import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';

const router = Router();

// Get all notifications for a user (exclude snoozed)
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 50, includeSnoozed = false } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const notificationRepo = AppDataSource.getRepository(Notification);
    const queryBuilder = notificationRepo.createQueryBuilder('notification');
    
    queryBuilder.where('notification.userId = :userId', { userId: userId as string });
    
    // Exclude snoozed notifications unless requested
    if (includeSnoozed !== 'true') {
      queryBuilder.andWhere('(notification.snoozedUntil IS NULL OR notification.snoozedUntil < :now)', { now: new Date() });
    }
    
    const notifications = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .take(parseInt(limit as string))
      .getMany();
    
    res.json(notifications);
  } catch (error) {
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

    const notificationRepo = AppDataSource.getRepository(Notification);
    const count = await notificationRepo.count({
      where: { userId: userId as string, read: false }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Create notification
router.post('/', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const notification = notificationRepo.create(req.body);
    await notificationRepo.save(notification);
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read (PUT)
router.put('/:id/read', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    await notificationRepo.update(req.params.id, { read: true });
    const notification = await notificationRepo.findOne({ where: { id: req.params.id } });
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark notification as read (PATCH - for frontend compatibility)
router.patch('/:id/read', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    await notificationRepo.update(req.params.id, { read: true });
    const notification = await notificationRepo.findOne({ where: { id: req.params.id } });
    res.json(notification);
  } catch (error) {
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

    const notificationRepo = AppDataSource.getRepository(Notification);
    await notificationRepo.update(
      { userId, read: false },
      { read: true }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Snooze notification
router.post('/:id/snooze', async (req, res) => {
  try {
    const { minutes } = req.body;
    const notificationRepo = AppDataSource.getRepository(Notification);
    
    const snoozedUntil = new Date(Date.now() + (minutes * 60 * 1000));
    
    await notificationRepo.update(req.params.id, { snoozedUntil });
    res.json({ success: true, message: `Notification snoozed for ${minutes} minutes`, snoozedUntil });
  } catch (error: any) {
    console.error('Error snoozing notification:', error);
    res.status(500).json({ error: 'Failed to snooze notification' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    await notificationRepo.delete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Helper function to create notification (can be imported by other routes)
export const createNotification = async (data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  issueId?: string;
  issueKey?: string;
  projectId?: string;
  actionUrl?: string;
  actorId?: string;
  actorName?: string;
}) => {
  const notificationRepo = AppDataSource.getRepository(Notification);
  const notification = notificationRepo.create(data);
  await notificationRepo.save(notification);
  return notification;
};

export default router;
