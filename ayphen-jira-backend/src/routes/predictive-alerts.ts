import { Router } from 'express';
import { predictiveAlertsService } from '../services/predictive-alerts.service';

const router = Router();

/**
 * Get all active alerts for a project
 */
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        const alerts = await predictiveAlertsService.getActiveAlerts(projectId);

        res.json({
            success: true,
            alerts,
            count: alerts.length
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Dismiss an alert
 */
router.post('/dismiss/:alertId', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { userId } = req.body;

        await predictiveAlertsService.dismissAlert(alertId, userId);

        res.json({
            success: true,
            message: 'Alert dismissed'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
