import { AppDataSource } from '../config/database';
import { Sprint } from '../entities/Sprint';
import { Issue } from '../entities/Issue';
import { aiRetrospectiveAnalyzer } from './ai-retrospective-analyzer.service';
import axios from 'axios';

interface Risk {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

interface SprintPrediction {
  successProbability: number; // 0-100%
  predictedVelocity: number;
  predictedCompletionRate: number;
  risks: Risk[];
  recommendations: string[];
  confidence: 'low' | 'medium' | 'high';
}

export class SprintPredictorService {
  private cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
  private cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';

  /**
   * Predict sprint success and identify risks
   */
  async predictSprintSuccess(sprintId: string): Promise<SprintPrediction> {
    const sprintRepo = AppDataSource.getRepository(Sprint);
    const issueRepo = AppDataSource.getRepository(Issue);
    
    try {
      // Get planned sprint
      const sprint = await sprintRepo.findOne({ 
        where: { id: sprintId },
        relations: ['project']
      });
      
      if (!sprint) {
        throw new Error('Sprint not found');
      }
      
      // Get planned issues
      const plannedIssues = await issueRepo.find({ 
        where: { sprintId: sprintId }
      });
      
      const plannedPoints = plannedIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
      
      // Get historical data
      const historicalSprints = await sprintRepo
        .createQueryBuilder('sprint')
        .where('sprint.projectId = :projectId', { projectId: sprint.projectId })
        .andWhere('sprint.status = :status', { status: 'closed' })
        .andWhere('sprint.endDate < :currentStart', { currentStart: sprint.startDate })
        .orderBy('sprint.endDate', 'DESC')
        .take(10)
        .getMany();
      
      if (historicalSprints.length === 0) {
        return {
          successProbability: 50,
          predictedVelocity: plannedPoints,
          predictedCompletionRate: 70,
          risks: [{
            type: 'no-historical-data',
            severity: 'medium',
            description: 'No historical sprint data available for accurate prediction',
            mitigation: 'Use conservative estimates and monitor progress closely'
          }],
          recommendations: [
            'This is a new team or project - predictions will improve after completing more sprints',
            'Focus on establishing baseline metrics',
            'Plan conservatively until historical patterns emerge'
          ],
          confidence: 'low'
        };
      }
      
      const historicalMetrics = await Promise.all(
        historicalSprints.map(s => aiRetrospectiveAnalyzer.getSprintMetrics(s.id))
      );
      
      const avgVelocity = this.avg(historicalMetrics.map(m => m.velocity));
      const avgCompletionRate = this.avg(historicalMetrics.map(m => m.completionRate));
      const avgBugs = this.avg(historicalMetrics.map(m => m.bugsRaised));
      
      // Identify risks
      const risks = this.identifyRisks(plannedPoints, avgVelocity, plannedIssues, avgBugs);
      
      // Calculate success probability
      let probability = 100;
      
      // Adjust based on planning vs historical
      const velocityRatio = plannedPoints / avgVelocity;
      if (velocityRatio > 1.3) {
        probability -= 40;
      } else if (velocityRatio > 1.2) {
        probability -= 30;
      } else if (velocityRatio > 1.1) {
        probability -= 15;
      } else if (velocityRatio < 0.8) {
        probability -= 5; // Under-planning also has risks
      }
      
      // Adjust based on historical completion
      probability *= (avgCompletionRate / 100);
      
      // Adjust based on risks
      risks.forEach(risk => {
        if (risk.severity === 'high') probability -= 20;
        else if (risk.severity === 'medium') probability -= 10;
        else probability -= 5;
      });
      
      // Ensure probability is within bounds
      probability = Math.max(0, Math.min(100, Math.round(probability)));
      
      // Determine confidence level
      const confidence = historicalSprints.length >= 5 ? 'high' : 
                        historicalSprints.length >= 3 ? 'medium' : 'low';
      
      // Generate AI recommendations
      const recommendations = await this.generateRecommendations(
        plannedPoints,
        avgVelocity,
        risks,
        probability,
        plannedIssues
      );
      
      return {
        successProbability: probability,
        predictedVelocity: avgVelocity,
        predictedCompletionRate: avgCompletionRate,
        risks,
        recommendations,
        confidence
      };
    } catch (error: any) {
      console.error('❌ Error predicting sprint success:', error);
      throw error;
    }
  }
  
