"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const workflow_service_1 = require("../services/workflow.service");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
// GET /api/roadmap/:projectId
// Get all epics with their child issues for roadmap view
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        // Get all epics for the project
        const epics = await issueRepo.find({
            where: { projectId, type: 'epic' },
            order: { startDate: 'ASC' },
        });
        // Get all issues linked to these epics
        const epicIds = epics.map(e => e.id);
        const childIssues = await issueRepo.find({
            where: epicIds.length > 0 ? epicIds.map(id => ({ epicLink: id })) : [],
            relations: ['assignee'],
        });
        const doneStatuses = await workflow_service_1.workflowService.getDoneStatuses(projectId);
        // Build roadmap data
        const roadmapData = epics.map(epic => {
            const children = childIssues.filter(issue => issue.epicLink === epic.id);
            const completedChildren = children.filter(i => doneStatuses.includes(i.status.toLowerCase()));
            const totalPoints = children.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            const completedPoints = completedChildren.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            return {
                id: epic.id,
                key: epic.key,
                summary: epic.summary,
                description: epic.description,
                status: epic.status,
                startDate: epic.startDate,
                endDate: epic.endDate,
                assignee: epic.assignee,
                dependencies: epic.dependencies || [],
                progress: children.length > 0 ? Math.round((completedChildren.length / children.length) * 100) : 0,
                pointsProgress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
                totalIssues: children.length,
                completedIssues: completedChildren.length,
                totalPoints,
                completedPoints,
                children: children.map(c => ({
                    id: c.id,
                    key: c.key,
                    summary: c.summary,
                    type: c.type,
                    status: c.status,
                    storyPoints: c.storyPoints,
                    startDate: c.startDate,
                    endDate: c.endDate,
                    dueDate: c.dueDate,
                    assignee: c.assignee,
                })),
            };
        });
        res.json(roadmapData);
    }
    catch (error) {
        console.error('Failed to get roadmap:', error);
        res.status(500).json({ error: 'Failed to get roadmap data' });
    }
});
// PUT /api/roadmap/:epicId/dates
// Update epic dates (for drag-to-resize)
router.put('/:epicId/dates', async (req, res) => {
    try {
        const { epicId } = req.params;
        const { startDate, endDate } = req.body;
        const epic = await issueRepo.findOne({ where: { id: epicId } });
        if (!epic) {
            return res.status(404).json({ error: 'Epic not found' });
        }
        if (epic.type !== 'epic') {
            return res.status(400).json({ error: 'Issue is not an epic' });
        }
        epic.startDate = startDate ? new Date(startDate) : epic.startDate;
        epic.endDate = endDate ? new Date(endDate) : epic.endDate;
        const savedEpic = await issueRepo.save(epic);
        res.json(savedEpic);
    }
    catch (error) {
        console.error('Failed to update epic dates:', error);
        res.status(500).json({ error: 'Failed to update epic dates' });
    }
});
// PUT /api/roadmap/:epicId/dependencies
// Update epic dependencies
router.put('/:epicId/dependencies', async (req, res) => {
    try {
        const { epicId } = req.params;
        const { dependencies } = req.body;
        const epic = await issueRepo.findOne({ where: { id: epicId } });
        if (!epic) {
            return res.status(404).json({ error: 'Epic not found' });
        }
        if (epic.type !== 'epic') {
            return res.status(400).json({ error: 'Issue is not an epic' });
        }
        epic.dependencies = dependencies || [];
        const savedEpic = await issueRepo.save(epic);
        res.json(savedEpic);
    }
    catch (error) {
        console.error('Failed to update epic dependencies:', error);
        res.status(500).json({ error: 'Failed to update epic dependencies' });
    }
});
// GET /api/roadmap/:projectId/timeline
// Get timeline data with date ranges
router.get('/:projectId/timeline', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { view = 'months' } = req.query; // quarters, months, weeks
        const epics = await issueRepo.find({
            where: { projectId, type: 'epic' },
            order: { startDate: 'ASC' },
        });
        // Calculate timeline bounds
        const epicDates = epics
            .filter(e => e.startDate && e.endDate)
            .flatMap(e => [new Date(e.startDate), new Date(e.endDate)]);
        if (epicDates.length === 0) {
            return res.json({
                epics: [],
                timelineStart: new Date(),
                timelineEnd: new Date(),
                periods: [],
            });
        }
        const timelineStart = new Date(Math.min(...epicDates.map(d => d.getTime())));
        const timelineEnd = new Date(Math.max(...epicDates.map(d => d.getTime())));
        // Generate periods based on view
        const periods = generatePeriods(timelineStart, timelineEnd, view);
        res.json({
            epics: epics.map(e => ({
                id: e.id,
                key: e.key,
                summary: e.summary,
                startDate: e.startDate,
                endDate: e.endDate,
                status: e.status,
            })),
            timelineStart,
            timelineEnd,
            periods,
        });
    }
    catch (error) {
        console.error('Failed to get timeline:', error);
        res.status(500).json({ error: 'Failed to get timeline data' });
    }
});
function generatePeriods(start, end, view) {
    const periods = [];
    const current = new Date(start);
    if (view === 'quarters') {
        while (current <= end) {
            const quarter = Math.floor(current.getMonth() / 3) + 1;
            const year = current.getFullYear();
            periods.push({
                label: `Q${quarter} ${year}`,
                start: new Date(year, (quarter - 1) * 3, 1),
                end: new Date(year, quarter * 3, 0),
            });
            current.setMonth(current.getMonth() + 3);
        }
    }
    else if (view === 'months') {
        while (current <= end) {
            const month = current.toLocaleString('default', { month: 'short' });
            const year = current.getFullYear();
            periods.push({
                label: `${month} ${year}`,
                start: new Date(current.getFullYear(), current.getMonth(), 1),
                end: new Date(current.getFullYear(), current.getMonth() + 1, 0),
            });
            current.setMonth(current.getMonth() + 1);
        }
    }
    else if (view === 'weeks') {
        while (current <= end) {
            const weekStart = new Date(current);
            const weekEnd = new Date(current);
            weekEnd.setDate(weekEnd.getDate() + 6);
            periods.push({
                label: `Week ${Math.ceil(current.getDate() / 7)}`,
                start: weekStart,
                end: weekEnd,
            });
            current.setDate(current.getDate() + 7);
        }
    }
    return periods;
}
exports.default = router;
