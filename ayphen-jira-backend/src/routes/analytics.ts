import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { Sprint } from '../entities/Sprint';
import { User } from '../entities/User';
import { workflowService } from '../services/workflow.service';

const router = Router();

// Get project analytics
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const issueRepo = AppDataSource.getRepository(Issue);

    const issues = await issueRepo.find({ where: { projectId } });

    const doneStatuses = await workflowService.getDoneStatuses(projectId);
    const workflows = await workflowService.getAll();
    const projectWorkflow = workflows.find(w => w.projectIds.includes(projectId)) || await workflowService.getById('workflow-1');
    const todoStatuses = projectWorkflow.statuses.filter(s => s.category === 'TODO').map(s => s.id.toLowerCase());
    const inProgressStatuses = projectWorkflow.statuses.filter(s => s.category === 'IN_PROGRESS').map(s => s.id.toLowerCase());

    const analytics = {
      totalIssues: issues.length,
      byStatus: {
        todo: issues.filter(i => todoStatuses.includes(i.status.toLowerCase())).length,
        inProgress: issues.filter(i => inProgressStatuses.includes(i.status.toLowerCase())).length,
        done: issues.filter(i => doneStatuses.includes(i.status.toLowerCase())).length,
      },
      byType: {
        epic: issues.filter(i => i.type === 'epic').length,
        story: issues.filter(i => i.type === 'story').length,
        task: issues.filter(i => i.type === 'task').length,
        bug: issues.filter(i => i.type === 'bug').length,
      },
      byPriority: {
        highest: issues.filter(i => i.priority === 'highest').length,
        high: issues.filter(i => i.priority === 'high').length,
        medium: issues.filter(i => i.priority === 'medium').length,
        low: issues.filter(i => i.priority === 'low').length,
      },
      completionRate: issues.length > 0 ? (issues.filter(i => doneStatuses.includes(i.status.toLowerCase())).length / issues.length * 100).toFixed(2) : 0,
      avgTimeToComplete: calculateAvgTime(issues.filter(i => doneStatuses.includes(i.status.toLowerCase()))),
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get user performance
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const issueRepo = AppDataSource.getRepository(Issue);

    const assignedIssues = await issueRepo.find({ where: { assigneeId: userId } });
    const reportedIssues = await issueRepo.find({ where: { reporterId: userId } });

    const performance = {
      assigned: assignedIssues.length,
      completedByStatus: await (async () => {
        const results: any = { completed: 0, inProgress: 0 };
        for (const i of assignedIssues) {
          const isDone = await workflowService.isDone(i.projectId, i.status);
          if (isDone) results.completed++;
          else results.inProgress++; // Simplified
        }
        return results;
      })(),
      reported: reportedIssues.length,
    };

    // Legacy mapping for existing frontend expectations
    const performanceLegacy = {
      assigned: performance.assigned,
      completed: performance.completedByStatus.completed,
      inProgress: performance.completedByStatus.inProgress,
      reported: performance.reported,
      completionRate: performance.assigned > 0 ? (performance.completedByStatus.completed / performance.assigned * 100).toFixed(2) : 0,
    };

    res.json(performanceLegacy);
  } catch (error) {
    console.error('Error fetching user performance:', error);
    res.status(500).json({ error: 'Failed to fetch user performance' });
  }
});

// Get sprint velocity
router.get('/velocity/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const sprintRepo = AppDataSource.getRepository(Sprint);
    const issueRepo = AppDataSource.getRepository(Issue);

    const sprints = await sprintRepo.find({
      where: { projectId, status: 'completed' },
      order: { startDate: 'DESC' },
      take: 10
    });

    const velocity = await Promise.all(sprints.map(async (sprint) => {
      const doneStatusesVelocity = await workflowService.getDoneStatuses(projectId);
      const allSprintIssues = await issueRepo.find({ where: { sprintId: sprint.id } });
      const issues = allSprintIssues.filter(i => doneStatusesVelocity.includes(i.status.toLowerCase()));
      const points = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
      return { sprintName: sprint.name, points, issueCount: issues.length };
    }));

    res.json(velocity);
  } catch (error) {
    console.error('Error fetching velocity:', error);
    res.status(500).json({ error: 'Failed to fetch velocity' });
  }
});

function calculateAvgTime(issues: Issue[]): string {
  if (issues.length === 0) return '0 days';
  const totalDays = issues.reduce((sum, issue) => {
    if (issue.createdAt && issue.resolvedAt) {
      const diff = new Date(issue.resolvedAt).getTime() - new Date(issue.createdAt).getTime();
      return sum + (diff / (1000 * 60 * 60 * 24));
    }
    return sum;
  }, 0);
  return `${(totalDays / issues.length).toFixed(1)} days`;
}

export default router;
