import { Router } from 'express';
import { workflowService } from '../services/workflow.service';

const router = Router();

// GET /api/workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await workflowService.getAll();
    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflows/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await workflowService.getById(id);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workflows
router.post('/', async (req, res) => {
  try {
    const { name, description, statuses = [], transitions = [] } = req.body;

    const workflow: any = {
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

    const allWorkflows = await workflowService.getAll();
    allWorkflows.push(workflow);
    res.status(201).json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/workflows/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, statuses, transitions } = req.body;

    const workflow = await workflowService.getById(id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (name) workflow.name = name;
    if (description) workflow.description = description;
    if (statuses) workflow.statuses = statuses;
    if (transitions) workflow.transitions = transitions;

    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/workflows/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflows = await workflowService.getAll();
    const index = workflows.findIndex(w => w.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflows[index].isDefault) {
      return res.status(403).json({ error: 'Cannot delete default workflow' });
    }

    workflows.splice(index, 1);
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workflows/:id/status
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId, name, category, position } = req.body;

    const workflow = await workflowService.getById(id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const newStatus = {
      id: statusId || `status-${Date.now()}`,
      name,
      category: category || 'TODO',
      position: position || { x: 100, y: 100 },
    };

    workflow.statuses.push(newStatus as any);
    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflows/templates/list
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
        transitions: [],
      },
    ];
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
