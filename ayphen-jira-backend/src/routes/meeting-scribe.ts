import { Router } from 'express';
import { meetingScribeService } from '../services/meeting-scribe.service';

const router = Router();

/**
 * Process meeting transcript and create issues
 */
router.post('/process', async (req, res) => {
    try {
        const { transcript, projectId, meetingTitle, attendees } = req.body;

        if (!transcript || !projectId) {
            return res.status(400).json({ error: 'transcript and projectId are required' });
        }

        const result = await meetingScribeService.processMeetingTranscript({
            text: transcript,
            projectId,
            meetingTitle,
            attendees
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error: any) {
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

        const result = await meetingScribeService.quickProcessNotes(notes, projectId);

        res.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
