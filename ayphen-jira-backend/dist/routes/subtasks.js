"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const History_1 = require("../entities/History");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const historyRepo = database_1.AppDataSource.getRepository(History_1.History);
// Get all subtasks for a parent issue
router.get('/parent/:parentId', async (req, res) => {
    try {
        const { parentId } = req.params;
        const subtasks = await issueRepo.find({
            where: { parentId },
            relations: ['assignee', 'reporter'],
        });
        res.json(subtasks);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create a subtask
router.post('/', async (req, res) => {
    try {
        const { parentId, userId, ...data } = req.body;
        const parent = await issueRepo.findOne({ where: { id: parentId } });
        if (!parent) {
            return res.status(404).json({ error: 'Parent issue not found' });
        }
        const subtaskData = issueRepo.create({
            ...data,
            type: 'subtask',
            parentId,
            projectId: parent.projectId,
        });
        const subtask = await issueRepo.save(subtaskData);
        // Update parent subtask count
        await issueRepo.update(parentId, {
            subtaskCount: (parent.subtaskCount || 0) + 1
        });
        // Create history entry
        await historyRepo.save({
            issueId: parentId,
            userId: userId || parent.reporterId,
            field: 'subtask',
            oldValue: '',
            newValue: subtask.key,
            changeType: 'subtask_added',
            projectId: parent.projectId,
            description: `Added subtask ${subtask.key}`
        });
        res.status(201).json(subtask);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update a subtask
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await issueRepo.update(id, req.body);
        const subtask = await issueRepo.findOne({
            where: { id },
            relations: ['assignee', 'reporter'],
        });
        res.json(subtask);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a subtask
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;
        const subtask = await issueRepo.findOne({ where: { id } });
        if (!subtask) {
            return res.status(404).json({ error: 'Subtask not found' });
        }
        const parentId = subtask.parentId;
        const subtaskKey = subtask.key;
        await issueRepo.delete(id);
        // Update parent subtask count
        if (parentId) {
            const parent = await issueRepo.findOne({ where: { id: parentId } });
            if (parent) {
                await issueRepo.update(parentId, {
                    subtaskCount: Math.max(0, (parent.subtaskCount || 1) - 1)
                });
                // Create history entry
                await historyRepo.save({
                    issueId: parentId,
                    userId: userId || parent.reporterId,
                    field: 'subtask',
                    oldValue: subtaskKey,
                    newValue: '',
                    changeType: 'subtask_removed',
                    projectId: parent.projectId,
                    description: `Removed subtask ${subtaskKey}`
                });
            }
        }
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
