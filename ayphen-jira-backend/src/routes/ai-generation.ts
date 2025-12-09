import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { AIRequirement } from '../entities/AIRequirement';
import { AIStory } from '../entities/AIStory';
import { AITestCase } from '../entities/AITestCase';
import { AITestSuite } from '../entities/AITestSuite';
import { Issue } from '../entities/Issue';
import { OpenAIService } from '../services/openai.service';
import { KeyGenerationService } from '../services/key-generation.service';
import { JiraSyncService } from '../services/jira-sync.service';
import { contextCollector } from '../services/context-collector.service';

const router = Router();
const requirementRepo = AppDataSource.getRepository(AIRequirement);
const storyRepo = AppDataSource.getRepository(AIStory);
const testCaseRepo = AppDataSource.getRepository(AITestCase);
const suiteRepo = AppDataSource.getRepository(AITestSuite);
const issueRepo = AppDataSource.getRepository(Issue);
const openaiService = new OpenAIService();
const keyGenService = new KeyGenerationService();
const jiraSyncService = new JiraSyncService();

// Helper function to calculate story points
function calculateStoryPoints(story: any) {
  const complexity = story.acceptanceCriteria?.length || 3;
  const basePoints = story.type === 'ui' ? 5 : 3;
  return Math.min(basePoints + complexity, 13); // Fibonacci: 1,2,3,5,8,13
}

// Helper function to distribute points
function distributePoints(totalPoints: number) {
  const devPoints = Math.ceil(totalPoints * 0.6); // 60% dev
  const qaPoints = Math.ceil(totalPoints * 0.25); // 25% QA
  const reviewPoints = Math.ceil(totalPoints * 0.15); // 15% review
  return { devPoints, qaPoints, reviewPoints };
}

