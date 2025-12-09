"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Notification_1 = require("../entities/Notification");
const router = (0, express_1.Router)();
const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
// POST send email notification
router.post('/email/send', async (req, res) => {
    try {
        const { to, subject, body, template } = req.body;
        // Simulate email sending (integrate with SendGrid/AWS SES in production)
        const emailResult = {
            id: `email-${Date.now()}`,
            to,
            subject,
            status: 'sent',
            sentAt: new Date(),
        };
        res.json(emailResult);
    }
    catch (error) {
        console.error('Failed to send email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});
// POST send push notification
router.post('/push/send', async (req, res) => {
    try {
        const { userId, title, message, data } = req.body;
        // Simulate push notification (integrate with Firebase/OneSignal in production)
        const pushResult = {
            id: `push-${Date.now()}`,
            userId,
            title,
            message,
            status: 'delivered',
            sentAt: new Date(),
        };
        res.json(pushResult);
    }
    catch (error) {
        console.error('Failed to send push notification:', error);
        res.status(500).json({ error: 'Failed to send push notification' });
    }
});
// POST bulk notifications
router.post('/bulk', async (req, res) => {
    try {
        const { userIds, notification } = req.body;
        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({ error: 'userIds array required' });
        }
        const results = [];
        for (const userId of userIds) {
            const notif = notificationRepo.create({
                userId,
                ...notification,
            });
            const saved = await notificationRepo.save(notif);
            results.push(saved);
        }
        res.json({ success: true, sent: results.length, notifications: results });
    }
    catch (error) {
        console.error('Failed to send bulk notifications:', error);
        res.status(500).json({ error: 'Failed to send bulk notifications' });
    }
});
// GET notification templates
router.get('/templates', async (req, res) => {
    try {
        const templates = [
            {
                id: 'issue-assigned',
                name: 'Issue Assigned',
                subject: 'Issue {{issueKey}} assigned to you',
                body: '{{userName}} assigned {{issueKey}} - {{issueSummary}} to you',
                variables: ['issueKey', 'issueSummary', 'userName'],
            },
            {
                id: 'issue-updated',
                name: 'Issue Updated',
                subject: 'Issue {{issueKey}} was updated',
                body: '{{userName}} updated {{issueKey}} - {{issueSummary}}',
                variables: ['issueKey', 'issueSummary', 'userName'],
            },
            {
                id: 'comment-added',
                name: 'Comment Added',
                subject: 'New comment on {{issueKey}}',
                body: '{{userName}} commented on {{issueKey}}: {{comment}}',
                variables: ['issueKey', 'userName', 'comment'],
            },
        ];
        res.json(templates);
    }
    catch (error) {
        console.error('Failed to get templates:', error);
        res.status(500).json({ error: 'Failed to get templates' });
    }
});
// POST create template
router.post('/templates', async (req, res) => {
    try {
        const { name, subject, body, variables } = req.body;
        const template = {
            id: `template-${Date.now()}`,
            name,
            subject,
            body,
            variables,
            createdAt: new Date(),
        };
        res.json(template);
    }
    catch (error) {
        console.error('Failed to create template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});
// GET notification digest
router.get('/digest', async (req, res) => {
    try {
        const { userId, period } = req.query;
        const notifications = await notificationRepo.find({
            where: { userId: userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
        const digest = {
            period,
            total: notifications.length,
            unread: notifications.filter(n => !n.read).length,
            notifications,
            generatedAt: new Date(),
        };
        res.json(digest);
    }
    catch (error) {
        console.error('Failed to get digest:', error);
        res.status(500).json({ error: 'Failed to get digest' });
    }
});
// POST subscribe to events
router.post('/subscribe', async (req, res) => {
    try {
        const { userId, eventTypes, projectIds } = req.body;
        const subscription = {
            id: `sub-${Date.now()}`,
            userId,
            eventTypes, // ['issue-created', 'issue-assigned', 'comment-added']
            projectIds,
            active: true,
            createdAt: new Date(),
        };
        res.json(subscription);
    }
    catch (error) {
        console.error('Failed to subscribe:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});
// POST unsubscribe from events
router.post('/unsubscribe', async (req, res) => {
    try {
        const { userId, subscriptionId } = req.body;
        res.json({
            success: true,
            subscriptionId,
            unsubscribedAt: new Date(),
        });
    }
    catch (error) {
        console.error('Failed to unsubscribe:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});
// GET notification channels
router.get('/channels', async (req, res) => {
    try {
        const channels = [
            { id: 'email', name: 'Email', enabled: true },
            { id: 'push', name: 'Push Notification', enabled: true },
            { id: 'in-app', name: 'In-App', enabled: true },
            { id: 'sms', name: 'SMS', enabled: false },
            { id: 'slack', name: 'Slack', enabled: false },
        ];
        res.json(channels);
    }
    catch (error) {
        console.error('Failed to get channels:', error);
        res.status(500).json({ error: 'Failed to get channels' });
    }
});
// POST test notification
router.post('/test', async (req, res) => {
    try {
        const { userId, channel, message } = req.body;
        const testResult = {
            success: true,
            channel,
            userId,
            message,
            sentAt: new Date(),
            status: 'delivered',
        };
        res.json(testResult);
    }
    catch (error) {
        console.error('Failed to send test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});
exports.default = router;
