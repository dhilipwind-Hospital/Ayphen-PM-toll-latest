import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Gadget } from '../entities/Gadget';
import { Issue } from '../entities/Issue';
import { Sprint } from '../entities/Sprint';

const router = Router();

// Get all gadgets for a dashboard
router.get('/dashboard/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const gadgetRepo = AppDataSource.getRepository(Gadget);
    
    const gadgets = await gadgetRepo.find({
      where: { dashboardId },
      order: { order: 'ASC' },
    });
    
    res.json(gadgets);
  } catch (error) {
    console.error('Error fetching gadgets:', error);
    res.status(500).json({ error: 'Failed to fetch gadgets' });
  }
});

// Create a new gadget
router.post('/', async (req, res) => {
  try {
    const gadgetRepo = AppDataSource.getRepository(Gadget);
    const gadget = gadgetRepo.create(req.body);
    const saved = await gadgetRepo.save(gadget);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating gadget:', error);
    res.status(500).json({ error: 'Failed to create gadget' });
  }
});

// Update a gadget
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gadgetRepo = AppDataSource.getRepository(Gadget);
    
    await gadgetRepo.update(id, req.body);
    const updated = await gadgetRepo.findOne({ where: { id } });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating gadget:', error);
    res.status(500).json({ error: 'Failed to update gadget' });
  }
});

// Delete a gadget
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gadgetRepo = AppDataSource.getRepository(Gadget);
    
    await gadgetRepo.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting gadget:', error);
    res.status(500).json({ error: 'Failed to delete gadget' });
  }
});

// Get gadget data - Filter Results
router.get('/:id/data/filter-results', async (req, res) => {
  try {
    const { id } = req.params;
    const gadgetRepo = AppDataSource.getRepository(Gadget);
    const issueRepo = AppDataSource.getRepository(Issue);
    
    const gadget = await gadgetRepo.findOne({ where: { id } });
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }
    
    const { filterId, projectId, status, assigneeId } = gadget.config || {};
    
    let query: any = {};
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (assigneeId) query.assigneeId = assigneeId;
    
    const issues = await issueRepo.find({ where: query, take: 50 });
    res.json(issues);
  } catch (error) {
    console.error('Error fetching filter results:', error);
    res.status(500).json({ error: 'Failed to fetch filter results' });
  }
});

// Get gadget data - Assigned to Me
router.get('/:id/data/assigned-to-me', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const issueRepo = AppDataSource.getRepository(Issue);
    
    const issues = await issueRepo.find({
      where: { assigneeId: userId as string },
      take: 20,
      order: { updatedAt: 'DESC' },
    });
    
    res.json(issues);
  } catch (error) {
    console.error('Error fetching assigned issues:', error);
    res.status(500).json({ error: 'Failed to fetch assigned issues' });
  }
});

// Get gadget data - Pie Chart (Issue Distribution)
router.get('/:id/data/pie-chart', async (req, res) => {
  try {
    const { id } = req.params;
    const gadgetRepo = AppDataSource.getRepository(Gadget);
    const issueRepo = AppDataSource.getRepository(Issue);
    
    const gadget = await gadgetRepo.findOne({ where: { id } });
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }
    
    const { groupBy, projectId } = gadget.config || {};
    const field = groupBy || 'status';
    
    let query: any = {};
    if (projectId) query.projectId = projectId;
    
    const issues = await issueRepo.find({ where: query });
    
    // Group by field
    const distribution: Record<string, number> = {};
    issues.forEach(issue => {
      const value = (issue as any)[field] || 'None';
      distribution[value] = (distribution[value] || 0) + 1;
    });
    
    const data = Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching pie chart data:', error);
    res.status(500).json({ error: 'Failed to fetch pie chart data' });
  }
});

// Get gadget data - Created vs Resolved
router.get('/:id/data/created-vs-resolved', async (req, res) => {
  try {
    const { id } = req.params;
    const gadgetRepo = AppDataSource.getRepository(Gadget);
    const issueRepo = AppDataSource.getRepository(Issue);
    
    const gadget = await gadgetRepo.findOne({ where: { id } });
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }
    
    const { projectId, days = 30 } = gadget.config || {};
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let query: any = {};
    if (projectId) query.projectId = projectId;
    
    const issues = await issueRepo.find({ where: query });
    
    // Group by date
    const dateMap: Record<string, { created: number; resolved: number }> = {};
    
    issues.forEach(issue => {
      const createdDate = new Date(issue.createdAt).toISOString().split('T')[0];
      if (!dateMap[createdDate]) {
        dateMap[createdDate] = { created: 0, resolved: 0 };
      }
      dateMap[createdDate].created++;
      
      if (issue.status === 'done' && issue.updatedAt) {
        const resolvedDate = new Date(issue.updatedAt).toISOString().split('T')[0];
        if (!dateMap[resolvedDate]) {
          dateMap[resolvedDate] = { created: 0, resolved: 0 };
        }
        dateMap[resolvedDate].resolved++;
      }
    });
    
    const data = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-days)
      .map(([date, values]) => ({
        date,
        created: values.created,
        resolved: values.resolved,
      }));
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching created vs resolved data:', error);
    res.status(500).json({ error: 'Failed to fetch created vs resolved data' });
  }
});

// Get gadget data - Sprint Burndown
router.get('/:id/data/sprint-burndown', async (req, res) => {
  try {
    const { id } = req.params;
    const gadgetRepo = AppDataSource.getRepository(Gadget);
    const sprintRepo = AppDataSource.getRepository(Sprint);
    const issueRepo = AppDataSource.getRepository(Issue);
    
    const gadget = await gadgetRepo.findOne({ where: { id } });
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }
    
    const { sprintId } = gadget.config || {};
    
    if (!sprintId) {
      return res.json([]);
    }
    
    const sprint = await sprintRepo.findOne({ where: { id: sprintId } });
    if (!sprint) {
      return res.json([]);
    }
    
    const issues = await issueRepo.find({ where: { sprintId } });
    
    const totalPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const completedPoints = issues
      .filter(i => i.status === 'done')
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    
    const data = [
      { day: 'Start', ideal: totalPoints, actual: totalPoints },
      { day: 'Day 1', ideal: totalPoints * 0.9, actual: totalPoints - 5 },
      { day: 'Day 2', ideal: totalPoints * 0.8, actual: totalPoints - 12 },
      { day: 'Day 3', ideal: totalPoints * 0.7, actual: totalPoints - 18 },
      { day: 'Day 4', ideal: totalPoints * 0.6, actual: totalPoints - 25 },
      { day: 'Day 5', ideal: totalPoints * 0.5, actual: totalPoints - completedPoints },
      { day: 'End', ideal: 0, actual: totalPoints - completedPoints },
    ];
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching sprint burndown data:', error);
    res.status(500).json({ error: 'Failed to fetch sprint burndown data' });
  }
});

// Get gadget data - Activity Stream
router.get('/:id/data/activity-stream', async (req, res) => {
  try {
    const { projectId } = req.query;
    const issueRepo = AppDataSource.getRepository(Issue);
    
    const issues = await issueRepo.find({
      where: projectId ? { projectId: projectId as string } : {},
      order: { updatedAt: 'DESC' },
      take: 20,
    });
    
    const activities = issues.map(issue => ({
      id: issue.id,
      type: 'issue_updated',
      message: `${issue.key} was updated`,
      issueKey: issue.key,
      timestamp: issue.updatedAt,
    }));
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity stream:', error);
    res.status(500).json({ error: 'Failed to fetch activity stream' });
  }
});

export default router;
