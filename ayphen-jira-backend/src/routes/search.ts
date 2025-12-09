import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { Like, In, Between, Not, IsNull, MoreThan, LessThan } from 'typeorm';
import { searchEngineService } from '../services/search-engine.service';
import { jqlParserService } from '../services/jql-parser.service';

const router = Router();
const issueRepo = AppDataSource.getRepository(Issue);

// Enhanced JQL parser with functions
function parseJQL(jql: string, currentUserId?: string): any {
  const where: any = {};
  
  // Remove extra spaces
  jql = jql.trim().replace(/\s+/g, ' ');
  
  // Replace JQL functions
  jql = jql.replace(/currentUser\(\)/gi, currentUserId || 'current-user');
  jql = jql.replace(/now\(\)/gi, new Date().toISOString());
  jql = jql.replace(/startOfDay\(\)/gi, new Date(new Date().setHours(0,0,0,0)).toISOString());
  jql = jql.replace(/endOfDay\(\)/gi, new Date(new Date().setHours(23,59,59,999)).toISOString());
  
  // Parse simple conditions
  const conditions = jql.split(' AND ').map(c => c.trim());
  
  conditions.forEach(condition => {
    // status = "done"
    if (condition.match(/status\s*=\s*"([^"]+)"/i)) {
      const match = condition.match(/status\s*=\s*"([^"]+)"/i);
      if (match) where.status = match[1];
    }
    
    // type = "bug"
    if (condition.match(/type\s*=\s*"([^"]+)"/i)) {
      const match = condition.match(/type\s*=\s*"([^"]+)"/i);
      if (match) where.type = match[1];
    }
    
    // priority = "high"
    if (condition.match(/priority\s*=\s*"([^"]+)"/i)) {
      const match = condition.match(/priority\s*=\s*"([^"]+)"/i);
      if (match) where.priority = match[1];
    }
    
    // project = "PROJ"
    if (condition.match(/project\s*=\s*"([^"]+)"/i)) {
      const match = condition.match(/project\s*=\s*"([^"]+)"/i);
      if (match) where.projectId = match[1];
    }
    
    // assignee = "user"
    if (condition.match(/assignee\s*=\s*"([^"]+)"/i)) {
      const match = condition.match(/assignee\s*=\s*"([^"]+)"/i);
      if (match) where.assigneeId = match[1];
    }
    
    // status IN ("todo", "in-progress")
    if (condition.match(/status\s+IN\s*\(([^)]+)\)/i)) {
      const match = condition.match(/status\s+IN\s*\(([^)]+)\)/i);
      if (match) {
        const values = match[1].split(',').map(v => v.trim().replace(/"/g, ''));
        where.status = In(values);
      }
    }
    
    // type IN ("bug", "task")
    if (condition.match(/type\s+IN\s*\(([^)]+)\)/i)) {
      const match = condition.match(/type\s+IN\s*\(([^)]+)\)/i);
      if (match) {
        const values = match[1].split(',').map(v => v.trim().replace(/"/g, ''));
        where.type = In(values);
      }
    }
    
    // text ~ "search term"
    if (condition.match(/text\s*~\s*"([^"]+)"/i)) {
      const match = condition.match(/text\s*~\s*"([^"]+)"/i);
      if (match) where.summary = Like(`%${match[1]}%`);
    }
    
    // summary ~ "search"
    if (condition.match(/summary\s*~\s*"([^"]+)"/i)) {
      const match = condition.match(/summary\s*~\s*"([^"]+)"/i);
      if (match) where.summary = Like(`%${match[1]}%`);
    }
    
    // assignee IS EMPTY
    if (condition.match(/assignee\s+IS\s+EMPTY/i)) {
      where.assigneeId = IsNull();
    }
    
    // assignee IS NOT EMPTY
    if (condition.match(/assignee\s+IS\s+NOT\s+EMPTY/i)) {
      where.assigneeId = Not(IsNull());
    }
  });
  
  return where;
}

