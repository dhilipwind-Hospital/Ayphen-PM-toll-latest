"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const AITestCase_1 = require("../entities/AITestCase");
const router = (0, express_1.Router)();
const testCaseRepo = database_1.AppDataSource.getRepository(AITestCase_1.AITestCase);
// GET all test cases
router.get('/', async (req, res) => {
    try {
        const { storyId, type, category } = req.query;
        const where = {};
        if (storyId)
            where.storyId = storyId;
        if (type)
            where.type = type;
        let testCases = await testCaseRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
        // Filter by category if provided
        if (category) {
            testCases = testCases.filter(tc => tc.categories && tc.categories.includes(category));
        }
        res.json(testCases);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET test case by ID
router.get('/:id', async (req, res) => {
    try {
        const testCase = await testCaseRepo.findOne({
            where: { id: req.params.id },
        });
        if (!testCase) {
            return res.status(404).json({ error: 'Test case not found' });
        }
        res.json(testCase);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT update test case
router.put('/:id', async (req, res) => {
    try {
        await testCaseRepo.update(req.params.id, req.body);
        const testCase = await testCaseRepo.findOne({
            where: { id: req.params.id },
        });
        res.json(testCase);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE test case
router.delete('/:id', async (req, res) => {
    try {
        await testCaseRepo.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
