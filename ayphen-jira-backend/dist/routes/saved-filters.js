"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const SavedFilter_1 = require("../entities/SavedFilter");
const router = (0, express_1.Router)();
// Get all saved filters for a user
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const filterRepo = database_1.AppDataSource.getRepository(SavedFilter_1.SavedFilter);
        // Get user's own filters and shared filters
        const filters = await filterRepo.find({
            where: [
                { ownerId: userId },
                { isShared: true }
            ],
            order: {
                isFavorite: 'DESC',
                usageCount: 'DESC',
                updatedAt: 'DESC'
            }
        });
        res.json(filters);
    }
    catch (error) {
        console.error('Error fetching saved filters:', error);
        res.status(500).json({ error: 'Failed to fetch saved filters' });
    }
});
// Get a single saved filter
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filterRepo = database_1.AppDataSource.getRepository(SavedFilter_1.SavedFilter);
        const filter = await filterRepo.findOne({ where: { id } });
        if (!filter) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        res.json(filter);
    }
    catch (error) {
        console.error('Error fetching filter:', error);
        res.status(500).json({ error: 'Failed to fetch filter' });
    }
});
// Create a new saved filter
router.post('/', async (req, res) => {
    try {
        const { name, description, filterConfig, ownerId, isShared, color } = req.body;
        if (!name || !filterConfig || !ownerId) {
            return res.status(400).json({ error: 'name, filterConfig, and ownerId are required' });
        }
        const filterRepo = database_1.AppDataSource.getRepository(SavedFilter_1.SavedFilter);
        const filter = filterRepo.create({
            name,
            description,
            filterConfig,
            ownerId,
            isShared: isShared || false,
            color: color || null
        });
        const savedFilter = await filterRepo.save(filter);
        res.status(201).json(savedFilter);
    }
    catch (error) {
        console.error('Error creating filter:', error);
        res.status(500).json({ error: 'Failed to create filter' });
    }
});
// Update a saved filter
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const filterRepo = database_1.AppDataSource.getRepository(SavedFilter_1.SavedFilter);
        const filter = await filterRepo.findOne({ where: { id } });
        if (!filter) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        // Update fields
        Object.assign(filter, updates);
        const updatedFilter = await filterRepo.save(filter);
        res.json(updatedFilter);
    }
    catch (error) {
        console.error('Error updating filter:', error);
        res.status(500).json({ error: 'Failed to update filter' });
    }
});
// Delete a saved filter
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filterRepo = database_1.AppDataSource.getRepository(SavedFilter_1.SavedFilter);
        const filter = await filterRepo.findOne({ where: { id } });
        if (!filter) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        await filterRepo.remove(filter);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting filter:', error);
        res.status(500).json({ error: 'Failed to delete filter' });
    }
});
// Star/unstar a filter
router.post('/:id/star', async (req, res) => {
    try {
        const { id } = req.params;
        const filterRepo = database_1.AppDataSource.getRepository(SavedFilter_1.SavedFilter);
        const filter = await filterRepo.findOne({ where: { id } });
        if (!filter) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        filter.isStarred = !filter.isStarred;
        const updatedFilter = await filterRepo.save(filter);
        res.json(updatedFilter);
    }
    catch (error) {
        console.error('Error starring filter:', error);
        res.status(500).json({ error: 'Failed to star filter' });
    }
});
// Mark filter as favorite
router.post('/:id/favorite', async (req, res) => {
    try {
        const { id } = req.params;
        const filterRepo = database_1.AppDataSource.getRepository(SavedFilter_1.SavedFilter);
        const filter = await filterRepo.findOne({ where: { id } });
        if (!filter) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        filter.isFavorite = !filter.isFavorite;
        const updatedFilter = await filterRepo.save(filter);
        res.json(updatedFilter);
    }
    catch (error) {
        console.error('Error favoriting filter:', error);
        res.status(500).json({ error: 'Failed to favorite filter' });
    }
});
// Track filter usage
router.post('/:id/use', async (req, res) => {
    try {
        const { id } = req.params;
        const filterRepo = database_1.AppDataSource.getRepository(SavedFilter_1.SavedFilter);
        const filter = await filterRepo.findOne({ where: { id } });
        if (!filter) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        filter.usageCount += 1;
        filter.lastUsedAt = new Date();
        const updatedFilter = await filterRepo.save(filter);
        res.json(updatedFilter);
    }
    catch (error) {
        console.error('Error tracking filter usage:', error);
        res.status(500).json({ error: 'Failed to track filter usage' });
    }
});
exports.default = router;
