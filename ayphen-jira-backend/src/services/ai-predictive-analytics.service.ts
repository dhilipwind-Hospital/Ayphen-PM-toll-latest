import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { Sprint } from '../entities/Sprint';
import { Project } from '../entities/Project';
import axios from 'axios';

interface ProjectInsights {
  velocity: {
    current: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    prediction: number;
    confidence: number;
  };
  bottlenecks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
    recommendation: string;
  }>;
  health: {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor';
    factors: Array<{
      name: string;
      score: number;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
  };
  recommendations: string[];
}

interface IssueCompletionPrediction {
  estimatedDays: number;
  completionDate: Date;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  similarIssues: Array<{
    key: string;
    summary: string;
    actualDays: number;
    similarity: number;
  }>;
}

export class AIPredictiveAnalyticsService {
  private cerebrasApiKey: string;
  private cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';

  constructor() {
    this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
  }

  /**
   * Generate comprehensive project insights
   */
  async generateInsights(projectId: string): Promise<ProjectInsights> {
    try {
      const [velocity, bottlenecks, health] = await Promise.all([
        this.predictVelocityTrend(projectId),
        this.identifyBottlenecks(projectId),
        this.assessProjectHealth(projectId)
      ]);

      const recommendations = await this.suggestImprovements(projectId, {
        velocity,
        bottlenecks,
        health
      });

      return {
        velocity,
        bottlenecks,
        health,
        recommendations
      };
    } catch (error: any) {
      console.error('❌ Generate insights error:', error);
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }

  /**
   * Predict velocity trend
   */
  private async predictVelocityTrend(projectId: string): Promise<ProjectInsights['velocity']> {
    try {
      const sprintRepo = AppDataSource.getRepository(Sprint);
      const issueRepo = AppDataSource.getRepository(Issue);

      // Get last 6 sprints
      const sprints = await sprintRepo.find({
        where: { projectId, status: 'completed' },
        order: { endDate: 'DESC' },
        take: 6
      });

      if (sprints.length < 2) {
        return {
          current: 20,
          trend: 'stable',
          prediction: 20,
          confidence: 0.3
        };
      }

      // Calculate velocities
      const velocities: number[] = [];
      for (const sprint of sprints) {
        const issues = await issueRepo.find({
          where: { sprintId: sprint.id, status: 'Done' }
        });
        const velocity = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        velocities.push(velocity);
      }

      velocities.reverse(); // Oldest to newest

      // Calculate trend
      const current = velocities[velocities.length - 1];
      const previous = velocities[velocities.length - 2];
      const change = current - previous;
      const changePercent = (change / previous) * 100;

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (changePercent > 10) trend = 'increasing';
      else if (changePercent < -10) trend = 'decreasing';
      else trend = 'stable';

      // Simple linear prediction
      const avgChange = velocities.reduce((sum, v, i) => {
        if (i === 0) return 0;
        return sum + (v - velocities[i - 1]);
      }, 0) / (velocities.length - 1);

      const prediction = Math.max(0, Math.round(current + avgChange));

      return {
        current,
        trend,
        prediction,
        confidence: 0.7
      };
    } catch (error) {
      console.error('❌ Predict velocity error:', error);
      return {
        current: 20,
        trend: 'stable',
        prediction: 20,
        confidence: 0.3
      };
    }
  }

  /**
   * Identify bottlenecks
   */
  private async identifyBottlenecks(projectId: string): Promise<ProjectInsights['bottlenecks']> {
    try {
      const issueRepo = AppDataSource.getRepository(Issue);
      const issues = await issueRepo.find({
        where: { projectId },
        relations: ['assignee']
      });

      const bottlenecks: ProjectInsights['bottlenecks'] = [];

      // Check for status bottlenecks
      const inReview = issues.filter(i => i.status === 'In Review').length;
      const inProgress = issues.filter(i => i.status === 'In Progress').length;
      
      if (inReview > inProgress * 0.5) {
        bottlenecks.push({
          type: 'review_queue',
          severity: inReview > inProgress ? 'high' : 'medium',
          description: `${inReview} issues waiting for review`,
          impact: 'Slowing down delivery and blocking developers',
          recommendation: 'Allocate more time for code reviews or implement pair programming'
        });
      }

      // Check for blocked issues
      const blocked = issues.filter(i => i.status === 'blocked' || i.isFlagged).length;
      if (blocked > 0) {
        bottlenecks.push({
          type: 'blocked_issues',
          severity: blocked > 5 ? 'high' : 'medium',
          description: `${blocked} issues are blocked or flagged`,
          impact: 'Preventing progress on dependent work',
          recommendation: 'Hold a dedicated session to resolve blockers'
        });
      }

      // Check for overdue issues
      const now = new Date();
      const overdue = issues.filter(i => i.dueDate && new Date(i.dueDate) < now && i.status !== 'Done').length;
      if (overdue > 0) {
        bottlenecks.push({
          type: 'overdue_issues',
          severity: overdue > 10 ? 'high' : 'medium',
          description: `${overdue} issues are past their due date`,
          impact: 'Missing deadlines and commitments',
          recommendation: 'Reprioritize backlog and adjust timelines'
        });
      }

      // Check for unassigned issues
      const unassigned = issues.filter(i => !i.assigneeId && i.status !== 'Done').length;
      if (unassigned > issues.length * 0.2) {
        bottlenecks.push({
          type: 'unassigned_work',
          severity: 'medium',
          description: `${unassigned} issues are unassigned`,
          impact: 'Work may not get picked up',
          recommendation: 'Assign issues during sprint planning or backlog grooming'
        });
      }

      // Check for large issues
      const largeIssues = issues.filter(i => (i.storyPoints || 0) > 8 && i.status !== 'Done').length;
      if (largeIssues > 0) {
        bottlenecks.push({
          type: 'large_issues',
          severity: 'low',
          description: `${largeIssues} issues have high complexity (>8 points)`,
          impact: 'May cause delays and unpredictability',
          recommendation: 'Break down large issues into smaller, manageable tasks'
        });
      }

      return bottlenecks;
    } catch (error) {
      console.error('❌ Identify bottlenecks error:', error);
      return [];
    }
  }

  /**
   * Assess project health
   */
  private async assessProjectHealth(projectId: string): Promise<ProjectInsights['health']> {
    try {
      const issueRepo = AppDataSource.getRepository(Issue);
      const sprintRepo = AppDataSource.getRepository(Sprint);

      const issues = await issueRepo.find({ where: { projectId } });
      const sprints = await sprintRepo.find({
        where: { projectId },
        order: { endDate: 'DESC' },
        take: 3
      });

      const factors: ProjectInsights['health']['factors'] = [];
      let totalScore = 0;

      // Factor 1: Completion rate
      const done = issues.filter(i => i.status === 'Done').length;
      const completionRate = issues.length > 0 ? (done / issues.length) * 100 : 0;
      const completionScore = Math.min(100, completionRate * 1.5);
      factors.push({
        name: 'Completion Rate',
        score: Math.round(completionScore),
        impact: completionRate > 60 ? 'positive' : completionRate > 40 ? 'neutral' : 'negative'
      });
      totalScore += completionScore;

      // Factor 2: Velocity consistency
      if (sprints.length >= 2) {
        const velocities: number[] = [];
        for (const sprint of sprints) {
          const sprintIssues = await issueRepo.find({
            where: { sprintId: sprint.id, status: 'Done' }
          });
          velocities.push(sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0));
        }
        
        const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / velocities.length;
        const stdDev = Math.sqrt(variance);
        const consistency = Math.max(0, 100 - (stdDev / avg) * 100);
        
        factors.push({
          name: 'Velocity Consistency',
          score: Math.round(consistency),
          impact: consistency > 70 ? 'positive' : consistency > 50 ? 'neutral' : 'negative'
        });
        totalScore += consistency;
      }

      // Factor 3: Bug ratio
      const bugs = issues.filter(i => i.type === 'bug').length;
      const bugRatio = issues.length > 0 ? (bugs / issues.length) * 100 : 0;
      const bugScore = Math.max(0, 100 - bugRatio * 2);
      factors.push({
        name: 'Bug Ratio',
        score: Math.round(bugScore),
        impact: bugRatio < 15 ? 'positive' : bugRatio < 25 ? 'neutral' : 'negative'
      });
      totalScore += bugScore;

      // Factor 4: Response time
      const recent = issues.filter(i => {
        const created = new Date(i.createdAt);
        const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });
      
      const avgResponseTime = recent.reduce((sum, i) => {
        if (i.status === 'To Do') return sum + 30; // Still waiting
        const created = new Date(i.createdAt);
        const updated = new Date(i.updatedAt);
        return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / Math.max(recent.length, 1);
      
      const responseScore = Math.max(0, 100 - avgResponseTime * 5);
      factors.push({
        name: 'Response Time',
        score: Math.round(responseScore),
        impact: avgResponseTime < 3 ? 'positive' : avgResponseTime < 7 ? 'neutral' : 'negative'
      });
      totalScore += responseScore;

      // Calculate overall score
      const score = Math.round(totalScore / factors.length);
      
      let status: ProjectInsights['health']['status'];
      if (score >= 80) status = 'excellent';
      else if (score >= 60) status = 'good';
      else if (score >= 40) status = 'fair';
      else status = 'poor';

      return {
        score,
        status,
        factors
      };
    } catch (error) {
      console.error('❌ Assess health error:', error);
      return {
        score: 50,
        status: 'fair',
        factors: []
      };
    }
  }

  /**
   * Suggest improvements
   */
  private async suggestImprovements(
    projectId: string,
    data: {
      velocity: ProjectInsights['velocity'];
      bottlenecks: ProjectInsights['bottlenecks'];
      health: ProjectInsights['health'];
    }
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Velocity suggestions
    if (data.velocity.trend === 'decreasing') {
      suggestions.push('📉 Velocity is decreasing. Review team capacity and remove impediments.');
    } else if (data.velocity.trend === 'increasing') {
      suggestions.push('📈 Velocity is improving! Maintain current practices and momentum.');
    }

    // Health suggestions
    if (data.health.score < 60) {
      suggestions.push('⚠️ Project health needs attention. Focus on completing existing work before starting new items.');
    }

    // Bottleneck suggestions
    const highSeverityBottlenecks = data.bottlenecks.filter(b => b.severity === 'high');
    if (highSeverityBottlenecks.length > 0) {
      suggestions.push(`🚨 ${highSeverityBottlenecks.length} high-severity bottleneck(s) detected. Address these immediately.`);
    }

    // Factor-specific suggestions
    const lowFactors = data.health.factors.filter(f => f.score < 50);
    for (const factor of lowFactors) {
      if (factor.name === 'Bug Ratio') {
        suggestions.push('🐛 High bug ratio detected. Allocate time for technical debt and quality improvements.');
      } else if (factor.name === 'Response Time') {
        suggestions.push('⏱️ Slow response time. Ensure issues are triaged and assigned promptly.');
      }
    }

    return suggestions;
  }

  /**
   * Predict issue completion time
   */
  async predictIssueCompletionTime(issueId: string): Promise<IssueCompletionPrediction> {
    try {
      const issueRepo = AppDataSource.getRepository(Issue);
      const issue = await issueRepo.findOne({
        where: { id: issueId },
        relations: ['assignee', 'project']
      });

      if (!issue) {
        throw new Error('Issue not found');
      }

      // Find similar completed issues
      const similarIssues = await this.findSimilarCompletedIssues(issue);

      // Calculate average completion time
      const avgDays = similarIssues.length > 0
        ? similarIssues.reduce((sum, i) => sum + i.actualDays, 0) / similarIssues.length
        : this.estimateByStoryPoints(issue.storyPoints || 0);

      // Adjust based on factors
      const factors: IssueCompletionPrediction['factors'] = [];
      let adjustedDays = avgDays;

      // Factor: Story points
      if (issue.storyPoints) {
        const pointsFactor = issue.storyPoints / 5; // Normalize to 5 points
        factors.push({
          name: 'Story Points',
          impact: pointsFactor,
          description: `${issue.storyPoints} story points estimated`
        });
        adjustedDays *= pointsFactor;
      }

      // Factor: Priority
      const priorityMultiplier = {
        highest: 0.8,
        high: 0.9,
        medium: 1.0,
        low: 1.2,
        lowest: 1.5
      };
      const priorityFactor = priorityMultiplier[issue.priority as keyof typeof priorityMultiplier] || 1.0;
      factors.push({
        name: 'Priority',
        impact: priorityFactor,
        description: `${issue.priority} priority affects timeline`
      });
      adjustedDays *= priorityFactor;

      // Factor: Dependencies
      if (issue.parentId || issue.epicId) {
        factors.push({
          name: 'Dependencies',
          impact: 1.2,
          description: 'Has dependencies that may cause delays'
        });
        adjustedDays *= 1.2;
      }

      // Calculate completion date
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + Math.ceil(adjustedDays));

      // Calculate confidence
      const confidence = similarIssues.length > 0
        ? Math.min(0.9, 0.5 + (similarIssues.length * 0.1))
        : 0.5;

      return {
        estimatedDays: Math.ceil(adjustedDays),
        completionDate,
        confidence,
        factors,
        similarIssues: similarIssues.slice(0, 5)
      };
    } catch (error: any) {
      console.error('❌ Predict completion error:', error);
      throw new Error(`Failed to predict completion time: ${error.message}`);
    }
  }

  /**
   * Find similar completed issues
   */
  private async findSimilarCompletedIssues(issue: Issue): Promise<Array<{
    key: string;
    summary: string;
    actualDays: number;
    similarity: number;
  }>> {
    try {
      const issueRepo = AppDataSource.getRepository(Issue);
      
      const completedIssues = await issueRepo.find({
        where: {
          projectId: issue.projectId,
          type: issue.type,
          status: 'Done'
        },
        select: ['id', 'key', 'summary', 'createdAt', 'updatedAt', 'storyPoints']
      });

      return completedIssues
        .map(i => {
          const created = new Date(i.createdAt);
          const completed = new Date(i.updatedAt);
          const actualDays = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          
          // Simple similarity based on story points
          const pointsDiff = Math.abs((i.storyPoints || 0) - (issue.storyPoints || 0));
          const similarity = Math.max(0, 1 - (pointsDiff / 10));
          
          return {
            key: i.key,
            summary: i.summary,
            actualDays: Math.ceil(actualDays),
            similarity
          };
        })
        .filter(i => i.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('❌ Find similar issues error:', error);
      return [];
    }
  }

  /**
   * Estimate by story points
   */
  private estimateByStoryPoints(points: number): number {
    // Simple heuristic: 1 point = 1 day
    const baseEstimate = {
      1: 0.5,
      2: 1,
      3: 2,
      5: 3,
      8: 5,
      13: 8
    };

    return baseEstimate[points as keyof typeof baseEstimate] || points;
  }
}

export const aiPredictiveAnalyticsService = new AIPredictiveAnalyticsService();
