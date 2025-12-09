import { AppDataSource } from '../config/database';
import { Sprint } from '../entities/Sprint';
import { Issue } from '../entities/Issue';
import axios from 'axios';

interface SprintMetrics {
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  completionRate: number;
  bugsRaised: number;
  carryOverIssues: number;
  totalIssues: number;
  completedIssues: number;
  avgCycleTime: number;
}

interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  themes: string[];
}

interface RetrospectiveReport {
  executiveSummary: string;
  wentWell: string[];
  challenges: string[];
  recommendations: string[];
  sentiment: SentimentAnalysis;
  metrics: SprintMetrics;
  generatedAt: Date;
}

export class AIRetrospectiveAnalyzerService {
  private cerebrasApiKey: string;
  private cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';

  constructor() {
    this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
  }

  /**
   * Main method: Generate AI-powered retrospective report
   */
  async generateRetrospective(sprintId: string): Promise<RetrospectiveReport> {
    try {
      console.log(`🤖 Generating AI retrospective for sprint ${sprintId}...`);

      // 1. Aggregate sprint metrics
      const metrics = await this.aggregateSprintMetrics(sprintId);
      console.log(`📊 Metrics aggregated:`, metrics);

      // 2. Extract comments and descriptions
      const textData = await this.extractSprintText(sprintId);
      console.log(`📝 Extracted ${textData.comments.length} comments and ${textData.descriptions.length} descriptions`);

      // 3. Analyze sentiment
      const sentiment = await this.analyzeSentiment(textData.comments);
      console.log(`😊 Sentiment analyzed:`, sentiment);

      // 4. Generate AI report
      const report = await this.generateAIReport(metrics, textData, sentiment);
      console.log(`✅ AI report generated successfully`);

      return {
        ...report,
        sentiment,
        metrics,
        generatedAt: new Date()
      };
    } catch (error: any) {
      console.error('❌ Error generating retrospective:', error);
      throw new Error(`Failed to generate retrospective: ${error.message}`);
    }
  }

  /**
   * Aggregate sprint metrics
   */
  private async aggregateSprintMetrics(sprintId: string): Promise<SprintMetrics> {
    try {
      const sprintRepo = AppDataSource.getRepository(Sprint);
      const issueRepo = AppDataSource.getRepository(Issue);

      const sprint = await sprintRepo.findOne({ where: { id: sprintId } });
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      // Get all issues in the sprint
      const issues = await issueRepo.find({
        where: { sprintId },
        relations: ['comments']
      });

      // Calculate metrics
      const plannedPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
      const completedIssues = issues.filter(i => i.status === 'done' || i.status === 'closed');
      const completedPoints = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
      const bugsRaised = issues.filter(i => i.type === 'bug').length;
      const carryOverIssues = issues.filter(i => i.status !== 'done' && i.status !== 'closed').length;

      // Calculate average cycle time (simplified)
      const cycleTimesMs = completedIssues
        .filter(i => i.createdAt && i.updatedAt)
        .map(i => new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime());
      
      const avgCycleTime = cycleTimesMs.length > 0
        ? cycleTimesMs.reduce((a, b) => a + b, 0) / cycleTimesMs.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      return {
        plannedPoints,
        completedPoints,
        velocity: completedPoints,
        completionRate: plannedPoints > 0 ? (completedPoints / plannedPoints) * 100 : 0,
        bugsRaised,
        carryOverIssues,
        totalIssues: issues.length,
        completedIssues: completedIssues.length,
        avgCycleTime: Math.round(avgCycleTime * 10) / 10
      };
    } catch (error: any) {
      console.error('Error aggregating metrics:', error);
      throw error;
    }
  }

  /**
   * Extract text data from sprint (comments and descriptions)
   */
  private async extractSprintText(sprintId: string): Promise<{
    comments: string[];
    descriptions: string[];
    issues: Array<{ key: string; summary: string; status: string }>;
  }> {
    try {
      const issueRepo = AppDataSource.getRepository(Issue);

      const issues = await issueRepo.find({
        where: { sprintId },
        select: ['id', 'key', 'summary', 'description', 'status']
      });

      // Note: Comments are stored in-memory in the current implementation
      // For now, we'll use issue descriptions as the primary text source
      // In a production system, you would fetch comments from a Comment entity or table

      return {
        comments: [], // Comments not available in current implementation
        descriptions: issues.map(i => i.description).filter(Boolean),
        issues: issues.map(i => ({
          key: i.key,
          summary: i.summary,
          status: i.status
        }))
      };
    } catch (error: any) {
      console.error('Error extracting text:', error);
      return { comments: [], descriptions: [], issues: [] };
    }
  }

