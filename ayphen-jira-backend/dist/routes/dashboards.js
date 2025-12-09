"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const Sprint_1 = require("../entities/Sprint");
const User_1 = require("../entities/User");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
// In-memory dashboards storage (can be moved to database later)
let dashboards = [
    {
        id: 'dashboard-1',
        name: 'System Dashboard',
        description: 'Default system dashboard',
        isStarred: false,
        isSystem: true,
        owner: null,
        layout: '2-column',
        gadgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
// GET /api/dashboards
router.get('/', async (req, res) => {
    try {
        res.json(dashboards);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/dashboards/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dashboard = dashboards.find(d => d.id === id);
        if (!dashboard) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        res.json(dashboard);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/dashboards
router.post('/', async (req, res) => {
    try {
        const { name, description, ownerId, layout = '2-column' } = req.body;
        const dashboard = {
            id: `dashboard-${Date.now()}`,
            name,
            description,
            isStarred: false,
            isSystem: false,
            owner: ownerId,
            layout,
            gadgets: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        dashboards.push(dashboard);
        res.status(201).json(dashboard);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT /api/dashboards/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, layout, gadgets } = req.body;
        const index = dashboards.findIndex(d => d.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        dashboards[index] = {
            ...dashboards[index],
            name: name || dashboards[index].name,
            description: description || dashboards[index].description,
            layout: layout || dashboards[index].layout,
            gadgets: gadgets !== undefined ? gadgets : dashboards[index].gadgets,
            updatedAt: new Date().toISOString(),
        };
        res.json(dashboards[index]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/dashboards/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const index = dashboards.findIndex(d => d.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        if (dashboards[index].isSystem) {
            return res.status(403).json({ error: 'Cannot delete system dashboard' });
        }
        dashboards.splice(index, 1);
        res.json({ message: 'Dashboard deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/dashboards/:id/gadgets/:gadgetType/data
// Get data for specific gadget type
router.get('/:id/gadgets/:gadgetType/data', async (req, res) => {
    try {
        const { gadgetType } = req.params;
        const { projectId = 'default-project', filter, limit = 10 } = req.query;
        let data = {};
        switch (gadgetType) {
            case 'assigned-to-me':
                const assignedIssues = await issueRepo.find({
                    where: { projectId: projectId },
                    take: parseInt(limit),
                    order: { createdAt: 'DESC' },
                });
                data = {
                    issues: assignedIssues.map(i => ({
                        id: i.id,
                        key: i.key,
                        summary: i.summary,
                        type: i.type,
                        status: i.status,
                        priority: i.priority,
                    })),
                    total: assignedIssues.length,
                };
                break;
            case 'activity-stream':
                const recentIssues = await issueRepo.find({
                    where: { projectId: projectId },
                    take: parseInt(limit),
                    order: { updatedAt: 'DESC' },
                });
                data = {
                    activities: recentIssues.map(i => ({
                        id: i.id,
                        type: 'issue_updated',
                        issue: { key: i.key, summary: i.summary },
                        timestamp: i.updatedAt,
                    })),
                };
                break;
            case 'pie-chart':
                const allIssues = await issueRepo.find({
                    where: { projectId: projectId },
                });
                const statusCounts = allIssues.reduce((acc, issue) => {
                    acc[issue.status] = (acc[issue.status] || 0) + 1;
                    return acc;
                }, {});
                data = {
                    data: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
                };
                break;
            case 'created-vs-resolved':
                const last30Days = new Date();
                last30Days.setDate(last30Days.getDate() - 30);
                const issues = await issueRepo.find({
                    where: { projectId: projectId },
                });
                const created = issues.filter(i => new Date(i.createdAt) >= last30Days).length;
                const resolved = issues.filter(i => i.status === 'done' && new Date(i.updatedAt) >= last30Days).length;
                data = {
                    created,
                    resolved,
                    trend: created > resolved ? 'increasing' : 'decreasing',
                };
                break;
            case 'sprint-burndown':
                const activeSprint = await sprintRepo.findOne({
                    where: { projectId: projectId, status: 'active' },
                });
                if (activeSprint) {
                    const sprintIssues = await issueRepo.find({
                        where: { sprintId: activeSprint.id },
                    });
                    const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                    const completedPoints = sprintIssues
                        .filter(i => i.status === 'done')
                        .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                    data = {
                        sprint: activeSprint.name,
                        totalPoints,
                        completedPoints,
                        remainingPoints: totalPoints - completedPoints,
                        progress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
                    };
                }
                else {
                    data = { message: 'No active sprint' };
                }
                break;
            case 'quick-links':
                data = {
                    links: [
                        { title: 'Create Issue', url: '/create-issue' },
                        { title: 'View Board', url: '/board' },
                        { title: 'Backlog', url: '/backlog' },
                        { title: 'Reports', url: '/reports' },
                    ],
                };
                break;
            case 'stats':
                const statsIssues = await issueRepo.find({
                    where: { projectId: projectId },
                });
                data = {
                    total: statsIssues.length,
                    open: statsIssues.filter(i => i.status !== 'done').length,
                    inProgress: statsIssues.filter(i => i.status === 'in-progress').length,
                    done: statsIssues.filter(i => i.status === 'done').length,
                };
                break;
            case 'in-progress':
                const inProgressIssues = await issueRepo.find({
                    where: { projectId: projectId, status: 'in-progress' },
                    take: parseInt(limit),
                });
                data = {
                    issues: inProgressIssues.map(i => ({
                        id: i.id,
                        key: i.key,
                        summary: i.summary,
                        type: i.type,
                        assignee: i.assignee,
                    })),
                };
                break;
            case 'filter-results':
                const filterIssues = await issueRepo.find({
                    where: { projectId: projectId },
                    take: parseInt(limit),
                    order: { createdAt: 'DESC' },
                });
                data = {
                    issues: filterIssues.map(i => ({
                        id: i.id,
                        key: i.key,
                        summary: i.summary,
                        type: i.type,
                        status: i.status,
                        priority: i.priority,
                    })),
                    total: filterIssues.length,
                };
                break;
            case 'user-workload':
                const users = await userRepo.find();
                const workloadIssues = await issueRepo.find({
                    where: { projectId: projectId, status: (0, typeorm_1.Not)('done') },
                });
                data = {
                    users: users.map(user => ({
                        id: user.id,
                        name: user.name,
                        issueCount: workloadIssues.filter(i => i.assigneeId === user.id).length,
                    })).filter(u => u.issueCount > 0),
                };
                break;
            default:
                data = { message: 'Gadget type not implemented' };
        }
        res.json(data);
    }
    catch (error) {
        console.error('Failed to get gadget data:', error);
        res.status(500).json({ error: error.message });
    }
});
// Import Not from typeorm for the user-workload gadget
const typeorm_1 = require("typeorm");
exports.default = router;
