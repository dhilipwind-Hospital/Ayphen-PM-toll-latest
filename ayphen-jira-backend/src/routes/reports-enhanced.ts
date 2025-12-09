import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { Sprint } from '../entities/Sprint';

const router = Router();
const issueRepo = AppDataSource.getRepository(Issue);
const sprintRepo = AppDataSource.getRepository(Sprint);

// GET custom report builder
router.get('/custom', async (req, res) => {
  try {
    const { reportType, projectId, startDate, endDate } = req.query;
    
    const where: any = {};
    if (projectId) where.projectId = projectId;
    
    const issues = await issueRepo.find({ where });
    
    res.json({
      reportType,
      data: issues,
      generatedAt: new Date(),
      filters: { projectId, startDate, endDate },
    });
  } catch (error) {
    console.error('Failed to build custom report:', error);
    res.status(500).json({ error: 'Failed to build custom report' });
  }
});

// POST generate report
router.post('/generate', async (req, res) => {
  try {
    const { reportConfig } = req.body;
    
    const report = {
      id: `report-${Date.now()}`,
      config: reportConfig,
      generatedAt: new Date(),
      status: 'completed',
      data: { /* report data */ },
    };
    
    res.json(report);
  } catch (error) {
    console.error('Failed to generate report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET export report
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { reportId } = req.query;
    
    const exportData = {
      format,
      reportId,
      exportedAt: new Date(),
      downloadUrl: `/downloads/report-${reportId}.${format}`,
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Failed to export report:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// POST schedule report
router.post('/schedule', async (req, res) => {
  try {
    const { reportConfig, frequency, recipients } = req.body;
    
    const schedule = {
      id: `schedule-${Date.now()}`,
      reportConfig,
      frequency, // daily, weekly, monthly
      recipients,
      nextRun: new Date(),
      active: true,
    };
    
    res.json(schedule);
  } catch (error) {
    console.error('Failed to schedule report:', error);
    res.status(500).json({ error: 'Failed to schedule report' });
  }
});

// GET burndown chart
router.get('/burndown-chart', async (req, res) => {
  try {
    const { sprintId } = req.query;
    
    const sprint = await sprintRepo.findOne({ where: { id: sprintId as string } });
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    const issues = await issueRepo.find({ where: { sprintId: sprintId as string } });
    
    const totalStoryPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const completedPoints = issues
      .filter(i => i.status === 'done')
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    
    const chartData = {
      totalPoints: totalStoryPoints,
      completedPoints,
      remainingPoints: totalStoryPoints - completedPoints,
      idealBurndown: [],
      actualBurndown: [],
    };
    
    res.json(chartData);
  } catch (error) {
    console.error('Failed to get burndown chart:', error);
    res.status(500).json({ error: 'Failed to get burndown chart' });
  }
});

// GET velocity chart
router.get('/velocity-chart', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    const sprints = await sprintRepo.find({
      where: { projectId: projectId as string },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    
    const velocityData = [];
    for (const sprint of sprints) {
      const issues = await issueRepo.find({ where: { sprintId: sprint.id } });
      const committed = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
      const completed = issues
        .filter(i => i.status === 'done')
        .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
      
      velocityData.push({
        sprintName: sprint.name,
        committed,
        completed,
      });
    }
    
    res.json(velocityData);
  } catch (error) {
    console.error('Failed to get velocity chart:', error);
    res.status(500).json({ error: 'Failed to get velocity chart' });
  }
});

// GET cumulative flow diagram
router.get('/cumulative-flow', async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const issues = await issueRepo.find({ where: { projectId: projectId as string } });
    
    const flowData = {
      todo: issues.filter(i => i.status === 'todo').length,
      inProgress: issues.filter(i => i.status === 'in-progress').length,
      inReview: issues.filter(i => i.status === 'in-review').length,
      done: issues.filter(i => i.status === 'done').length,
    };
    
    res.json(flowData);
  } catch (error) {
    console.error('Failed to get cumulative flow:', error);
    res.status(500).json({ error: 'Failed to get cumulative flow' });
  }
});

// GET control chart
router.get('/control-chart', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    const issues = await issueRepo.find({
      where: { projectId: projectId as string, status: 'done' },
    });
    
    const cycleTime = issues.map(issue => {
      const created = new Date(issue.createdAt);
      const resolved = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date();
      const days = Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return { issueKey: issue.key, cycleTime: days };
    });
    
    res.json(cycleTime);
  } catch (error) {
    console.error('Failed to get control chart:', error);
    res.status(500).json({ error: 'Failed to get control chart' });
  }
});

// GET time tracking report
router.get('/time-tracking', async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const issues = await issueRepo.find({ where: { projectId: projectId as string } });
    
    const timeData = issues.map(issue => ({
      issueKey: issue.key,
      summary: issue.summary,
      originalEstimate: issue.originalEstimate || '0h',
      timeSpent: issue.timeSpent || '0h',
      remainingEstimate: issue.remainingEstimate || '0h',
    }));
    
    res.json(timeData);
  } catch (error) {
    console.error('Failed to get time tracking report:', error);
    res.status(500).json({ error: 'Failed to get time tracking report' });
  }
});

// GET user workload report
router.get('/user-workload', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    const issues = await issueRepo.find({
      where: { projectId: projectId as string },
      relations: ['assignee'],
    });
    
    const workload = issues.reduce((acc: any, issue) => {
      const assigneeId = issue.assigneeId || 'unassigned';
      if (!acc[assigneeId]) {
        acc[assigneeId] = {
          assigneeId,
          assigneeName: issue.assignee?.name || 'Unassigned',
          totalIssues: 0,
          inProgress: 0,
          completed: 0,
          storyPoints: 0,
        };
      }
      acc[assigneeId].totalIssues++;
      if (issue.status === 'in-progress') acc[assigneeId].inProgress++;
      if (issue.status === 'done') acc[assigneeId].completed++;
      acc[assigneeId].storyPoints += issue.storyPoints || 0;
      return acc;
    }, {});
    
    res.json(Object.values(workload));
  } catch (error) {
    console.error('Failed to get user workload:', error);
    res.status(500).json({ error: 'Failed to get user workload' });
  }
});

export default router;
