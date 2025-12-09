import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { SprintRetrospective } from '../entities/SprintRetrospective';
import { Project } from '../entities/Project';

interface ActionItemInput {
  task: string;
  assigneeId?: string;
  priority: string;
}

interface ActionItemProgress {
  totalItems: number;
  completedItems: number;
  completionRate: number;
  overdueItems: number;
  items: Array<{
    id: string;
    key: string;
    summary: string;
    status: string;
    assignee?: string;
    dueDate?: Date;
  }>;
}

export class ActionItemTrackerService {
  /**
   * Create Jira tasks from retrospective action items
   */
  async createTasksFromActionItems(
    retrospectiveId: string,
    actionItems: ActionItemInput[]
  ): Promise<Issue[]> {
    const issueRepo = AppDataSource.getRepository(Issue);
    const retroRepo = AppDataSource.getRepository(SprintRetrospective);
    const projectRepo = AppDataSource.getRepository(Project);
    
    try {
      const retro = await retroRepo.findOne({
        where: { id: retrospectiveId },
        relations: ['sprint']
      });
      
      if (!retro) {
        throw new Error('Retrospective not found');
      }
      
      const project = await projectRepo.findOne({
        where: { id: retro.sprint.projectId }
      });
      
      const createdTasks: Issue[] = [];
      
      for (const item of actionItems) {
        const key = await this.generateIssueKey(retro.sprint.projectId);
        
        const task = issueRepo.create({
          key,
          summary: item.task,
          description: `Action item from Sprint ${retro.sprint.name} retrospective\n\nThis task was automatically created to track a retrospective action item.`,
          type: 'task',
          status: 'todo',
          priority: item.priority || 'medium',
          projectId: retro.sprint.projectId,
          assigneeId: item.assigneeId || null,
          reporterId: retro.createdById,
          labels: ['retrospective-action', `sprint-${retro.sprint.name}`],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        const saved = await issueRepo.save(task);
        createdTasks.push(saved);
        
        console.log(`✅ Created action item task: ${saved.key} - ${saved.summary}`);
      }
      
      return createdTasks;
    } catch (error: any) {
      console.error('❌ Failed to create action item tasks:', error);
      throw error;
    }
  }
  
  /**
   * Track progress of action items from a retrospective
   */
  async trackActionItemProgress(retrospectiveId: string): Promise<ActionItemProgress> {
    const issueRepo = AppDataSource.getRepository(Issue);
    const retroRepo = AppDataSource.getRepository(SprintRetrospective);
    
    try {
      const retro = await retroRepo.findOne({
        where: { id: retrospectiveId },
        relations: ['sprint']
      });
      
      if (!retro) {
        throw new Error('Retrospective not found');
      }
      
      // Find all tasks with retrospective-action label for this sprint
      const tasks = await issueRepo
        .createQueryBuilder('issue')
        .where('issue.projectId = :projectId', { projectId: retro.sprint.projectId })
        .andWhere('issue.type = :type', { type: 'task' })
        .andWhere('issue.labels LIKE :label', { label: `%sprint-${retro.sprint.name}%` })
        .getMany();
      
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'done' || t.status === 'closed').length;
      const overdue = tasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < new Date() && 
        t.status !== 'done' && 
        t.status !== 'closed'
      ).length;
      
      return {
        totalItems: total,
        completedItems: completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        overdueItems: overdue,
        items: tasks.map(t => ({
          id: t.id,
          key: t.key,
          summary: t.summary,
          status: t.status,
          assignee: t.assigneeId,
          dueDate: t.dueDate
        }))
      };
    } catch (error: any) {
      console.error('❌ Failed to track action item progress:', error);
      throw error;
    }
  }
  
  /**
   * Generate unique issue key for a project
   */
  private async generateIssueKey(projectId: string): Promise<string> {
    const issueRepo = AppDataSource.getRepository(Issue);
    const projectRepo = AppDataSource.getRepository(Project);
    
    try {
      const project = await projectRepo.findOne({ where: { id: projectId } });
      const prefix = project?.key || 'TASK';
      
      const allIssues = await issueRepo
        .createQueryBuilder('issue')
        .where('issue.projectId = :projectId', { projectId })
        .andWhere('issue.key LIKE :prefix', { prefix: `${prefix}-%` })
        .getMany();
      
      let maxNumber = 0;
      allIssues.forEach(issue => {
        const match = issue.key.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) maxNumber = num;
        }
      });
      
      return `${prefix}-${maxNumber + 1}`;
    } catch (error) {
      console.error('Error generating issue key:', error);
      return `TASK-${Date.now()}`;
    }
  }
}

// Export singleton instance
export const actionItemTrackerService = new ActionItemTrackerService();
