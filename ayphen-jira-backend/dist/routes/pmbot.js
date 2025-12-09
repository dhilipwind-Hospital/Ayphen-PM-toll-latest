"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pmbot_service_1 = require("../services/pmbot.service");
const router = (0, express_1.Router)();
/**
 * Auto-assign an issue to the best team member
 */
router.post('/auto-assign/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const result = await pmbot_service_1.pmBotService.autoAssignIssue(issueId);
        res.json({
            success: true,
            assignedTo: result.assignedTo,
            confidence: result.confidence,
            reasoning: result.reasoning
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Detect and follow up on stale issues in a project
 */
router.post('/stale-sweep/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const result = await pmbot_service_1.pmBotService.detectAndFollowUpStaleIssues(projectId);
        res.json({
            success: true,
            staleIssues: result.staleIssues.map(s => ({
                issueId: s.issue.id,
                issueKey: s.issue.key,
                summary: s.issue.summary,
                daysSinceActivity: s.daysSinceActivity,
                shouldEscalate: s.shouldEscalate
            })),
            actionsTaken: result.actionsTaken
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Auto-triage an issue (suggest labels, priority, epic)
 */
router.post('/triage/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const result = await pmbot_service_1.pmBotService.autoTriageIssue(issueId);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get PMBot activity summary
 */
router.get('/activity/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const days = parseInt(req.query.days) || 7;
        const summary = await pmbot_service_1.pmBotService.getActivitySummary(projectId, days);
        res.json({
            success: true,
            summary
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