  /**
   * Analyze sentiment from comments
   */
  private async analyzeSentiment(comments: string[]): Promise<SentimentAnalysis> {
    if (comments.length === 0) {
      return {
        overall: 'neutral',
        score: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        themes: []
      };
    }

    try {
      const prompt = `Analyze the sentiment of these team comments from a sprint. Classify each as positive, neutral, or negative, and identify common themes.

Comments:
${comments.slice(0, 50).map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return ONLY valid JSON:
{
  "overall": "positive|neutral|negative",
  "score": 0.5,
  "positiveCount": 10,
  "neutralCount": 5,
  "negativeCount": 2,
  "themes": ["collaboration", "technical challenges", "good progress"]
}`;

      const response = await axios.post(
        this.cerebrasEndpoint,
        {
          model: 'llama-3.3-70b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at sentiment analysis for agile teams. Always return valid JSON.'
            },
            { role: 'user', content: prompt }
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

      let content = response.data.choices[0].message.content || '{}';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        overall: 'neutral',
        score: 0,
        positiveCount: 0,
        neutralCount: comments.length,
        negativeCount: 0,
        themes: []
      };
    }
  }

  /**
   * Generate AI report using Cerebras
   */
  private async generateAIReport(
    metrics: SprintMetrics,
    textData: any,
    sentiment: SentimentAnalysis
  ): Promise<Omit<RetrospectiveReport, 'sentiment' | 'metrics' | 'generatedAt'>> {
    try {
      const prompt = `You are an expert Scrum Master analyzing a sprint retrospective. Generate a comprehensive report.

**SPRINT METRICS:**
- Planned Story Points: ${metrics.plannedPoints}
- Completed Story Points: ${metrics.completedPoints}
- Velocity: ${metrics.velocity}
- Completion Rate: ${metrics.completionRate.toFixed(1)}%
- Bugs Raised: ${metrics.bugsRaised}
- Carry-Over Issues: ${metrics.carryOverIssues}
- Total Issues: ${metrics.totalIssues}
- Completed Issues: ${metrics.completedIssues}
- Avg Cycle Time: ${metrics.avgCycleTime} days

**TEAM SENTIMENT:**
- Overall: ${sentiment.overall}
- Positive Comments: ${sentiment.positiveCount}
- Neutral Comments: ${sentiment.neutralCount}
- Negative Comments: ${sentiment.negativeCount}
- Themes: ${sentiment.themes.join(', ')}

**COMPLETED ISSUES:**
${textData.issues.filter((i: any) => i.status === 'done').slice(0, 10).map((i: any) => `- ${i.key}: ${i.summary}`).join('\n')}

**INCOMPLETE ISSUES:**
${textData.issues.filter((i: any) => i.status !== 'done').slice(0, 5).map((i: any) => `- ${i.key}: ${i.summary}`).join('\n')}

Generate a retrospective report with:
1. Executive Summary (2-3 sentences)
2. What Went Well (3-5 points)
3. Challenges & Bottlenecks (3-5 points)
4. Recommendations for Next Sprint (3-5 actionable items)

Return ONLY valid JSON:
{
  "executiveSummary": "Sprint summary here...",
  "wentWell": [
    "Point 1",
    "Point 2",
    "Point 3"
  ],
  "challenges": [
    "Challenge 1",
    "Challenge 2",
    "Challenge 3"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}`;

      console.log('🤖 Calling Cerebras AI for report generation...');
      const response = await axios.post(
        this.cerebrasEndpoint,
        {
          model: 'llama-3.3-70b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Scrum Master and Agile coach. Provide insightful, actionable retrospective analysis. Always return valid JSON.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.cerebrasApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let content = response.data.choices[0].message.content || '{}';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      const report = JSON.parse(content);
      console.log('✅ AI report generated successfully');

      return {
        executiveSummary: report.executiveSummary || 'Sprint completed.',
        wentWell: report.wentWell || [],
        challenges: report.challenges || [],
        recommendations: report.recommendations || []
      };
    } catch (error: any) {
      console.error('Error generating AI report:', error);
      
      // Fallback report
      return {
        executiveSummary: `Sprint completed with ${metrics.completionRate.toFixed(1)}% of planned work. Team delivered ${metrics.completedPoints} story points out of ${metrics.plannedPoints} planned.`,
        wentWell: [
          `Completed ${metrics.completedIssues} out of ${metrics.totalIssues} issues`,
          `Team velocity: ${metrics.velocity} story points`,
          sentiment.overall === 'positive' ? 'Positive team morale' : 'Team collaboration'
        ],
        challenges: [
          metrics.carryOverIssues > 0 ? `${metrics.carryOverIssues} issues carried over to next sprint` : 'Sprint scope management',
          metrics.bugsRaised > 3 ? `${metrics.bugsRaised} bugs raised during sprint` : 'Quality assurance',
          metrics.completionRate < 80 ? 'Lower than expected completion rate' : 'Sprint planning accuracy'
        ],
        recommendations: [
          'Review sprint capacity and adjust planning',
          'Focus on reducing carry-over work',
          'Improve estimation accuracy',
          'Enhance testing practices to reduce bugs'
        ]
      };
    }
  }

  /**
   * Get sprint metrics only (without AI analysis)
   */
  async getSprintMetrics(sprintId: string): Promise<SprintMetrics> {
    return this.aggregateSprintMetrics(sprintId);
  }

  /**
   * Generate historical trends comparing current sprint to previous sprints
   */
  async generateHistoricalTrends(
    currentSprintId: string,
    lookbackSprints: number = 5
  ): Promise<{
    trends: {
      velocityTrend: 'improving' | 'declining' | 'stable';
      bugTrend: 'improving' | 'worsening' | 'stable';
      completionRateTrend: 'improving' | 'declining' | 'stable';
    };
    comparison: Array<{
      sprintName: string;
      sprintId: string;
      velocity: number;
      completionRate: number;
      bugsRaised: number;
      endDate: Date;
    }>;
    insights: string[];
  }> {
    try {
      const sprintRepo = AppDataSource.getRepository(Sprint);
      
      // Get current sprint
      const currentSprint = await sprintRepo.findOne({ where: { id: currentSprintId } });
      if (!currentSprint) {
        throw new Error('Sprint not found');
      }
      
      const currentMetrics = await this.getSprintMetrics(currentSprintId);
      
      // Get previous sprints from same project
      const previousSprints = await sprintRepo
        .createQueryBuilder('sprint')
        .where('sprint.projectId = :projectId', { projectId: currentSprint.projectId })
        .andWhere('sprint.endDate < :currentStart', { currentStart: currentSprint.startDate })
        .andWhere('sprint.status = :status', { status: 'closed' })
        .orderBy('sprint.endDate', 'DESC')
        .take(lookbackSprints)
        .getMany();
      
      // Get metrics for each previous sprint
      const historicalMetrics = await Promise.all(
        previousSprints.map(async (sprint) => ({
          sprintName: sprint.name,
          sprintId: sprint.id,
          endDate: sprint.endDate,
          metrics: await this.getSprintMetrics(sprint.id)
        }))
      );
      
      // Calculate averages
      const avgVelocity = historicalMetrics.length > 0
        ? historicalMetrics.reduce((sum, h) => sum + h.metrics.velocity, 0) / historicalMetrics.length
        : 0;
      
      const avgCompletionRate = historicalMetrics.length > 0
        ? historicalMetrics.reduce((sum, h) => sum + h.metrics.completionRate, 0) / historicalMetrics.length
        : 0;
      
      const avgBugs = historicalMetrics.length > 0
        ? historicalMetrics.reduce((sum, h) => sum + h.metrics.bugsRaised, 0) / historicalMetrics.length
        : 0;
      
      // Determine trends
      const velocityTrend = 
        currentMetrics.velocity > avgVelocity * 1.1 ? 'improving' :
        currentMetrics.velocity < avgVelocity * 0.9 ? 'declining' : 'stable';
      
      const completionRateTrend =
        currentMetrics.completionRate > avgCompletionRate * 1.1 ? 'improving' :
        currentMetrics.completionRate < avgCompletionRate * 0.9 ? 'declining' : 'stable';
      
      const bugTrend =
        currentMetrics.bugsRaised < avgBugs * 0.9 ? 'improving' :
        currentMetrics.bugsRaised > avgBugs * 1.1 ? 'worsening' : 'stable';
      
      // Generate AI insights
      const insights = await this.generateTrendInsights(
        currentMetrics,
        historicalMetrics,
        { velocityTrend, bugTrend, completionRateTrend },
        avgVelocity,
        avgCompletionRate,
        avgBugs
      );
      
      return {
        trends: { velocityTrend, bugTrend, completionRateTrend },
        comparison: [
          {
            sprintName: currentSprint.name,
            sprintId: currentSprint.id,
            velocity: currentMetrics.velocity,
            completionRate: currentMetrics.completionRate,
            bugsRaised: currentMetrics.bugsRaised,
            endDate: currentSprint.endDate
          },
          ...historicalMetrics.map(h => ({
            sprintName: h.sprintName,
            sprintId: h.sprintId,
            velocity: h.metrics.velocity,
            completionRate: h.metrics.completionRate,
            bugsRaised: h.metrics.bugsRaised,
            endDate: h.endDate
          }))
        ],
        insights
      };
    } catch (error: any) {
      console.error('❌ Error generating historical trends:', error);
      throw error;
    }
  }

  /**
   * Generate AI insights about trends
   */
  private async generateTrendInsights(
    current: SprintMetrics,
    historical: any[],
    trends: any,
    avgVelocity: number,
    avgCompletionRate: number,
    avgBugs: number
  ): Promise<string[]> {
    if (historical.length === 0) {
      return ['Not enough historical data to generate insights. Complete more sprints to see trends.'];
    }

    const prompt = `Analyze sprint trends and provide 3-5 actionable insights.

Current Sprint:
- Velocity: ${current.velocity} points
- Completion Rate: ${current.completionRate.toFixed(1)}%
- Bugs Raised: ${current.bugsRaised}

Historical Average (last ${historical.length} sprints):
- Avg Velocity: ${avgVelocity.toFixed(1)} points
- Avg Completion: ${avgCompletionRate.toFixed(1)}%
- Avg Bugs: ${avgBugs.toFixed(1)}

Trends:
- Velocity: ${trends.velocityTrend}
- Completion Rate: ${trends.completionRateTrend}
- Bug Quality: ${trends.bugTrend}

Generate 3-5 specific, actionable insights about these trends. Return as JSON array of strings.

Example: ["Velocity has improved 15% - team capacity planning is working well", "Bug count increased - consider adding more testing"]`;

    try {
      const response = await axios.post(
        this.cerebrasEndpoint,
        {
          model: 'llama-3.3-70b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Agile coach analyzing sprint trends. Provide specific, actionable insights. Always return valid JSON array.'
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
      console.error('⚠️ Failed to generate AI insights:', error);
      
      // Fallback insights
      const insights = [];
      
      if (trends.velocityTrend === 'improving') {
        insights.push(`Velocity improved to ${current.velocity} points (${((current.velocity - avgVelocity) / avgVelocity * 100).toFixed(1)}% above average)`);
      } else if (trends.velocityTrend === 'declining') {
        insights.push(`Velocity declined to ${current.velocity} points (${((avgVelocity - current.velocity) / avgVelocity * 100).toFixed(1)}% below average)`);
      }
      
      if (trends.bugTrend === 'worsening') {
        insights.push(`Bug count increased to ${current.bugsRaised} (consider adding more testing or code reviews)`);
      } else if (trends.bugTrend === 'improving') {
        insights.push(`Bug count decreased to ${current.bugsRaised} (quality practices are working well)`);
      }
      
      if (trends.completionRateTrend === 'improving') {
        insights.push(`Completion rate improved to ${current.completionRate.toFixed(1)}% (sprint planning is more accurate)`);
      }
      
      return insights.length > 0 ? insights : ['Continue monitoring sprint metrics for trend analysis'];
    }
  }
}

// Export singleton instance
export const aiRetrospectiveAnalyzer = new AIRetrospectiveAnalyzerService();
