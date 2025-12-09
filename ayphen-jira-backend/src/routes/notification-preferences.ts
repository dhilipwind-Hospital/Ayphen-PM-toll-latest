import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { NotificationPreference } from '../entities/NotificationPreference';

const router = Router();

// Get user's notification preferences
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const prefRepo = AppDataSource.getRepository(NotificationPreference);
    
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
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update user's notification preferences
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const prefRepo = AppDataSource.getRepository(NotificationPreference);
    
    let preferences = await prefRepo.findOne({ where: { userId } });
    
    if (!preferences) {
      preferences = prefRepo.create({ userId, ...req.body }) as any;
      const saved = await prefRepo.save(preferences);
      res.json(saved);
    } else {
      Object.assign(preferences, req.body);
      const saved = await prefRepo.save(preferences);
      res.json(saved);
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

export default router;
