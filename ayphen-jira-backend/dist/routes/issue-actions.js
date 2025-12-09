"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const History_1 = require("../entities/History");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const historyRepo = database_1.AppDataSource.getRepository(History_1.History);
// Flag issue
router.post('/:issueId/flag', async (req, res) => {
    try {
        const { issueId } = req.params;
        const { userId } = req.body;
        const issue = await issueRepo.findOne({ where: { id: issueId } });
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        const newFlagStatus = !issue.isFlagged;
        await issueRepo.update(issueId, {
            isFlagged: newFlagStatus,
            flaggedAt: newFlagStatus ? new Date() : null,
            flaggedBy: newFlagStatus ? userId : null
        });
        // Create history entry
        await historyRepo.save({
            issueId,
            userId,
            field: 'flag',
            oldValue: issue.isFlagged ? 'flagged' : 'unflagged',
            newValue: newFlagStatus ? 'flagged' : 'unflagged',
            changeType: 'field_change',
            projectId: issue.projectId
        });
        res.json({ success: true, isFlagged: newFlagStatus });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Log work
router.post('/:issueId/log-work', async (req, res) => {
    try {
        const { issueId } = req.params;
        const { timeSpent, comment, userId } = req.body;
        const issue = await issueRepo.findOne({ where: { id: issueId } });
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        // Parse time spent (e.g., "2h", "30m", "1d")
        const parseTime = (time) => {
            const match = time.match(/(\d+)([hdm])/);
            if (!match)
                return 0;
            const [, value, unit] = match;
            const num = parseInt(value);
            if (unit === 'h')
                return num * 60;
            if (unit === 'd')
                return num * 480; // 8 hours per day
            return num; // minutes
        };
        const minutes = parseTime(timeSpent);
        const currentTimeSpent = issue.timeSpent || '0m';
        const currentMinutes = parseTime(currentTimeSpent);
        const totalMinutes = currentMinutes + minutes;
        // Convert back to hours/minutes
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const newTimeSpent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        await issueRepo.update(issueId, { timeSpent: newTimeSpent });
        // Create history entry
        await historyRepo.save({
            issueId,
            userId,
            field: 'timeSpent',
            oldValue: currentTimeSpent,
            newValue: newTimeSpent,
            changeType: 'work_logged',
            projectId: issue.projectId,
            description: comment ? `Logged ${timeSpent}: ${comment}` : `Logged ${timeSpent}`
        });
        res.json({ success: true, timeSpent: newTimeSpent });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
