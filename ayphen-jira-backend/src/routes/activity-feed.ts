import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ActivityLog } from '../entities/ActivityLog';
import { Issue } from '../entities/Issue';
import { User } from '../entities/User';

const router = Router();

// Get activity feed for user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const activityRepo = AppDataSource.getRepository(ActivityLog);
    const activities = await activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.issue', 'issue')
      .where('activity.userId = :userId', { userId })
      .orWhere('issue.assigneeId = :userId', { userId })
      .orWhere('issue.reporterId = :userId', { userId })
      .orderBy('activity.createdAt', 'DESC')
      .limit(Number(limit))
      .offset(Number(offset))
      .getMany();

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Get project activity feed
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 100 } = req.query;

    const activityRepo = AppDataSource.getRepository(ActivityLog);
    const activities = await activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.issue', 'issue')
      .where('activity.projectId = :projectId', { projectId })
      .orderBy('activity.createdAt', 'DESC')
      .limit(Number(limit))
      .getMany();

    res.json(activities);
  } catch (error) {
    console.error('Error fetching project activity:', error);
    res.status(500).json({ error: 'Failed to fetch project activity' });
  }
});

// Log activity
router.post('/', async (req, res) => {
  try {
    const { userId, issueId, projectId, action, description, metadata } = req.body;

    const activityRepo = AppDataSource.getRepository(ActivityLog);
    const activity = activityRepo.create({
      userId,
      projectId,
      action,
      details: description,
      metadata: { ...metadata, issueId },
    });

    await activityRepo.save(activity);
    res.json(activity);
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

export default router;
