"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Project_1 = require("../entities/Project");
const User_1 = require("../entities/User");
const ProjectMember_1 = require("../entities/ProjectMember");
const projectAccess_1 = require("../middleware/projectAccess");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
const projectMemberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
// GET public projects (no auth needed)
router.get('/public', async (req, res) => {
    try {
        const projects = await projectRepo.find({
            where: { visibility: 'public' },
            relations: ['lead'],
            order: { createdAt: 'DESC' },
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch public projects' });
    }
});
// GET all projects (filtered by user's accessible projects)
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        // 🔒 REQUIRE userId FOR DATA ISOLATION
        if (!userId) {
            return res.json([]); // No userId = No data
        }
        // Get user's accessible projects
        const accessibleProjectIds = await (0, projectAccess_1.getUserProjectIds)(userId);
        if (accessibleProjectIds.length === 0) {
            return res.json([]);
        }
        const projects = await projectRepo.find({
            where: { id: (0, typeorm_1.In)(accessibleProjectIds) },
            relations: ['lead'],
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
// GET project by ID
router.get('/:id', async (req, res) => {
    try {
        const project = await projectRepo.findOne({
            where: { id: req.params.id },
            relations: ['lead'],
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
// POST create project
router.post('/', async (req, res) => {
    try {
        const { key, name, description, type, leadId, category, isStarred } = req.body;
        // Validate required fields
        if (!key || !name || !leadId) {
            return res.status(400).json({ error: 'Missing required fields: key, name, leadId' });
        }
        // Check if project key already exists
        const existing = await projectRepo.findOne({ where: { key: key.toUpperCase() } });
        if (existing) {
            return res.status(400).json({ error: `Project with key ${key} already exists` });
        }
        // Verify lead user exists
        const lead = await userRepo.findOne({ where: { id: leadId } });
        if (!lead) {
            return res.status(404).json({ error: 'Lead user not found' });
        }
        // Create project
        const project = projectRepo.create({
            key: key.toUpperCase(),
            name,
            description: description || '',
            type: type || 'scrum',
            leadId,
            category: category || 'Software Development',
            isStarred: isStarred || false,
        });
        const savedProject = await projectRepo.save(project);
        // Automatically add creator/lead as admin member
        const projectMember = projectMemberRepo.create({
            projectId: savedProject.id,
            userId: leadId,
            role: 'admin',
            addedById: leadId,
        });
        await projectMemberRepo.save(projectMember);
        // Return with relations
        const fullProject = await projectRepo.findOne({
            where: { id: savedProject.id },
            relations: ['lead'],
        });
        console.log(`✅ Created project: ${fullProject?.key} - ${fullProject?.name}`);
        console.log(`✅ Added ${lead.name} as admin member`);
        res.status(201).json(fullProject);
    }
    catch (error) {
        console.error('❌ Error creating project:', error);
        res.status(500).json({ error: error.message || 'Failed to create project' });
    }
});
// PUT update project
router.put('/:id', async (req, res) => {
    try {
        await projectRepo.update(req.params.id, req.body);
        const project = await projectRepo.findOne({
            where: { id: req.params.id },
            relations: ['lead'],
        });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});
// DELETE project
router.delete('/:id', async (req, res) => {
    try {
        await projectRepo.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
// GET project workflow
router.get('/:id/workflow', async (req, res) => {
    try {
        const project = await projectRepo.findOne({
            where: { id: req.params.id },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ workflowId: project.workflowId || 'workflow-1' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch project workflow' });
    }
});
// PUT update project workflow
router.put('/:id/workflow', async (req, res) => {
    try {
        const { workflowId } = req.body;
        await projectRepo.update(req.params.id, { workflowId });
        const project = await projectRepo.findOne({
            where: { id: req.params.id },
            relations: ['lead'],
        });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update project workflow' });
    }
});
// POST archive project
router.post('/:id/archive', async (req, res) => {
    try {
        const project = await projectRepo.findOne({ where: { id: req.params.id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        await projectRepo.update(req.params.id, {
            isArchived: true,
            archivedAt: new Date(),
            archivedBy: req.body.userId || null,
        });
        const updated = await projectRepo.findOne({
            where: { id: req.params.id },
            relations: ['lead'],
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to archive project:', error);
        res.status(500).json({ error: 'Failed to archive project' });
    }
});
// POST restore project
router.post('/:id/restore', async (req, res) => {
    try {
        const project = await projectRepo.findOne({ where: { id: req.params.id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        await projectRepo.update(req.params.id, {
            isArchived: false,
            archivedAt: null,
            archivedBy: null,
        });
        const updated = await projectRepo.findOne({
            where: { id: req.params.id },
            relations: ['lead'],
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to restore project:', error);
        res.status(500).json({ error: 'Failed to restore project' });
    }
});
// GET project permissions
router.get('/:id/permissions', async (req, res) => {
    try {
        const project = await projectRepo.findOne({ where: { id: req.params.id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Return default permissions if not set
        const permissions = project.projectPermissions || {
            admin: ['create', 'read', 'update', 'delete', 'archive', 'manage-members'],
            developer: ['create', 'read', 'update', 'comment'],
            viewer: ['read'],
        };
        res.json(permissions);
    }
    catch (error) {
        console.error('Failed to fetch permissions:', error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});
// PUT update project permissions
router.put('/:id/permissions', async (req, res) => {
    try {
        const project = await projectRepo.findOne({ where: { id: req.params.id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        await projectRepo.update(req.params.id, {
            projectPermissions: req.body,
        });
        res.json({ success: true, permissions: req.body });
    }
    catch (error) {
        console.error('Failed to update permissions:', error);
        res.status(500).json({ error: 'Failed to update permissions' });
    }
});
// POST export project
router.post('/:id/export', async (req, res) => {
    try {
        const project = await projectRepo.findOne({
            where: { id: req.params.id },
            relations: ['lead'],
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const exportData = {
            project,
            exportedAt: new Date(),
            version: '1.0',
            format: req.body.format || 'json',
        };
        res.json(exportData);
    }
    catch (error) {
        console.error('Failed to export project:', error);
        res.status(500).json({ error: 'Failed to export project' });
    }
});
// POST import project
router.post('/import', async (req, res) => {
    try {
        const { projectData, options } = req.body;
        if (!projectData) {
            return res.status(400).json({ error: 'Project data required' });
        }
        const project = projectRepo.create({
            ...projectData,
            key: projectData.key + '_IMPORTED',
            name: projectData.name + ' (Imported)',
        });
        const savedProject = await projectRepo.save(project);
        res.json(savedProject);
    }
    catch (error) {
        console.error('Failed to import project:', error);
        res.status(500).json({ error: 'Failed to import project' });
    }
});
// GET project members
router.get('/:id/members', async (req, res) => {
    try {
        const project = await projectRepo.findOne({ where: { id: req.params.id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Return memberRoles or empty array
        const members = project.memberRoles || [];
        res.json(members);
    }
    catch (error) {
        console.error('Failed to fetch members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});
// POST add project member
router.post('/:id/members', async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role) {
            return res.status(400).json({ error: 'userId and role required' });
        }
        const project = await projectRepo.findOne({ where: { id: req.params.id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const members = project.memberRoles || [];
        members.push({ userId, role, addedAt: new Date() });
        await projectRepo.update(req.params.id, { memberRoles: members });
        res.json({ success: true, members });
    }
    catch (error) {
        console.error('Failed to add member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});
// DELETE remove project member
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const project = await projectRepo.findOne({ where: { id: req.params.id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const members = (project.memberRoles || []).filter((m) => m.userId !== req.params.userId);
        await projectRepo.update(req.params.id, { memberRoles: members });
        res.json({ success: true, members });
    }
    catch (error) {
        console.error('Failed to remove member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});
// PUT update member role
router.put('/:id/members/:userId/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ error: 'Role required' });
        }
        const project = await projectRepo.findOne({ where: { id: req.params.id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const members = (project.memberRoles || []).map((m) => m.userId === req.params.userId ? { ...m, role } : m);
        await projectRepo.update(req.params.id, { memberRoles: members });
        res.json({ success: true, members });
    }
    catch (error) {
        console.error('Failed to update member role:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
});
// POST join public project
router.post('/:id/join', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        const project = await projectRepo.findOne({ where: { id } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.visibility !== 'public' || !project.allowPublicJoin) {
            return res.status(403).json({ error: 'Project is not open for joining' });
        }
        // Check if already member
        const existing = await projectMemberRepo.findOne({
            where: { projectId: id, userId },
        });
        if (existing) {
            return res.status(400).json({ error: 'Already a member' });
        }
        // Add as viewer by default
        const member = projectMemberRepo.create({
            projectId: id,
            userId,
            role: 'viewer',
            addedById: userId, // Self-join
        });
        await projectMemberRepo.save(member);
        res.json({ message: 'Joined project successfully', member });
    }
    catch (error) {
        console.error('Failed to join project:', error);
        res.status(500).json({ error: error.message || 'Failed to join project' });
    }
});
exports.default = router;
