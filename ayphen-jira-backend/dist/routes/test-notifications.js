"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const email_service_1 = require("../services/email.service");
const router = (0, express_1.Router)();
// POST /api/test-notifications/email
router.post('/email', async (req, res) => {
    try {
        const { userId, type } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Test data based on type
        const testData = {
            issue_created: {
                issueKey: 'JC-TEST',
                summary: 'Test Issue for Email Notification',
                type: 'Story',
                priority: 'High',
                actorName: 'Test User',
                projectKey: 'JC',
            },
            assignment_changed: {
                issueKey: 'JC-4',
                summary: 'Implement email notifications',
                priority: 'high',
                status: 'in-progress',
                actorName: 'Dhilip',
                projectKey: 'JC',
            },
            comment_added: {
                issueKey: 'JC-4',
                comment: 'This is a test comment to verify email notifications are working!',
                actorName: 'Dhilip',
                projectKey: 'JC',
            },
            mention: {
                issueKey: 'JC-4',
                context: '@' + user.name + ' can you check the email notification system?',
                actorName: 'Dhilip',
                projectKey: 'JC',
            },
            status_changed: {
                issueKey: 'JC-4',
                oldStatus: 'In Progress',
                newStatus: 'Done',
                actorName: 'Dhilip',
                projectKey: 'JC',
            },
            issue_updated: {
                issueKey: 'JC-4',
                summary: 'Implement email notifications',
                changes: 'Priority changed from Medium to High',
                actorName: 'Dhilip',
                projectKey: 'JC',
            },
        };
        const data = testData[type || 'assignment_changed'];
        await email_service_1.emailService.sendNotificationEmail(userId, type || 'assignment_changed', data);
        res.json({
            success: true,
            message: 'Test email sent!',
            to: user.email,
            type: type || 'assignment_changed',
            note: 'Check your email inbox (and spam folder) for the notification',
        });
    }
    catch (error) {
        console.error('Test notification failed:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST /api/test-notifications/digest
router.post('/digest', async (req, res) => {
    try {
        const { userId } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const sampleNotifications = [
            {
                title: 'JC-4 assigned to you',
                message: 'Dhilip assigned "Implement email notifications" to you',
                createdAt: new Date(),
            },
            {
                title: 'Comment on JC-2',
                message: 'Jane commented: "Great work on the drag and drop!"',
                createdAt: new Date(),
            },
            {
                title: 'Status changed on JC-1',
                message: 'John moved "Setup authentication system" to Done',
                createdAt: new Date(),
            },
        ];
        await email_service_1.emailService.sendDigestEmail(userId, sampleNotifications);
        res.json({
            success: true,
            message: 'Digest email sent!',
            to: user.email,
            notificationCount: sampleNotifications.length,
        });
    }
    catch (error) {
        console.error('Test digest failed:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/test-notifications/users
router.get('/users', async (req, res) => {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const users = await userRepo.find();
        res.json(users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
        })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
