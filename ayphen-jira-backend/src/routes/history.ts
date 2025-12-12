import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

const router = Router();

// In-memory storage for history - made global for access from other routes
declare global {
  var historyEntries: any[];
}
global.historyEntries = global.historyEntries || [];
const historyEntries = global.historyEntries;

// Helper function to generate human-readable descriptions
function generateDescription(field: string, oldValue: any, newValue: any, changeType: string): string {
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
    const userRepository = AppDataSource.getRepository(User);
    
    const history = historyEntries
      .filter(entry => entry.issueId === issueId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Fetch user data for history entries
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        if (entry.userId && !entry.user) {
          const user = await userRepository.findOne({ where: { id: entry.userId } });
          if (user) {
            return {
              ...entry,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
              },
              userName: user.name,
            };
          }
        }
        return entry;
      })
    );
    
    res.json(enrichedHistory);
  } catch (error: any) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a history entry
router.post('/', async (req, res) => {
  try {
    const { issueId, userId, field, oldValue, newValue, changeType, projectId, description } = req.body;
    
    const entry = {
      id: `history-${Date.now()}`,
      issueId,
      userId,
      field,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      changeType, // 'field_change', 'status_change', 'comment', 'attachment', 'type_conversion', etc.
      description: description || generateDescription(field, oldValue, newValue, changeType),
      projectId,
      createdAt: new Date().toISOString(),
    };
    
    historyEntries.push(entry);
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get history for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const history = historyEntries
      .filter(entry => entry.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