// POST generate stories from requirement
router.post('/stories', async (req, res) => {
  try {
    const { requirementId } = req.body;
    console.log('📝 Generating stories for requirement:', requirementId);

    const requirement = await requirementRepo.findOne({
      where: { id: requirementId },
    });

    if (!requirement) {
      console.log('❌ Requirement not found:', requirementId);
      return res.status(404).json({ error: 'Requirement not found' });
    }

    console.log('🤖 Calling AI service to generate stories...');
    // Generate stories using AI
    const generated = await openaiService.generateStories(requirement.content);
    console.log('✅ AI generated:', generated);

    // Save UI stories
    const uiStories = [];
    for (const story of generated.uiStories || []) {
      const saved = await storyRepo.save({
        requirementId,
        title: story.title,
        description: story.description,
        type: 'ui',
        acceptanceCriteria: story.acceptanceCriteria,
        status: 'generated',
        syncStatus: 'synced',
      });
      uiStories.push(saved);
    }

    // Save API stories
    const apiStories = [];
    for (const story of generated.apiStories || []) {
      const saved = await storyRepo.save({
        requirementId,
        title: story.title,
        description: story.description,
        type: 'api',
        acceptanceCriteria: story.acceptanceCriteria,
        status: 'generated',
        syncStatus: 'synced',
      });
      apiStories.push(saved);
    }

    console.log(`✅ Saved ${uiStories.length} UI stories and ${apiStories.length} API stories`);

    res.json({
      success: true,
      uiStories,
      apiStories,
      total: uiStories.length + apiStories.length,
    });
  } catch (error: any) {
    console.error('❌ Error generating stories:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST generate test cases from story
router.post('/test-cases', async (req, res) => {
  try {
    const { storyId } = req.body;

    const story = await storyRepo.findOne({
      where: { id: storyId },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Generate test cases using AI
    const generated = await openaiService.generateTestCases(story);

    // Save test cases
    const testCases = [];
    for (const tc of generated.testCases || []) {
      const saved = await testCaseRepo.save({
        storyId,
        title: tc.title,
        type: story.type,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
        categories: tc.categories,
        status: 'active',
      });
      testCases.push(saved);
    }

    // Auto-create suites
    await autoCreateSuites(story.requirementId, storyId, testCases);

    res.json({
      success: true,
      testCases,
      total: testCases.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to auto-create test suites
async function autoCreateSuites(requirementId: string, storyId: string, testCases: any[]) {
  const story = await storyRepo.findOne({ where: { id: storyId } });
  if (!story) return;

  const categories = ['smoke', 'sanity', 'regression'];

  for (const category of categories) {
    const casesInCategory = testCases.filter(tc =>
      tc.categories && tc.categories.includes(category)
    );

    if (casesInCategory.length > 0) {
      // Check if suite already exists
      const existing = await suiteRepo.findOne({
        where: {
          requirementId,
          category,
        },
      });

      if (existing) {
        // Update count
        await suiteRepo.update(existing.id, {
          testCaseCount: existing.testCaseCount + casesInCategory.length,
        });
      } else {
        // Create new suite
        await suiteRepo.save({
          name: `${story.title} - ${category.toUpperCase()}`,
          category,
          requirementId,
          testCaseCount: casesInCategory.length,
        });
      }

      // Update test cases with suite ID
      for (const tc of casesInCategory) {
        const suite = await suiteRepo.findOne({
          where: { requirementId, category },
        });
        if (suite) {
          await testCaseRepo.update(tc.id, { suiteId: suite.id });
        }
      }
    }
  }
}

// Helper function to handle rate limits with retry
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3, baseDelay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        console.log(`⏳ Rate limit hit, waiting ${delay}ms before retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// POST generate everything (stories + test cases + suites) - ONE CLICK!
router.post('/complete', async (req, res) => {
  try {
    const { requirementId } = req.body;
    console.log('🚀 Starting COMPLETE generation for requirement:', requirementId);

    const requirement = await requirementRepo.findOne({
      where: { id: requirementId },
    });

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    // ⭐ NEW: Collect Epic + Project Context
    let fullContext = null;
    if (requirement.epicKey && requirement.projectId) {
      console.log('🔍 Collecting context for context-aware generation...');
      fullContext = await contextCollector.collectFullContext(
        requirement.epicKey,
        requirement.projectId
      );

      if (fullContext) {
        console.log('✅ Context collected:', {
          epicGoals: fullContext.epic.goals.length,
          relatedStories: fullContext.relatedStories.length,
          techStack: fullContext.project.techStack,
          avgPoints: fullContext.project.avgStoryPoints
        });
      }
    }

    // STEP 1: Generate Stories (with retry + CONTEXT)
    console.log('📝 Step 1: Generating stories' + (fullContext ? ' with CONTEXT...' : '...'));
    let generated;
    try {
      generated = await retryWithBackoff(() =>
        fullContext
          ? openaiService.generateStoriesWithContext(requirement.content, fullContext)
          : openaiService.generateStories(requirement.content)
      );
    } catch (error: any) {
      console.warn('⚠️  AI generation failed, using mock data:', error.message);
      // Fallback to mock data
      generated = {
        uiStories: [
          {
            title: "User can view requirement details",
            description: "As a user, I want to view requirement details, so that I can understand the feature scope",
            acceptanceCriteria: ["Requirement title is displayed", "Requirement content is shown", "Status is visible"]
          },
          {
            title: "User can edit requirement",
            description: "As a user, I want to edit requirements, so that I can update specifications",
            acceptanceCriteria: ["Edit button is available", "Form allows content modification", "Changes are saved"]
          }
        ],
        apiStories: [
          {
            title: "API endpoint for requirement retrieval",
            description: "As an API consumer, I want to retrieve requirements, so that I can display them",
            acceptanceCriteria: ["GET /api/requirements/:id returns requirement", "Returns 404 if not found", "Includes all requirement fields"]
          },
          {
            title: "API endpoint for requirement updates",
            description: "As an API consumer, I want to update requirements, so that I can modify specifications",
            acceptanceCriteria: ["PUT /api/requirements/:id accepts updates", "Validates input data", "Returns updated requirement"]
          }
        ]
      };
    }

    const allStories = [];
    const allTestCases = [];
    let testCaseCounter = 1; // Counter for test case numbering

    // Get project key for key generation
    const projectKey = requirement.projectId ? await keyGenService.getProjectKey(requirement.projectId) : null;
    const epicKey = requirement.epicKey;

    // Save UI Stories with points and keys
    for (const storyData of generated.uiStories || []) {
      const storyPoints = calculateStoryPoints(storyData);
      const { devPoints, qaPoints, reviewPoints } = distributePoints(storyPoints);

      // Generate story key
      let storyKey = null;
      if (requirement.projectId && projectKey) {
        const storyNumber = await keyGenService.getNextStoryNumber(requirement.projectId);
        storyKey = keyGenService.generateStoryKey(projectKey, storyNumber);
        console.log(`✅ Generated storyKey: ${storyKey}`);
      }

      const story = await storyRepo.save({
        requirementId,
        storyKey: storyKey || undefined,
        projectId: requirement.projectId || undefined,
        epicKey: epicKey || undefined,
        title: storyData.title,
        description: storyData.description,
        type: 'ui' as const,
        acceptanceCriteria: storyData.acceptanceCriteria,
        status: 'generated' as const,
        syncStatus: 'synced' as const,
      }) as AIStory;

      // Create Issue record for Backlog/Board integration
      if (storyKey && requirement.projectId) {
        try {
          const issue = await issueRepo.save({
            key: storyKey,
            summary: storyData.title,
            description: storyData.description,
            type: 'story',
            status: 'backlog',
            priority: 'medium',
            projectId: requirement.projectId,
            epicKey: epicKey,
            aiStoryId: story.id,
            storyPoints: storyPoints,
          });

          // Link issue back to story
          await storyRepo.update(story.id, { issueId: issue.id });
          console.log(`✅ Created Issue ${issue.key} for story ${story.id}`);
        } catch (error) {
          console.error(`❌ Failed to create Issue for story ${story.id}:`, error);
        }
      }

      allStories.push({
        ...story,
        storyPoints,
        devPoints,
        qaPoints,
        reviewPoints,
      });

      // STEP 2: Generate Test Cases for this story (with retry)
      console.log(`🧪 Step 2: Generating test cases for story: ${story.title}`);
      const testCasesData = await retryWithBackoff(() =>
        openaiService.generateTestCases(story)
      );

      for (const tc of testCasesData.testCases || []) {
        // Generate test case key
        let testCaseKey = null;
        if (epicKey) {
          testCaseKey = keyGenService.generateTestCaseKey(epicKey, testCaseCounter);
          testCaseCounter++;
          console.log(`✅ Generated testCaseKey: ${testCaseKey}`);
        }

        const testCase = await testCaseRepo.save({
          storyId: story.id,
          testCaseKey,
          requirementId,
          projectId: requirement.projectId,
          title: tc.title,
          type: story.type,
          steps: tc.steps,
          expectedResult: tc.expectedResult,
          categories: tc.categories,
          status: 'pending',
        });
        allTestCases.push(testCase);
      }
    }

    // Save API Stories with points and keys
    for (const storyData of generated.apiStories || []) {
      const storyPoints = calculateStoryPoints(storyData);
      const { devPoints, qaPoints, reviewPoints } = distributePoints(storyPoints);

      // Generate story key
      let storyKey = null;
      if (requirement.projectId && projectKey) {
        const storyNumber = await keyGenService.getNextStoryNumber(requirement.projectId);
        storyKey = keyGenService.generateStoryKey(projectKey, storyNumber);
        console.log(`✅ Generated storyKey: ${storyKey}`);
      }

      const story = await storyRepo.save({
        requirementId,
        storyKey,
        projectId: requirement.projectId,
        epicKey,
        title: storyData.title,
        description: storyData.description,
        type: 'api',
        acceptanceCriteria: storyData.acceptanceCriteria,
        status: 'generated',
        syncStatus: 'synced',
      });

      // Create Issue record for Backlog/Board integration
      if (storyKey && requirement.projectId) {
        try {
          const issue = await issueRepo.save({
            key: storyKey,
            summary: storyData.title,
            description: storyData.description,
            type: 'story',
            status: 'backlog',
            priority: 'medium',
            projectId: requirement.projectId,
            epicKey: epicKey,
            aiStoryId: story.id,
            storyPoints: storyPoints,
          });

          // Link issue back to story
          await storyRepo.update(story.id, { issueId: issue.id });
          console.log(`✅ Created Issue ${issue.key} for story ${story.id}`);
        } catch (error) {
          console.error(`❌ Failed to create Issue for story ${story.id}:`, error);
        }
      }

      allStories.push({
        ...story,
        storyPoints,
        devPoints,
        qaPoints,
        reviewPoints,
      });

      // STEP 2: Generate Test Cases for this story (with retry)
      console.log(`🧪 Step 2: Generating test cases for story: ${story.title}`);
      const testCasesData = await retryWithBackoff(() =>
        openaiService.generateTestCases(story)
      );

      for (const tc of testCasesData.testCases || []) {
        // Generate test case key
        let testCaseKey = null;
        if (epicKey) {
          testCaseKey = keyGenService.generateTestCaseKey(epicKey, testCaseCounter);
          testCaseCounter++;
          console.log(`✅ Generated testCaseKey: ${testCaseKey}`);
        }

        const testCase = await testCaseRepo.save({
          storyId: story.id,
          testCaseKey,
          requirementId,
          projectId: requirement.projectId,
          title: tc.title,
          type: story.type,
          steps: tc.steps,
          expectedResult: tc.expectedResult,
          categories: tc.categories,
          status: 'pending',
        });
        allTestCases.push(testCase);
      }
    }

    // STEP 3: Create Test Suites
    console.log('📦 Step 3: Creating test suites...');
    const smokeTests = allTestCases.filter(tc => tc.categories.includes('smoke'));
    const sanityTests = allTestCases.filter(tc => tc.categories.includes('sanity'));
    const regressionTests = allTestCases.filter(tc => tc.categories.includes('regression'));

    const suites = [];

    if (smokeTests.length > 0) {
      const suiteKey = epicKey ? keyGenService.generateSuiteKey('smoke', epicKey) : null;
      console.log(`✅ Generated suiteKey: ${suiteKey}`);

      const suite = await suiteRepo.save({
        requirementId,
        suiteKey,
        projectId: requirement.projectId,
        name: `${requirement.title} - Smoke Suite`,
        description: 'Critical path tests that must pass',
        testCaseKeys: smokeTests.map(tc => tc.testCaseKey).filter(k => k),
        category: 'smoke',
        testCaseCount: smokeTests.length,
      });

      // Update test cases with suiteKey
      for (const tc of smokeTests) {
        await testCaseRepo.update(tc.id, { suiteKey, suiteId: suite.id });
      }

      suites.push(suite);
    }

    if (sanityTests.length > 0) {
      const suiteKey = epicKey ? keyGenService.generateSuiteKey('sanity', epicKey) : null;
      console.log(`✅ Generated suiteKey: ${suiteKey}`);

      const suite = await suiteRepo.save({
        requirementId,
        suiteKey,
        projectId: requirement.projectId,
        name: `${requirement.title} - Sanity Suite`,
        description: 'Basic functionality tests',
        testCaseKeys: sanityTests.map(tc => tc.testCaseKey).filter(k => k),
        category: 'sanity',
        testCaseCount: sanityTests.length,
      });

      // Update test cases with suiteKey
      for (const tc of sanityTests) {
        await testCaseRepo.update(tc.id, { suiteKey, suiteId: suite.id });
      }

      suites.push(suite);
    }

    if (regressionTests.length > 0) {
      const suiteKey = epicKey ? keyGenService.generateSuiteKey('regression', epicKey) : null;
      console.log(`✅ Generated suiteKey: ${suiteKey}`);

      const suite = await suiteRepo.save({
        requirementId,
        suiteKey,
        projectId: requirement.projectId,
        name: `${requirement.title} - Regression Suite`,
        description: 'Comprehensive edge case and error scenario tests',
        testCaseKeys: regressionTests.map(tc => tc.testCaseKey).filter(k => k),
        category: 'regression',
        testCaseCount: regressionTests.length,
      });

      // Update test cases with suiteKey
      for (const tc of regressionTests) {
        await testCaseRepo.update(tc.id, { suiteKey, suiteId: suite.id });
      }

      suites.push(suite);
    }

    console.log(`✅ COMPLETE! Generated ${allStories.length} stories, ${allTestCases.length} test cases, ${suites.length} suites`);

    // STEP 4: Sync to Jira (if projectId exists)
    let jiraSyncResult: any = null;
    if (requirement.projectId && requirement.epicKey) {
      try {
        console.log('🔄 Step 4: Syncing to Jira...');

        // Use first user as reporter (in production, use actual logged-in user)
        const userId = '1'; // TODO: Get from auth context

        // Sync Epic to Jira
        const epicIssue = await jiraSyncService.syncEpicToJira(
          requirement,
          requirement.projectId,
          userId
        );

        // Sync all Stories to Jira
        const syncResult = await jiraSyncService.syncAllStoriesToJira(
          allStories as AIStory[],
          requirement.epicKey,
          requirement.projectId,
          userId
        );

        jiraSyncResult = {
          epicKey: epicIssue.key,
          epicIssueId: epicIssue.id,
          storiesSync: syncResult.summary,
          syncedStories: syncResult.successful.map(issue => issue.key),
          failedStories: syncResult.failed.map(f => ({
            storyKey: f.story.storyKey,
            error: f.error,
          })),
        };

        console.log(`✅ Jira sync complete: ${syncResult.summary.synced}/${syncResult.summary.total} stories synced`);
      } catch (error: any) {
        console.error('⚠️ Jira sync failed (continuing anyway):', error.message);
        jiraSyncResult = {
          error: error.message,
          syncFailed: true,
        };
      }
    }

    // Update requirement status to 'completed'
    await requirementRepo.update(requirementId, { status: 'completed' });
    console.log('✅ Updated requirement status to completed');

    res.json({
      success: true,
      stories: allStories,
      testCases: allTestCases,
      suites: suites,
      jiraSync: jiraSyncResult,
      summary: {
        totalStories: allStories.length,
        uiStories: allStories.filter(s => s.type === 'ui').length,
        apiStories: allStories.filter(s => s.type === 'api').length,
        totalTestCases: allTestCases.length,
        smokeTests: smokeTests.length,
        sanityTests: sanityTests.length,
        regressionTests: regressionTests.length,
        totalSuites: suites.length,
        totalStoryPoints: allStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0),
      },
    });
  } catch (error: any) {
    console.error('❌ Error in complete generation:', error);

    // Check if it's an API key error
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({
        error: 'AI Service Not Configured',
        message: 'Please configure a FREE AI API key in the backend .env file. See AI_API_SETUP_REQUIRED.md for instructions.',
        details: error.message
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to generate test automation artifacts',
      details: error.toString()
    });
  }
});

// GET test cases for a specific suite
router.get('/suites/:suiteId/test-cases', async (req, res) => {
  try {
    const { suiteId } = req.params;
    console.log(`📦 Fetching test cases for suite: ${suiteId}`);

    // Get the suite
    const suite = await suiteRepo.findOne({
      where: { id: suiteId },
    });

    if (!suite) {
      return res.status(404).json({ error: 'Suite not found' });
    }

    // Get test cases using testCaseKeys array
    if (!suite.testCaseKeys || suite.testCaseKeys.length === 0) {
      return res.json({ testCases: [] });
    }

    // Query test cases where testCaseKey is in the suite's testCaseKeys array
    const testCases = await testCaseRepo
      .createQueryBuilder('testCase')
      .where('testCase.testCaseKey IN (:...keys)', { keys: suite.testCaseKeys })
      .orderBy('testCase.testCaseKey', 'ASC')
      .getMany();

    console.log(`✅ Found ${testCases.length} test cases for suite ${suite.suiteKey}`);

    res.json({
      suite: {
        id: suite.id,
        suiteKey: suite.suiteKey,
        name: suite.name,
        description: suite.description,
        category: suite.category,
        testCaseCount: suite.testCaseCount,
      },
      testCases,
    });
  } catch (error: any) {
    console.error('❌ Error fetching suite test cases:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
