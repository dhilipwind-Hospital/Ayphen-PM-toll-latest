"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSprintPlannerService = exports.AISprintPlannerService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const Sprint_1 = require("../entities/Sprint");
const ProjectMember_1 = require("../entities/ProjectMember");
const axios_1 = __importDefault(require("axios"));
class AISprintPlannerService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }
    /**
     * Suggest optimal sprint composition
     */
    async suggestSprintComposition(input) {
        try {
            // Get backlog issues
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const issues = await issueRepo.findByIds(input.backlogIssueIds);
            // Get historical velocity
            const historicalVelocity = await this.getHistoricalVelocity(input.projectId);
            // Analyze dependencies
            const dependencies = await this.analyzeDependencies(issues);
            // Use AI to optimize selection
            const aiRecommendation = await this.getAIRecommendation(issues, input.teamCapacity, historicalVelocity, dependencies);
            return aiRecommendation;
        }
        catch (error) {
            console.error('❌ Sprint planning error:', error);
            throw new Error(`Failed to suggest sprint composition: ${error.message}`);
        }
    }
    /**
     * Get AI recommendation for sprint composition
     */
    async getAIRecommendation(issues, capacity, historicalVelocity, dependencies) {
        const issuesData = issues.map(i => ({
            id: i.id,
            key: i.key,
            summary: i.summary,
            type: i.type,
            priority: i.priority,
            storyPoints: i.storyPoints || 0,
            dependencies: dependencies.get(i.id) || []
        }));
        const prompt = `You are an expert Agile sprint planner. Analyze this data and suggest optimal sprint composition.

Available capacity: ${capacity} story points
Historical velocity: ${historicalVelocity} points/sprint
Backlog issues: ${JSON.stringify(issuesData, null, 2)}

Recommend which issues to include in the sprint based on:
1. Priority (highest first)
2. Dependencies (resolve blockers first)
3. Story points (don't overcommit)
4. Value delivery (maximize business value)
5. Risk mitigation (balance risky vs safe items)

Return ONLY a valid JSON object:
{
  "recommendedIssues": [
    {
      "issueId": "uuid",
      "key": "PROJ-123",
      "summary": "Issue title",
      "storyPoints": 5,
      "priority": "high",
      "reason": "Why this issue should be included",
      "confidence": 0.85
    }
  ],
  "totalPoints": 25,
  "capacityUtilization": 0.83,
  "risks": ["Risk 1", "Risk 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;
        try {
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama3.1-8b',
                messages: [
                    { role: 'system', content: 'You are a JSON-only response assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0].message.content;
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```\n?/g, '');
            }
            return JSON.parse(jsonStr);
        }
        catch (error) {
            console.error('❌ AI recommendation error:', error);
            // Fallback: simple priority-based selection
            return this.fallbackSelection(issues, capacity);
        }
    }
    /**
     * Fallback selection algorithm
     */
    fallbackSelection(issues, capacity) {
        const sorted = issues
            .filter(i => i.storyPoints && i.storyPoints > 0)
            .sort((a, b) => {
            const priorityOrder = { highest: 5, high: 4, medium: 3, low: 2, lowest: 1 };
            return (priorityOrder[b.priority] || 0) -
                (priorityOrder[a.priority] || 0);
        });
        const selected = [];
        let totalPoints = 0;
        for (const issue of sorted) {
            if (totalPoints + (issue.storyPoints || 0) <= capacity) {
                selected.push({
                    issueId: issue.id,
                    key: issue.key,
                    summary: issue.summary,
                    storyPoints: issue.storyPoints || 0,
                    priority: issue.priority,
                    reason: 'Selected based on priority and capacity',
                    confidence: 0.7
                });
                totalPoints += issue.storyPoints || 0;
            }
        }
        return {
            recommendedIssues: selected,
            totalPoints,
            capacityUtilization: totalPoints / capacity,
            risks: totalPoints > capacity * 0.9 ? ['Sprint may be overcommitted'] : [],
            recommendations: ['Review dependencies before starting sprint']
        };
    }
    /**
     * Predict sprint success
     */
    async predictSprintSuccess(sprintId) {
        try {
            const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const sprint = await sprintRepo.findOne({ where: { id: sprintId } });
            if (!sprint) {
                throw new Error('Sprint not found');
            }
            const issues = await issueRepo.find({ where: { sprintId } });
            // Calculate factors
            const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            const teamVelocity = await this.getHistoricalVelocity(sprint.projectId);
            const blockers = issues.filter(i => i.status === 'blocked').length;
            const inProgress = issues.filter(i => i.status === 'In Progress').length;
            const done = issues.filter(i => i.status === 'Done').length;
            // Calculate progress
            const donePoints = issues
                .filter(i => i.status === 'Done')
                .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            const progress = totalPoints > 0 ? donePoints / totalPoints : 0;
            // Days elapsed
            const startDate = new Date(sprint.startDate);
            const endDate = new Date(sprint.endDate);
            const today = new Date();
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const remainingDays = Math.max(0, totalDays - elapsedDays);
            // Predict success
            const expectedProgress = elapsedDays / totalDays;
            const progressDelta = progress - expectedProgress;
            let successProbability = 0.5;
            if (progressDelta > 0.2)
                successProbability = 0.9;
            else if (progressDelta > 0.1)
                successProbability = 0.75;
            else if (progressDelta > 0)
                successProbability = 0.6;
            else if (progressDelta > -0.1)
                successProbability = 0.4;
            else if (progressDelta > -0.2)
                successProbability = 0.25;
            else
                successProbability = 0.1;
            // Adjust for blockers
            if (blockers > 0) {
                successProbability *= 0.8;
            }
            // Identify risks
            const risks = [];
            if (blockers > 0) {
                risks.push({
                    type: 'blockers',
                    severity: blockers > 2 ? 'high' : 'medium',
                    description: `${blockers} issue(s) are blocked`,
                    mitigation: 'Resolve blockers immediately to unblock progress'
                });
            }
            if (progressDelta < -0.1) {
                risks.push({
                    type: 'behind_schedule',
                    severity: progressDelta < -0.2 ? 'high' : 'medium',
                    description: 'Sprint is behind schedule',
                    mitigation: 'Consider descoping low-priority items or extending sprint'
                });
            }
            if (totalPoints > teamVelocity * 1.2) {
                risks.push({
                    type: 'overcommitment',
                    severity: 'medium',
                    description: 'Sprint is overcommitted compared to historical velocity',
                    mitigation: 'Move lower priority items to backlog'
                });
            }
            // Generate recommendations
            const recommendations = [];
            if (inProgress > issues.length * 0.5) {
                recommendations.push('Too many items in progress. Focus on completing existing work.');
            }
            if (remainingDays < 3 && progress < 0.8) {
                recommendations.push('Sprint is ending soon. Prioritize completing high-value items.');
            }
            if (blockers > 0) {
                recommendations.push('Address blockers in daily standup to maintain momentum.');
            }
            // Estimate completion date
            const pointsRemaining = totalPoints - donePoints;
            const dailyVelocity = donePoints / Math.max(elapsedDays, 1);
            const daysNeeded = dailyVelocity > 0 ? Math.ceil(pointsRemaining / dailyVelocity) : remainingDays;
            const completionDate = new Date(today.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
            return {
                successProbability: Math.round(successProbability * 100) / 100,
                completionDate,
                risks,
                recommendations,
                confidence: 0.75
            };
        }
        catch (error) {
            console.error('❌ Sprint prediction error:', error);
            throw new Error(`Failed to predict sprint success: ${error.message}`);
        }
    }
    /**
     * Get historical velocity
     */
    async getHistoricalVelocity(projectId) {
        try {
            const sprintRepo = database_1.AppDataSource.getRepository(Sprint_1.Sprint);
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            // Get last 3 completed sprints
            const sprints = await sprintRepo.find({
                where: { projectId, status: 'completed' },
                order: { endDate: 'DESC' },
                take: 3
            });
            if (sprints.length === 0) {
                return 20; // Default velocity
            }
            // Calculate average velocity
            let totalVelocity = 0;
            for (const sprint of sprints) {
                const issues = await issueRepo.find({
                    where: { sprintId: sprint.id, status: 'Done' }
                });
                const sprintVelocity = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                totalVelocity += sprintVelocity;
            }
            return Math.round(totalVelocity / sprints.length);
        }
        catch (error) {
            console.error('❌ Get velocity error:', error);
            return 20;
        }
    }
    /**
     * Analyze dependencies
     */
    async analyzeDependencies(issues) {
        const dependencies = new Map();
        for (const issue of issues) {
            const deps = [];
            // Check for parent dependencies
            if (issue.parentId) {
                deps.push(issue.parentId);
            }
            // Check for epic dependencies
            if (issue.epicId) {
                deps.push(issue.epicId);
            }
            // TODO: Check for linked issue dependencies
            if (deps.length > 0) {
                dependencies.set(issue.id, deps);
            }
        }
        return dependencies;
    }
    /**
     * Balance workload across team
     */
    async balanceWorkload(sprintId) {
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const memberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
            // Get sprint issues
            const issues = await issueRepo.find({
                where: { sprintId },
                relations: ['assignee']
            });
            // Get team members
            const sprint = await database_1.AppDataSource.getRepository(Sprint_1.Sprint).findOne({
                where: { id: sprintId }
            });
            if (!sprint) {
                throw new Error('Sprint not found');
            }
            const members = await memberRepo.find({
                where: { projectId: sprint.projectId },
                relations: ['user']
            });
            // Calculate assignments
            const assignments = members.map(member => {
                const userIssues = issues.filter(i => i.assigneeId === member.userId);
                const assignedPoints = userIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                const capacity = 20; // Default capacity per person
                return {
                    userId: member.userId,
                    userName: member.user?.name || 'Unknown',
                    assignedPoints,
                    capacity,
                    utilization: assignedPoints / capacity,
                    issues: userIssues.map(i => i.key)
                };
            });
            // Check if balanced
            const avgUtilization = assignments.reduce((sum, a) => sum + a.utilization, 0) / assignments.length;
            const maxDeviation = Math.max(...assignments.map(a => Math.abs(a.utilization - avgUtilization)));
            const balanced = maxDeviation < 0.2; // Within 20% of average
            // Generate suggestions
            const suggestions = [];
            const overloaded = assignments.filter(a => a.utilization > 1.2);
            const underutilized = assignments.filter(a => a.utilization < 0.6);
            if (overloaded.length > 0) {
                suggestions.push(`${overloaded.map(a => a.userName).join(', ')} may be overloaded. Consider redistributing work.`);
            }
            if (underutilized.length > 0) {
                suggestions.push(`${underutilized.map(a => a.userName).join(', ')} have capacity for more work.`);
            }
            return {
                assignments,
                balanced,
                suggestions
            };
        }
        catch (error) {
            console.error('❌ Balance workload error:', error);
            throw new Error(`Failed to balance workload: ${error.message}`);
        }
    }
}
exports.AISprintPlannerService = AISprintPlannerService;
exports.aiSprintPlannerService = new AISprintPlannerService();
