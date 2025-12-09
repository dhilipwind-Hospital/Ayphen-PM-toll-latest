"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meeting_scribe_service_1 = require("../services/meeting-scribe.service");
const router = (0, express_1.Router)();
/**
 * Process meeting transcript and create issues
 */
router.post('/process', async (req, res) => {
    try {
        const { transcript, projectId, meetingTitle, attendees } = req.body;
        if (!transcript || !projectId) {
            return res.status(400).json({ error: 'transcript and projectId are required' });
        }
        const result = await meeting_scribe_service_1.meetingScribeService.processMeetingTranscript({
            text: transcript,
            projectId,
            meetingTitle,
            attendees
        });
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
 * Quick process - paste notes and go
 */
router.post('/quick', async (req, res) => {
    try {
        const { notes, projectId } = req.body;
        if (!notes || !projectId) {
            return res.status(400).json({ error: 'notes and projectId are required' });
        }
        const result = await meeting_scribe_service_1.meetingScribeService.quickProcessNotes(notes, projectId);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
