import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { TestRun } from '../entities/TestRun';
import { TestResult } from '../entities/TestResult';
import { TestCycle } from '../entities/TestCycle';
import { TestData } from '../entities/TestData';
import { TestDefectLink } from '../entities/TestDefectLink';
import { AITestCase } from '../entities/AITestCase';
import { AITestSuite } from '../entities/AITestSuite';
import { AIStory } from '../entities/AIStory';
import { Issue } from '../entities/Issue';

const router = Router();

// Test Runs
router.post('/runs', async (req, res) => {
  try {
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const testRun = testRunRepo.create({
      ...req.body,
      startTime: new Date(),
      status: 'running',
    });
    const saved = await testRunRepo.save(testRun);
    res.json(saved);
  } catch (error) {
    console.error('Error creating test run:', error);
    res.status(500).json({ error: 'Failed to create test run' });
  }
});

router.get('/runs', async (req, res) => {
  try {
    const { projectId, suiteId, cycleId, status, environment } = req.query;
    
    // VALIDATE projectId is required
    if (!projectId) {
      return res.status(400).json({ 
        error: 'projectId is required',
        message: 'All test runs must be scoped to a project'
      });
    }
    
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const query = testRunRepo.createQueryBuilder('run')
      .leftJoinAndSelect('run.executor', 'executor')
      .leftJoinAndSelect('run.suite', 'suite')
      .where('run.projectId = :projectId', { projectId })
      .orderBy('run.createdAt', 'DESC');
    if (suiteId) query.andWhere('run.suiteId = :suiteId', { suiteId });
    if (cycleId) query.andWhere('run.cycleId = :cycleId', { cycleId });
    if (status) query.andWhere('run.status = :status', { status });
    if (environment) query.andWhere('run.environment = :environment', { environment });

    const runs = await query.getMany();
    res.json(runs);
  } catch (error) {
    console.error('Error fetching test runs:', error);
    res.status(500).json({ error: 'Failed to fetch test runs' });
  }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const testResultRepo = AppDataSource.getRepository(TestResult);
    
    const run = await testRunRepo.findOne({
      where: { id: req.params.id },
      relations: ['executor', 'suite'],
    });

    if (!run) {
      return res.status(404).json({ error: 'Test run not found' });
    }

    const results = await testResultRepo.find({
      where: { testRunId: run.id },
      relations: ['testCase', 'executor'],
      order: { createdAt: 'ASC' },
    });

    res.json({ ...run, results });
  } catch (error) {
    console.error('Error fetching test run:', error);
    res.status(500).json({ error: 'Failed to fetch test run' });
  }
});

router.put('/runs/:id', async (req, res) => {
  try {
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const run = await testRunRepo.findOne({ where: { id: req.params.id } });
    
    if (!run) {
      return res.status(404).json({ error: 'Test run not found' });
    }

    Object.assign(run, req.body);
    
    if (req.body.status === 'completed' || req.body.status === 'aborted') {
      run.endTime = new Date();
      if (run.startTime) {
        run.duration = run.endTime.getTime() - run.startTime.getTime();
      }
    }

    const updated = await testRunRepo.save(run);
    res.json(updated);
  } catch (error) {
    console.error('Error updating test run:', error);
    res.status(500).json({ error: 'Failed to update test run' });
  }
});

router.post('/runs/:id/abort', async (req, res) => {
  try {
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const run = await testRunRepo.findOne({ where: { id: req.params.id } });
    
    if (!run) {
      return res.status(404).json({ error: 'Test run not found' });
    }

    run.status = 'aborted';
    run.endTime = new Date();
    if (run.startTime) {
      run.duration = run.endTime.getTime() - run.startTime.getTime();
    }

    const updated = await testRunRepo.save(run);
    res.json(updated);
  } catch (error) {
    console.error('Error aborting test run:', error);
    res.status(500).json({ error: 'Failed to abort test run' });
  }
});

// Test Results
router.post('/results', async (req, res) => {
  try {
    const testResultRepo = AppDataSource.getRepository(TestResult);
    const testRunRepo = AppDataSource.getRepository(TestRun);
    
    const result = testResultRepo.create({
      ...req.body,
      startTime: req.body.startTime || new Date(),
    });
    
    const saved = await testResultRepo.save(result);

    // Update test run counts
    const run = await testRunRepo.findOne({ where: { id: req.body.testRunId } });
    if (run) {
      const results = await testResultRepo.find({ where: { testRunId: run.id } });
      run.totalTests = results.length;
      run.passed = results.filter((r: TestResult) => r.status === 'passed').length;
      run.failed = results.filter((r: TestResult) => r.status === 'failed').length;
      run.skipped = results.filter((r: TestResult) => r.status === 'skipped').length;
      run.blocked = results.filter((r: TestResult) => r.status === 'blocked').length;
      await testRunRepo.save(run);
    }

    res.json(saved);
  } catch (error) {
    console.error('Error creating test result:', error);
    res.status(500).json({ error: 'Failed to create test result' });
  }
});

