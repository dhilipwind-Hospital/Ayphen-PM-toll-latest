"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_issue_creator_service_1 = require("../services/ai-issue-creator.service");
const ai_sprint_planner_service_1 = require("../services/ai-sprint-planner.service");
const ai_predictive_analytics_service_1 = require("../services/ai-predictive-analytics.service");
const router = (0, express_1.Router)();
/**
 * POST /api/ai-smart/create-issue
 * Create issue from natural language
 */
router.post('/create-issue', async (req, res) => {
    try {
        const { text, projectId, userId } = req.body;
        if (!text || !projectId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        console.log('🤖 Creating issue from natural language:', text);
        const result = await ai_issue_creator_service_1.aiIssueCreatorService.createFromNaturalLanguage({
            text,
            projectId,
            userId
        });
        res.json(result);
    }
    catch (error) {
        console.error('❌ AI create issue error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/ai-smart/auto-complete-description
 * Auto-complete issue description
 */
router.post('/auto-complete-description', async (req, res) => {
    try {
        const { partialDescription, issueType } = req.body;
        if (!partialDescription || !issueType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const completed = await ai_issue_creator_service_1.aiIssueCreatorService.autoCompleteDescription(partialDescription, issueType);
        res.json({ completed });
    }
    catch (error) {
        console.error('❌ Auto-complete error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/ai-smart/generate-acceptance-criteria
 * Generate acceptance criteria
 */
router.post('/generate-acceptance-criteria', async (req, res) => {
    try {
        const { summary, description } = req.body;
        if (!summary || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const criteria = await ai_issue_creator_service_1.aiIssueCreatorService.generateAcceptanceCriteria(summary, description);
        res.json({ criteria });
    }
    catch (error) {
        console.error('❌ Generate criteria error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/ai-smart/suggest-sprint
 * Suggest sprint composition
 */
router.post('/suggest-sprint', async (req, res) => {
    try {
        const { projectId, sprintDuration, teamCapacity, backlogIssueIds } = req.body;
        if (!projectId || !sprintDuration || !teamCapacity || !backlogIssueIds) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        console.log('🤖 Suggesting sprint composition for project:', projectId);
        const composition = await ai_sprint_planner_service_1.aiSprintPlannerService.suggestSprintComposition({
            projectId,
            sprintDuration,
            teamCapacity,
            backlogIssueIds
        });
        res.json(composition);
    }
    catch (error) {
        console.error('❌ Suggest sprint error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/ai-smart/predict-sprint/:sprintId
 * Predict sprint success
 */
router.get('/predict-sprint/:sprintId', async (req, res) => {
    try {
        const { sprintId } = req.params;
        console.log('🤖 Predicting sprint success:', sprintId);
        const prediction = await ai_sprint_planner_service_1.aiSprintPlannerService.predictSprintSuccess(sprintId);
        res.json(prediction);
    }
    catch (error) {
        console.error('❌ Predict sprint error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/ai-smart/balance-workload/:sprintId
 * Balance workload across team
 */
router.get('/balance-workload/:sprintId', async (req, res) => {
    try {
        const { sprintId } = req.params;
        console.log('🤖 Balancing workload for sprint:', sprintId);
        const balance = await ai_sprint_planner_service_1.aiSprintPlannerService.balanceWorkload(sprintId);
        res.json(balance);
    }
    catch (error) {
        console.error('❌ Balance workload error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/ai-smart/insights/:projectId
 * Get project insights
 */
router.get('/insights/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log('🤖 Generating insights for project:', projectId);
        const insights = await ai_predictive_analytics_service_1.aiPredictiveAnalyticsService.generateInsights(projectId);
        res.json(insights);
    }
    catch (error) {
        console.error('❌ Generate insights error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/ai-smart/predict-completion/:issueId
 * Predict issue completion time
 */
router.get('/predict-completion/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        console.log('🤖 Predicting completion time for issue:', issueId);
        const prediction = await ai_predictive_analytics_service_1.aiPredictiveAnalyticsService.predictIssueCompletionTime(issueId);
        res.json(prediction);
    }
    catch (error) {
        console.error('❌ Predict completion error:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
