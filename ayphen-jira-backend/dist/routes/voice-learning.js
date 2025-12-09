"use strict";
/**
 * Voice Learning Routes
 * Phase 9-10: Analytics & Learning
 *
 * Routes for aliases, feedback, and personalization
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const command_aliases_service_1 = require("../services/command-aliases.service");
const user_feedback_service_1 = require("../services/user-feedback.service");
const voice_analytics_service_1 = require("../services/voice-analytics.service");
const router = (0, express_1.Router)();
// ============================================================================
// Command Aliases
// ============================================================================
/**
 * POST /api/voice-learning/aliases
 * Create custom alias
 */
router.post('/aliases', async (req, res) => {
    try {
        const { userId, shortcut, fullCommand, tags } = req.body;
        if (!userId || !shortcut || !fullCommand) {
            return res.status(400).json({
                success: false,
                error: 'userId, shortcut, and fullCommand are required'
            });
        }
        const alias = command_aliases_service_1.commandAliases.createAlias(userId, shortcut, fullCommand, tags);
        res.json({
            success: true,
            alias
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/voice-learning/aliases/:userId
 * Get user's aliases
 */
router.get('/aliases/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const aliases = command_aliases_service_1.commandAliases.getUserAliases(userId);
        res.json({
            success: true,
            aliases
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * POST /api/voice-learning/aliases/resolve
 * Resolve alias to full command
 */
router.post('/aliases/resolve', async (req, res) => {
    try {
        const { userId, input } = req.body;
        if (!userId || !input) {
            return res.status(400).json({
                success: false,
                error: 'userId and input are required'
            });
        }
        const resolved = command_aliases_service_1.commandAliases.resolveAlias(userId, input);
        res.json({
            success: true,
            original: input,
            resolved,
            wasAlias: resolved !== input
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * PUT /api/voice-learning/aliases/:aliasId
 * Update alias
 */
router.put('/aliases/:aliasId', async (req, res) => {
    try {
        const { aliasId } = req.params;
        const { userId, shortcut, fullCommand, tags } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        const updated = command_aliases_service_1.commandAliases.updateAlias(userId, aliasId, {
            shortcut,
            fullCommand,
            tags
        });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Alias not found'
            });
        }
        res.json({
            success: true,
            alias: updated
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * DELETE /api/voice-learning/aliases/:aliasId
 * Delete alias
 */
router.delete('/aliases/:aliasId', async (req, res) => {
    try {
        const { aliasId } = req.params;
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        const deleted = command_aliases_service_1.commandAliases.deleteAlias(userId, aliasId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Alias not found'
            });
        }
        res.json({
            success: true,
            message: 'Alias deleted'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/voice-learning/aliases/suggestions/:userId
 * Get alias suggestions
 */
router.get('/aliases/suggestions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Get command history from analytics
        const summary = voice_analytics_service_1.voiceAnalytics.getSummary(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(), userId);
        const commandHistory = summary.topIntents.map(intent => ({
            command: intent.intent,
            count: intent.count
        }));
        const suggestions = command_aliases_service_1.commandAliases.suggestAliases(userId, commandHistory);
        res.json({
            success: true,
            suggestions
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/voice-learning/aliases/popular
 * Get popular aliases
 */
router.get('/aliases/popular', async (req, res) => {
    try {
        const { limit } = req.query;
        const popular = command_aliases_service_1.commandAliases.getPopularAliases(limit ? parseInt(limit) : 10);
        res.json({
            success: true,
            popular
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * POST /api/voice-learning/aliases/import-popular
 * Import popular aliases
 */
router.post('/aliases/import-popular', async (req, res) => {
    try {
        const { userId, count } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        const imported = command_aliases_service_1.commandAliases.importPopularAliases(userId, count || 5);
        res.json({
            success: true,
            imported,
            count: imported.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/voice-learning/aliases/stats/:userId
 * Get alias statistics
 */
router.get('/aliases/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = command_aliases_service_1.commandAliases.getAliasStats(userId);
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/voice-learning/aliases/defaults
 * Get default aliases
 */
router.get('/aliases/defaults', async (req, res) => {
    try {
        res.json({
            success: true,
            defaults: command_aliases_service_1.DEFAULT_ALIASES
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================================================
// User Feedback
// ============================================================================
/**
 * POST /api/voice-learning/feedback/rating
 * Submit thumbs up/down
 */
router.post('/feedback/rating', async (req, res) => {
    try {
        const { userId, commandId, isPositive, comment } = req.body;
        if (!userId || !commandId || isPositive === undefined) {
            return res.status(400).json({
                success: false,
                error: 'userId, commandId, and isPositive are required'
            });
        }
        const feedback = user_feedback_service_1.userFeedback.submitRating(userId, commandId, isPositive, comment);
        res.json({
            success: true,
            feedback
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * POST /api/voice-learning/feedback/correction
 * Submit correction
 */
router.post('/feedback/correction', async (req, res) => {
    try {
        const { userId, originalTranscript, correctedTranscript, originalIntent, correctIntent, confidence } = req.body;
        if (!userId || !originalTranscript || !correctedTranscript) {
            return res.status(400).json({
                success: false,
                error: 'userId, originalTranscript, and correctedTranscript are required'
            });
        }
        const feedback = user_feedback_service_1.userFeedback.submitCorrection(userId, originalTranscript, correctedTranscript, originalIntent, correctIntent, confidence);
        res.json({
            success: true,
            feedback
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * POST /api/voice-learning/feedback/feature
 * Submit feature request
 */
router.post('/feedback/feature', async (req, res) => {
    try {
        const { userId, feature, description } = req.body;
        if (!userId || !feature) {
            return res.status(400).json({
                success: false,
                error: 'userId and feature are required'
            });
        }
        const feedback = user_feedback_service_1.userFeedback.submitFeatureRequest(userId, feature, description);
        res.json({
            success: true,
            feedback
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * POST /api/voice-learning/feedback/bug
 * Submit bug report
 */
router.post('/feedback/bug', async (req, res) => {
    try {
        const { userId, bug, transcript, context } = req.body;
        if (!userId || !bug) {
            return res.status(400).json({
                success: false,
                error: 'userId and bug are required'
            });
        }
        const feedback = user_feedback_service_1.userFeedback.submitBugReport(userId, bug, transcript, context);
        res.json({
            success: true,
            feedback
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * POST /api/voice-learning/feedback/comment
 * Submit general comment
 */
router.post('/feedback/comment', async (req, res) => {
    try {
        const { userId, commandId, comment, transcript } = req.body;
        if (!userId || !comment) {
            return res.status(400).json({
                success: false,
                error: 'userId and comment are required'
            });
        }
        const feedback = user_feedback_service_1.userFeedback.submitFeedback({
            userId,
            feedbackType: 'thumbs_down', // Generic comment
            commandId,
            transcript,
            comment
        });
        res.json({
            success: true,
            feedback
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/voice-learning/feedback/summary
 * Get feedback summary
 */
router.get('/feedback/summary', async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const summary = user_feedback_service_1.userFeedback.getFeedbackSummary(start, end, userId);
        res.json({
            success: true,
            summary
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/voice-learning/feedback/corrections
 * Get corrections for learning
 */
router.get('/feedback/corrections', async (req, res) => {
    try {
        const { userId } = req.query;
        const corrections = user_feedback_service_1.userFeedback.getCorrections(userId);
        res.json({
            success: true,
            corrections
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/voice-learning/feedback/statistics
 * Get feedback statistics
 */
router.get('/feedback/statistics', async (req, res) => {
    try {
        const stats = user_feedback_service_1.userFeedback.getStatistics();
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