router.put('/results/:id', async (req, res) => {
  try {
    const testResultRepo = AppDataSource.getRepository(TestResult);
    const testRunRepo = AppDataSource.getRepository(TestRun);
    
    const result = await testResultRepo.findOne({ where: { id: req.params.id } });
    
    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    Object.assign(result, req.body);
    
    if (req.body.status && !result.endTime) {
      result.endTime = new Date();
      if (result.startTime) {
        result.executionTime = result.endTime.getTime() - result.startTime.getTime();
      }
    }

    const updated = await testResultRepo.save(result);

    // Update test run counts
    const run = await testRunRepo.findOne({ where: { id: result.testRunId } });
    if (run) {
      const results = await testResultRepo.find({ where: { testRunId: run.id } });
      run.passed = results.filter(r => r.status === 'passed').length;
      run.failed = results.filter(r => r.status === 'failed').length;
      run.skipped = results.filter(r => r.status === 'skipped').length;
      run.blocked = results.filter(r => r.status === 'blocked').length;
      await testRunRepo.save(run);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating test result:', error);
    res.status(500).json({ error: 'Failed to update test result' });
  }
});

router.get('/results', async (req, res) => {
  try {
    const testResultRepo = AppDataSource.getRepository(TestResult);
    const { testRunId, testCaseId, status } = req.query;
    
    const query = testResultRepo.createQueryBuilder('result')
      .leftJoinAndSelect('result.testCase', 'testCase')
      .leftJoinAndSelect('result.executor', 'executor')
      .orderBy('result.createdAt', 'DESC');

    if (testRunId) query.andWhere('result.testRunId = :testRunId', { testRunId });
    if (testCaseId) query.andWhere('result.testCaseId = :testCaseId', { testCaseId });
    if (status) query.andWhere('result.status = :status', { status });

    const results = await query.getMany();
    res.json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Auto-create defect from failed test
router.post('/results/:id/create-defect', async (req, res) => {
  try {
    const testResultRepo = AppDataSource.getRepository(TestResult);
    const issueRepo = AppDataSource.getRepository(Issue);
    const testDefectLinkRepo = AppDataSource.getRepository(TestDefectLink);
    const testCaseRepo = AppDataSource.getRepository(AITestCase);
    
    const result = await testResultRepo.findOne({
      where: { id: req.params.id },
      relations: ['testCase'],
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (result.status !== 'failed') {
      return res.status(400).json({ error: 'Can only create defects for failed tests' });
    }

    // Check if defect already exists
    if (result.defectId) {
      return res.status(400).json({ error: 'Defect already created for this test result' });
    }

    const testCase = result.testCase;
    
    // Get the AI Story if test case is linked to one
    let storyIssueId = null;
    if (testCase.storyId) {
      const aiStoryRepo = AppDataSource.getRepository(AIStory);
      const aiStory = await aiStoryRepo.findOne({ where: { id: testCase.storyId } });
      if (aiStory && aiStory.issueId) {
        storyIssueId = aiStory.issueId;
      }
    }
    
    // Create Jira issue
    const issue = issueRepo.create({
      key: `BUG-${Date.now()}`,
      type: 'bug',
      summary: `Test Failed: ${testCase.title}`,
      description: `
**Test Case**: ${testCase.testCaseKey || testCase.id}
**Test Title**: ${testCase.title}
**Status**: Failed
**Environment**: ${result.environment}
**Browser**: ${result.browser}
${storyIssueId ? `**Related Story**: Linked to story issue` : ''}

**Steps to Reproduce**:
${testCase.steps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') || 'N/A'}

**Expected Result**:
${testCase.expectedResult || 'N/A'}

**Actual Result**:
${result.actualResult || 'Test failed'}

**Error Message**:
${result.errorMessage || 'N/A'}

**Stack Trace**:
\`\`\`
${result.stackTrace || 'N/A'}
\`\`\`

**Test Run ID**: ${result.testRunId}
**Executed At**: ${result.createdAt}
      `.trim(),
      priority: testCase.categories?.includes('smoke') ? 'highest' : 
                testCase.categories?.includes('regression') ? 'high' : 'medium',
      status: 'todo',
      labels: ['test-failure', 'auto-created', ...(testCase.categories || [])],
      projectId: testCase.projectId || req.body.projectId,
      reporterId: result.executedBy || req.body.reporterId,
      ...(storyIssueId && { parentId: storyIssueId }), // Link bug to story issue if exists
    });

    const savedIssue = await issueRepo.save(issue);

    // Link defect to test result
    result.defectId = savedIssue.id;
    await testResultRepo.save(result);

    // Create defect link
    const link = testDefectLinkRepo.create({
      testResultId: result.id,
      defectId: savedIssue.id,
      linkType: 'blocks',
      autoCreated: true,
    });
    await testDefectLinkRepo.save(link);

    res.json({ issue: savedIssue, link });
  } catch (error) {
    console.error('Error creating defect:', error);
    res.status(500).json({ error: 'Failed to create defect' });
  }
});

// Link existing defect to test result
router.post('/results/:id/link-defect', async (req, res) => {
  try {
    const testResultRepo = AppDataSource.getRepository(TestResult);
    const testDefectLinkRepo = AppDataSource.getRepository(TestDefectLink);
    
    const result = await testResultRepo.findOne({ where: { id: req.params.id } });
    
    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    const { defectId, linkType } = req.body;

    const link = testDefectLinkRepo.create({
      testResultId: result.id,
      defectId,
      linkType: linkType || 'relates-to',
      autoCreated: false,
    });

    const saved = await testDefectLinkRepo.save(link);

    result.defectId = defectId;
    await testResultRepo.save(result);

    res.json(saved);
  } catch (error) {
    console.error('Error linking defect:', error);
    res.status(500).json({ error: 'Failed to link defect' });
  }
});

// Test Cycles
router.post('/cycles', async (req, res) => {
  try {
    const testCycleRepo = AppDataSource.getRepository(TestCycle);
    const cycle = testCycleRepo.create(req.body);
    const saved = await testCycleRepo.save(cycle);
    res.json(saved);
  } catch (error) {
    console.error('Error creating test cycle:', error);
    res.status(500).json({ error: 'Failed to create test cycle' });
  }
});

router.get('/cycles', async (req, res) => {
  try {
    const testCycleRepo = AppDataSource.getRepository(TestCycle);
    const { projectId, status } = req.query;
    
    const query = testCycleRepo.createQueryBuilder('cycle')
      .orderBy('cycle.createdAt', 'DESC');

    if (projectId) query.andWhere('cycle.projectId = :projectId', { projectId });
    if (status) query.andWhere('cycle.status = :status', { status });

    const cycles = await query.getMany();
    res.json(cycles);
  } catch (error) {
    console.error('Error fetching test cycles:', error);
    res.status(500).json({ error: 'Failed to fetch test cycles' });
  }
});

router.get('/cycles/:id', async (req, res) => {
  try {
    const testCycleRepo = AppDataSource.getRepository(TestCycle);
    const cycle = await testCycleRepo.findOne({ where: { id: req.params.id } });
    
    if (!cycle) {
      return res.status(404).json({ error: 'Test cycle not found' });
    }

    res.json(cycle);
  } catch (error) {
    console.error('Error fetching test cycle:', error);
    res.status(500).json({ error: 'Failed to fetch test cycle' });
  }
});

router.put('/cycles/:id', async (req, res) => {
  try {
    const testCycleRepo = AppDataSource.getRepository(TestCycle);
    const cycle = await testCycleRepo.findOne({ where: { id: req.params.id } });
    
    if (!cycle) {
      return res.status(404).json({ error: 'Test cycle not found' });
    }

    Object.assign(cycle, req.body);
    const updated = await testCycleRepo.save(cycle);
    res.json(updated);
  } catch (error) {
    console.error('Error updating test cycle:', error);
    res.status(500).json({ error: 'Failed to update test cycle' });
  }
});

// Test Data
router.post('/test-data', async (req, res) => {
  try {
    const testDataRepo = AppDataSource.getRepository(TestData);
    const testData = testDataRepo.create(req.body);
    const saved = await testDataRepo.save(testData);
    res.json(saved);
  } catch (error) {
    console.error('Error creating test data:', error);
    res.status(500).json({ error: 'Failed to create test data' });
  }
});

router.get('/test-data', async (req, res) => {
  try {
    const testDataRepo = AppDataSource.getRepository(TestData);
    const { testCaseId, environment, projectId } = req.query;
    
    const query = testDataRepo.createQueryBuilder('data')
      .where('data.isActive = :isActive', { isActive: true })
      .orderBy('data.createdAt', 'DESC');

    if (testCaseId) query.andWhere('data.testCaseId = :testCaseId', { testCaseId });
    if (environment) query.andWhere('data.environment = :environment', { environment });
    if (projectId) query.andWhere('data.projectId = :projectId', { projectId });

    const testData = await query.getMany();
    res.json(testData);
  } catch (error) {
    console.error('Error fetching test data:', error);
    res.status(500).json({ error: 'Failed to fetch test data' });
  }
});

export default router;
