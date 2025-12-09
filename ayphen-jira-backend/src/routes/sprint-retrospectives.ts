import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { SprintRetrospective } from '../entities/SprintRetrospective';
import { aiRetrospectiveAnalyzer } from '../services/ai-retrospective-analyzer.service';
import { actionItemTrackerService } from '../services/action-item-tracker.service';
import { sprintPredictorService } from '../services/sprint-predictor.service';

const router = Router();
const retroRepo = AppDataSource.getRepository(SprintRetrospective);

// GET retrospective by sprint ID
router.get('/sprint/:sprintId', async (req, res) => {
  try {
    const retro = await retroRepo.findOne({
      where: { sprintId: req.params.sprintId },
      relations: ['sprint', 'createdBy'],
    });
    
    res.json(retro);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch retrospective' });
  }
});

// POST create/update retrospective
router.post('/', async (req, res) => {
  try {
    const { sprintId, wentWell, improvements, actionItems, notes, createdById } = req.body;

    // Check if retro exists for this sprint
    let retro = await retroRepo.findOne({ where: { sprintId } });

    if (retro) {
      // Update existing
      retro.wentWell = wentWell;
      retro.improvements = improvements;
      retro.actionItems = actionItems;
      retro.notes = notes;
    } else {
      // Create new
      retro = retroRepo.create({
        sprintId,
        wentWell,
        improvements,
        actionItems,
        notes,
        createdById,
      });
    }

    await retroRepo.save(retro);

    const fullRetro = await retroRepo.findOne({
      where: { id: retro.id },
      relations: ['sprint', 'createdBy'],
    });

    res.status(201).json(fullRetro);
  } catch (error: any) {
    console.error('Failed to save retrospective:', error);
    res.status(500).json({ error: 'Failed to save retrospective' });
  }
});

// PATCH update action item status
router.patch('/:id/action-item/:itemIndex', async (req, res) => {
  try {
    const { id, itemIndex } = req.params;
    const { completed } = req.body;

    const retro = await retroRepo.findOne({ where: { id } });
    if (!retro) {
      return res.status(404).json({ error: 'Retrospective not found' });
    }

    const index = parseInt(itemIndex);
    if (retro.actionItems[index]) {
      retro.actionItems[index].completed = completed;
      await retroRepo.save(retro);
    }

    res.json(retro);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

/**
 * POST /api/sprint-retrospectives/generate/:sprintId
 * Generate AI-powered retrospective report
 */
router.post('/generate/:sprintId', async (req, res) => {
  try {
    const { sprintId } = req.params;
    
    console.log(`🤖 Generating AI retrospective for sprint ${sprintId}...`);
    
    const report = await aiRetrospectiveAnalyzer.generateRetrospective(sprintId);
    
    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('❌ Error generating retrospective:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate retrospective'
    });
  }
});

/**
 * GET /api/sprint-retrospectives/metrics/:sprintId
 * Get sprint metrics only (without AI analysis)
 */
router.get('/metrics/:sprintId', async (req, res) => {
  try {
    const { sprintId } = req.params;
    
    const metrics = await aiRetrospectiveAnalyzer.getSprintMetrics(sprintId);
    
    res.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    console.error('❌ Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch metrics'
    });
  }
});

/**
 * GET /api/sprint-retrospectives/trends/:sprintId
 * Get historical trends for a sprint
 */
router.get('/trends/:sprintId', async (req, res) => {
  try {
    const { sprintId } = req.params;
    const lookback = parseInt(req.query.lookback as string) || 5;
    
    console.log(`📈 Generating historical trends for sprint ${sprintId} (lookback: ${lookback})`);
    
    const trends = await aiRetrospectiveAnalyzer.generateHistoricalTrends(sprintId, lookback);
    
    res.json({
      success: true,
      ...trends
    });
  } catch (error: any) {
    console.error('❌ Error generating trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate trends'
    });
  }
});

/**
 * POST /api/sprint-retrospectives/:id/create-tasks
 * Create Jira tasks from retrospective action items
 */
router.post('/:id/create-tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { actionItems } = req.body;
    
    if (!actionItems || !Array.isArray(actionItems)) {
      return res.status(400).json({
        success: false,
        error: 'actionItems array is required'
      });
    }
    
    console.log(`📋 Creating ${actionItems.length} tasks from retrospective ${id}`);
    
    const tasks = await actionItemTrackerService.createTasksFromActionItems(id, actionItems);
    
    res.json({
      success: true,
      tasks,
      message: `Created ${tasks.length} action item tasks`
    });
  } catch (error: any) {
    console.error('❌ Error creating tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tasks'
    });
  }
});

/**
 * GET /api/sprint-retrospectives/:id/action-progress
 * Track progress of action items from a retrospective
 */
router.get('/:id/action-progress', async (req, res) => {
  try {
    const { id } = req.params;
    
    const progress = await actionItemTrackerService.trackActionItemProgress(id);
    
    res.json({
      success: true,
      ...progress
    });
  } catch (error: any) {
    console.error('❌ Error tracking progress:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track progress'
    });
  }
});

/**
 * GET /api/sprint-retrospectives/predict/:sprintId
 * Predict sprint success and identify risks
 */
router.get('/predict/:sprintId', async (req, res) => {
  try {
    const { sprintId } = req.params;
    
    console.log(`🔮 Predicting success for sprint ${sprintId}`);
    
    const prediction = await sprintPredictorService.predictSprintSuccess(sprintId);
    
    res.json({
      success: true,
      ...prediction
    });
  } catch (error: any) {
    console.error('❌ Error predicting sprint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to predict sprint success'
    });
  }
});

export default router;
