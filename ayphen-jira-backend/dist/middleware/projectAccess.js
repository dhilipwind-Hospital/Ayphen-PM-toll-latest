"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProjectIds = getUserProjectIds;
exports.checkProjectAccess = checkProjectAccess;
exports.checkProjectAdmin = checkProjectAdmin;
const database_1 = require("../config/database");
const ProjectMember_1 = require("../entities/ProjectMember");
// Helper function to get user's accessible project IDs
async function getUserProjectIds(userId) {
    try {
        const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        const memberships = await projectMemberRepo.find({
            where: { userId },
            select: ['projectId'],
        });
        return memberships.map(m => m.projectId);
    }
    catch (error) {
        console.error('Error fetching user projects:', error);
        return [];
    }
}
// Middleware to check if user has access to a specific project
async function checkProjectAccess(req, res, next) {
    try {
        const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
        const userId = req.query.userId || req.body.userId || req.session?.userId;
        if (!projectId || !userId) {
            return res.status(400).json({ error: 'Missing projectId or userId' });
        }
        const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        const membership = await projectMemberRepo.findOne({
            where: {
                projectId: projectId,
                userId: userId,
            },
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        // Attach membership info to request
        req.projectMembership = membership;
        next();
    }
    catch (error) {
        console.error('Project access check error:', error);
        res.status(500).json({ error: 'Failed to verify project access' });
    }
}
// Middleware to check if user is project admin
async function checkProjectAdmin(req, res, next) {
    try {
        const projectId = req.params.projectId || req.body.projectId;
        const userId = req.query.userId || req.body.userId || req.session?.userId;
        if (!projectId || !userId) {
            return res.status(400).json({ error: 'Missing projectId or userId' });
        }
        const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
        const membership = await projectMemberRepo.findOne({
            where: {
                projectId: projectId,
                userId: userId,
            },
        });
        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.projectMembership = membership;
        next();
    }
    catch (error) {
        console.error('Project admin check error:', error);
        res.status(500).json({ error: 'Failed to verify admin access' });
    }
}
