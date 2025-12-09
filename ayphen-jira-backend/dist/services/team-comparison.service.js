"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamComparisonService = exports.TeamComparisonService = void 0;
const database_1 = require("../config/database");
const Sprint_1 = require("../entities/Sprint");
const Project_1 = require("../entities/Project");
const ai_retrospective_analyzer_service_1 = require("./ai-retrospective-analyzer.service");
const axios_1 = __importDefault(require("axios"));
class TeamComparisonService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }
    /**
     * Compare performance across multiple teams
     */
    async compareTeams(projectIds, timeRange) {
        const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
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
            const teamGroups = new Map();
            for (const sprint of sprints) {
                if (!teamGroups.has(sprint.projectId)) {
                    teamGroups.set(sprint.projectId, []);
                }
                teamGroups.get(sprint.projectId).push(sprint);
            }
            // Calculate metrics for each team
            const teamMetrics = [];
            for (const [projectId, teamSprints] of teamGroups) {
                const project = await projectRepo.findOne({ where: { id: projectId } });
                const metrics = await Promise.all(teamSprints.map(s => ai_retrospective_analyzer_service_1.aiRetrospectiveAnalyzer.getSprintMetrics(s.id)));
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
        }
        catch (error) {
            console.error('❌ Error comparing teams:', error);
            throw error;
        }
    }
    /**
     * Generate AI insights about team comparison
     */
    async generateComparisonInsights(teams, rankings) {
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
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
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
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            let content = response.data.choices[0].message.content || '[]';
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                content = jsonMatch[0];
            }
            return JSON.parse(content);
        }
        catch (error) {
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
    avg(numbers) {
        return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
    }
}
exports.TeamComparisonService = TeamComparisonService;
// Export singleton instance
exports.teamComparisonService = new TeamComparisonService();
