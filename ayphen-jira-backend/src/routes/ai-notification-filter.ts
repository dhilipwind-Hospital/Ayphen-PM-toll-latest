import { Router } from 'express';
import { aiNotificationFilterService } from '../services/ai-notification-filter.service';

const router = Router();

/**
 * POST /api/ai-notification-filter/filter
 * Filter and prioritize notifications for a user
 */
router.post('/filter', async (req, res) => {
  try {
    const { userId, notifications } = req.body;

    if (!userId || !Array.isArray(notifications)) {
      return res.status(400).json({
        success: false,
        error: 'userId and notifications array are required'
      });
    }

    console.log(`🔔 Filtering ${notifications.length} notifications for user: ${userId}`);

    const result = await aiNotificationFilterService.filterNotifications(userId, notifications);

    res.json({
      success: true,
      data: result,
      message: `Filtered notifications: ${result.critical.length} critical, ${result.important.length} important, ${result.batched.length} batched`
    });
  } catch (error: any) {
    console.error('❌ Notification filtering error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to filter notifications'
    });
  }
});

/**
 * POST /api/ai-notification-filter/analyze-priority
 * Analyze priority of a single notification
 */
router.post('/analyze-priority', async (req, res) => {
  try {
    const { notification } = req.body;

    if (!notification) {
      return res.status(400).json({
        success: false,
        error: 'notification object is required'
      });
    }

    const priority = await aiNotificationFilterService.analyzePriority(notification);

    res.json({
      success: true,
      data: { priority },
      message: `Notification priority: ${priority}`
    });
  } catch (error: any) {
    console.error('❌ Priority analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze priority'
    });
  }
});

/**
 * GET /api/ai-notification-filter/stats/:userId
 * Get notification statistics for a user
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    const stats = await aiNotificationFilterService.getNotificationStats(
      userId,
      days ? parseInt(days as string) : 7
    );

    res.json({
      success: true,
      data: stats,
      message: 'Notification statistics retrieved'
    });
  } catch (error: any) {
    console.error('❌ Stats retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats'
    });
  }
});

export default router;
