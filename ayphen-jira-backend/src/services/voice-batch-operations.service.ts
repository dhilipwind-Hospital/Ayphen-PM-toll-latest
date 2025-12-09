/**
 * Voice Batch Operations Service
 * Phase 5-6: Advanced Features
 * 
 * Handles bulk operations via voice commands
 * Example: "Set all selected to high priority"
 */

import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { User } from '../entities/User';

export interface BatchOperation {
  type: 'update_priority' | 'update_status' | 'assign' | 'add_label' | 
        'set_due_date' | 'delete' | 'move_to_sprint' | 'add_to_epic';
  value: any;
  filter?: {
    issueIds?: string[];
    status?: string;
    priority?: string;
    assigneeId?: string;
    labels?: string[];
    projectId?: string;
  };
}

export interface BatchResult {
  success: boolean;
  totalIssues: number;
  successful: number;
  failed: number;
  errors: Array<{ issueId: string; error: string }>;
  updates: any[];
  executionTime: number;
}

export class VoiceBatchOperationsService {
  private issueRepo = AppDataSource.getRepository(Issue);
  private userRepo = AppDataSource.getRepository(User);

  /**
   * Execute batch operation
   */
  async executeBatch(operation: BatchOperation): Promise<BatchResult> {
    const startTime = Date.now();
    const result: BatchResult = {
      success: false,
      totalIssues: 0,
      successful: 0,
      failed: 0,
      errors: [],
      updates: [],
      executionTime: 0
    };

    try {
      // Get issues to update
      const issues = await this.getIssues(operation.filter);
      result.totalIssues = issues.length;

      if (issues.length === 0) {
        result.success = true;
        result.executionTime = Date.now() - startTime;
        return result;
      }

      // Execute operation on each issue
      const updates = await Promise.allSettled(
        issues.map(issue => this.executeOperation(issue, operation))
      );

      // Process results
      updates.forEach((update, index) => {
        if (update.status === 'fulfilled') {
          result.successful++;
          result.updates.push(update.value);
        } else {
          result.failed++;
          result.errors.push({
            issueId: issues[index].id,
            error: update.reason.message
          });
        }
      });

      result.success = result.failed === 0;
      result.executionTime = Date.now() - startTime;

      return result;
    } catch (error: any) {
      result.executionTime = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Get issues based on filter
   */
  private async getIssues(filter?: BatchOperation['filter']): Promise<Issue[]> {
    if (!filter) {
      return [];
    }

    const query = this.issueRepo.createQueryBuilder('issue');

    // Filter by issue IDs
    if (filter.issueIds && filter.issueIds.length > 0) {
      query.andWhere('issue.id IN (:...ids)', { ids: filter.issueIds });
    }

    // Filter by project
    if (filter.projectId) {
      query.andWhere('issue.projectId = :projectId', { projectId: filter.projectId });
    }

    // Filter by status
    if (filter.status) {
      query.andWhere('issue.status = :status', { status: filter.status });
    }

    // Filter by priority
    if (filter.priority) {
      query.andWhere('issue.priority = :priority', { priority: filter.priority });
    }

    // Filter by assignee
    if (filter.assigneeId) {
      query.andWhere('issue.assigneeId = :assigneeId', { assigneeId: filter.assigneeId });
    }

    // Filter by labels
    if (filter.labels && filter.labels.length > 0) {
      query.andWhere('issue.labels && ARRAY[:...labels]', { labels: filter.labels });
    }

    return await query.getMany();
  }

  /**
   * Execute operation on single issue
   */
  private async executeOperation(issue: Issue, operation: BatchOperation): Promise<any> {
    switch (operation.type) {
      case 'update_priority':
        return await this.updatePriority(issue, operation.value);
      
      case 'update_status':
        return await this.updateStatus(issue, operation.value);
      
      case 'assign':
        return await this.assign(issue, operation.value);
      
      case 'add_label':
        return await this.addLabel(issue, operation.value);
      
      case 'set_due_date':
        return await this.setDueDate(issue, operation.value);
      
      case 'delete':
        return await this.deleteIssue(issue);
      
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Update priority
   */
  private async updatePriority(issue: Issue, priority: string): Promise<any> {
    issue.priority = priority;
    await this.issueRepo.save(issue);
    return { issueId: issue.id, field: 'priority', value: priority };
  }

  /**
   * Update status
   */
  private async updateStatus(issue: Issue, status: string): Promise<any> {
    issue.status = status;
    await this.issueRepo.save(issue);
    return { issueId: issue.id, field: 'status', value: status };
  }

  /**
   * Assign issue
   */
  private async assign(issue: Issue, assigneeId: string): Promise<any> {
    issue.assigneeId = assigneeId;
    await this.issueRepo.save(issue);
    return { issueId: issue.id, field: 'assigneeId', value: assigneeId };
  }

  /**
   * Add label
   */
  private async addLabel(issue: Issue, label: string): Promise<any> {
    const currentLabels = issue.labels || [];
    if (!currentLabels.includes(label)) {
      issue.labels = [...currentLabels, label];
      await this.issueRepo.save(issue);
    }
    return { issueId: issue.id, field: 'labels', value: issue.labels };
  }

  /**
   * Set due date
   */
  private async setDueDate(issue: Issue, dueDate: Date): Promise<any> {
    issue.dueDate = dueDate;
    await this.issueRepo.save(issue);
    return { issueId: issue.id, field: 'dueDate', value: dueDate };
  }

  /**
   * Delete issue
   */
  private async deleteIssue(issue: Issue): Promise<any> {
    await this.issueRepo.remove(issue);
    return { issueId: issue.id, deleted: true };
  }

  /**
   * Parse voice command to batch operation
   */
  async parseVoiceCommand(command: string, context: any): Promise<BatchOperation | null> {
    const cmd = command.toLowerCase();

    // Detect batch keywords
    const isBatch = cmd.includes('all') || cmd.includes('selected') || 
                    cmd.includes('these') || cmd.includes('multiple');

    if (!isBatch) {
      return null;
    }

    const operation: BatchOperation = {
      type: 'update_priority',
      value: null,
      filter: {}
    };

    // Set filter based on context
    if (cmd.includes('selected') && context.selectedIssueIds) {
      operation.filter!.issueIds = context.selectedIssueIds;
    } else if (context.projectId) {
      operation.filter!.projectId = context.projectId;
    }

    // Detect operation type and value
    if (cmd.includes('priority')) {
      operation.type = 'update_priority';
      if (cmd.includes('high') || cmd.includes('urgent')) {
        operation.value = 'high';
      } else if (cmd.includes('medium')) {
        operation.value = 'medium';
      } else if (cmd.includes('low')) {
        operation.value = 'low';
      }
    } else if (cmd.includes('status')) {
      operation.type = 'update_status';
      if (cmd.includes('progress')) {
        operation.value = 'in-progress';
      } else if (cmd.includes('done')) {
        operation.value = 'done';
      } else if (cmd.includes('todo')) {
        operation.value = 'todo';
      }
    } else if (cmd.includes('assign')) {
      operation.type = 'assign';
      // Extract assignee name
      const match = cmd.match(/assign.*to\s+(\w+)/i);
      if (match) {
        const name = match[1];
        const users = await this.userRepo.find();
        const user = users.find(u => u.name.toLowerCase().includes(name.toLowerCase()));
        if (user) {
          operation.value = user.id;
        }
      }
    } else if (cmd.includes('label') || cmd.includes('tag')) {
      operation.type = 'add_label';
      const match = cmd.match(/(?:label|tag)\s+(\w+)/i);
      if (match) {
        operation.value = match[1];
      }
    } else if (cmd.includes('delete') || cmd.includes('remove')) {
      operation.type = 'delete';
    }

    return operation;
  }

  /**
   * Get batch operation preview
   */
  async previewBatch(operation: BatchOperation): Promise<{
    issueCount: number;
    issues: Array<{ id: string; key: string; summary: string }>;
    operation: string;
  }> {
    const issues = await this.getIssues(operation.filter);
    
    let operationDesc = '';
    switch (operation.type) {
      case 'update_priority':
        operationDesc = `Set priority to ${operation.value}`;
        break;
      case 'update_status':
        operationDesc = `Change status to ${operation.value}`;
        break;
      case 'assign':
        const user = await this.userRepo.findOne({ where: { id: operation.value } });
        operationDesc = `Assign to ${user?.name || 'user'}`;
        break;
      case 'add_label':
        operationDesc = `Add label '${operation.value}'`;
        break;
      case 'delete':
        operationDesc = 'Delete issues';
        break;
    }

    return {
      issueCount: issues.length,
      issues: issues.slice(0, 10).map(i => ({
        id: i.id,
        key: i.key,
        summary: i.summary
      })),
      operation: operationDesc
    };
  }

  /**
   * Undo batch operation
   */
  async undoBatch(batchId: string): Promise<boolean> {
    // This would require storing batch history
    // For now, return false
    return false;
  }
}

// Export singleton instance
export const voiceBatchOperations = new VoiceBatchOperationsService();
