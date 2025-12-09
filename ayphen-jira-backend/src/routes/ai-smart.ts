import { Router } from 'express';
import { aiIssueCreatorService } from '../services/ai-issue-creator.service';
import { aiSprintPlannerService } from '../services/ai-sprint-planner.service';
import { aiPredictiveAnalyticsService } from '../services/ai-predictive-analytics.service';

const router = Router();

/**
 * POST /api/ai-smart/create-issue
 * Create issue from natural language
 */
router.post('/create-issue', async (req, res) => {
  try {
    const { text, projectId, userId } = req.body;

    if (!text || !projectId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🤖 Creating issue from natural language:', text);

    const result = await aiIssueCreatorService.createFromNaturalLanguage({
      text,
      projectId,
      userId
    });

    res.json(result);
  } catch (error: any) {
    console.error('❌ AI create issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai-smart/auto-complete-description
 * Auto-complete issue description
 */
router.post('/auto-complete-description', async (req, res) => {
  try {
    const { partialDescription, issueType } = req.body;

    if (!partialDescription || !issueType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const completed = await aiIssueCreatorService.autoCompleteDescription(
      partialDescription,
      issueType
    );

    res.json({ completed });
  } catch (error: any) {
    console.error('❌ Auto-complete error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai-smart/generate-acceptance-criteria
 * Generate acceptance criteria
 */
router.post('/generate-acceptance-criteria', async (req, res) => {
  try {
    const { summary, description } = req.body;

    if (!summary || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const criteria = await aiIssueCreatorService.generateAcceptanceCriteria(
      summary,
      description
    );

    res.json({ criteria });
  } catch (error: any) {
    console.error('❌ Generate criteria error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai-smart/suggest-sprint
 * Suggest sprint composition
 */
router.post('/suggest-sprint', async (req, res) => {
  try {
    const { projectId, sprintDuration, teamCapacity, backlogIssueIds } = req.body;

    if (!projectId || !sprintDuration || !teamCapacity || !backlogIssueIds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🤖 Suggesting sprint composition for project:', projectId);

    const composition = await aiSprintPlannerService.suggestSprintComposition({
      projectId,
      sprintDuration,
      teamCapacity,
      backlogIssueIds
    });

    res.json(composition);
  } catch (error: any) {
    console.error('❌ Suggest sprint error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai-smart/predict-sprint/:sprintId
 * Predict sprint success
 */
router.get('/predict-sprint/:sprintId', async (req, res) => {
  try {
    const { sprintId } = req.params;

    console.log('🤖 Predicting sprint success:', sprintId);

    const prediction = await aiSprintPlannerService.predictSprintSuccess(sprintId);

    res.json(prediction);
  } catch (error: any) {
    console.error('❌ Predict sprint error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai-smart/balance-workload/:sprintId
 * Balance workload across team
 */
router.get('/balance-workload/:sprintId', async (req, res) => {
  try {
    const { sprintId } = req.params;

    console.log('🤖 Balancing workload for sprint:', sprintId);

    const balance = await aiSprintPlannerService.balanceWorkload(sprintId);

    res.json(balance);
  } catch (error: any) {
    console.error('❌ Balance workload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai-smart/insights/:projectId
 * Get project insights
 */
router.get('/insights/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log('🤖 Generating insights for project:', projectId);

    const insights = await aiPredictiveAnalyticsService.generateInsights(projectId);

    res.json(insights);
  } catch (error: any) {
    console.error('❌ Generate insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai-smart/predict-completion/:issueId
 * Predict issue completion time
 */
router.get('/predict-completion/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;

    console.log('🤖 Predicting completion time for issue:', issueId);

    const prediction = await aiPredictiveAnalyticsService.predictIssueCompletionTime(issueId);

    res.json(prediction);
  } catch (error: any) {
    console.error('❌ Predict completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
