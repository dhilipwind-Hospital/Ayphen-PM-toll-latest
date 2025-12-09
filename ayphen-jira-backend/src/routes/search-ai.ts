import { Router } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

// AI-powered search
router.post('/ai', async (req, res) => {
  try {
    const { query, projectId, context = 'issues' } = req.body;
    
    // Simple keyword search (can be enhanced with AI later)
    let searchQuery = `
      SELECT i.*, u.name as assigneeName 
      FROM issues i 
      LEFT JOIN users u ON i.assigneeId = u.id 
      WHERE (i.summary LIKE ? OR i.description LIKE ? OR i.key LIKE ?)
    `;
    const params = [`%${query}%`, `%${query}%`, `%${query}%`];
    
    if (projectId) {
      searchQuery += ' AND i.projectId = ?';
      params.push(projectId);
    }
    
    searchQuery += ' ORDER BY i.updatedAt DESC LIMIT 10';
    
    const results = await AppDataSource.query(searchQuery, params);
    
    const formattedResults = results.map((issue: any) => ({
      id: issue.id,
      type: 'issue',
      title: `${issue.key} - ${issue.summary}`,
      subtitle: issue.description || '',
      key: issue.key,
      priority: issue.priority,
      status: issue.status,
      assignee: issue.assigneeName
    }));
    
    res.json({ results: formattedResults });
  } catch (error) {
    console.error('AI search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// AI search suggestions
router.post('/suggestions', async (req, res) => {
  try {
    const { query, projectId } = req.body;
    
    // Generate suggestions based on common patterns
    const suggestions = [
      `status:open ${query}`,
      `priority:high ${query}`,
      `assignee:me ${query}`,
      `created:today ${query}`,
      `type:bug ${query}`
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()));
    
    res.json({ suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Duplicate detection
router.post('/duplicates', async (req, res) => {
  try {
    const { summary, description, projectId } = req.body;
    
    // Simple similarity search
    const searchQuery = `
      SELECT *, 
        (CASE 
          WHEN summary LIKE ? THEN 3
          WHEN description LIKE ? THEN 2
          WHEN summary LIKE ? OR description LIKE ? THEN 1
          ELSE 0
        END) as similarity_score
      FROM issues 
      WHERE projectId = ? AND similarity_score > 0
      ORDER BY similarity_score DESC, updatedAt DESC
      LIMIT 5
    `;
    
    const params = [
      `%${summary}%`,
      `%${description}%`,
      `%${summary.split(' ')[0]}%`,
      `%${description.split(' ')[0]}%`,
      projectId
    ];
    
    const duplicates = await AppDataSource.query(searchQuery, params);
    
    res.json({ 
      duplicates: duplicates.map((d: any) => ({
        id: d.id,
        key: d.key,
        summary: d.summary,
        similarity: d.similarity_score > 2 ? 'high' : 'medium'
      }))
    });
  } catch (error) {
    console.error('Duplicate detection error:', error);
    res.status(500).json({ error: 'Duplicate detection failed' });
  }
});

export default router;