// POST /api/search
// Search issues with JQL or filters
router.post('/', async (req, res) => {
  try {
    const { jql, filters, orderBy = 'createdAt', order = 'DESC', limit = 50, offset = 0 } = req.body;
    
    let where: any = {};
    
    // Parse JQL if provided
    if (jql) {
      where = parseJQL(jql);
    }
    
    // Apply filters if provided
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.priority) where.priority = filters.priority;
      if (filters.assigneeId) where.assigneeId = filters.assigneeId;
      if (filters.projectId) where.projectId = filters.projectId;
      if (filters.sprintId) where.sprintId = filters.sprintId;
      if (filters.epicLink) where.epicLink = filters.epicLink;
      
      // Text search
      if (filters.text) {
        where.summary = Like(`%${filters.text}%`);
      }
      
      // Date range
      if (filters.createdFrom || filters.createdTo) {
        where.createdAt = Between(
          filters.createdFrom || new Date('2000-01-01'),
          filters.createdTo || new Date('2100-01-01')
        );
      }
    }
    
    const [issues, total] = await issueRepo.findAndCount({
      where,
      order: { [orderBy]: order },
      take: limit,
      skip: offset,
    });
    
    res.json({
      issues: issues.map(i => ({
        id: i.id,
        key: i.key,
        summary: i.summary,
        description: i.description,
        type: i.type,
        status: i.status,
        priority: i.priority,
        assignee: i.assignee,
        reporter: i.reporter,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        storyPoints: i.storyPoints,
        labels: i.labels,
        sprintId: i.sprintId,
        epicLink: i.epicLink,
      })),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error('Search failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/search/quick
// Quick search by text
router.get('/quick', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.json({ issues: [] });
    }
    
    const issues = await issueRepo.find({
      where: [
        { key: Like(`%${q}%`) },
        { summary: Like(`%${q}%`) },
      ],
      take: parseInt(limit as string),
      order: { updatedAt: 'DESC' },
    });
    
    res.json({
      issues: issues.map(i => ({
        id: i.id,
        key: i.key,
        summary: i.summary,
        type: i.type,
        status: i.status,
      })),
    });
  } catch (error: any) {
    console.error('Quick search failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/search/suggestions
// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { field, q } = req.query;
    
    let suggestions: string[] = [];
    
    switch (field) {
      case 'status':
        suggestions = ['todo', 'in-progress', 'in-review', 'done', 'backlog'];
        break;
      case 'type':
        suggestions = ['epic', 'story', 'task', 'bug', 'subtask'];
        break;
      case 'priority':
        suggestions = ['highest', 'high', 'medium', 'low', 'lowest'];
        break;
      default:
        suggestions = [];
    }
    
    if (q) {
      suggestions = suggestions.filter(s => s.toLowerCase().includes((q as string).toLowerCase()));
    }
    
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/search/validate-jql
// Validate JQL syntax
router.post('/validate-jql', async (req, res) => {
  try {
    const { jql } = req.body;
    
    // Try to parse JQL
    try {
      const where = parseJQL(jql);
      res.json({ valid: true, where });
    } catch (error: any) {
      res.json({ valid: false, error: error.message });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/search/fields
// Get searchable fields
router.get('/fields', async (req, res) => {
  try {
    const fields = [
      { name: 'status', type: 'select', values: ['todo', 'in-progress', 'in-review', 'done', 'backlog'] },
      { name: 'type', type: 'select', values: ['epic', 'story', 'task', 'bug', 'subtask'] },
      { name: 'priority', type: 'select', values: ['highest', 'high', 'medium', 'low', 'lowest'] },
      { name: 'assignee', type: 'user' },
      { name: 'reporter', type: 'user' },
      { name: 'project', type: 'project' },
      { name: 'sprint', type: 'sprint' },
      { name: 'epic', type: 'epic' },
      { name: 'text', type: 'text' },
      { name: 'summary', type: 'text' },
      { name: 'description', type: 'text' },
      { name: 'labels', type: 'array' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
      { name: 'storyPoints', type: 'number' },
    ];
    
    res.json({ fields });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// New JQL search endpoint
router.post('/jql', async (req, res) => {
  try {
    const { jql, userId } = req.body;
    const issues = await searchEngineService.executeJQL(jql, userId);
    res.json({ issues, total: issues.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate JQL syntax
router.post('/validate', async (req, res) => {
  try {
    const { jql } = req.body;
    const validation = jqlParserService.validateJQL(jql);
    res.json(validation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const jql = (req.query.jql as string) || '';
    const cursor = parseInt(req.query.cursor as string) || jql.length;
    const suggestions = jqlParserService.getAutocompleteSuggestions(jql, cursor);
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Full-text search
router.post('/full-text', async (req, res) => {
  try {
    const { searchText, projectId } = req.body;
    const issues = await searchEngineService.fullTextSearch(searchText, projectId);
    res.json({ issues, total: issues.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
