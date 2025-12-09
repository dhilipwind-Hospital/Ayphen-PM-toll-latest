"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const duplicate_learning_service_1 = require("../services/duplicate-learning.service");
const router = (0, express_1.Router)();
/**
 * POST /api/duplicate-feedback
 * Record user feedback on duplicate suggestion
 */
router.post('/', async (req, res) => {
    try {
        const { issueId, suggestedDuplicateId, aiConfidence, userAction, userId } = req.body;
        if (!issueId || !suggestedDuplicateId || !aiConfidence || !userAction || !userId) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }
        if (!['dismissed', 'linked', 'merged', 'blocked'].includes(userAction)) {
            return res.status(400).json({
                error: 'Invalid user action'
            });
        }
        await duplicate_learning_service_1.duplicateLearningService.recordFeedback({
            issueId,
            suggestedDuplicateId,
            aiConfidence,
            userAction,
            userId
        });
        res.json({
            success: true,
            message: 'Feedback recorded successfully'
        });
    }
    catch (error) {
        console.error('❌ Feedback recording error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to record feedback'
        });
    }
});
/**
 * GET /api/duplicate-feedback/metrics
 * Get accuracy metrics for duplicate detection
 */
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await duplicate_learning_service_1.duplicateLearningService.getAccuracyMetrics();
        res.json({
            success: true,
            metrics
        });
    }
    catch (error) {
        console.error('❌ Metrics error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get metrics'
        });
    }
});
/**
 * GET /api/duplicate-feedback/recent
 * Get recent feedback entries
 */
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const feedback = await duplicate_learning_service_1.duplicateLearningService.getRecentFeedback(limit);
        res.json({
            success: true,
            feedback
        });
    }
    catch (error) {
        console.error('❌ Recent feedback error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get recent feedback'
        });
    }
});
exports.default = router;
