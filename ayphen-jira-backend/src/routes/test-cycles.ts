import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { TestCycle } from '../entities/TestCycle';
import { TestRun } from '../entities/TestRun';
import { AITestSuite } from '../entities/AITestSuite';

const router = Router();

// GET /api/test-cycles - List all cycles
router.get('/', async (req, res) => {
  try {
    const { projectId, status } = req.query;
    
    // VALIDATE projectId is required
    if (!projectId) {
      return res.status(400).json({ 
        error: 'projectId is required',
        message: 'Test cycles must be scoped to a project'
      });
    }
    
    const cycleRepo = AppDataSource.getRepository(TestCycle);
    let query = cycleRepo.createQueryBuilder('cycle')
      .where('cycle.projectId = :projectId', { projectId })
      .orderBy('cycle.createdAt', 'DESC');
    if (status) {
      query = query.andWhere('cycle.status = :status', { status });
    }
    
    const cycles = await query.getMany();
    res.json(cycles);
  } catch (error) {
    console.error('Error fetching cycles:', error);
    res.status(500).json({ error: 'Failed to fetch cycles' });
  }
});

// POST /api/test-cycles - Create cycle
router.post('/', async (req, res) => {
  try {
    const cycleRepo = AppDataSource.getRepository(TestCycle);
    const cycle = cycleRepo.create(req.body);
    const saved = await cycleRepo.save(cycle);
    res.json(saved);
  } catch (error) {
    console.error('Error creating cycle:', error);
    res.status(500).json({ error: 'Failed to create cycle' });
  }
});

// GET /api/test-cycles/:id - Get cycle details
router.get('/:id', async (req, res) => {
  try {
    const cycleRepo = AppDataSource.getRepository(TestCycle);
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const suiteRepo = AppDataSource.getRepository(AITestSuite);
    
    const cycle = await cycleRepo.findOne({ where: { id: req.params.id } });
    
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    
    // Get test runs for this cycle
    const runs = await testRunRepo.find({
      where: { cycleId: cycle.id },
      relations: ['suite', 'executor'],
      order: { createdAt: 'DESC' },
    });
    
    // Get suites for this cycle
    const suites = cycle.suiteIds && cycle.suiteIds.length > 0
      ? await suiteRepo.findByIds(cycle.suiteIds)
      : [];
    
    res.json({
      ...cycle,
      runs,
      suites,
    });
  } catch (error) {
    console.error('Error fetching cycle:', error);
    res.status(500).json({ error: 'Failed to fetch cycle' });
  }
});

// PUT /api/test-cycles/:id - Update cycle
router.put('/:id', async (req, res) => {
  try {
    const cycleRepo = AppDataSource.getRepository(TestCycle);
    const cycle = await cycleRepo.findOne({ where: { id: req.params.id } });
    
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    
    Object.assign(cycle, req.body);
    const updated = await cycleRepo.save(cycle);
    res.json(updated);
  } catch (error) {
    console.error('Error updating cycle:', error);
    res.status(500).json({ error: 'Failed to update cycle' });
  }
});

// DELETE /api/test-cycles/:id - Delete cycle
router.delete('/:id', async (req, res) => {
  try {
    const cycleRepo = AppDataSource.getRepository(TestCycle);
    const cycle = await cycleRepo.findOne({ where: { id: req.params.id } });
    
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    
    await cycleRepo.remove(cycle);
    res.json({ message: 'Cycle deleted successfully' });
  } catch (error) {
    console.error('Error deleting cycle:', error);
    res.status(500).json({ error: 'Failed to delete cycle' });
  }
});

// POST /api/test-cycles/:id/start - Start cycle
router.post('/:id/start', async (req, res) => {
  try {
    const cycleRepo = AppDataSource.getRepository(TestCycle);
    const cycle = await cycleRepo.findOne({ where: { id: req.params.id } });
    
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    
    cycle.status = 'in-progress';
    cycle.startDate = new Date();
    const updated = await cycleRepo.save(cycle);
    res.json(updated);
  } catch (error) {
    console.error('Error starting cycle:', error);
    res.status(500).json({ error: 'Failed to start cycle' });
  }
});

// POST /api/test-cycles/:id/complete - Complete cycle
router.post('/:id/complete', async (req, res) => {
  try {
    const cycleRepo = AppDataSource.getRepository(TestCycle);
    const cycle = await cycleRepo.findOne({ where: { id: req.params.id } });
    
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    
    cycle.status = 'completed';
    cycle.endDate = new Date();
    cycle.progress = 100;
    const updated = await cycleRepo.save(cycle);
    res.json(updated);
  } catch (error) {
    console.error('Error completing cycle:', error);
    res.status(500).json({ error: 'Failed to complete cycle' });
  }
});

// GET /api/test-cycles/:id/progress - Get cycle progress
router.get('/:id/progress', async (req, res) => {
  try {
    const cycleRepo = AppDataSource.getRepository(TestCycle);
    const testRunRepo = AppDataSource.getRepository(TestRun);
    
    const cycle = await cycleRepo.findOne({ where: { id: req.params.id } });
    
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    
    // Get all runs for this cycle
    const runs = await testRunRepo.find({ where: { cycleId: cycle.id } });
    
    const totalTests = runs.reduce((sum, r) => sum + r.totalTests, 0);
    const executedTests = runs.reduce((sum, r) => sum + (r.passed + r.failed + r.skipped + r.blocked), 0);
    const passedTests = runs.reduce((sum, r) => sum + r.passed, 0);
    const failedTests = runs.reduce((sum, r) => sum + r.failed, 0);
    
    const progress = totalTests > 0 ? (executedTests / totalTests) * 100 : 0;
    
    // Update cycle progress
    cycle.totalTests = totalTests;
    cycle.executedTests = executedTests;
    cycle.passedTests = passedTests;
    cycle.failedTests = failedTests;
    cycle.progress = Number(progress.toFixed(2));
    await cycleRepo.save(cycle);
    
    res.json({
      totalTests,
      executedTests,
      passedTests,
      failedTests,
      progress: Number(progress.toFixed(2)),
      totalRuns: runs.length,
      completedRuns: runs.filter(r => r.status === 'completed').length,
    });
  } catch (error) {
    console.error('Error fetching cycle progress:', error);
    res.status(500).json({ error: 'Failed to fetch cycle progress' });
  }
});

export default router;
