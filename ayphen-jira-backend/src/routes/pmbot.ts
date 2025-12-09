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

export default router;
