"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const Sprint_1 = require("../entities/Sprint");
const User_1 = require("../entities/User");
const typeorm_1 = require("typeorm");
const reporting_service_1 = require("../services/reporting.service");
const workflow_service_1 = require("../services/workflow.service");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
// Helper function to get date range
const getDateRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
};
// GET /api/reports/burndown/:sprintId
// Real burndown chart with actual sprint data
router.get('/burndown/:sprintId', async (req, res) => {
    try {
        const { sprintId } = req.params;
        const sprint = await sprintRepo.findOne({ where: { id: sprintId } });
        if (!sprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        const issues = await issueRepo.find({ where: { sprintId } });
        if (!sprint.startDate || !sprint.endDate) {
            return res.json([]);
        }
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
        const idealBurnRate = totalPoints / totalDays;
        const burndownData = [];
        for (let day = 0; day <= totalDays; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            // Calculate ideal remaining
            const idealRemaining = Math.max(0, totalPoints - (idealBurnRate * day));
            const doneStatusesBurndown = await workflow_service_1.workflowService.getDoneStatuses(sprint.projectId);
            const completedIssues = issues.filter(issue => {
                if (doneStatusesBurndown.includes(issue.status.toLowerCase()) && issue.updatedAt) {
                    return new Date(issue.updatedAt) <= currentDate;
                }
                return false;
            });
            const completedPoints = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
            const actualRemaining = Math.max(0, totalPoints - completedPoints);
            burndownData.push({
                day: `Day ${day}`,
                date: currentDate.toISOString().split('T')[0],
                ideal: Math.round(idealRemaining * 10) / 10,
                actual: Math.round(actualRemaining * 10) / 10,
            });
        }
        res.json(burndownData);
    }
    catch (error) {
        console.error('Failed to generate burndown:', error);
        res.status(500).json({ error: 'Failed to generate burndown chart' });
    }
});
// GET /api/reports/burnup/:sprintId
// Burnup chart showing scope changes
router.get('/burnup/:sprintId', async (req, res) => {
    try {
        const { sprintId } = req.params;
        const sprint = await sprintRepo.findOne({ where: { id: sprintId } });
        if (!sprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        const issues = await issueRepo.find({ where: { sprintId } });
        if (!sprint.startDate || !sprint.endDate) {
            return res.json([]);
        }
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const burnupData = [];
        for (let day = 0; day <= totalDays; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            // Calculate total scope (issues added by this day)
            const scopeIssues = issues.filter(issue => {
                return new Date(issue.createdAt) <= currentDate;
            });
            const totalScope = scopeIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
            const doneStatusesBurnup = await workflow_service_1.workflowService.getDoneStatuses(sprint.projectId);
            const completedIssues = scopeIssues.filter(issue => {
                if (doneStatusesBurnup.includes(issue.status.toLowerCase()) && issue.updatedAt) {
                    return new Date(issue.updatedAt) <= currentDate;
                }
                return false;
            });
            const completedWork = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
            burnupData.push({
                day: `Day ${day}`,
                date: currentDate.toISOString().split('T')[0],
                scope: Math.round(totalScope * 10) / 10,
                completed: Math.round(completedWork * 10) / 10,
            });
        }
        res.json(burnupData);
    }
    catch (error) {
        console.error('Failed to generate burnup:', error);
        res.status(500).json({ error: 'Failed to generate burnup chart' });
    }
});
// GET /api/reports/cumulative-flow/:projectId
// Cumulative flow diagram showing status distribution over time
router.get('/cumulative-flow/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const days = parseInt(req.query.days) || 30;
        const { startDate, endDate } = getDateRange(days);
        const issues = await issueRepo.find({
            where: { projectId },
            order: { createdAt: 'ASC' }
        });
        const cfdData = [];
        for (let day = 0; day <= days; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            const issuesAtDate = issues.filter(issue => new Date(issue.createdAt) <= currentDate);
            const statusCounts = { todo: 0, 'in-progress': 0, 'in-review': 0, done: 0 };
            const doneStatusesCFD = await workflow_service_1.workflowService.getDoneStatuses(projectId);
            const projectWorkflowCFD = (await workflow_service_1.workflowService.getAll()).find(w => w.projectIds.includes(projectId)) || (await workflow_service_1.workflowService.getById('workflow-1'));
            const todoStatusesCFD = projectWorkflowCFD.statuses.filter(s => s.category === 'TODO').map(s => s.id.toLowerCase());
            const inProgressStatusesCFD = projectWorkflowCFD.statuses.filter(s => s.category === 'IN_PROGRESS').map(s => s.id.toLowerCase());
            issuesAtDate.forEach(issue => {
                const s = issue.status.toLowerCase();
                if (todoStatusesCFD.includes(s))
                    statusCounts.todo++;
                else if (inProgressStatusesCFD.includes(s))
                    statusCounts['in-progress']++;
                else if (doneStatusesCFD.includes(s))
                    statusCounts.done++;
                else
                    statusCounts['in-review']++; // Default for remaining
            });
            cfdData.push({
                date: currentDate.toISOString().split('T')[0],
                'To Do': statusCounts.todo,
                'In Progress': statusCounts['in-progress'],
                'In Review': statusCounts['in-review'],
                'Done': statusCounts.done,
            });
        }
        res.json(cfdData);
    }
    catch (error) {
        console.error('Failed to generate CFD:', error);
        res.status(500).json({ error: 'Failed to generate cumulative flow diagram' });
    }
});
// GET /api/reports/control-chart/:projectId
// Control chart for cycle time analysis
router.get('/control-chart/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const days = parseInt(req.query.days) || 30;
        const { startDate } = getDateRange(days);
        const doneStatusesCtrl = await workflow_service_1.workflowService.getDoneStatuses(projectId);
        const issues = await issueRepo.find({
            where: {
                projectId,
                updatedAt: (0, typeorm_1.Not)(null)
            },
            order: { updatedAt: 'ASC' }
        });
        const filteredIssues = issues.filter(i => doneStatusesCtrl.includes(i.status.toLowerCase()));
        const controlData = filteredIssues
            .filter(issue => new Date(issue.updatedAt) >= startDate)
            .map(issue => {
            const created = new Date(issue.createdAt);
            const completed = new Date(issue.updatedAt);
            const cycleTime = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return {
                key: issue.key,
                completedDate: completed.toISOString().split('T')[0],
                cycleTime,
                type: issue.type,
            };
        });
        // Calculate average and control limits
        const cycleTimes = controlData.map(d => d.cycleTime);
        const average = cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length || 0;
        const stdDev = Math.sqrt(cycleTimes.reduce((sq, n) => sq + Math.pow(n - average, 2), 0) / cycleTimes.length);
        const upperLimit = average + (2 * stdDev);
        const lowerLimit = Math.max(0, average - (2 * stdDev));
        res.json({
            data: controlData,
            average: Math.round(average * 10) / 10,
            upperLimit: Math.round(upperLimit * 10) / 10,
            lowerLimit: Math.round(lowerLimit * 10) / 10,
        });
    }
    catch (error) {
        console.error('Failed to generate control chart:', error);
        res.status(500).json({ error: 'Failed to generate control chart' });
    }
});
// GET /api/reports/velocity/:projectId
// Velocity chart (already exists in sprints.ts, but enhanced here)
router.get('/velocity/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const limit = parseInt(req.query.limit) || 6;
        const sprints = await sprintRepo.find({
            where: { projectId, status: 'completed' },
            order: { completedAt: 'DESC' },
            take: limit,
        });
        const velocityData = await Promise.all(sprints.reverse().map(async (sprint) => {
            const doneStatusesVel = await workflow_service_1.workflowService.getDoneStatuses(projectId);
            const issues = await issueRepo.find({ where: { sprintId: sprint.id } });
            const completedIssues = issues.filter(i => doneStatusesVel.includes(i.status.toLowerCase()));
            const points = completedIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            return {
                sprint: sprint.name,
                points,
                committed: issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0),
                completed: points,
            };
        }));
        res.json(velocityData);
    }
    catch (error) {
        console.error('Failed to generate velocity:', error);
        res.status(500).json({ error: 'Failed to generate velocity chart' });
    }
});
// GET /api/reports/epic-burndown/:epicId
// Epic burndown chart
router.get('/epic-burndown/:epicId', async (req, res) => {
    try {
        const { epicId } = req.params;
        const epicIssues = await issueRepo.find({
            where: { epicId },
            order: { createdAt: 'ASC' }
        });
        if (epicIssues.length === 0) {
            return res.json([]);
        }
        const startDate = new Date(Math.min(...epicIssues.map(i => new Date(i.createdAt).getTime())));
        const endDate = new Date();
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalPoints = epicIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
        const burndownData = [];
        for (let day = 0; day <= Math.min(totalDays, 90); day += Math.ceil(totalDays / 30)) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            const completedIssues = epicIssues.filter(issue => {
                if (issue.status === 'done' && issue.updatedAt) {
                    return new Date(issue.updatedAt) <= currentDate;
                }
                return false;
            });
            const completedPoints = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
            const remaining = Math.max(0, totalPoints - completedPoints);
            burndownData.push({
                date: currentDate.toISOString().split('T')[0],
                remaining: Math.round(remaining * 10) / 10,
                completed: Math.round(completedPoints * 10) / 10,
            });
        }
        res.json(burndownData);
    }
    catch (error) {
        console.error('Failed to generate epic burndown:', error);
        res.status(500).json({ error: 'Failed to generate epic burndown' });
    }
});
// GET /api/reports/epic-report/:epicId
// Comprehensive epic report
router.get('/epic-report/:epicId', async (req, res) => {
    try {
        const { epicId } = req.params;
        const issues = await issueRepo.find({ where: { epicId } });
        const totalIssues = issues.length;
        let doneStats = ['done'];
        let tStats = ['todo'];
        if (issues.length > 0) {
            doneStats = await workflow_service_1.workflowService.getDoneStatuses(issues[0].projectId);
            const wfs = await workflow_service_1.workflowService.getAll();
            const pw = wfs.find(w => w.projectIds.includes(issues[0].projectId)) || await workflow_service_1.workflowService.getById('workflow-1');
            tStats = pw.statuses.filter(s => s.category === 'TODO').map(s => s.id.toLowerCase());
        }
        const completedIssues = issues.filter(i => doneStats.includes(i.status.toLowerCase())).length;
        const inProgressIssues = issues.filter(i => !doneStats.includes(i.status.toLowerCase()) && !tStats.includes(i.status.toLowerCase())).length;
        const todoIssues = issues.filter(i => tStats.includes(i.status.toLowerCase())).length;
        const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        const completedPoints = issues.filter(i => doneStats.includes(i.status.toLowerCase())).reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        const issuesByType = issues.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
        }, {});
        res.json({
            totalIssues,
            completedIssues,
            inProgressIssues,
            todoIssues,
            completionRate: totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0,
            totalPoints,
            completedPoints,
            remainingPoints: totalPoints - completedPoints,
            pointsCompletionRate: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
            issuesByType,
            issues: issues.map(i => ({
                key: i.key,
                summary: i.summary,
                type: i.type,
                status: i.status,
                storyPoints: i.storyPoints,
                assignee: i.assignee,
            })),
        });
    }
    catch (error) {
        console.error('Failed to generate epic report:', error);
        res.status(500).json({ error: 'Failed to generate epic report' });
    }
});
// GET /api/reports/created-vs-resolved/:projectId
// Created vs Resolved chart
router.get('/created-vs-resolved/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const days = parseInt(req.query.days) || 30;
        const { startDate, endDate } = getDateRange(days);
        const issues = await issueRepo.find({
            where: { projectId },
            order: { createdAt: 'ASC' }
        });
        const chartData = [];
        for (let day = 0; day <= days; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            const nextDate = new Date(currentDate);
            nextDate.setDate(currentDate.getDate() + 1);
            const created = issues.filter(issue => {
                const createdDate = new Date(issue.createdAt);
                return createdDate >= currentDate && createdDate < nextDate;
            }).length;
            const doneS = await workflow_service_1.workflowService.getDoneStatuses(projectId);
            const resolved = issues.filter(issue => {
                if (doneS.includes(issue.status.toLowerCase()) && issue.updatedAt) {
                    const resolvedDate = new Date(issue.updatedAt);
                    return resolvedDate >= currentDate && resolvedDate < nextDate;
                }
                return false;
            }).length;
            chartData.push({
                date: currentDate.toISOString().split('T')[0],
                created,
                resolved,
            });
        }
        res.json(chartData);
    }
    catch (error) {
        console.error('Failed to generate created vs resolved:', error);
        res.status(500).json({ error: 'Failed to generate created vs resolved chart' });
    }
});
// GET /api/reports/time-tracking/:projectId
// Time tracking report
router.get('/time-tracking/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const issues = await issueRepo.find({
            where: { projectId, status: 'done' }
        });
        const timeData = issues.map(issue => {
            const estimate = issue.storyPoints ? issue.storyPoints * 8 : 0; // 1 point = 8 hours estimate
            const created = new Date(issue.createdAt);
            const completed = new Date(issue.updatedAt);
            const actualHours = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60));
            return {
                key: issue.key,
                summary: issue.summary,
                type: issue.type,
                estimatedHours: estimate,
                actualHours: Math.min(actualHours, estimate * 3), // Cap at 3x estimate for realistic data
                storyPoints: issue.storyPoints || 0,
            };
        });
        const totalEstimated = timeData.reduce((sum, d) => sum + d.estimatedHours, 0);
        const totalActual = timeData.reduce((sum, d) => sum + d.actualHours, 0);
        res.json({
            issues: timeData,
            summary: {
                totalEstimated,
                totalActual,
                variance: totalActual - totalEstimated,
                accuracy: totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0,
            },
        });
    }
    catch (error) {
        console.error('Failed to generate time tracking report:', error);
        res.status(500).json({ error: 'Failed to generate time tracking report' });
    }
});
// GET /api/reports/user-workload/:projectId
// User workload report
router.get('/user-workload/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const doneS = await workflow_service_1.workflowService.getDoneStatuses(projectId);
        const allIssues = await issueRepo.find({
            where: { projectId }
        });
        const issues = allIssues.filter(i => !doneS.includes(i.status.toLowerCase()));
        const users = await userRepo.find();
        const workloadData = users.map(user => {
            const userIssues = issues.filter(i => i.assignee?.id === user.id);
            const totalPoints = userIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            const issueCount = userIssues.length;
            const byType = userIssues.reduce((acc, issue) => {
                acc[issue.type] = (acc[issue.type] || 0) + 1;
                return acc;
            }, {});
            return {
                userId: user.id,
                userName: user.name,
                email: user.email,
                issueCount,
                totalPoints,
                byType,
                issues: userIssues.map(i => ({
                    key: i.key,
                    summary: i.summary,
                    type: i.type,
                    status: i.status,
                    storyPoints: i.storyPoints,
                })),
            };
        }).filter(u => u.issueCount > 0);
        res.json(workloadData);
    }
    catch (error) {
        console.error('Failed to generate user workload:', error);
        res.status(500).json({ error: 'Failed to generate user workload report' });
    }
});
// GET /api/reports/version-report/:versionId
// Version report (placeholder for future versions feature)
router.get('/version-report/:versionId', async (req, res) => {
    try {
        const { versionId } = req.params;
        // For now, return mock data structure
        // This will be implemented when versions feature is added
        res.json({
            versionId,
            name: 'Version 1.0',
            status: 'unreleased',
            totalIssues: 0,
            completedIssues: 0,
            message: 'Versions feature coming soon',
        });
    }
    catch (error) {
        console.error('Failed to generate version report:', error);
        res.status(500).json({ error: 'Failed to generate version report' });
    }
});
// New reporting service endpoints
router.get('/sprint-burndown/:sprintId', async (req, res) => {
    try {
        const data = await reporting_service_1.reportingService.getSprintBurndown(req.params.sprintId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/velocity/:projectId', async (req, res) => {
    try {
        const sprints = parseInt(req.query.sprints) || 6;
        const data = await reporting_service_1.reportingService.getVelocityChart(req.params.projectId, sprints);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/cumulative-flow/:projectId', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const data = await reporting_service_1.reportingService.getCumulativeFlow(req.params.projectId, days);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/created-vs-resolved/:projectId', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const data = await reporting_service_1.reportingService.getCreatedVsResolved(req.params.projectId, days);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/pie-chart/:projectId', async (req, res) => {
    try {
        const groupBy = req.query.groupBy || 'status';
        const data = await reporting_service_1.reportingService.getPieChartData(req.params.projectId, groupBy);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/time-tracking/:projectId', async (req, res) => {
    try {
        const data = await reporting_service_1.reportingService.getTimeTrackingReport(req.params.projectId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/average-age/:projectId', async (req, res) => {
    try {
        const data = await reporting_service_1.reportingService.getAverageAgeReport(req.params.projectId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/resolution-time/:projectId', async (req, res) => {
    try {
        const data = await reporting_service_1.reportingService.getResolutionTimeReport(req.params.projectId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/user-workload/:projectId', async (req, res) => {
    try {
        const data = await reporting_service_1.reportingService.getUserWorkloadReport(req.params.projectId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/sprint-report/:sprintId', async (req, res) => {
    try {
        const data = await reporting_service_1.reportingService.getSprintReport(req.params.sprintId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
