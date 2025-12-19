"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const History_1 = require("../entities/History");
const workflow_service_1 = require("../services/workflow.service");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const historyRepo = database_1.AppDataSource.getRepository(History_1.History);
// GET /api/epics
// Get all epics for a project
router.get('/', async (req, res) => {
    try {
        const { projectId = 'default-project' } = req.query;
        const epics = await issueRepo.find({
            where: { projectId: projectId, type: 'epic' },
            order: { createdAt: 'DESC' },
        });
        // Get child issues for each epic
        const epicsWithChildren = await Promise.all(epics.map(async (epic) => {
            const children = await issueRepo.find({
                where: { epicLink: epic.id },
            });
            const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(projectId);
            const completedChildren = children.filter(i => doneStatuses.includes(i.status.toLowerCase()));
            const totalPoints = children.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            const completedPoints = completedChildren.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            return {
                ...epic,
                childCount: children.length,
                completedCount: completedChildren.length,
                progress: children.length > 0 ? Math.round((completedChildren.length / children.length) * 100) : 0,
                totalPoints,
                completedPoints,
                pointsProgress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
            };
        }));
        res.json(epicsWithChildren);
    }
    catch (error) {
        console.error('Failed to get epics:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/epics/:id
// Get epic details with all child issues
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const epic = await issueRepo.findOne({ where: { id } });
        if (!epic) {
            return res.status(404).json({ error: 'Epic not found' });
        }
        if (epic.type !== 'epic') {
            return res.status(400).json({ error: 'Issue is not an epic' });
        }
        // Get all child issues
        const children = await issueRepo.find({
            where: { epicLink: epic.id },
            order: { createdAt: 'DESC' },
        });
        // Calculate statistics
        const doneStatusesDet = await workflow_service_1.workflowService.getDoneStatuses(epic.projectId);
        const workflows = await workflow_service_1.workflowService.getAll();
        const projectWorkflow = workflows.find(w => w.projectIds.includes(epic.projectId)) || await workflow_service_1.workflowService.getById('workflow-1');
        const todoStatusesDet = projectWorkflow.statuses.filter(s => s.category === 'TODO').map(s => s.id.toLowerCase());
        const completedChildren = children.filter(i => doneStatusesDet.includes(i.status.toLowerCase()));
        const inProgressChildren = children.filter(i => !doneStatusesDet.includes(i.status.toLowerCase()) && !todoStatusesDet.includes(i.status.toLowerCase()));
        const todoChildren = children.filter(i => todoStatusesDet.includes(i.status.toLowerCase()));
        const totalPoints = children.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        const completedPoints = completedChildren.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        const inProgressPoints = inProgressChildren.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        // Group by type
        const byType = children.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
        }, {});
        // Group by status
        const byStatus = children.reduce((acc, issue) => {
            acc[issue.status] = (acc[issue.status] || 0) + 1;
            return acc;
        }, {});
        res.json({
            epic,
            children: children.map(c => ({
                id: c.id,
                key: c.key,
                summary: c.summary,
                type: c.type,
                status: c.status,
                priority: c.priority,
                assignee: c.assignee,
                storyPoints: c.storyPoints,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            })),
            statistics: {
                totalIssues: children.length,
                completedIssues: completedChildren.length,
                inProgressIssues: inProgressChildren.length,
                todoIssues: todoChildren.length,
                totalPoints,
                completedPoints,
                inProgressPoints,
                remainingPoints: totalPoints - completedPoints,
                progress: children.length > 0 ? Math.round((completedChildren.length / children.length) * 100) : 0,
                pointsProgress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
                byType,
                byStatus,
            },
        });
    }
    catch (error) {
        console.error('Failed to get epic details:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/epics/:id/timeline
// Get epic timeline data
router.get('/:id/timeline', async (req, res) => {
    try {
        const { id } = req.params;
        const epic = await issueRepo.findOne({ where: { id } });
        if (!epic) {
            return res.status(404).json({ error: 'Epic not found' });
        }
        const children = await issueRepo.find({
            where: { epicLink: epic.id },
            order: { createdAt: 'ASC' },
        });
        // Calculate progress over time
        const timeline = [];
        const sortedChildren = [...children].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        let cumulativeTotal = 0;
        let cumulativeCompleted = 0;
        const doneStatusesTimeline = await workflow_service_1.workflowService.getDoneStatuses(epic.projectId);
        for (const child of sortedChildren) {
            cumulativeTotal += child.storyPoints || 0;
            if (doneStatusesTimeline.includes(child.status.toLowerCase())) {
                cumulativeCompleted += child.storyPoints || 0;
            }
            timeline.push({
                date: child.createdAt,
                totalPoints: cumulativeTotal,
                completedPoints: cumulativeCompleted,
                remainingPoints: cumulativeTotal - cumulativeCompleted,
                issueKey: child.key,
            });
        }
        res.json({
            epic: {
                id: epic.id,
                key: epic.key,
                summary: epic.summary,
                startDate: epic.startDate,
                endDate: epic.endDate,
            },
            timeline,
        });
    }
    catch (error) {
        console.error('Failed to get epic timeline:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST /api/epics/:id/link
// Link an issue to an epic
router.post('/:id/link', async (req, res) => {
    try {
        const { id } = req.params;
        const { issueId, userId } = req.body;
        const epic = await issueRepo.findOne({ where: { id } });
        if (!epic || epic.type !== 'epic') {
            return res.status(404).json({ error: 'Epic not found' });
        }
        const issue = await issueRepo.findOne({ where: { id: issueId } });
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        const oldEpicKey = issue.epicKey;
        issue.epicLink = epic.id;
        issue.epicKey = epic.key;
        await issueRepo.save(issue);
        // Create history entry
        await historyRepo.save({
            issueId: issue.id,
            userId: userId || issue.reporterId,
            field: 'epicLink',
            oldValue: oldEpicKey || '',
            newValue: epic.key,
            changeType: 'field_change',
            projectId: issue.projectId,
            description: `Added to epic ${epic.key}`
        });
        res.json({ message: 'Issue linked to epic successfully', issue });
    }
    catch (error) {
        console.error('Failed to link issue to epic:', error);
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/epics/:id/link/:issueId
// Unlink an issue from an epic
router.delete('/:id/link/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const { userId } = req.query;
        const issue = await issueRepo.findOne({ where: { id: issueId } });
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        const oldEpicKey = issue.epicKey;
        issue.epicLink = null;
        issue.epicKey = null;
        await issueRepo.save(issue);
        // Create history entry
        if (oldEpicKey) {
            await historyRepo.save({
                issueId: issue.id,
                userId: userId || issue.reporterId,
                field: 'epicLink',
                oldValue: oldEpicKey,
                newValue: '',
                changeType: 'field_change',
                projectId: issue.projectId,
                description: `Removed from epic ${oldEpicKey}`
            });
        }
        res.json({ message: 'Issue unlinked from epic successfully', issue });
    }
    catch (error) {
        console.error('Failed to unlink issue from epic:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/epics/:id/burndown
// Get epic burndown data
router.get('/:id/burndown', async (req, res) => {
    try {
        const { id } = req.params;
        const epic = await issueRepo.findOne({ where: { id } });
        if (!epic) {
            return res.status(404).json({ error: 'Epic not found' });
        }
        const children = await issueRepo.find({
            where: { epicLink: epic.id },
            order: { createdAt: 'ASC' },
        });
        if (children.length === 0) {
            return res.json([]);
        }
        const startDate = new Date(Math.min(...children.map(c => new Date(c.createdAt).getTime())));
        const endDate = new Date();
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalPoints = children.reduce((sum, c) => sum + (c.storyPoints || 0), 0);
        const burndownData = [];
        for (let day = 0; day <= Math.min(totalDays, 90); day += Math.ceil(totalDays / 30)) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(epic.projectId);
            const completedByDate = children.filter(c => {
                if (doneStatuses.includes(c.status.toLowerCase()) && c.updatedAt) {
                    return new Date(c.updatedAt) <= currentDate;
                }
                return false;
            });
            const completedPoints = completedByDate.reduce((sum, c) => sum + (c.storyPoints || 0), 0);
            const remaining = Math.max(0, totalPoints - completedPoints);
            burndownData.push({
                date: currentDate.toISOString().split('T')[0],
                remaining: Math.round(remaining * 10) / 10,
                completed: Math.round(completedPoints * 10) / 10,
                total: totalPoints,
            });
        }
        res.json(burndownData);
    }
    catch (error) {
        console.error('Failed to get epic burndown:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
