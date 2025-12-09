import { AppDataSource } from '../config/database';
import { Sprint } from '../entities/Sprint';
import { Project } from '../entities/Project';
import { aiRetrospectiveAnalyzer } from './ai-retrospective-analyzer.service';
import axios from 'axios';

interface TeamMetrics {
  teamId: string;
  teamName: string;
  avgVelocity: number;
  avgCompletionRate: number;
  avgBugsPerSprint: number;
  avgCycleTime: number;
  sprintsAnalyzed: number;
}

interface TeamComparison {
  teams: TeamMetrics[];
  rankings: {
    velocity: TeamMetrics[];
    quality: TeamMetrics[];
    efficiency: TeamMetrics[];
  };
  insights: string[];
}

export class TeamComparisonService {
  private cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
  private cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';

  /**
   * Compare performance across multiple teams
   */
  async compareTeams(
    projectIds: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<TeamComparison> {
    const sprintRepo = AppDataSource.getRepository(Sprint);
    const projectRepo = AppDataSource.getRepository(Project);
    
    try {
      // Get all sprints for these projects in time range
      const sprints = await sprintRepo
        .createQueryBuilder('sprint')
        .leftJoinAndSelect('sprint.project', 'project')
        .where('sprint.projectId IN (:...projectIds)', { projectIds })
        .andWhere('sprint.endDate BETWEEN :start AND :end', timeRange)
        .andWhere('sprint.status = :status', { status: 'closed' })
        .getMany();
      
      if (sprints.length === 0) {
        return {
          teams: [],
          rankings: { velocity: [], quality: [], efficiency: [] },
          insights: ['No completed sprints found in the specified time range']
        };
      }
      
      // Group by project (team)
      const teamGroups = new Map<string, Sprint[]>();
      for (const sprint of sprints) {
        if (!teamGroups.has(sprint.projectId)) {
          teamGroups.set(sprint.projectId, []);
        }
        teamGroups.get(sprint.projectId)!.push(sprint);
      }
      
      // Calculate metrics for each team
      const teamMetrics: TeamMetrics[] = [];
      
      for (const [projectId, teamSprints] of teamGroups) {
        const project = await projectRepo.findOne({ where: { id: projectId } });
        
        const metrics = await Promise.all(
          teamSprints.map(s => aiRetrospectiveAnalyzer.getSprintMetrics(s.id))
        );
        
        teamMetrics.push({
          teamId: projectId,
          teamName: project?.name || `Team ${projectId.substring(0, 8)}`,
          avgVelocity: this.avg(metrics.map(m => m.velocity)),
          avgCompletionRate: this.avg(metrics.map(m => m.completionRate)),
          avgBugsPerSprint: this.avg(metrics.map(m => m.bugsRaised)),
          avgCycleTime: this.avg(metrics.map(m => m.avgCycleTime)),
          sprintsAnalyzed: teamSprints.length
        });
      }
      
      // Create rankings
      const rankings = {
        velocity: [...teamMetrics].sort((a, b) => b.avgVelocity - a.avgVelocity),
        quality: [...teamMetrics].sort((a, b) => a.avgBugsPerSprint - b.avgBugsPerSprint),
        efficiency: [...teamMetrics].sort((a, b) => a.avgCycleTime - b.avgCycleTime)
      };
      
      // Generate AI insights
      const insights = await this.generateComparisonInsights(teamMetrics, rankings);
      
      return {
        teams: teamMetrics,
        rankings,
        insights
      };
    } catch (error: any) {
      console.error('❌ Error comparing teams:', error);
      throw error;
    }
  }

  /**
   * Generate AI insights about team comparison
   */
  private async generateComparisonInsights(
    teams: TeamMetrics[],
    rankings: any
  ): Promise<string[]> {
    if (teams.length < 2) {
      return ['Need at least 2 teams to generate comparison insights'];
    }

    const topVelocity = rankings.velocity[0];
    const topQuality = rankings.quality[0];
    const topEfficiency = rankings.efficiency[0];

    const prompt = `Analyze team performance comparison and provide 4-6 actionable insights.

Teams Analyzed: ${teams.length}

Top Performers:
- Velocity Leader: ${topVelocity.teamName} (${topVelocity.avgVelocity.toFixed(1)} points/sprint)
- Quality Leader: ${topQuality.teamName} (${topQuality.avgBugsPerSprint.toFixed(1)} bugs/sprint)
- Efficiency Leader: ${topEfficiency.teamName} (${topEfficiency.avgCycleTime.toFixed(1)} days cycle time)

All Teams:
${teams.map(t => `- ${t.teamName}: Velocity ${t.avgVelocity.toFixed(1)}, Bugs ${t.avgBugsPerSprint.toFixed(1)}, Cycle ${t.avgCycleTime.toFixed(1)} days`).join('\n')}

Generate 4-6 specific insights about:
1. Performance gaps and opportunities
2. Best practices to share across teams
3. Areas for cross-team learning
4. Recommendations for improvement

Return as JSON array of strings.`;

    try {
      const response = await axios.post(
        this.cerebrasEndpoint,
        {
          model: 'llama-3.3-70b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Agile coach analyzing team performance. Provide specific, actionable insights for cross-team improvement. Always return valid JSON array.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 600
        },
        {
          headers: {
            'Authorization': `Bearer ${this.cerebrasApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let content = response.data.choices[0].message.content || '[]';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('⚠️ Failed to generate AI insights:', error);
      
      // Fallback insights
      const insights = [];
      
      const velocityGap = topVelocity.avgVelocity - teams[teams.length - 1].avgVelocity;
      if (velocityGap > 10) {
        insights.push(`${topVelocity.teamName} leads velocity by ${velocityGap.toFixed(1)} points - consider sharing their planning practices`);
      }
      
      if (topQuality.avgBugsPerSprint < 3) {
        insights.push(`${topQuality.teamName} maintains excellent quality (${topQuality.avgBugsPerSprint.toFixed(1)} bugs/sprint) - their testing practices could benefit other teams`);
      }
      
      insights.push('Schedule cross-team knowledge sharing sessions to exchange best practices');
      insights.push('Consider pairing high and low performing teams for mentorship opportunities');
      
      return insights.length > 0 ? insights : ['Continue monitoring team metrics for comparison insights'];
    }
  }

  /**
   * Calculate average of numbers
   */
  private avg(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
}

// Export singleton instance
export const teamComparisonService = new TeamComparisonService();