  /**
   * Identify potential risks for the sprint
   */
  private identifyRisks(
    plannedPoints: number,
    avgVelocity: number,
    issues: Issue[],
    avgBugs: number
  ): Risk[] {
    const risks: Risk[] = [];
    
    // Over-commitment risk
    if (plannedPoints > avgVelocity * 1.3) {
      risks.push({
        type: 'over-commitment',
        severity: 'high',
        description: `Planned ${plannedPoints} points vs historical avg ${avgVelocity.toFixed(1)} points (${((plannedPoints / avgVelocity - 1) * 100).toFixed(0)}% over capacity)`,
        mitigation: 'Reduce scope by removing lower priority items or extend sprint duration'
      });
    } else if (plannedPoints > avgVelocity * 1.2) {
      risks.push({
        type: 'over-commitment',
        severity: 'medium',
        description: `Planned ${plannedPoints} points vs historical avg ${avgVelocity.toFixed(1)} points (${((plannedPoints / avgVelocity - 1) * 100).toFixed(0)}% over capacity)`,
        mitigation: 'Consider reducing scope or be prepared to carry over items'
      });
    }
    
    // Large story risk
    const largeStories = issues.filter(i => (i.storyPoints || 0) > 8);
    if (largeStories.length > 0) {
      risks.push({
        type: 'large-stories',
        severity: largeStories.length > 2 ? 'high' : 'medium',
        description: `${largeStories.length} ${largeStories.length === 1 ? 'story' : 'stories'} larger than 8 points`,
        mitigation: 'Break down large stories into smaller, more manageable tasks (ideally 3-5 points each)'
      });
    }
    
    // Unestimated work risk
    const unestimated = issues.filter(i => !i.storyPoints || i.storyPoints === 0);
    if (unestimated.length > 0) {
      risks.push({
        type: 'unestimated-work',
        severity: unestimated.length > 3 ? 'high' : 'medium',
        description: `${unestimated.length} ${unestimated.length === 1 ? 'issue' : 'issues'} without story point estimates`,
        mitigation: 'Complete estimation for all planned work before sprint starts'
      });
    }
    
    // Blocked issues risk
    const blocked = issues.filter(i => i.status === 'blocked');
    if (blocked.length > 0) {
      risks.push({
        type: 'blocked-issues',
        severity: 'high',
        description: `${blocked.length} ${blocked.length === 1 ? 'issue is' : 'issues are'} currently blocked`,
        mitigation: 'Resolve blockers before sprint start or remove blocked items from sprint'
      });
    }
    
    // Bug-heavy sprint risk
    const bugs = issues.filter(i => i.type === 'bug');
    if (bugs.length > avgBugs * 1.5) {
      risks.push({
        type: 'bug-heavy',
        severity: 'medium',
        description: `${bugs.length} bugs planned vs historical avg ${avgBugs.toFixed(1)} bugs per sprint`,
        mitigation: 'Consider dedicating time for bug fixing or addressing root causes'
      });
    }
    
    return risks;
  }
  
  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    plannedPoints: number,
    avgVelocity: number,
    risks: Risk[],
    probability: number,
    issues: Issue[]
  ): Promise<string[]> {
    const prompt = `Analyze sprint planning and provide 3-5 specific recommendations.

Sprint Planning:
- Planned Points: ${plannedPoints}
- Historical Avg Velocity: ${avgVelocity.toFixed(1)}
- Success Probability: ${probability}%
- Total Issues: ${issues.length}

Identified Risks:
${risks.map(r => `- [${r.severity.toUpperCase()}] ${r.type}: ${r.description}`).join('\n')}

Generate 3-5 specific, actionable recommendations to improve sprint success probability.
Focus on practical steps the team can take before or during the sprint.

Return as JSON array of strings.`;

    try {
      const response = await axios.post(
        this.cerebrasEndpoint,
        {
          model: 'llama-3.3-70b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Agile coach providing sprint planning advice. Give specific, actionable recommendations. Always return valid JSON array.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
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
      console.error('⚠️ Failed to generate AI recommendations:', error);
      
      // Fallback recommendations
      const recommendations = [];
      
      if (plannedPoints > avgVelocity * 1.1) {
        recommendations.push(`Consider reducing sprint scope to match historical velocity of ${avgVelocity.toFixed(1)} points`);
      }
      
      if (risks.some(r => r.type === 'large-stories')) {
        recommendations.push('Break down large stories for better predictability and easier progress tracking');
      }
      
      if (risks.some(r => r.type === 'blocked-issues')) {
        recommendations.push('Resolve all blocked issues before sprint start to avoid delays');
      }
      
      recommendations.push('Hold daily standups to identify and address impediments early');
      recommendations.push('Review and adjust sprint scope at mid-sprint if needed');
      
      return recommendations;
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
export const sprintPredictorService = new SprintPredictorService();
