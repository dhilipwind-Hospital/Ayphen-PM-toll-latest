import { AppDataSource } from '../config/database';
import { Project } from '../entities/Project';
import { Issue } from '../entities/Issue';

export interface IssueContext {
  project?: {
    id: string;
    name: string;
    key: string;
    description: string;
    type: string;
  };
  epic?: {
    id: string;
    key: string;
    summary: string;
    description: string;
  };
  parentIssue?: {
    id: string;
    key: string;
    summary: string;
    description: string;
    type: string;
  };
  relatedIssues: Array<{
    id: string;
    key: string;
    summary: string;
    description: string;
    type: string;
  }>;
  hierarchy: {
    project?: string;
    epic?: string;
    parent?: string;
  };
}

export class ContextHierarchyService {
  private projectRepo = AppDataSource.getRepository(Project);
  private issueRepo = AppDataSource.getRepository(Issue);

  /**
   * Get full context for an issue including project, epic, parent, and related issues
   */
  async getIssueContext(params: {
    projectId?: string;
    epicId?: string;
    parentIssueId?: string;
    issueType: string;
  }): Promise<IssueContext> {
    const context: IssueContext = {
      relatedIssues: [],
      hierarchy: {},
    };

    try {
      // Get project context
      if (params.projectId) {
        const project = await this.projectRepo.findOne({
          where: { id: params.projectId },
        });

        if (project) {
          context.project = {
            id: project.id,
            name: project.name,
            key: project.key,
            description: project.description || '',
            type: project.type,
          };
          context.hierarchy.project = project.name;
        }
      }

      // Get epic context
      if (params.epicId) {
        const epic = await this.issueRepo.findOne({
          where: { id: params.epicId },
        });

        if (epic) {
          context.epic = {
            id: epic.id,
            key: epic.key,
            summary: epic.summary,
            description: epic.description || '',
          };
          context.hierarchy.epic = epic.summary;
        }
      }

      // Get parent issue context
      if (params.parentIssueId) {
        const parent = await this.issueRepo.findOne({
          where: { id: params.parentIssueId },
        });

        if (parent) {
          context.parentIssue = {
            id: parent.id,
            key: parent.key,
            summary: parent.summary,
            description: parent.description || '',
            type: parent.type,
          };
          context.hierarchy.parent = parent.summary;
        }
      }

      // Get related issues (same project, same type or related epic)
      if (params.projectId) {
        const relatedQuery = this.issueRepo
          .createQueryBuilder('issue')
          .where('issue.projectId = :projectId', { projectId: params.projectId })
          .andWhere('issue.type = :type', { type: params.issueType })
          .orderBy('issue.createdAt', 'DESC')
          .limit(5);

        if (params.epicId) {
          relatedQuery.andWhere('issue.epicId = :epicId', { epicId: params.epicId });
        }

        const relatedIssues = await relatedQuery.getMany();

        context.relatedIssues = relatedIssues.map(issue => ({
          id: issue.id,
          key: issue.key,
          summary: issue.summary,
          description: issue.description || '',
          type: issue.type,
        }));
      }

      return context;
    } catch (error) {
      console.error('Error getting issue context:', error);
      return context;
    }
  }

  /**
   * Get project goals and requirements
   */
  async getProjectGoals(projectId: string): Promise<string[]> {
    try {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
      });

      if (project && project.description) {
        // Extract goals from description (simple implementation)
        // In production, you might have a dedicated goals field
        return [project.description];
      }

      return [];
    } catch (error) {
      console.error('Error getting project goals:', error);
      return [];
    }
  }

  /**
   * Build a comprehensive context summary for AI
   */
  buildContextSummary(context: IssueContext): string {
    const parts: string[] = [];

    if (context.project) {
      parts.push(`Project: ${context.project.name} (${context.project.key})`);
      if (context.project.description) {
        parts.push(`Project Description: ${context.project.description}`);
      }
    }

    if (context.epic) {
      parts.push(`Epic: ${context.epic.key} - ${context.epic.summary}`);
      if (context.epic.description) {
        parts.push(`Epic Description: ${context.epic.description}`);
      }
    }

    if (context.parentIssue) {
      parts.push(`Parent ${context.parentIssue.type}: ${context.parentIssue.key} - ${context.parentIssue.summary}`);
      if (context.parentIssue.description) {
        parts.push(`Parent Description: ${context.parentIssue.description}`);
      }
    }

    if (context.relatedIssues.length > 0) {
      parts.push(`Related Issues (${context.relatedIssues.length}):`);
      context.relatedIssues.slice(0, 3).forEach(issue => {
        parts.push(`- ${issue.key}: ${issue.summary}`);
      });
    }

    return parts.join('\n');
  }
}

export const contextHierarchyService = new ContextHierarchyService();
