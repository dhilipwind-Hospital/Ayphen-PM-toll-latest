"use strict";
/**
 * Team Notifications Routes
 *
 * In-app notifications for team members within Ayphen PM
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Notification_1 = require("../entities/Notification");
const User_1 = require("../entities/User");
const Team_1 = require("../entities/Team");
const ProjectMember_1 = require("../entities/ProjectMember");
const router = (0, express_1.Router)();
/**
 * POST /api/team-notifications/team/:teamId/notify
 * Send notification to all members of a team/project
 * teamId can be a Team ID or Project ID
 */
router.post('/team/:teamId/notify', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { title, message, type = 'info', priority = 'medium', actionUrl } = req.body;
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        const { Project } = require('../entities/Project');
        const projectRepo = database_1.AppDataSource.getRepository(Project);
        // Try to find as project first (frontend sends project ID)
        let projectId = teamId;
        let projectName = 'Team';
        const project = await projectRepo.findOne({ where: { id: teamId } });
        if (project) {
            projectId = project.id;
            projectName = project.name;
        }
        else {
            // Try as team ID
            const teamRepo = database_1.AppDataSource.getRepository(Team_1.Team);
            const team = await teamRepo.findOne({ where: { id: teamId } });
            if (team) {
                projectId = team.projectId;
                projectName = team.name;
            }
        }
        // Get all project members
        const members = await projectMemberRepo.find({
            where: { projectId },
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
            message: `[${projectName}] ${message}`,
            projectId: projectId,
            actionUrl: actionUrl || null,
            read: false
        }));
        await notificationRepo.insert(notificationsData);
        res.json({
            success: true,
            message: `Notification sent to ${notificationsData.length} team members`,
            notifiedCount: notificationsData.length
        });
    }
    catch (error) {
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
 * If teamId is 'all', returns all notifications for the user
 */
router.get('/team/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        let notifications;
        if (teamId === 'all') {
            // Return all notifications for this user
            notifications = await notificationRepo.find({
                where: { userId: userId },
                order: { createdAt: 'DESC' },
                take: 50
            });
        }
        else {
            // Return notifications for specific project/team
            notifications = await notificationRepo.find({
                where: {
                    userId: userId,
                    projectId: teamId
                },
                order: { createdAt: 'DESC' },
                take: 50
            });
        }
        // Return as array directly for frontend compatibility
        res.json(notifications);
    }
    catch (error) {
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
router.post('/broadcast', async (req, res) => {
    try {
        const { title, message, priority = 'medium', projectId } = req.body;
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        let userIds = [];
        if (projectId) {
            // Get project members only
            const members = await projectMemberRepo.find({
                where: { projectId }
            });
            userIds = members.map(m => m.userId);
        }
        else {
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
    }
    catch (error) {
        console.error('Error broadcasting notification:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to broadcast notification'
        });
    }
});
exports.default = router;
