import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { Sprint } from '../entities/Sprint';
import { ProjectMember } from '../entities/ProjectMember';
import { User } from '../entities/User';
import axios from 'axios';

interface SprintPopulationConfig {
  sprintId: string;
  teamCapacity: number; // total story points
  sprintDuration: number; // in days
  prioritizeBy?: 'priority' | 'business-value' | 'dependencies' | 'balanced';
  includeTypes?: Array<'epic' | 'story' | 'task' | 'bug' | 'subtask'>;
}

interface PopulationResult {
  selectedIssues: Array<{
    issueId: string;
    issueKey: string;
    summary: string;
    storyPoints: number;
    priority: string;
    assignedTo?: string;
    reason: string;
  }>;
  totalPoints: number;
  capacityUtilization: number; // percentage
  teamBalance: {
    [userId: string]: {
      userName: string;
      assignedPoints: number;
      assignedIssues: number;
    };
  };
  recommendations: string[];
  warnings: string[];
}

export class AISprintAutoPopulateService {
  private cerebrasApiKey: string;
  private cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';

  constructor() {
    this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
  }

  /**
   * Auto-populate sprint with optimal issues
   */
  async populateSprint(config: SprintPopulationConfig): Promise<PopulationResult> {
    try {
      console.log(`🏃 Auto-populating sprint ${config.sprintId}`);

      // Step 1: Get sprint and validate
      const sprint = await this.getSprint(config.sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      // Step 2: Get backlog issues
      const backlogIssues = await this.getBacklogIssues(sprint.projectId, config.includeTypes);

      // Step 3: Get team members and their capacity
      const teamMembers = await this.getTeamMembers(sprint.projectId);

      // Step 4: Calculate historical velocity
      const historicalVelocity = await this.getHistoricalVelocity(sprint.projectId);

      // Step 5: Analyze dependencies
      const dependencies = await this.analyzeDependencies(backlogIssues);

      // Step 6: Use AI to select optimal issues
      const selection = await this.selectOptimalIssues(
        backlogIssues,
        config.teamCapacity || historicalVelocity,
        config.prioritizeBy || 'balanced',
        dependencies
      );

      // Step 7: Balance workload across team
      const balanced = await this.balanceWorkload(selection, teamMembers);

      // Step 8: Assign issues to sprint
      await this.assignIssuesToSprint(balanced.selectedIssues, config.sprintId);

      console.log(`✅ Sprint populated with ${balanced.selectedIssues.length} issues`);
      return balanced;
    } catch (error: any) {
      console.error('❌ Sprint population error:', error);
      throw new Error(`Failed to populate sprint: ${error.message}`);
    }
  }

  /**
   * Get sprint by ID
   */
  private async getSprint(sprintId: string): Promise<Sprint | null> {
    const sprintRepo = AppDataSource.getRepository(Sprint);
    return await sprintRepo.findOne({ where: { id: sprintId } });
  }

  /**
   * Get backlog issues for project
   */
  private async getBacklogIssues(
    projectId: string,
    includeTypes?: string[]
  ): Promise<Issue[]> {
    const issueRepo = AppDataSource.getRepository(Issue);
    
    const query: any = {
      projectId,
      status: 'todo',
      sprintId: null // Only backlog items
    };

    if (includeTypes && includeTypes.length > 0) {
      query.type = includeTypes;
    }

    const issues = await issueRepo.find({
      where: query,
      order: { priority: 'ASC', createdAt: 'ASC' }
    });

    return issues;
  }

  /**
   * Get team members for project
   */
  private async getTeamMembers(projectId: string): Promise<User[]> {
    const memberRepo = AppDataSource.getRepository(ProjectMember);
    const members = await memberRepo.find({
      where: { projectId },
      relations: ['user']
    });

    return members.map(m => m.user);
  }

  /**
   * Calculate historical velocity
   */
  private async getHistoricalVelocity(projectId: string): Promise<number> {
    const sprintRepo = AppDataSource.getRepository(Sprint);
    const completedSprints = await sprintRepo.find({
      where: { projectId, status: 'completed' },
      order: { endDate: 'DESC' },
      take: 3 // Last 3 sprints
    });

    if (completedSprints.length === 0) return 40; // Default

    const issueRepo = AppDataSource.getRepository(Issue);
    let totalPoints = 0;
    let count = 0;

    for (const sprint of completedSprints) {
      const issues = await issueRepo.find({
        where: { sprintId: sprint.id, status: 'done' }
      });
      
      const sprintPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
      totalPoints += sprintPoints;
      count++;
    }

    return count > 0 ? Math.round(totalPoints / count) : 40;
  }

  /**
   * Analyze issue dependencies
   */
  private async analyzeDependencies(issues: Issue[]): Promise<Map<string, string[]>> {
    const dependencies = new Map<string, string[]>();
    
    // TODO: Implement proper dependency analysis from issue links
    // For now, return empty dependencies
    
    return dependencies;
  }

  /**
   * Select optimal issues using AI
   */
  private async selectOptimalIssues(
    backlogIssues: Issue[],
    capacity: number,
    prioritizeBy: string,
    dependencies: Map<string, string[]>
  ): Promise<Issue[]> {
    try {
      const issuesData = backlogIssues.map(i => ({
        id: i.id,
        key: i.key,
        summary: i.summary,
        type: i.type,
        priority: i.priority,
        storyPoints: i.storyPoints || 3,
        labels: i.labels || []
      }));

      const prompt = `You are an expert Agile sprint planner. Select the optimal set of issues for this sprint.

Backlog Issues (${backlogIssues.length} total):
${JSON.stringify(issuesData.slice(0, 20), null, 2)}

Sprint Capacity: ${capacity} story points
Prioritize By: ${prioritizeBy}

Select issues that:
1. Fit within capacity (don't exceed ${capacity} points)
2. Balance different issue types
3. Consider priority levels
4. Maximize business value
5. Respect dependencies

Return ONLY a valid JSON array of issue IDs to include:
["issue-id-1", "issue-id-2", ...]

Aim for 80-95% capacity utilization.`;

      const response = await axios.post(
        this.cerebrasEndpoint,
        {
          model: 'llama3.1-8b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert sprint planner. Return only valid JSON arrays of issue IDs.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.cerebrasApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const selectedIds = JSON.parse(jsonMatch[0]);
        return backlogIssues.filter(i => selectedIds.includes(i.id));
      }

      return this.fallbackSelection(backlogIssues, capacity, prioritizeBy);
    } catch (error) {
      console.error('AI selection failed, using fallback:', error);
      return this.fallbackSelection(backlogIssues, capacity, prioritizeBy);
    }
  }

  /**
   * Fallback selection without AI
   */
  private fallbackSelection(
    backlogIssues: Issue[],
    capacity: number,
    prioritizeBy: string
  ): Issue[] {
    const selected: Issue[] = [];
    let currentPoints = 0;

    // Sort by priority
    const sorted = [...backlogIssues].sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        highest: 1,
        high: 2,
        medium: 3,
        low: 4,
        lowest: 5
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Select issues until capacity is reached
    for (const issue of sorted) {
      const points = issue.storyPoints || 3;
      if (currentPoints + points <= capacity) {
        selected.push(issue);
        currentPoints += points;
      }
      
      // Stop at 95% capacity
      if (currentPoints >= capacity * 0.95) break;
    }

    return selected;
  }

  /**
   * Balance workload across team members
   */
  private async balanceWorkload(
    selectedIssues: Issue[],
    teamMembers: User[]
  ): Promise<PopulationResult> {
    const teamBalance: PopulationResult['teamBalance'] = {};
    const result: PopulationResult = {
      selectedIssues: [],
      totalPoints: 0,
      capacityUtilization: 0,
      teamBalance,
      recommendations: [],
      warnings: []
    };

    // Initialize team balance
    for (const member of teamMembers) {
      teamBalance[member.id] = {
        userName: member.name,
        assignedPoints: 0,
        assignedIssues: 0
      };
    }

    // Distribute issues evenly
    const pointsPerMember = Math.ceil(
      selectedIssues.reduce((sum, i) => sum + (i.storyPoints || 3), 0) / teamMembers.length
    );

    let currentMemberIndex = 0;
    
    for (const issue of selectedIssues) {
      const member = teamMembers[currentMemberIndex % teamMembers.length];
      const points = issue.storyPoints || 3;

      result.selectedIssues.push({
        issueId: issue.id,
        issueKey: issue.key,
        summary: issue.summary,
        storyPoints: points,
        priority: issue.priority,
        assignedTo: member.id,
        reason: `Balanced workload distribution`
      });

      teamBalance[member.id].assignedPoints += points;
      teamBalance[member.id].assignedIssues++;
      result.totalPoints += points;

      currentMemberIndex++;
    }

    // Calculate utilization
    const totalCapacity = teamMembers.length * pointsPerMember;
    result.capacityUtilization = Math.round((result.totalPoints / totalCapacity) * 100);

    // Generate recommendations
    if (result.capacityUtilization < 70) {
      result.recommendations.push('Consider adding more issues to reach 80-90% capacity');
    } else if (result.capacityUtilization > 95) {
      result.warnings.push('Sprint may be over-committed. Consider removing some issues.');
    }

    return result;
  }

  /**
   * Assign selected issues to sprint
   */
  private async assignIssuesToSprint(
    selectedIssues: PopulationResult['selectedIssues'],
    sprintId: string
  ): Promise<void> {
    const issueRepo = AppDataSource.getRepository(Issue);

    for (const selected of selectedIssues) {
      const issue = await issueRepo.findOne({ where: { id: selected.issueId } });
      if (issue) {
        issue.sprintId = sprintId;
        if (selected.assignedTo) {
          issue.assigneeId = selected.assignedTo;
        }
        await issueRepo.save(issue);
      }
    }
  }

  /**
   * Preview sprint population without applying
   */
  async previewSprintPopulation(config: SprintPopulationConfig): Promise<PopulationResult> {
    // Same logic as populateSprint but without the final assignment step
    const sprint = await this.getSprint(config.sprintId);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const backlogIssues = await this.getBacklogIssues(sprint.projectId, config.includeTypes);
    const teamMembers = await this.getTeamMembers(sprint.projectId);
    const historicalVelocity = await this.getHistoricalVelocity(sprint.projectId);
    const dependencies = await this.analyzeDependencies(backlogIssues);

    const selection = await this.selectOptimalIssues(
      backlogIssues,
      config.teamCapacity || historicalVelocity,
      config.prioritizeBy || 'balanced',
      dependencies
    );

    return await this.balanceWorkload(selection, teamMembers);
  }
}

export const aiSprintAutoPopulateService = new AISprintAutoPopulateService();
