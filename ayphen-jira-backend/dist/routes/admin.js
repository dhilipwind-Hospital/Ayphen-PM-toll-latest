"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Project_1 = require("../entities/Project");
const Issue_1 = require("../entities/Issue");
const ProjectMember_1 = require("../entities/ProjectMember");
const ActivityLog_1 = require("../entities/ActivityLog");
const router = (0, express_1.Router)();
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
const activityLogRepo = database_1.AppDataSource.getRepository(ActivityLog_1.ActivityLog);
// Middleware to check if user is system admin
const requireSystemAdmin = async (req, res, next) => {
    try {
        const userId = req.query.adminId || req.body.adminId;
        if (!userId) {
            return res.status(401).json({ error: 'Admin authorization required' });
        }
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user || !user.isSystemAdmin) {
            return res.status(403).json({ error: 'System admin access required' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Authorization failed' });
    }
};
// GET system stats (dashboard)
router.get('/stats', requireSystemAdmin, async (req, res) => {
    try {
        const totalUsers = await userRepo.count();
        const activeUsers = await userRepo.count({ where: { isActive: true } });
        const totalProjects = await projectRepo.count();
        const totalIssues = await issueRepo.count();
        // Recent activity
        const recentActivity = await activityLogRepo.find({
            take: 50,
            order: { createdAt: 'DESC' },
            relations: ['user', 'project'],
        });
        res.json({
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            totalProjects,
            totalIssues,
            recentActivity,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET all users (admin)
router.get('/users', requireSystemAdmin, async (req, res) => {
    try {
        const users = await userRepo.find({
            order: { createdAt: 'DESC' },
            select: ['id', 'name', 'email', 'role', 'isActive', 'isSystemAdmin', 'createdAt', 'lastLoginAt'],
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT deactivate user
router.put('/users/:id/deactivate', requireSystemAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.body;
        const user = await userRepo.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.isSystemAdmin) {
            return res.status(400).json({ error: 'Cannot deactivate system admin' });
        }
        await userRepo.update(id, {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedBy: adminId,
        });
        // Log activity
        await activityLogRepo.save({
            userId: adminId,
            action: 'user_deactivated',
            details: `Deactivated user: ${user.email}`,
            metadata: { userId: id, userEmail: user.email },
        });
        const updated = await userRepo.findOne({ where: { id } });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT activate user
router.put('/users/:id/activate', requireSystemAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.body;
        const user = await userRepo.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await userRepo.update(id, {
            isActive: true,
            deactivatedAt: null,
            deactivatedBy: null,
        });
        // Log activity
        await activityLogRepo.save({
            userId: adminId,
            action: 'user_activated',
            details: `Activated user: ${user.email}`,
            metadata: { userId: id, userEmail: user.email },
        });
        const updated = await userRepo.findOne({ where: { id } });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE user (soft delete)
router.delete('/users/:id', requireSystemAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.query;
        const user = await userRepo.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.isSystemAdmin) {
            return res.status(400).json({ error: 'Cannot delete system admin' });
        }
        // Remove from all projects
        await projectMemberRepo.delete({ userId: id });
        // Deactivate instead of hard delete
        await userRepo.update(id, {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedBy: adminId,
        });
        // Log activity
        await activityLogRepo.save({
            userId: adminId,
            action: 'user_deleted',
            details: `Deleted user: ${user.email}`,
            metadata: { userId: id, userEmail: user.email },
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT make user system admin
router.put('/users/:id/make-admin', requireSystemAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.body;
        await userRepo.update(id, { isSystemAdmin: true });
        const user = await userRepo.findOne({ where: { id } });
        // Log activity
        await activityLogRepo.save({
            userId: adminId,
            action: 'admin_granted',
            details: `Granted system admin to: ${user?.email}`,
            metadata: { userId: id },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT remove system admin
router.put('/users/:id/remove-admin', requireSystemAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.body;
        const user = await userRepo.findOne({ where: { id } });
        if (user?.id === adminId) {
            return res.status(400).json({ error: 'Cannot remove your own admin access' });
        }
        await userRepo.update(id, { isSystemAdmin: false });
        // Log activity
        await activityLogRepo.save({
            userId: adminId,
            action: 'admin_revoked',
            details: `Revoked system admin from: ${user?.email}`,
            metadata: { userId: id },
        });
        const updated = await userRepo.findOne({ where: { id } });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST transfer project ownership
router.post('/projects/:id/transfer', requireSystemAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newLeadId, adminId } = req.body;
        if (!newLeadId) {
            return res.status(400).json({ error: 'New lead ID required' });
        }
        const project = await projectRepo.findOne({ where: { id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const oldLeadId = project.leadId;
        // Update project lead
        await projectRepo.update(id, { leadId: newLeadId });
        // Ensure new lead is admin of project
        const existingMember = await projectMemberRepo.findOne({
            where: { projectId: id, userId: newLeadId },
        });
        if (existingMember) {
            await projectMemberRepo.update(existingMember.id, { role: 'admin' });
        }
        else {
            await projectMemberRepo.save({
                projectId: id,
                userId: newLeadId,
                role: 'admin',
                addedById: adminId,
            });
        }
        // Log activity
        await activityLogRepo.save({
            userId: adminId,
            projectId: id,
            action: 'project_transferred',
            details: `Project transferred from ${oldLeadId} to ${newLeadId}`,
            metadata: { oldLeadId, newLeadId },
        });
        const updated = await projectRepo.findOne({
            where: { id },
            relations: ['lead'],
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET audit logs
router.get('/audit-logs', requireSystemAdmin, async (req, res) => {
    try {
        const { limit = 100, offset = 0, action, userId, projectId } = req.query;
        const where = {};
        if (action)
            where.action = action;
        if (userId)
            where.userId = userId;
        if (projectId)
            where.projectId = projectId;
        const logs = await activityLogRepo.find({
            where,
            relations: ['user', 'project'],
            order: { createdAt: 'DESC' },
            take: Number(limit),
            skip: Number(offset),
        });
        const total = await activityLogRepo.count({ where });
        res.json({
            logs,
            total,
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET usage analytics
router.get('/analytics/usage', requireSystemAdmin, async (req, res) => {
    try {
        // Projects analytics
        const projectsByCategory = await projectRepo
            .createQueryBuilder('project')
            .select('project.category', 'category')
            .addSelect('COUNT(*)', 'count')
            .groupBy('project.category')
            .getRawMany();
        const projectsByType = await projectRepo
            .createQueryBuilder('project')
            .select('project.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('project.type')
            .getRawMany();
        // Issues analytics
        const issuesByStatus = await issueRepo
            .createQueryBuilder('issue')
            .select('issue.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('issue.status')
            .getRawMany();
        const issuesByType = await issueRepo
            .createQueryBuilder('issue')
            .select('issue.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('issue.type')
            .getRawMany();
        // Member analytics
        const membersByRole = await projectMemberRepo
            .createQueryBuilder('member')
            .select('member.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('member.role')
            .getRawMany();
        res.json({
            projects: {
                byCategory: projectsByCategory,
                byType: projectsByType,
            },
            issues: {
                byStatus: issuesByStatus,
                byType: issuesByType,
            },
            members: {
                byRole: membersByRole,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET project analytics
router.get('/analytics/projects/:id', requireSystemAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectRepo.findOne({ where: { id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const issueCount = await issueRepo.count({ where: { projectId: id } });
        const memberCount = await projectMemberRepo.count({ where: { projectId: id } });
        const issuesByStatus = await issueRepo
            .createQueryBuilder('issue')
            .select('issue.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('issue.projectId = :id', { id })
            .groupBy('issue.status')
            .getRawMany();
        const recentActivity = await activityLogRepo.find({
            where: { projectId: id },
            take: 20,
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
        res.json({
            project,
            issueCount,
            memberCount,
            issuesByStatus,
            recentActivity,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
