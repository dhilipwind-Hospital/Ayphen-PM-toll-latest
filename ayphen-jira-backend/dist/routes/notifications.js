"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const Notification_1 = require("../entities/Notification");
const router = (0, express_1.Router)();
// Get all notifications for a user (exclude snoozed)
router.get('/', async (req, res) => {
    try {
        const { userId, limit = 50, includeSnoozed = false } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const queryBuilder = notificationRepo.createQueryBuilder('notification');
        queryBuilder.where('notification.userId = :userId', { userId: userId });
        // Exclude snoozed notifications unless requested
        if (includeSnoozed !== 'true') {
            queryBuilder.andWhere('(notification.snoozedUntil IS NULL OR notification.snoozedUntil < :now)', { now: new Date() });
        }
        const notifications = await queryBuilder
            .orderBy('notification.createdAt', 'DESC')
            .take(parseInt(limit))
            .getMany();
        res.json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// Get unread count
router.get('/unread-count', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const count = await notificationRepo.count({
            where: { userId: userId, read: false }
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});
// Create notification
router.post('/', async (req, res) => {
    try {
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const notification = notificationRepo.create(req.body);
        await notificationRepo.save(notification);
        res.status(201).json(notification);
    }
    catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});
// Mark notification as read (PUT)
router.put('/:id/read', async (req, res) => {
    try {
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        await notificationRepo.update(req.params.id, { read: true });
        const notification = await notificationRepo.findOne({ where: { id: req.params.id } });
        res.json(notification);
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
// Mark notification as read (PATCH - for frontend compatibility)
router.patch('/:id/read', async (req, res) => {
    try {
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        await notificationRepo.update(req.params.id, { read: true });
        const notification = await notificationRepo.findOne({ where: { id: req.params.id } });
        res.json(notification);
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
// Mark all as read for a user
router.put('/mark-all-read', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        await notificationRepo.update({ userId, read: false }, { read: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});
// Snooze notification
router.post('/:id/snooze', async (req, res) => {
    try {
        const { minutes } = req.body;
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const snoozedUntil = new Date(Date.now() + (minutes * 60 * 1000));
        await notificationRepo.update(req.params.id, { snoozedUntil });
        res.json({ success: true, message: `Notification snoozed for ${minutes} minutes`, snoozedUntil });
    }
    catch (error) {
        console.error('Error snoozing notification:', error);
        res.status(500).json({ error: 'Failed to snooze notification' });
    }
});
// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        await notificationRepo.delete(req.params.id);
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});
// Helper function to create notification (can be imported by other routes)
const createNotification = async (data) => {
    const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
    const notification = notificationRepo.create(data);
    await notificationRepo.save(notification);
    return notification;
};
exports.createNotification = createNotification;
exports.default = router;
