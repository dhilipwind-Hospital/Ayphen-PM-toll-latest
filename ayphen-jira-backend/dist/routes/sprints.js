"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Sprint_1 = require("../entities/Sprint");
const workflow_service_1 = require("../services/workflow.service");
const router = (0, express_1.Router)();
const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
// GET all sprints
router.get('/', async (req, res) => {
    try {
        const { projectId, userId } = req.query;
        if (!userId) {
            return res.json([]); // No userId = No data
        }
        const { getUserProjectIds } = await Promise.resolve().then(() => __importStar(require('../middleware/projectAccess')));
        const accessibleProjectIds = await getUserProjectIds(userId);
        const where = {};
        if (projectId) {
            // Verify access to specific project
            if (!accessibleProjectIds.includes(projectId)) {
                return res.status(403).json({ error: 'Access denied to this project' });
            }
            where.projectId = projectId;
        }
        else {
            // Return sprints for all accessible projects
            const { In } = await Promise.resolve().then(() => __importStar(require('typeorm')));
            if (accessibleProjectIds.length === 0) {
                return res.json([]);
            }
            where.projectId = In(accessibleProjectIds);
        }
        const sprints = await sprintRepo.find({ where, order: { createdAt: 'DESC' } });
        res.json(sprints);
    }
    catch (error) {
        console.error('Failed to fetch sprints:', error);
        res.status(500).json({ error: 'Failed to fetch sprints' });
    }
});
// POST create sprint
router.post('/', async (req, res) => {
    try {
        const sprint = sprintRepo.create(req.body);
        const savedSprint = await sprintRepo.save(sprint);
        res.status(201).json(savedSprint);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create sprint' });
    }
});
// PUT update sprint
router.put('/:id', async (req, res) => {
    try {
        await sprintRepo.update(req.params.id, req.body);
        const sprint = await sprintRepo.findOne({ where: { id: req.params.id } });
        res.json(sprint);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update sprint' });
    }
});
// DELETE sprint
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Move issues to backlog (unassign sprintId)
        const { Issue } = await Promise.resolve().then(() => __importStar(require('../entities/Issue')));
        const issueRepo = database_1.AppDataSource.getRepository(Issue);
        await issueRepo.update({ sprintId: id }, { sprintId: null });
        // Delete sprint
        await sprintRepo.delete(id);
        res.json({ message: 'Sprint deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete sprint:', error);
        res.status(500).json({ error: 'Failed to delete sprint' });
    }
});
// POST start sprint
router.post('/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, goal, capacity } = req.body;
        const sprint = await sprintRepo.findOne({ where: { id } });
        if (!sprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        sprint.status = 'active';
        sprint.startDate = startDate;
        sprint.endDate = endDate;
        sprint.goal = goal;
        const savedSprint = await sprintRepo.save(sprint);
        // Update issues in this sprint from 'backlog' to 'todo'
        const { Issue } = await Promise.resolve().then(() => __importStar(require('../entities/Issue')));
        const issueRepo = database_1.AppDataSource.getRepository(Issue);
        const issuesToUpdate = await issueRepo.find({
            where: { sprintId: id, status: 'backlog' }
        });
        for (const issue of issuesToUpdate) {
            issue.status = 'todo';
            await issueRepo.save(issue);
        }
        res.json(savedSprint);
    }
    catch (error) {
        console.error('Failed to start sprint:', error);
        res.status(500).json({ error: 'Failed to start sprint' });
    }
});
// POST complete sprint
router.post('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { incompleteIssues, retrospective, createNewSprint, newSprintName } = req.body;
        const sprint = await sprintRepo.findOne({ where: { id } });
        if (!sprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        // Update sprint status
        sprint.status = 'completed';
        sprint.completedAt = new Date();
        const savedSprint = await sprintRepo.save(sprint);
        // Handle incomplete issues
        if (incompleteIssues && incompleteIssues.length > 0) {
            const { Issue } = await Promise.resolve().then(() => __importStar(require('../entities/Issue')));
            const issueRepo = database_1.AppDataSource.getRepository(Issue);
            for (const item of incompleteIssues) {
                const issue = await issueRepo.findOne({ where: { id: item.issueId } });
                if (!issue)
                    continue;
                if (item.action === 'backlog') {
                    issue.sprintId = undefined;
                    issue.status = 'backlog';
                }
                else if (item.action === 'next-sprint' && item.targetSprintId) {
                    issue.sprintId = item.targetSprintId;
                }
                else if (item.action === 'new-sprint' && createNewSprint && newSprintName) {
                    // Create new sprint
                    let newSprint = await sprintRepo.findOne({
                        where: { name: newSprintName, projectId: sprint.projectId }
                    });
                    if (!newSprint) {
                        newSprint = sprintRepo.create({
                            name: newSprintName,
                            projectId: sprint.projectId,
                            status: 'future',
                        });
                        newSprint = await sprintRepo.save(newSprint);
                    }
                    issue.sprintId = newSprint.id;
                }
                await issueRepo.save(issue);
            }
        }
        res.json(savedSprint);
    }
    catch (error) {
        console.error('Failed to complete sprint:', error);
        res.status(500).json({ error: 'Failed to complete sprint' });
    }
});
// GET sprint report
router.get('/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        const sprint = await sprintRepo.findOne({ where: { id } });
        if (!sprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        const { Issue } = await Promise.resolve().then(() => __importStar(require('../entities/Issue')));
        const issueRepo = database_1.AppDataSource.getRepository(Issue);
        const issues = await issueRepo.find({ where: { sprintId: id } });
        const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(sprint.projectId);
        const completed = issues.filter(i => doneStatuses.includes(i.status.toLowerCase()));
        const incomplete = issues.filter(i => !doneStatuses.includes(i.status.toLowerCase()));
        const completedPoints = completed.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        res.json({
            sprint,
            completed,
            incomplete,
            completedPoints,
            totalPoints,
            completedCount: completed.length,
            incompleteCount: incomplete.length,
            totalCount: issues.length,
        });
    }
    catch (error) {
        console.error('Failed to get sprint report:', error);
        res.status(500).json({ error: 'Failed to get sprint report' });
    }
});
// GET sprint burndown
router.get('/:id/burndown', async (req, res) => {
    try {
        const { id } = req.params;
        const sprint = await sprintRepo.findOne({ where: { id } });
        if (!sprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        const { Issue } = await Promise.resolve().then(() => __importStar(require('../entities/Issue')));
        const issueRepo = database_1.AppDataSource.getRepository(Issue);
        const issues = await issueRepo.find({ where: { sprintId: id } });
        const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        // Calculate burndown (simplified - in production, track daily)
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const burndown = [];
        for (let i = 0; i <= days; i++) {
            const ideal = totalPoints - (totalPoints / days) * i;
            // Simplified actual - in production, track actual daily progress
            const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(sprint.projectId);
            const completedIssues = issues.filter(issue => doneStatuses.includes(issue.status.toLowerCase()));
            const completedPoints = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
            const actual = i === days ? totalPoints - completedPoints : totalPoints - (completedPoints / days) * i;
            burndown.push({
                day: i,
                ideal: Math.max(0, ideal),
                actual: Math.max(0, actual),
            });
        }
        res.json(burndown);
    }
    catch (error) {
        console.error('Failed to get burndown:', error);
        res.status(500).json({ error: 'Failed to get burndown' });
    }
});
// GET velocity
router.get('/velocity', async (req, res) => {
    try {
        const { projectId } = req.query;
        const sprints = await sprintRepo.find({
            where: { projectId: projectId, status: 'completed' },
            order: { completedAt: 'DESC' },
            take: 6,
        });
        const { Issue } = await Promise.resolve().then(() => __importStar(require('../entities/Issue')));
        const issueRepo = database_1.AppDataSource.getRepository(Issue);
        const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(projectId);
        const velocity = [];
        for (const sprint of sprints) {
            const allIssuesFromSprint = await issueRepo.find({
                where: { sprintId: sprint.id }
            });
            const issues = allIssuesFromSprint.filter(i => doneStatuses.includes(i.status.toLowerCase()));
            const points = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            velocity.push({
                sprint: sprint.name,
                points,
                completedAt: sprint.completedAt,
            });
        }
        res.json(velocity.reverse());
    }
    catch (error) {
        console.error('Failed to get velocity:', error);
        res.status(500).json({ error: 'Failed to get velocity' });
    }
});
exports.default = router;
