"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predictive_alerts_service_1 = require("../services/predictive-alerts.service");
const router = (0, express_1.Router)();
/**
 * Get all active alerts for a project
 */
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const alerts = await predictive_alerts_service_1.predictiveAlertsService.getActiveAlerts(projectId);
        res.json({
            success: true,
            alerts,
            count: alerts.length
        });
    }
    catch (error) {
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
        await predictive_alerts_service_1.predictiveAlertsService.dismissAlert(alertId, userId);
        res.json({
            success: true,
            message: 'Alert dismissed'
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
