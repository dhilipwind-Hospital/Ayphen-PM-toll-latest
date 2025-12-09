import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { TestResult } from '../entities/TestResult';
import { AITestCase } from '../entities/AITestCase';
import { AIRequirement } from '../entities/AIRequirement';
import { aiTestInsightsService } from '../services/ai-test-insights.service';

const router = Router();

// POST /api/ai-insights/analyze-flaky-test
router.post('/analyze-flaky-test', async (req, res) => {
  try {
    const { testCaseId } = req.body;
    
    const testCaseRepo = AppDataSource.getRepository(AITestCase);
    const testResultRepo = AppDataSource.getRepository(TestResult);
    
    const testCase = await testCaseRepo.findOne({ where: { id: testCaseId } });
    if (!testCase) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    
    const executionHistory = await testResultRepo.find({
      where: { testCaseId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    
    const analysis = await aiTestInsightsService.analyzeFlakyTest(testCase, executionHistory);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing flaky test:', error);
    res.status(500).json({ error: 'Failed to analyze flaky test' });
  }
});

// POST /api/ai-insights/predict-failure
router.post('/predict-failure', async (req, res) => {
  try {
    const { testCaseId, recentChanges = [] } = req.body;
    
    const testCaseRepo = AppDataSource.getRepository(AITestCase);
    const testCase = await testCaseRepo.findOne({ where: { id: testCaseId } });
    
    if (!testCase) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    
    const prediction = await aiTestInsightsService.predictTestFailure(testCase, recentChanges);
    res.json(prediction);
  } catch (error) {
    console.error('Error predicting failure:', error);
    res.status(500).json({ error: 'Failed to predict failure' });
  }
});

// POST /api/ai-insights/suggest-optimization
router.post('/suggest-optimization', async (req, res) => {
  try {
    const { testCaseId, executionTime } = req.body;
    
    const testCaseRepo = AppDataSource.getRepository(AITestCase);
    const testCase = await testCaseRepo.findOne({ where: { id: testCaseId } });
    
    if (!testCase) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    
    const suggestions = await aiTestInsightsService.suggestTestOptimization(testCase, executionTime);
    res.json(suggestions);
  } catch (error) {
    console.error('Error suggesting optimization:', error);
    res.status(500).json({ error: 'Failed to suggest optimization' });
  }
});

// POST /api/ai-insights/generate-test-data
router.post('/generate-test-data', async (req, res) => {
  try {
    const { testCaseId, environment = 'dev' } = req.body;
    
    const testCaseRepo = AppDataSource.getRepository(AITestCase);
    const testCase = await testCaseRepo.findOne({ where: { id: testCaseId } });
    
    if (!testCase) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    
    const testData = await aiTestInsightsService.generateTestData(testCase, environment);
    res.json(testData);
  } catch (error) {
    console.error('Error generating test data:', error);
    res.status(500).json({ error: 'Failed to generate test data' });
  }
});

// POST /api/ai-insights/identify-coverage-gaps
router.post('/identify-coverage-gaps', async (req, res) => {
  try {
    const { projectId } = req.body;
    
    // VALIDATE projectId is required
    if (!projectId) {
      return res.status(400).json({ 
        error: 'projectId is required',
        message: 'Coverage gap analysis must be scoped to a project'
      });
    }
    
    const requirementRepo = AppDataSource.getRepository(AIRequirement);
    const testCaseRepo = AppDataSource.getRepository(AITestCase);
    
    let reqQuery = requirementRepo.createQueryBuilder('req')
      .where('req.projectId = :projectId', { projectId });
    let testQuery = testCaseRepo.createQueryBuilder('test')
      .where('test.projectId = :projectId', { projectId });
    
    const requirements = await reqQuery.getMany();
    const tests = await testQuery.getMany();
    
    const analysis = await aiTestInsightsService.identifyMissingCoverage(requirements, tests);
    res.json(analysis);
  } catch (error) {
    console.error('Error identifying coverage gaps:', error);
    res.status(500).json({ error: 'Failed to identify coverage gaps' });
  }
});

// POST /api/ai-insights/chat
router.post('/chat', async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const answer = await aiTestInsightsService.answerQuestion(question, context);
    res.json({ question, answer });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// GET /api/ai-insights/smart-test-selection
router.post('/smart-test-selection', async (req, res) => {
  try {
    const { changedFiles = [], projectId } = req.body;
    
    const testCaseRepo = AppDataSource.getRepository(AITestCase);
    let query = testCaseRepo.createQueryBuilder('test');
    
    if (projectId) {
      query = query.where('test.projectId = :projectId', { projectId });
    }
    
    const allTests = await query.getMany();
    
    // Simple heuristic: prioritize tests based on categories and recent failures
    const testResultRepo = AppDataSource.getRepository(TestResult);
    const recentFailures = await testResultRepo
      .createQueryBuilder('result')
      .where('result.status = :status', { status: 'failed' })
      .orderBy('result.createdAt', 'DESC')
      .take(50)
      .getMany();
    
    const failedTestIds = new Set(recentFailures.map(r => r.testCaseId));
    
    const prioritizedTests = allTests
      .map(test => ({
        ...test,
        priority: test.categories?.includes('smoke') ? 3 :
                 test.categories?.includes('sanity') ? 2 :
                 failedTestIds.has(test.id) ? 2 : 1,
        reason: test.categories?.includes('smoke') ? 'Critical smoke test' :
                test.categories?.includes('sanity') ? 'Important sanity test' :
                failedTestIds.has(test.id) ? 'Recently failed' : 'Standard test',
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 20);
    
    res.json({
      recommendedTests: prioritizedTests,
      totalTests: allTests.length,
      selectedCount: prioritizedTests.length,
      estimatedTime: prioritizedTests.length * 30, // 30 seconds per test
    });
  } catch (error) {
    console.error('Error in smart test selection:', error);
    res.status(500).json({ error: 'Failed to select tests' });
  }
});

export default router;
