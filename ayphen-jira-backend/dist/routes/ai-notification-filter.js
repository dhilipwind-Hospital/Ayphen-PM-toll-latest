"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_notification_filter_service_1 = require("../services/ai-notification-filter.service");
const router = (0, express_1.Router)();
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
        const result = await ai_notification_filter_service_1.aiNotificationFilterService.filterNotifications(userId, notifications);
        res.json({
            success: true,
            data: result,
            message: `Filtered notifications: ${result.critical.length} critical, ${result.important.length} important, ${result.batched.length} batched`
        });
    }
    catch (error) {
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
        const priority = await ai_notification_filter_service_1.aiNotificationFilterService.analyzePriority(notification);
        res.json({
            success: true,
            data: { priority },
            message: `Notification priority: ${priority}`
        });
    }
    catch (error) {
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
        const stats = await ai_notification_filter_service_1.aiNotificationFilterService.getNotificationStats(userId, days ? parseInt(days) : 7);
        res.json({
            success: true,
            data: stats,
            message: 'Notification statistics retrieved'
        });
    }
    catch (error) {
        console.error('❌ Stats retrieval error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get stats'
        });
    }
});
exports.default = router;
