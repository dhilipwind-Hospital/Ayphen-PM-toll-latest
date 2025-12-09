"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const NotificationPreference_1 = require("../entities/NotificationPreference");
const router = (0, express_1.Router)();
// Get user's notification preferences
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const prefRepo = database_1.AppDataSource.getRepository(NotificationPreference_1.NotificationPreference);
        let preferences = await prefRepo.findOne({ where: { userId } });
        // Create default preferences if none exist
        if (!preferences) {
            preferences = prefRepo.create({
                userId,
                inAppNotifications: true,
                emailNotifications: true,
                desktopNotifications: false,
                doNotDisturb: false,
                notifyOnAssignment: true,
                notifyOnMention: true,
                notifyOnComment: true,
                notifyOnStatusChange: true,
                notifyOnIssueUpdate: true,
                notifyOnSprintStart: true,
                notifyOnSprintComplete: true,
                emailDigestFrequency: 'instant',
                mutedProjects: [],
                mutedIssueTypes: [],
            });
            await prefRepo.save(preferences);
        }
        res.json(preferences);
    }
    catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
});
// Update user's notification preferences
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const prefRepo = database_1.AppDataSource.getRepository(NotificationPreference_1.NotificationPreference);
        let preferences = await prefRepo.findOne({ where: { userId } });
        if (!preferences) {
            preferences = prefRepo.create({ userId, ...req.body });
            const saved = await prefRepo.save(preferences);
            res.json(saved);
        }
        else {
            Object.assign(preferences, req.body);
            const saved = await prefRepo.save(preferences);
            res.json(saved);
        }
    }
    catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
});
exports.default = router;
