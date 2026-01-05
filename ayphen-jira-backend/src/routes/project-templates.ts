import { Router } from 'express';

const router = Router();

// Pre-defined project templates
const templates = [
  {
    id: 'scrum',
    name: 'Scrum',
    description: 'Agile development with sprints, user stories, and retrospectives',
    icon: '🏃',
    category: 'Software Development',
    features: ['Sprints', 'Backlog', 'Story Points', 'Burndown Charts'],
    defaultWorkflow: {
      statuses: ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'],
      transitions: 'all'
    },
    issueTypes: ['Epic', 'Story', 'Task', 'Bug', 'Subtask']
  },
  {
    id: 'kanban',
    name: 'Kanban',
    description: 'Continuous flow with visual boards and WIP limits',
    icon: '📊',
    category: 'Software Development',
    features: ['Visual Board', 'WIP Limits', 'Continuous Flow', 'Cycle Time'],
    defaultWorkflow: {
      statuses: ['To Do', 'In Progress', 'Done'],
      transitions: 'all'
    },
    issueTypes: ['Task', 'Bug', 'Story']
  },
  {
    id: 'bug-tracking',
    name: 'Bug Tracking',
    description: 'Track and manage software defects and issues',
    icon: '🐛',
    category: 'Quality Assurance',
    features: ['Bug Reports', 'Severity Levels', 'Resolution Tracking', 'Test Cases'],
    defaultWorkflow: {
      statuses: ['New', 'Confirmed', 'In Progress', 'Fixed', 'Verified', 'Closed'],
      transitions: 'all'
    },
    issueTypes: ['Bug', 'Task', 'Improvement']
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'General project tracking with milestones and tasks',
    icon: '📋',
    category: 'Business',
    features: ['Milestones', 'Tasks', 'Gantt Chart', 'Dependencies'],
    defaultWorkflow: {
      statuses: ['Not Started', 'In Progress', 'On Hold', 'Completed'],
      transitions: 'all'
    },
    issueTypes: ['Epic', 'Task', 'Subtask', 'Milestone']
  },
  {
    id: 'marketing',
    name: 'Marketing Campaign',
    description: 'Plan and execute marketing campaigns',
    icon: '📢',
    category: 'Marketing',
    features: ['Campaign Tracking', 'Content Calendar', 'Approvals', 'Analytics'],
    defaultWorkflow: {
      statuses: ['Ideation', 'Planning', 'In Progress', 'Review', 'Published'],
      transitions: 'all'
    },
    issueTypes: ['Campaign', 'Task', 'Content']
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with a clean slate',
    icon: '📄',
    category: 'General',
    features: ['Customizable', 'Flexible', 'No Preset Rules'],
    defaultWorkflow: {
      statuses: ['To Do', 'In Progress', 'Done'],
      transitions: 'all'
    },
    issueTypes: ['Task']
  }
];

// GET all templates
router.get('/', async (req, res) => {
  try {
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create custom template (in-memory for now)
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, category, features, defaultWorkflow, issueTypes } = req.body;
    
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      icon: icon || '📋',
      category: category || 'Custom',
      features: features || [],
      defaultWorkflow: defaultWorkflow || {
        statuses: ['To Do', 'In Progress', 'Done'],
        transitions: 'all'
      },
      issueTypes: issueTypes || ['Task']
    };
    
    templates.push(newTemplate);
    res.status(201).json(newTemplate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
