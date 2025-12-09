"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sync_service_1 = require("../services/sync.service");
const router = (0, express_1.Router)();
const syncService = new sync_service_1.SyncService();
// POST sync requirement
router.post('/:requirementId', async (req, res) => {
    try {
        const result = await syncService.syncRequirement(req.params.requirementId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET changes for requirement
router.get('/changes/:requirementId', async (req, res) => {
    try {
        const changes = await syncService.getChanges(req.params.requirementId);
        res.json(changes);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
