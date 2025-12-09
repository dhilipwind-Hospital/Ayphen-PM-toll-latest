"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// In-memory storage for workflows
let workflows = [
    {
        id: 'workflow-1',
        name: 'Default Workflow',
        description: 'Standard workflow for most issues',
        isDefault: true,
        statuses: [
            { id: 'todo', name: 'To Do', category: 'TODO', position: { x: 100, y: 100 } },
            { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS', position: { x: 300, y: 100 } },
            { id: 'in-review', name: 'In Review', category: 'IN_PROGRESS', position: { x: 500, y: 100 } },
            { id: 'done', name: 'Done', category: 'DONE', position: { x: 700, y: 100 } },
        ],
        transitions: [
            { id: 't1', from: 'todo', to: 'in-progress', name: 'Start Progress', rules: [] },
            { id: 't2', from: 'in-progress', to: 'in-review', name: 'Submit for Review', rules: [] },
            { id: 't3', from: 'in-review', to: 'in-progress', name: 'Request Changes', rules: [] },
            { id: 't4', from: 'in-review', to: 'done', name: 'Complete', rules: [] },
            { id: 't5', from: 'in-progress', to: 'todo', name: 'Stop Progress', rules: [] },
        ],
        projectIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'workflow-2',
        name: 'Bug Workflow',
        description: 'Simplified workflow for bug tracking',
        isDefault: false,
        statuses: [
            { id: 'open', name: 'Open', category: 'TODO', position: { x: 150, y: 150 } },
            { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS', position: { x: 400, y: 150 } },
            { id: 'closed', name: 'Closed', category: 'DONE', position: { x: 650, y: 150 } },
        ],
        transitions: [
            { id: 't1', from: 'open', to: 'in-progress', name: 'Start Fix', rules: [] },
            { id: 't2', from: 'in-progress', to: 'closed', name: 'Close', rules: [] },
            { id: 't3', from: 'closed', to: 'open', name: 'Reopen', rules: [] },
        ],
        projectIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
// GET /api/workflows
router.get('/', async (req, res) => {
    try {
        res.json(workflows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/workflows/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/workflows
router.post('/', async (req, res) => {
    try {
        const { name, description, statuses = [], transitions = [] } = req.body;
        const workflow = {
            id: `workflow-${Date.now()}`,
            name,
            description,
            isDefault: false,
            statuses,
            transitions,
            projectIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        workflows.push(workflow);
        res.status(201).json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT /api/workflows/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, statuses, transitions } = req.body;
        const index = workflows.findIndex(w => w.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        workflows[index] = {
            ...workflows[index],
            name: name || workflows[index].name,
            description: description || workflows[index].description,
            statuses: statuses || workflows[index].statuses,
            transitions: transitions || workflows[index].transitions,
            updatedAt: new Date().toISOString(),
        };
        res.json(workflows[index]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/workflows/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const index = workflows.findIndex(w => w.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        if (workflows[index].isDefault) {
            return res.status(403).json({ error: 'Cannot delete default workflow' });
        }
        workflows.splice(index, 1);
        res.json({ message: 'Workflow deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/workflows/:id/status
// Add status to workflow
router.post('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { statusId, name, category, position } = req.body;
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        const newStatus = {
            id: statusId || `status-${Date.now()}`,
            name,
            category: category || 'TODO',
            position: position || { x: 100, y: 100 },
        };
        workflow.statuses.push(newStatus);
        workflow.updatedAt = new Date().toISOString();
        res.json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT /api/workflows/:id/status/:statusId
// Update status position or properties
router.put('/:id/status/:statusId', async (req, res) => {
    try {
        const { id, statusId } = req.params;
        const { name, category, position } = req.body;
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        const statusIndex = workflow.statuses.findIndex((s) => s.id === statusId);
        if (statusIndex === -1) {
            return res.status(404).json({ error: 'Status not found' });
        }
        workflow.statuses[statusIndex] = {
            ...workflow.statuses[statusIndex],
            name: name || workflow.statuses[statusIndex].name,
            category: category || workflow.statuses[statusIndex].category,
            position: position || workflow.statuses[statusIndex].position,
        };
        workflow.updatedAt = new Date().toISOString();
        res.json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/workflows/:id/status/:statusId
// Remove status from workflow
router.delete('/:id/status/:statusId', async (req, res) => {
    try {
        const { id, statusId } = req.params;
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        workflow.statuses = workflow.statuses.filter((s) => s.id !== statusId);
        workflow.transitions = workflow.transitions.filter((t) => t.from !== statusId && t.to !== statusId);
        workflow.updatedAt = new Date().toISOString();
        res.json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/workflows/:id/transition
// Add transition to workflow
router.post('/:id/transition', async (req, res) => {
    try {
        const { id } = req.params;
        const { from, to, name, rules = [] } = req.body;
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        const newTransition = {
            id: `t${Date.now()}`,
            from,
            to,
            name: name || `${from} → ${to}`,
            rules,
        };
        workflow.transitions.push(newTransition);
        workflow.updatedAt = new Date().toISOString();
        res.json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/workflows/:id/transition/:transitionId
// Remove transition from workflow
router.delete('/:id/transition/:transitionId', async (req, res) => {
    try {
        const { id, transitionId } = req.params;
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        workflow.transitions = workflow.transitions.filter((t) => t.id !== transitionId);
        workflow.updatedAt = new Date().toISOString();
        res.json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/workflows/templates
// Get workflow templates
router.get('/templates/list', async (req, res) => {
    try {
        const templates = [
            {
                id: 'template-simple',
                name: 'Simple Workflow',
                description: 'Basic To Do → In Progress → Done',
                statuses: [
                    { id: 'todo', name: 'To Do', category: 'TODO', position: { x: 100, y: 150 } },
                    { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS', position: { x: 400, y: 150 } },
                    { id: 'done', name: 'Done', category: 'DONE', position: { x: 700, y: 150 } },
                ],
                transitions: [
                    { id: 't1', from: 'todo', to: 'in-progress', name: 'Start', rules: [] },
                    { id: 't2', from: 'in-progress', to: 'done', name: 'Complete', rules: [] },
                ],
            },
            {
                id: 'template-scrum',
                name: 'Scrum Workflow',
                description: 'Full Scrum workflow with review and testing',
                statuses: [
                    { id: 'backlog', name: 'Backlog', category: 'TODO', position: { x: 50, y: 100 } },
                    { id: 'todo', name: 'To Do', category: 'TODO', position: { x: 250, y: 100 } },
                    { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS', position: { x: 450, y: 100 } },
                    { id: 'in-review', name: 'In Review', category: 'IN_PROGRESS', position: { x: 650, y: 100 } },
                    { id: 'done', name: 'Done', category: 'DONE', position: { x: 850, y: 100 } },
                ],
                transitions: [
                    { id: 't1', from: 'backlog', to: 'todo', name: 'Plan', rules: [] },
                    { id: 't2', from: 'todo', to: 'in-progress', name: 'Start', rules: [] },
                    { id: 't3', from: 'in-progress', to: 'in-review', name: 'Review', rules: [] },
                    { id: 't4', from: 'in-review', to: 'in-progress', name: 'Changes', rules: [] },
                    { id: 't5', from: 'in-review', to: 'done', name: 'Complete', rules: [] },
                ],
            },
            {
                id: 'template-kanban',
                name: 'Kanban Workflow',
                description: 'Continuous flow Kanban workflow',
                statuses: [
                    { id: 'todo', name: 'To Do', category: 'TODO', position: { x: 100, y: 150 } },
                    { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS', position: { x: 300, y: 150 } },
                    { id: 'testing', name: 'Testing', category: 'IN_PROGRESS', position: { x: 500, y: 150 } },
                    { id: 'done', name: 'Done', category: 'DONE', position: { x: 700, y: 150 } },
                ],
                transitions: [
                    { id: 't1', from: 'todo', to: 'in-progress', name: 'Start', rules: [] },
                    { id: 't2', from: 'in-progress', to: 'testing', name: 'Test', rules: [] },
                    { id: 't3', from: 'testing', to: 'in-progress', name: 'Failed', rules: [] },
                    { id: 't4', from: 'testing', to: 'done', name: 'Pass', rules: [] },
                ],
            },
        ];
        res.json(templates);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
