import { Router } from 'express';
import { pmBotService } from '../services/pmbot.service';

const router = Router();

/**
 * Auto-assign an issue to the best team member
 */
router.post('/auto-assign/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;

        const result = await pmBotService.autoAssignIssue(issueId);

        res.json({
            success: true,
            assignedTo: result.assignedTo,
            confidence: result.confidence,
            reasoning: result.reasoning
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Detect and follow up on stale issues in a project
 */
router.post('/stale-sweep/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        const result = await pmBotService.detectAndFollowUpStaleIssues(projectId);

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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Auto-triage an issue (suggest labels, priority, epic)
 */
router.post('/triage/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;

        const result = await pmBotService.autoTriageIssue(issueId);

        res.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get PMBot activity summary
 */
router.get('/activity/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const days = parseInt(req.query.days as string) || 7;

        const summary = await pmBotService.getActivitySummary(projectId, days);

        res.json({
            success: true,
            summary
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get PMBot settings for a user/project
 */
router.get('/settings', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        const projectId = req.query.projectId as string;

        // Default settings
        const defaultSettings = {
            autoAssignEnabled: true,
            staleSweepEnabled: true,
            staleDaysThreshold: 7,
            autoTriageEnabled: true,
            notifyOnAssign: true,
            notifyOnStale: true,
            excludedLabels: [],
            workingHoursOnly: false,
            workingHoursStart: 9,
            workingHoursEnd: 17
        };

        // In a production app, fetch from database
        // For now, return default settings
        res.json({
            success: true,
            settings: defaultSettings,
            userId,
            projectId
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Save PMBot settings for a user/project
 */
router.put('/settings', async (req, res) => {
    try {
        const { userId, projectId, settings } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // In a production app, save to database
        // For now, just acknowledge the save
        console.log('Saving PMBot settings:', { userId, projectId, settings });

        res.json({
            success: true,
            message: 'Settings saved successfully',
            settings
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

