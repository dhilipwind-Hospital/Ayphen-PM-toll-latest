"use strict";
/**
 * Teams Webhook Routes
 *
 * API endpoints for Teams webhook notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teams_webhook_service_1 = require("../services/teams-webhook.service");
const router = (0, express_1.Router)();
/**
 * GET /api/teams-webhook/status
 * Check if Teams webhook is configured
 */
router.get('/status', async (req, res) => {
    res.json({
        success: true,
        configured: teams_webhook_service_1.teamsWebhook.isAvailable(),
        message: teams_webhook_service_1.teamsWebhook.isAvailable()
            ? 'Teams webhook is configured and ready'
            : 'Teams webhook not configured. Set TEAMS_WEBHOOK_URL environment variable.'
    });
});
/**
 * POST /api/teams-webhook/test
 * Send a test notification to verify webhook works
 */
router.post('/test', async (req, res) => {
    if (!teams_webhook_service_1.teamsWebhook.isAvailable()) {
        return res.status(400).json({
            success: false,
            message: 'Teams webhook not configured. Set TEAMS_WEBHOOK_URL environment variable.'
        });
    }
    try {
        const success = await teams_webhook_service_1.teamsWebhook.sendNotification({
            title: '🧪 Test Notification',
            message: 'This is a test notification from Ayphen PM Tool. If you see this, the integration is working!',
            type: 'success'
        });
        res.json({
            success,
            message: success ? 'Test notification sent successfully' : 'Failed to send test notification'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
/**
 * POST /api/teams-webhook/notify
 * Send a custom notification
 */
router.post('/notify', async (req, res) => {
    if (!teams_webhook_service_1.teamsWebhook.isAvailable()) {
        return res.status(400).json({
            success: false,
            message: 'Teams webhook not configured'
        });
    }
    const { title, message, type = 'info', issueKey, projectName, userName } = req.body;
    if (!title || !message) {
        return res.status(400).json({
            success: false,
            message: 'Title and message are required'
        });
    }
    try {
        const success = await teams_webhook_service_1.teamsWebhook.sendNotification({
            title,
            message,
            type,
            issueKey,
            projectName,
            userName
        });
        res.json({
            success,
            message: success ? 'Notification sent' : 'Failed to send notification'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.default = router;
