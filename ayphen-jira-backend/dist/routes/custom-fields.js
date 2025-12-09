"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const CustomField_1 = require("../entities/CustomField");
const router = (0, express_1.Router)();
const customFieldRepo = database_1.AppDataSource.getRepository(CustomField_1.CustomField);
// GET all custom fields
router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        let where = { isActive: true };
        if (projectId) {
            where = [
                { projectId, isActive: true },
                { isGlobal: true, isActive: true }
            ];
        }
        const fields = await customFieldRepo.find({
            where,
            order: { sortOrder: 'ASC' },
        });
        res.json(fields);
    }
    catch (error) {
        console.error('Failed to fetch custom fields:', error);
        res.status(500).json({ error: 'Failed to fetch custom fields' });
    }
});
// POST create custom field
router.post('/', async (req, res) => {
    try {
        const field = customFieldRepo.create(req.body);
        await customFieldRepo.save(field);
        res.status(201).json(field);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create custom field' });
    }
});
// PUT update custom field
router.put('/:id', async (req, res) => {
    try {
        await customFieldRepo.update(req.params.id, req.body);
        const field = await customFieldRepo.findOne({ where: { id: req.params.id } });
        res.json(field);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update custom field' });
    }
});
// DELETE custom field
router.delete('/:id', async (req, res) => {
    try {
        await customFieldRepo.update(req.params.id, { isActive: false });
        res.json({ message: 'Custom field deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete custom field' });
    }
});
exports.default = router;
