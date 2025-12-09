"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const Sprint_1 = require("../entities/Sprint");
const router = (0, express_1.Router)();
// Get project analytics
router.get('/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const issues = await issueRepo.find({ where: { projectId } });
        const analytics = {
            totalIssues: issues.length,
            byStatus: {
                todo: issues.filter(i => i.status === 'todo').length,
                inProgress: issues.filter(i => i.status === 'in-progress').length,
                inReview: issues.filter(i => i.status === 'in-review').length,
                done: issues.filter(i => i.status === 'done').length,
            },
            byType: {
                epic: issues.filter(i => i.type === 'epic').length,
                story: issues.filter(i => i.type === 'story').length,
                task: issues.filter(i => i.type === 'task').length,
                bug: issues.filter(i => i.type === 'bug').length,
            },
            byPriority: {
                highest: issues.filter(i => i.priority === 'highest').length,
                high: issues.filter(i => i.priority === 'high').length,
                medium: issues.filter(i => i.priority === 'medium').length,
                low: issues.filter(i => i.priority === 'low').length,
            },
            completionRate: issues.length > 0 ? (issues.filter(i => i.status === 'done').length / issues.length * 100).toFixed(2) : 0,
            avgTimeToComplete: calculateAvgTime(issues.filter(i => i.status === 'done')),
        };
        res.json(analytics);
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
// Get user performance
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const assignedIssues = await issueRepo.find({ where: { assigneeId: userId } });
        const reportedIssues = await issueRepo.find({ where: { reporterId: userId } });
        const performance = {
            assigned: assignedIssues.length,
            completed: assignedIssues.filter(i => i.status === 'done').length,
            inProgress: assignedIssues.filter(i => i.status === 'in-progress').length,
            reported: reportedIssues.length,
            completionRate: assignedIssues.length > 0 ? (assignedIssues.filter(i => i.status === 'done').length / assignedIssues.length * 100).toFixed(2) : 0,
        };
        res.json(performance);
    }
    catch (error) {
        console.error('Error fetching user performance:', error);
        res.status(500).json({ error: 'Failed to fetch user performance' });
    }
});
// Get sprint velocity
router.get('/velocity/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const sprints = await sprintRepo.find({
            where: { projectId, status: 'completed' },
            order: { startDate: 'DESC' },
            take: 10
        });
        const velocity = await Promise.all(sprints.map(async (sprint) => {
            const issues = await issueRepo.find({ where: { sprintId: sprint.id, status: 'done' } });
            const points = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
            return { sprintName: sprint.name, points, issueCount: issues.length };
        }));
        res.json(velocity);
    }
    catch (error) {
        console.error('Error fetching velocity:', error);
        res.status(500).json({ error: 'Failed to fetch velocity' });
    }
});
function calculateAvgTime(issues) {
    if (issues.length === 0)
        return '0 days';
    const totalDays = issues.reduce((sum, issue) => {
        if (issue.createdAt && issue.resolvedAt) {
            const diff = new Date(issue.resolvedAt).getTime() - new Date(issue.createdAt).getTime();
            return sum + (diff / (1000 * 60 * 60 * 24));
        }
        return sum;
    }, 0);
    return `${(totalDays / issues.length).toFixed(1)} days`;
}
exports.default = router;
