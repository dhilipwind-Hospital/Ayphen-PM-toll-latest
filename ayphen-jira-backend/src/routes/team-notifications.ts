/**
 * Team Notifications Routes
 * 
 * In-app notifications for team members within Ayphen PM
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { User } from '../entities/User';
import { Team } from '../entities/Team';
import { ProjectMember } from '../entities/ProjectMember';

const router = Router();

/**
 * POST /api/team-notifications/team/:teamId/notify
 * Send notification to all members of a team
 */
router.post('/team/:teamId/notify', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { title, message, type = 'info', priority = 'medium', actionUrl } = req.body;

    if (!title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and message are required' 
      });
    }

    const teamRepo = AppDataSource.getRepository(Team);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);

    // Get team
    const team = await teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    // Get all project members (since teams are project-based)
    const members = await projectMemberRepo.find({
      where: { projectId: team.projectId },
      relations: ['user']
    });

    if (members.length === 0) {
      return res.json({
        success: true,
        message: 'No team members to notify',
        notifiedCount: 0
      });
    }

    // Create notifications for each member
    const notificationsData = members.map(member => ({
      userId: member.userId,
      type: type,
      title: title,
      message: `[${team.name}] ${message}`,
      projectId: team.projectId,
      actionUrl: actionUrl || null,
      read: false
    }));

    await notificationRepo.insert(notificationsData);

    res.json({
      success: true,
      message: `Notification sent to ${notificationsData.length} team members`,
      notifiedCount: notificationsData.length
    });
  } catch (error: any) {
    console.error('Error sending team notification:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send notification' 
    });
  }
});

/**
 * GET /api/team-notifications/team/:teamId
 * Get notifications for a team (filtered by user)
 */
router.get('/team/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.query;

    const notificationRepo = AppDataSource.getRepository(Notification);

    const whereClause: any = {};
    
    if (userId) {
      whereClause.userId = userId;
    }

    // Get notifications that have this teamId in their data
    const notifications = await notificationRepo
      .createQueryBuilder('notification')
      .where(userId ? 'notification.userId = :userId' : '1=1', { userId })
      .andWhere("notification.data->>'teamId' = :teamId", { teamId })
      .orderBy('notification.createdAt', 'DESC')
      .take(50)
      .getMany();

    res.json({
      success: true,
      notifications
    });
  } catch (error: any) {
    console.error('Error fetching team notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch notifications' 
    });
  }
});

/**
 * POST /api/team-notifications/broadcast
 * Broadcast notification to all users (or all in a project)
 */
router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const { title, message, priority = 'medium', projectId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and message are required' 
      });
    }

    const notificationRepo = AppDataSource.getRepository(Notification);
    const userRepo = AppDataSource.getRepository(User);
    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);

    let userIds: string[] = [];

    if (projectId) {
      // Get project members only
      const members = await projectMemberRepo.find({
        where: { projectId }
      });
      userIds = members.map(m => m.userId);
    } else {
      // Get all active users
      const users = await userRepo.find({
        where: { isActive: true }
      });
      userIds = users.map(u => u.id);
    }

    if (userIds.length === 0) {
      return res.json({
        success: true,
        message: 'No users to notify',
        notifiedCount: 0
      });
    }

    // Create notifications for each user
    const notificationsData = userIds.map(userId => ({
      userId,
      type: 'broadcast',
      title,
      message,
      projectId: projectId || null,
      read: false
    }));

    await notificationRepo.insert(notificationsData);

    res.json({
      success: true,
      message: `Broadcast sent to ${notificationsData.length} users`,
      notifiedCount: notificationsData.length
    });
  } catch (error: any) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to broadcast notification' 
    });
  }
});

export default router;
