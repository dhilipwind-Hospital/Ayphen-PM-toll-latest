"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const router = (0, express_1.Router)();
// In-memory storage for settings (you can create entities later)
let workflows = [
    {
        id: 'workflow-1',
        name: 'Default Workflow',
        statuses: ['To Do', 'In Progress', 'In Review', 'Done'],
        projectId: null,
    },
    {
        id: 'workflow-2',
        name: 'Bug Workflow',
        statuses: ['Open', 'In Progress', 'Testing', 'Closed'],
        projectId: null,
    },
];
let issueTypes = [
    { id: 'type-1', name: 'Epic', icon: '⚡', color: 'purple', description: 'Large body of work' },
    { id: 'type-2', name: 'Story', icon: '📖', color: 'green', description: 'User story' },
    { id: 'type-3', name: 'Task', icon: '✓', color: 'blue', description: 'Task to be done' },
    { id: 'type-4', name: 'Bug', icon: '🐛', color: 'red', description: 'Bug to be fixed' },
    { id: 'type-5', name: 'Subtask', icon: '📋', color: 'gray', description: 'Subtask of an issue' },
];
let customFields = [
    { id: 'field-1', name: 'Story Points', type: 'Number', required: false },
    { id: 'field-2', name: 'Sprint', type: 'Sprint Picker', required: false },
    { id: 'field-3', name: 'Epic Link', type: 'Epic Link', required: false },
    { id: 'field-4', name: 'Labels', type: 'Labels', required: false },
];
let automationRules = [
    { id: 'rule-1', name: 'Auto-assign new issues', enabled: true, trigger: 'Issue Created', action: 'Assign to reporter' },
    { id: 'rule-2', name: 'Close stale issues', enabled: false, trigger: 'Issue Inactive 30 days', action: 'Close issue' },
    { id: 'rule-3', name: 'Notify on high priority', enabled: true, trigger: 'Priority = Highest', action: 'Send notification' },
];
// ============= WORKFLOWS =============
// Note: Workflows are now managed through /api/workflows route
// These endpoints are kept for backward compatibility but redirect to main workflow API
// ============= ISSUE TYPES =============
// Get all issue types
router.get('/issue-types', async (req, res) => {
    try {
        res.json(issueTypes);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create issue type
router.post('/issue-types', async (req, res) => {
    try {
        const { name, icon, color, description } = req.body;
        const issueType = {
            id: `type-${Date.now()}`,
            name,
            icon,
            color,
            description,
            createdAt: new Date().toISOString(),
        };
        issueTypes.push(issueType);
        res.status(201).json(issueType);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update issue type
router.put('/issue-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const index = issueTypes.findIndex(t => t.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Issue type not found' });
        }
        issueTypes[index] = { ...issueTypes[index], ...updates, updatedAt: new Date().toISOString() };
        res.json(issueTypes[index]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete issue type
router.delete('/issue-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const index = issueTypes.findIndex(t => t.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Issue type not found' });
        }
        issueTypes.splice(index, 1);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ============= CUSTOM FIELDS =============
// Get all custom fields
router.get('/custom-fields', async (req, res) => {
    try {
        res.json(customFields);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create custom field
router.post('/custom-fields', async (req, res) => {
    try {
        const { name, type, required } = req.body;
        const field = {
            id: `field-${Date.now()}`,
            name,
            type,
            required: required || false,
            createdAt: new Date().toISOString(),
        };
        customFields.push(field);
        res.status(201).json(field);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update custom field
router.put('/custom-fields/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const index = customFields.findIndex(f => f.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Custom field not found' });
        }
        customFields[index] = { ...customFields[index], ...updates, updatedAt: new Date().toISOString() };
        res.json(customFields[index]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete custom field
router.delete('/custom-fields/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const index = customFields.findIndex(f => f.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Custom field not found' });
        }
        customFields.splice(index, 1);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ============= AUTOMATION RULES =============
// Get all automation rules
router.get('/automation-rules', async (req, res) => {
    try {
        res.json(automationRules);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create automation rule
router.post('/automation-rules', async (req, res) => {
    try {
        const { name, trigger, action, enabled } = req.body;
        const rule = {
            id: `rule-${Date.now()}`,
            name,
            trigger,
            action,
            enabled: enabled !== undefined ? enabled : true,
            createdAt: new Date().toISOString(),
        };
        automationRules.push(rule);
        res.status(201).json(rule);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update automation rule
router.put('/automation-rules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const index = automationRules.findIndex(r => r.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Automation rule not found' });
        }
        automationRules[index] = { ...automationRules[index], ...updates, updatedAt: new Date().toISOString() };
        res.json(automationRules[index]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete automation rule
router.delete('/automation-rules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const index = automationRules.findIndex(r => r.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Automation rule not found' });
        }
        automationRules.splice(index, 1);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ============= PROJECT TEAM MEMBERS =============
// Get project team members
router.get('/project/:projectId/members', async (req, res) => {
    try {
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const users = await userRepository.find();
        // Add role information (mock for now)
        const members = users.map(user => ({
            ...user,
            role: 'member',
            addedAt: new Date().toISOString(),
        }));
        res.json(members);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Add team member
router.post('/project/:projectId/members', async (req, res) => {
    try {
        const { userId, role, name, email } = req.body;
        // If name and email provided, create a new user object
        if (name && email) {
            const member = {
                id: userId || `user-${Date.now()}`,
                name,
                email,
                avatar: null,
                role: role || 'member',
                addedAt: new Date().toISOString(),
            };
            return res.status(201).json(member);
        }
        // Otherwise, try to find existing user
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const member = {
            ...user,
            role: role || 'member',
            addedAt: new Date().toISOString(),
        };
        res.status(201).json(member);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update team member role
router.put('/project/:projectId/members/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const member = {
            ...user,
            role,
            updatedAt: new Date().toISOString(),
        };
        res.json(member);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Remove team member
router.delete('/project/:projectId/members/:userId', async (req, res) => {
    try {
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ============= PERMISSIONS =============
let permissions = [
    {
        id: 'perm-1',
        role: 'Administrators',
        permissions: ['Administer', 'Browse', 'Create', 'Edit', 'Delete', 'Assign', 'Resolve', 'Close', 'Transition', 'Comment', 'Attach', 'Link'],
        description: 'Full access to all project features'
    },
    {
        id: 'perm-2',
        role: 'Members',
        permissions: ['Browse', 'Create', 'Edit', 'Comment', 'Attach'],
        description: 'Can create and edit issues, add comments'
    },
    {
        id: 'perm-3',
        role: 'Viewers',
        permissions: ['Browse'],
        description: 'Read-only access to issues'
    },
];
// Get all permissions
router.get('/permissions', async (req, res) => {
    try {
        res.json(permissions);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update permission role
router.put('/permissions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const index = permissions.findIndex(p => p.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Permission role not found' });
        }
        permissions[index] = { ...permissions[index], ...updates, updatedAt: new Date().toISOString() };
        res.json(permissions[index]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
