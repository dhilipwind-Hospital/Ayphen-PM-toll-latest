import { Router } from 'express';
import { duplicateLearningService } from '../services/duplicate-learning.service';

const router = Router();

/**
 * POST /api/duplicate-feedback
 * Record user feedback on duplicate suggestion
 */
router.post('/', async (req, res) => {
  try {
    const {
      issueId,
      suggestedDuplicateId,
      aiConfidence,
      userAction,
      userId
    } = req.body;

    if (!issueId || !suggestedDuplicateId || !aiConfidence || !userAction || !userId) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    if (!['dismissed', 'linked', 'merged', 'blocked'].includes(userAction)) {
      return res.status(400).json({
        error: 'Invalid user action'
      });
    }

    await duplicateLearningService.recordFeedback({
      issueId,
      suggestedDuplicateId,
      aiConfidence,
      userAction,
      userId
    });

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error: any) {
    console.error('❌ Feedback recording error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record feedback'
    });
  }
});

/**
 * GET /api/duplicate-feedback/metrics
 * Get accuracy metrics for duplicate detection
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await duplicateLearningService.getAccuracyMetrics();

    res.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    console.error('❌ Metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get metrics'
    });
  }
});

/**
 * GET /api/duplicate-feedback/recent
 * Get recent feedback entries
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const feedback = await duplicateLearningService.getRecentFeedback(limit);

    res.json({
      success: true,
      feedback
    });
  } catch (error: any) {
    console.error('❌ Recent feedback error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent feedback'
    });
  }
});

export default router;
