/**
 * Teams Webhook Routes
 * 
 * API endpoints for Teams webhook notifications
 */

import { Router, Request, Response } from 'express';
import { teamsWebhook } from '../services/teams-webhook.service';

const router = Router();

/**
 * GET /api/teams-webhook/status
 * Check if Teams webhook is configured
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    configured: teamsWebhook.isAvailable(),
    message: teamsWebhook.isAvailable() 
      ? 'Teams webhook is configured and ready' 
      : 'Teams webhook not configured. Set TEAMS_WEBHOOK_URL environment variable.'
  });
});

/**
 * POST /api/teams-webhook/test
 * Send a test notification to verify webhook works
 */
router.post('/test', async (req: Request, res: Response) => {
  if (!teamsWebhook.isAvailable()) {
    return res.status(400).json({
      success: false,
      message: 'Teams webhook not configured. Set TEAMS_WEBHOOK_URL environment variable.'
    });
  }

  try {
    const success = await teamsWebhook.sendNotification({
      title: '🧪 Test Notification',
      message: 'This is a test notification from Ayphen PM Tool. If you see this, the integration is working!',
      type: 'success'
    });

    res.json({
      success,
      message: success ? 'Test notification sent successfully' : 'Failed to send test notification'
    });
  } catch (error: any) {
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
router.post('/notify', async (req: Request, res: Response) => {
  if (!teamsWebhook.isAvailable()) {
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
    const success = await teamsWebhook.sendNotification({
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
