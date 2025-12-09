"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const AITestSuite_1 = require("../entities/AITestSuite");
const router = (0, express_1.Router)();
const suiteRepo = database_1.AppDataSource.getRepository(AITestSuite_1.AITestSuite);
// GET all test suites
router.get('/', async (req, res) => {
    try {
        const { requirementId, category } = req.query;
        const where = {};
        if (requirementId)
            where.requirementId = requirementId;
        if (category)
            where.category = category;
        const suites = await suiteRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
        res.json(suites);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET suite by ID
router.get('/:id', async (req, res) => {
    try {
        const suite = await suiteRepo.findOne({
            where: { id: req.params.id },
        });
        if (!suite) {
            return res.status(404).json({ error: 'Test suite not found' });
        }
        res.json(suite);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
