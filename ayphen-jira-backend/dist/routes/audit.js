"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_service_1 = require("../services/audit.service");
const router = (0, express_1.Router)();
// Get audit logs with filters
router.get('/', async (req, res) => {
    try {
        const filters = {
            userId: req.query.userId,
            action: req.query.action,
            entityType: req.query.entityType,
            entityId: req.query.entityId,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0,
        };
        const result = await audit_service_1.auditService.getLogs(filters);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get user activity summary
router.get('/user/:userId', async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const activity = await audit_service_1.auditService.getUserActivity(req.params.userId, days);
        res.json(activity);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get system activity summary
router.get('/system', async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 7;
        const activity = await audit_service_1.auditService.getSystemActivity(days);
        res.json(activity);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
