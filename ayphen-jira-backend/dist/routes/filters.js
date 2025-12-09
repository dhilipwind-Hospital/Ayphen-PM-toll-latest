"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// In-memory filters storage
let filters = [
    {
        id: 'filter-1',
        name: 'My Open Issues',
        description: 'Issues assigned to me that are not done',
        jql: 'assignee = currentUser() AND status != Done',
        isStarred: false,
        ownerId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'filter-2',
        name: 'Recently Updated',
        description: 'Issues updated in the last 7 days',
        jql: 'updated >= -7d',
        isStarred: false,
        ownerId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
// Get all filters
router.get('/', async (req, res) => {
    try {
        res.json(filters);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get filter by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filter = filters.find(f => f.id === id);
        if (!filter) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        res.json(filter);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create a filter
router.post('/', async (req, res) => {
    try {
        const { name, description, jql, ownerId } = req.body;
        const filter = {
            id: `filter-${Date.now()}`,
            name,
            description,
            jql,
            isStarred: false,
            ownerId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        filters.push(filter);
        res.status(201).json(filter);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update a filter
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const filterIndex = filters.findIndex(f => f.id === id);
        if (filterIndex === -1) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        filters[filterIndex] = {
            ...filters[filterIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        res.json(filters[filterIndex]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a filter
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filterIndex = filters.findIndex(f => f.id === id);
        if (filterIndex === -1) {
            return res.status(404).json({ error: 'Filter not found' });
        }
        filters.splice(filterIndex, 1);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
