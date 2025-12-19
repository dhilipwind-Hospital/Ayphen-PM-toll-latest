"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const History_1 = require("../entities/History");
const router = (0, express_1.Router)();
// Helper function to generate human-readable descriptions
function generateDescription(field, oldValue, newValue, changeType) {
    switch (changeType) {
        case 'type_conversion':
            return `converted issue from ${oldValue} to ${newValue}`;
        case 'created':
            return `created the issue`;
        case 'deleted':
            return `deleted the issue`;
        default:
            break;
    }
    switch (field) {
        case 'status':
            return `changed status from "${oldValue}" to "${newValue}"`;
        case 'assignee':
            return `changed assignee from "${oldValue || 'Unassigned'}" to "${newValue || 'Unassigned'}"`;
        case 'priority':
            return `changed priority from "${oldValue}" to "${newValue}"`;
        case 'summary':
            return `updated summary`;
        case 'description':
            return `updated description`;
        case 'labels':
            return `updated labels`;
        case 'sprint':
            return `moved to sprint "${newValue}"`;
        case 'epic':
            return `linked to epic "${newValue}"`;
        case 'type':
            return `changed type from "${oldValue}" to "${newValue}"`;
        case 'storyPoints':
            return `changed story points from "${oldValue}" to "${newValue}"`;
        case 'dueDate':
            return `changed due date from "${oldValue}" to "${newValue}"`;
        default:
            return `updated ${field}`;
    }
}
// Get history for an issue
router.get('/issue/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const historyRepository = database_1.AppDataSource.getRepository(History_1.History);
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        // Fetch history from DB
        const history = await historyRepository.find({
            where: { issueId },
            order: { createdAt: 'DESC' },
            relations: ['user'] // Eager load user if possible, but manual fallback is fine
        });
        // Ensure user data is populated (if relation didn't load or we want flat structure)
        const enrichedHistory = await Promise.all(history.map(async (entry) => {
            let user = entry.user;
            if (!user && entry.userId) {
                user = await userRepository.findOne({ where: { id: entry.userId } });
            }
            return {
                ...entry,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                } : null,
                userName: user?.name || 'Unknown',
            };
        }));
        res.json(enrichedHistory);
    }
    catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: error.message });
    }
});
// Create a history entry (internal usage mostly, but kept for API completeness)
router.post('/', async (req, res) => {
    try {
        const { issueId, userId, field, oldValue, newValue, changeType, projectId, description } = req.body;
        const historyRepository = database_1.AppDataSource.getRepository(History_1.History);
        const entryDescription = description || generateDescription(field, oldValue, newValue, changeType);
        const newHistory = historyRepository.create({
            issueId,
            userId,
            field,
            oldValue: oldValue ? JSON.stringify(oldValue) : null,
            newValue: newValue ? JSON.stringify(newValue) : null,
            changeType,
            description: entryDescription,
            projectId,
        });
        const savedEntry = await historyRepository.save(newHistory);
        res.status(201).json(savedEntry);
    }
    catch (error) {
        console.error('Error creating history:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get history for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const historyRepository = database_1.AppDataSource.getRepository(History_1.History);
        const history = await historyRepository.find({
            where: { projectId },
            order: { createdAt: 'DESC' }
        });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
