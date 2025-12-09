"use strict";
/**
 * Voice Integrations Routes
 * Phase 7-8: Integrations
 *
 * Routes for Teams, Mobile, and Meeting integrations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teams_bot_service_1 = require("../services/teams-bot.service");
const meeting_integration_service_1 = require("../services/meeting-integration.service");
const router = (0, express_1.Router)();
// ============================================================================
// Microsoft Teams Integration
// ============================================================================
/**
 * POST /api/voice-integrations/teams/messages
 * Handle incoming Teams messages
 */
router.post('/teams/messages', async (req, res) => {
    try {
        await teams_bot_service_1.teamsBot.processMessage(req, res);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * POST /api/voice-integrations/teams/notify
 * Send notification to Teams user
 */
router.post('/teams/notify', async (req, res) => {
    try {
        const { conversationReference, issue, action } = req.body;
        if (!conversationReference || !issue) {
            return res.status(400).json({
                success: false,
                error: 'conversationReference and issue are required'
            });
        }
        await teams_bot_service_1.teamsBot.sendIssueNotification(conversationReference, issue, action);
        res.json({
            success: true,
            message: 'Notification sent'
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
// Meeting Integration
// ============================================================================
/**
 * POST /api/voice-integrations/meeting/start
 * Start meeting transcription
 */
router.post('/meeting/start', async (req, res) => {
    try {
        const { meetingId, platform, participants } = req.body;
        if (!meetingId || !platform || !participants) {
            return res.status(400).json({
                success: false,
                error: 'meetingId, platform, and participants are required'
            });
        }
        const meeting = meeting_integration_service_1.meetingIntegration.startMeeting(meetingId, platform, participants);
        res.json({
            success: true,
            meeting: {
                id: meeting.id,
                meetingId: meeting.meetingId,
                platform: meeting.platform,
                startTime: meeting.startTime
            }
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
 * POST /api/voice-integrations/meeting/segment
 * Add transcript segment
 */
router.post('/meeting/segment', async (req, res) => {
    try {
        const { meetingId, speaker, text, confidence } = req.body;
        if (!meetingId || !speaker || !text) {
            return res.status(400).json({
                success: false,
                error: 'meetingId, speaker, and text are required'
            });
        }
        await meeting_integration_service_1.meetingIntegration.addSegment(meetingId, speaker, text, confidence);
        res.json({
            success: true,
            message: 'Segment added'
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
 * POST /api/voice-integrations/meeting/end
 * End meeting and get summary
 */
router.post('/meeting/end', async (req, res) => {
    try {
        const { meetingId } = req.body;
        if (!meetingId) {
            return res.status(400).json({
                success: false,
                error: 'meetingId is required'
            });
        }
        const summary = await meeting_integration_service_1.meetingIntegration.endMeeting(meetingId);
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
 * GET /api/voice-integrations/meeting/:meetingId
 * Get active meeting
 */
router.get('/meeting/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const meeting = meeting_integration_service_1.meetingIntegration.getActiveMeeting(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                error: 'Meeting not found'
            });
        }
        res.json({
            success: true,
            meeting: {
                id: meeting.id,
                meetingId: meeting.meetingId,
                platform: meeting.platform,
                startTime: meeting.startTime,
                participants: meeting.participants,
                segmentCount: meeting.segments.length,
                actionItemCount: meeting.actionItems.length,
                issuesDiscussed: meeting.issues.length
            }
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
 * POST /api/voice-integrations/meeting/create-issues
 * Create issues from action items
 */
router.post('/meeting/create-issues', async (req, res) => {
    try {
        const { meetingId, actionItemIds } = req.body;
        if (!meetingId || !actionItemIds) {
            return res.status(400).json({
                success: false,
                error: 'meetingId and actionItemIds are required'
            });
        }
        const issues = await meeting_integration_service_1.meetingIntegration.createIssuesFromActionItems(meetingId, actionItemIds);
        res.json({
            success: true,
            issues: issues.map(i => ({
                id: i.id,
                key: i.key,
                summary: i.summary,
                type: i.type,
                priority: i.priority
            }))
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
 * GET /api/voice-integrations/meeting/search
 * Search meeting transcripts
 */
router.get('/meeting/search', async (req, res) => {
    try {
        const { query, limit } = req.query;
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'query is required'
            });
        }
        const results = await meeting_integration_service_1.meetingIntegration.searchTranscripts(query, limit ? parseInt(limit) : 10);
        res.json({
            success: true,
            results
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
// Mobile API (optimized responses)
// ============================================================================
/**
 * GET /api/voice-integrations/mobile/quick-actions
 * Get mobile-optimized quick actions
 */
router.get('/mobile/quick-actions', async (req, res) => {
    try {
        const { userId, context } = req.query;
        // Return mobile-optimized quick actions
        const quickActions = [
            {
                id: 'priority-high',
                text: 'Set priority to high',
                icon: '🔴',
                command: 'set priority to high'
            },
            {
                id: 'status-progress',
                text: 'Move to in progress',
                icon: '▶️',
                command: 'move to in progress'
            },
            {
                id: 'assign-me',
                text: 'Assign to me',
                icon: '👤',
                command: 'assign to me'
            },
            {
                id: 'show-issues',
                text: 'Show my issues',
                icon: '📋',
                command: 'show my issues'
            },
            {
                id: 'create-bug',
                text: 'Create a bug',
                icon: '🐛',
                command: 'create a bug'
            }
        ];
        res.json({
            success: true,
            quickActions
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
 * POST /api/voice-integrations/mobile/command
 * Execute mobile voice command
 */
router.post('/mobile/command', async (req, res) => {
    try {
        const { command, context } = req.body;
        if (!command) {
            return res.status(400).json({
                success: false,
                error: 'command is required'
            });
        }
        // Use existing AI parsing and execution
        // This is just a mobile-optimized wrapper
        res.json({
            success: true,
            message: 'Use /api/voice-assistant-ai/parse and /api/voice-assistant-ai/execute'
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
