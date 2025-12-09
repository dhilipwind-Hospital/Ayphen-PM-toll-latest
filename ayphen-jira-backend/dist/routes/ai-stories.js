"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const AIStory_1 = require("../entities/AIStory");
const router = (0, express_1.Router)();
const storyRepo = database_1.AppDataSource.getRepository(AIStory_1.AIStory);
// GET all stories
router.get('/', async (req, res) => {
    try {
        const { requirementId, type } = req.query;
        const where = {};
        if (requirementId)
            where.requirementId = requirementId;
        if (type)
            where.type = type;
        const stories = await storyRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
        res.json(stories);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET story by ID
router.get('/:id', async (req, res) => {
    try {
        const story = await storyRepo.findOne({
            where: { id: req.params.id },
        });
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }
        res.json(story);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT update story
router.put('/:id', async (req, res) => {
    try {
        await storyRepo.update(req.params.id, req.body);
        const story = await storyRepo.findOne({
            where: { id: req.params.id },
        });
        res.json(story);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE story
router.delete('/:id', async (req, res) => {
    try {
        await storyRepo.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
