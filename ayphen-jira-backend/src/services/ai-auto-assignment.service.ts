import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { User } from '../entities/User';
import { ProjectMember } from '../entities/ProjectMember';
import axios from 'axios';

interface AssignmentScore {
  userId: string;
  userName: string;
  score: number;
  reasons: string[];
  expertise: number;
  workload: number;
  availability: number;
}

interface AutoAssignmentResult {
  recommendedAssignee: {
    userId: string;
    userName: string;
    email: string;
    confidence: number;
    reasons: string[];
  };
  alternativeAssignees: Array<{
    userId: string;
    userName: string;
    score: number;
    reasons: string[];
  }>;
  analysis: {
    issueComplexity: 'low' | 'medium' | 'high';
    requiredSkills: string[];
    estimatedHours: number;
  };
}

export class AIAutoAssignmentService {
  private cerebrasApiKey: string;
  private cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';

  constructor() {
    this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
  }

  /**
   * Auto-assign issue to best team member
   */
  async autoAssignIssue(issueId: string): Promise<AutoAssignmentResult> {
    try {
      const issueRepo = AppDataSource.getRepository(Issue);
      const issue = await issueRepo.findOne({
        where: { id: issueId },
        relations: ['project']
      });

      if (!issue) {
        throw new Error('Issue not found');
      }

      // Get project team members
      const teamMembers = await this.getProjectTeamMembers(issue.projectId);

      if (teamMembers.length === 0) {
        throw new Error('No team members found for this project');
      }

      // Analyze issue to extract requirements
      const issueAnalysis = await this.analyzeIssue(issue);

      // Score each team member
      const scores = await Promise.all(
        teamMembers.map(member => this.scoreTeamMember(member, issue, issueAnalysis))
      );

      // Sort by score (highest first)
      scores.sort((a, b) => b.score - a.score);

      // Get top recommendation
      const topAssignee = scores[0];
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: topAssignee.userId } });

      if (!user) {
        throw new Error('Recommended user not found');
      }

      return {
        recommendedAssignee: {
          userId: topAssignee.userId,
          userName: topAssignee.userName,
          email: user.email,
          confidence: topAssignee.score,
          reasons: topAssignee.reasons
        },
        alternativeAssignees: scores.slice(1, 4).map(s => ({
          userId: s.userId,
          userName: s.userName,
          score: s.score,
          reasons: s.reasons
        })),
        analysis: issueAnalysis
      };
    } catch (error: any) {
      console.error('❌ Auto-assignment error:', error);
      throw new Error(`Failed to auto-assign issue: ${error.message}`);
    }
  }

  /**
   * Get project team members
   */
  private async getProjectTeamMembers(projectId: string): Promise<User[]> {
    const memberRepo = AppDataSource.getRepository(ProjectMember);
    const members = await memberRepo.find({
      where: { projectId },
      relations: ['user']
    });

    return members
      .filter(m => m.user && m.user.isActive !== false)
      .map(m => m.user);
  }

  /**
   * Analyze issue using AI
   */
  private async analyzeIssue(issue: Issue): Promise<{
    issueComplexity: 'low' | 'medium' | 'high';
    requiredSkills: string[];
    estimatedHours: number;
  }> {
    try {
      const prompt = `Analyze this Jira issue and extract key information:

Type: ${issue.type}
Summary: ${issue.summary}
Description: ${issue.description || 'No description'}
Priority: ${issue.priority}
Labels: ${issue.labels?.join(', ') || 'None'}

Return ONLY a valid JSON object:
{
  "issueComplexity": "low" | "medium" | "high",
  "requiredSkills": ["skill1", "skill2"],
  "estimatedHours": number
}

Rules:
- Complexity: low (1-4h), medium (4-16h), high (16+h)
- Skills: technical areas needed (e.g., "React", "Node.js", "Database", "API", "UI/UX")
- Estimate based on type and description complexity`;

      const response = await axios.post(
        this.cerebrasEndpoint,
        {
          model: 'llama3.1-8b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software project analyzer. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.cerebrasApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          issueComplexity: analysis.issueComplexity || 'medium',
          requiredSkills: analysis.requiredSkills || [],
          estimatedHours: analysis.estimatedHours || 8
        };
      }

      // Fallback to simple analysis
      return this.fallbackAnalysis(issue);
    } catch (error) {
      console.error('AI analysis failed, using fallback:', error);
      return this.fallbackAnalysis(issue);
    }
  }

  /**
   * Fallback analysis without AI
   */
  private fallbackAnalysis(issue: Issue): {
    issueComplexity: 'low' | 'medium' | 'high';
    requiredSkills: string[];
    estimatedHours: number;
  } {
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    let estimatedHours = 8;

    // Determine complexity
    if (issue.type === 'epic') {
      complexity = 'high';
      estimatedHours = 40;
    } else if (issue.type === 'story') {
      complexity = 'medium';
      estimatedHours = 16;
    } else if (issue.type === 'task') {
      complexity = 'low';
      estimatedHours = 4;
    } else if (issue.type === 'bug') {
      complexity = issue.priority === 'highest' || issue.priority === 'high' ? 'high' : 'medium';
      estimatedHours = complexity === 'high' ? 8 : 4;
    }

    // Extract skills from labels and description
    const requiredSkills: string[] = [];
    const text = `${issue.summary} ${issue.description || ''} ${issue.labels?.join(' ') || ''}`.toLowerCase();

    const skillKeywords = {
      'React': ['react', 'frontend', 'ui', 'component'],
      'Node.js': ['node', 'backend', 'api', 'server'],
      'Database': ['database', 'sql', 'query', 'schema'],
      'UI/UX': ['design', 'ui', 'ux', 'interface', 'layout'],
      'Testing': ['test', 'qa', 'quality'],
      'DevOps': ['deploy', 'ci/cd', 'docker', 'kubernetes']
    };

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        requiredSkills.push(skill);
      }
    }

    return { issueComplexity: complexity, requiredSkills, estimatedHours };
  }

  /**
   * Score team member for assignment
   */
  private async scoreTeamMember(
    user: User,
    issue: Issue,
    analysis: { issueComplexity: string; requiredSkills: string[]; estimatedHours: number }
  ): Promise<AssignmentScore> {
    const reasons: string[] = [];
    let expertiseScore = 0;
    let workloadScore = 0;
    let availabilityScore = 0;

    // 1. Expertise Score (40% weight)
    expertiseScore = await this.calculateExpertiseScore(user.id, issue, analysis.requiredSkills, reasons);

    // 2. Workload Score (40% weight)
    workloadScore = await this.calculateWorkloadScore(user.id, issue.projectId, reasons);

    // 3. Availability Score (20% weight)
    availabilityScore = this.calculateAvailabilityScore(user, reasons);

    // Calculate final score (0-100)
    const finalScore = (
      expertiseScore * 0.4 +
      workloadScore * 0.4 +
      availabilityScore * 0.2
    );

    return {
      userId: user.id,
      userName: user.name,
      score: Math.round(finalScore * 100) / 100,
      reasons,
      expertise: expertiseScore,
      workload: workloadScore,
      availability: availabilityScore
    };
  }

  /**
   * Calculate expertise score based on past issues
   */
  private async calculateExpertiseScore(
    userId: string,
    issue: Issue,
    requiredSkills: string[],
    reasons: string[]
  ): Promise<number> {
    const issueRepo = AppDataSource.getRepository(Issue);

    // Get user's past issues
    const pastIssues = await issueRepo.find({
      where: { assigneeId: userId },
      take: 50,
      order: { updatedAt: 'DESC' }
    });

    if (pastIssues.length === 0) {
      reasons.push('New team member - no history');
      return 50; // Neutral score for new members
    }

    let score = 0;

    // 1. Same issue type experience (30 points)
    const sameTypeCount = pastIssues.filter(i => i.type === issue.type).length;
    const typeScore = Math.min((sameTypeCount / pastIssues.length) * 30, 30);
    score += typeScore;
    
    if (sameTypeCount > 5) {
      reasons.push(`Experienced with ${issue.type}s (${sameTypeCount} completed)`);
    }

    // 2. Similar labels/skills (40 points)
    if (requiredSkills.length > 0) {
      let skillMatches = 0;
      for (const skill of requiredSkills) {
        const matchingIssues = pastIssues.filter(i => {
          const text = `${i.summary} ${i.description || ''} ${i.labels?.join(' ') || ''}`.toLowerCase();
          return text.includes(skill.toLowerCase());
        });
        
        if (matchingIssues.length > 0) {
          skillMatches++;
          reasons.push(`Has ${skill} experience (${matchingIssues.length} issues)`);
        }
      }
      score += (skillMatches / requiredSkills.length) * 40;
    } else {
      score += 20; // Neutral if no skills identified
    }

    // 3. Success rate (30 points)
    const completedIssues = pastIssues.filter(i => i.status === 'done').length;
    const successRate = completedIssues / pastIssues.length;
    score += successRate * 30;

    if (successRate > 0.8) {
      reasons.push(`High success rate (${Math.round(successRate * 100)}%)`);
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate workload score (lower workload = higher score)
   */
  private async calculateWorkloadScore(
    userId: string,
    projectId: string,
    reasons: string[]
  ): Promise<number> {
    const issueRepo = AppDataSource.getRepository(Issue);

    // Get user's current active issues
    const activeIssues = await issueRepo.find({
      where: {
        assigneeId: userId,
        projectId,
        status: ['todo', 'in-progress', 'in-review'] as any
      }
    });

    const activeCount = activeIssues.length;
    const totalPoints = activeIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

    // Score based on workload (inverse relationship)
    let score = 100;

    if (activeCount === 0) {
      reasons.push('Currently available (no active issues)');
      score = 100;
    } else if (activeCount <= 3) {
      reasons.push(`Light workload (${activeCount} active issues)`);
      score = 80;
    } else if (activeCount <= 6) {
      reasons.push(`Moderate workload (${activeCount} active issues)`);
      score = 60;
    } else if (activeCount <= 10) {
      reasons.push(`Heavy workload (${activeCount} active issues)`);
      score = 30;
    } else {
      reasons.push(`Overloaded (${activeCount} active issues)`);
      score = 10;
    }

    // Adjust for story points
    if (totalPoints > 40) {
      score -= 20;
      reasons.push(`High story point load (${totalPoints} points)`);
    }

    return Math.max(score, 0);
  }

  /**
   * Calculate availability score
   */
  private calculateAvailabilityScore(user: User, reasons: string[]): number {
    // For now, assume all users are available
    // In future, integrate with calendar, time zones, PTO, etc.
    
    if (user.isActive === false) {
      reasons.push('User is inactive');
      return 0;
    }

    reasons.push('Available for assignment');
    return 100;
  }

  /**
   * Bulk auto-assign multiple issues
   */
  async bulkAutoAssign(issueIds: string[]): Promise<Map<string, AutoAssignmentResult>> {
    const results = new Map<string, AutoAssignmentResult>();

    for (const issueId of issueIds) {
      try {
        const result = await this.autoAssignIssue(issueId);
        results.set(issueId, result);
      } catch (error: any) {
        console.error(`Failed to auto-assign issue ${issueId}:`, error);
      }
    }

    return results;
  }

  /**
   * Learn from manual assignment (feedback loop)
   */
  async recordAssignmentFeedback(
    issueId: string,
    recommendedUserId: string,
    actualUserId: string,
    wasAccepted: boolean
  ): Promise<void> {
    // TODO: Store feedback for future ML model training
    // This will help improve assignment accuracy over time
    console.log('📊 Assignment feedback recorded:', {
      issueId,
      recommended: recommendedUserId,
      actual: actualUserId,
      accepted: wasAccepted
    });
  }
}

export const aiAutoAssignmentService = new AIAutoAssignmentService();
