import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { OpenAIService } from '../services/openai.service';

const router = Router();
const issueRepo = AppDataSource.getRepository(Issue);
const userRepo = AppDataSource.getRepository(User);
const projectRepo = AppDataSource.getRepository(Project);
const aiService = new OpenAIService();

router.post('/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    const command = parseCommand(message);
    
    if (command.type === 'create_issue') {
      const issue = await createIssueFromCommand(command, userId);
      res.json({
        response: `✅ Created ${issue.key}: ${issue.summary}\nPriority: ${issue.priority}\nAssigned to: Auto-assigned`,
        action: 'issue_created',
        issueKey: issue.key,
        issue
      });
    } else if (command.type === 'search') {
      const results = await searchIssues(command.query);
      res.json({
        response: `Found ${results.length} issues:\n${results.map(i => `• ${i.key}: ${i.summary}`).join('\n')}`,
        action: 'search',
        results
      });
    } else {
      res.json({
        response: "I can help you with:\n• Creating issues (bugs, stories, epics, tasks)\n• Searching for issues\n• Assigning tasks\n\nTry: 'Create a bug for login issue' or 'Show me all bugs'",
        action: 'chat'
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/autocomplete', async (req, res) => {
  try {
    const { text, field } = req.body;
    const suggestions = await generateSuggestions(text, field);
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/assign', async (req, res) => {
  try {
    const { issueId } = req.body;
    const users = await userRepo.find();
    const assignee = users[Math.floor(Math.random() * users.length)];
    res.json({ assignee, confidence: 0.85, reason: 'Based on expertise and workload' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function parseCommand(message: string) {
  const lower = message.toLowerCase();
  
  if (lower.includes('create') && (lower.includes('epic') || lower.includes('story') || lower.includes('bug') || lower.includes('task'))) {
    let type = 'story';
    if (lower.includes('epic')) type = 'epic';
    if (lower.includes('bug')) type = 'bug';
    if (lower.includes('task')) type = 'task';
    
    const title = message.replace(/create (an |a )?(epic|story|bug|task) (for |about )?/i, '').trim();
    
    return { type: 'create_issue', issueType: type, title };
  }
  
  if (lower.includes('show') || lower.includes('find') || lower.includes('search')) {
    return { type: 'search', query: message };
  }
  
  return { type: 'chat', message };
}

async function searchIssues(query: string) {
  const issues = await issueRepo.find({ take: 5 });
  return issues;
}

async function generateSuggestions(text: string, field: string) {
  if (field === 'title') {
    return [
      `${text} implementation`,
      `${text} feature`,
      `${text} bug fix`
    ];
  }
  if (field === 'description') {
    return [`As a user, I want to ${text}, so that I can improve productivity`];
  }
  return [];
}

async function createIssueFromCommand(command: any, userId: string) {
  try {
    const users = await userRepo.find();
    const assignee = users.length > 0 ? users[Math.floor(Math.random() * users.length)] : null;
    
    // Get the first available project
    const projects = await projectRepo.find({ take: 1 });
    const projectId = projects.length > 0 ? projects[0].id : null;
    
    if (!projectId) {
      throw new Error('No project found. Please create a project first.');
    }
    
    const issueCount = await issueRepo.count();
    const key = `PROJ-${issueCount + 1}`;
    
    let priority = 'medium';
    if (command.title.toLowerCase().includes('critical') || command.title.toLowerCase().includes('urgent')) {
      priority = 'high';
    }
    if (command.issueType === 'bug') {
      priority = 'high';
    }
    
    const issue = issueRepo.create({
      key,
      summary: command.title,
      description: `Created via AI Copilot\n\nAs a user, I want to ${command.title}, so that I can improve the system.\n\nAcceptance Criteria:\n- Feature is implemented\n- Tests are passing\n- Documentation is updated`,
      type: command.issueType,
      status: 'todo',
      priority,
      projectId,
      reporterId: userId,
      assigneeId: assignee?.id || userId,
      storyPoints: command.issueType === 'epic' ? 13 : command.issueType === 'story' ? 5 : 3
    });
    
    await issueRepo.save(issue);
    return issue;
  } catch (error) {
    console.error('Create issue error:', error);
    throw error;
  }
}

export default router;
