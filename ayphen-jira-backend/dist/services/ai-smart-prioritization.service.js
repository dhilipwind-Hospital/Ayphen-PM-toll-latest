"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSmartPrioritizationService = exports.AISmartPrioritizationService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const axios_1 = __importDefault(require("axios"));
class AISmartPrioritizationService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }
    /**
     * Analyze and suggest priority for an issue
     */
    async analyzePriority(issueId) {
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const issue = await issueRepo.findOne({
                where: { id: issueId },
                relations: ['project']
            });
            if (!issue) {
                throw new Error('Issue not found');
            }
            // Analyze using multiple factors
            const urgencyScore = this.calculateUrgencyScore(issue);
            const impactScore = await this.calculateImpactScore(issue);
            const businessValue = this.calculateBusinessValue(issue);
            const riskLevel = this.determineRiskLevel(urgencyScore, impactScore);
            // Use AI for final priority suggestion
            const aiSuggestion = await this.getAIPrioritySuggestion(issue, {
                urgencyScore,
                impactScore,
                businessValue,
                riskLevel
            });
            return {
                ...aiSuggestion,
                urgencyScore,
                impactScore,
                businessValue,
                riskLevel
            };
        }
        catch (error) {
            console.error('❌ Priority analysis error:', error);
            throw new Error(`Failed to analyze priority: ${error.message}`);
        }
    }
    /**
     * Calculate urgency score based on keywords and context
     */
    calculateUrgencyScore(issue) {
        let score = 50; // Base score
        const text = `${issue.summary} ${issue.description || ''}`.toLowerCase();
        const reasons = [];
        // Critical urgency keywords
        const criticalKeywords = [
            'critical', 'urgent', 'asap', 'immediately', 'emergency',
            'production down', 'outage', 'security breach', 'data loss',
            'cannot access', 'blocking', 'broken', 'crash'
        ];
        // High urgency keywords
        const highKeywords = [
            'important', 'priority', 'deadline', 'soon', 'needed',
            'customer complaint', 'bug', 'error', 'issue', 'problem'
        ];
        // Check for critical keywords
        const criticalMatches = criticalKeywords.filter(kw => text.includes(kw));
        if (criticalMatches.length > 0) {
            score += 30;
        }
        // Check for high urgency keywords
        const highMatches = highKeywords.filter(kw => text.includes(kw));
        if (highMatches.length > 0) {
            score += 15;
        }
        // Issue type urgency
        if (issue.type === 'bug') {
            score += 10;
        }
        else if (issue.type === 'epic') {
            score -= 10; // Epics are usually less urgent
        }
        // Current priority influence
        const priorityBoost = {
            highest: 20,
            high: 10,
            medium: 0,
            low: -10,
            lowest: -20
        };
        score += priorityBoost[issue.priority] || 0;
        return Math.min(Math.max(score, 0), 100);
    }
    /**
     * Calculate impact score based on dependencies and scope
     */
    async calculateImpactScore(issue) {
        let score = 50; // Base score
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // Check for blocking issues
        const blockingIssues = await issueRepo.count({
            where: { projectId: issue.projectId }
            // TODO: Add proper link checking when issue links are available
        });
        // Issue type impact
        const typeImpact = {
            epic: 30, // Epics have high impact
            story: 15, // Stories moderate impact
            task: 10, // Tasks lower impact
            bug: 20, // Bugs can have high impact
            subtask: 5 // Subtasks lowest impact
        };
        score += typeImpact[issue.type] || 0;
        // Check description for impact indicators
        const text = `${issue.summary} ${issue.description || ''}`.toLowerCase();
        const impactKeywords = [
            'all users', 'entire system', 'multiple', 'widespread',
            'customer facing', 'revenue', 'business critical',
            'performance', 'scalability', 'security'
        ];
        const impactMatches = impactKeywords.filter(kw => text.includes(kw));
        score += impactMatches.length * 5;
        return Math.min(Math.max(score, 0), 100);
    }
    /**
     * Calculate business value
     */
    calculateBusinessValue(issue) {
        let score = 50; // Base score
        const text = `${issue.summary} ${issue.description || ''}`.toLowerCase();
        // Business value keywords
        const businessKeywords = {
            high: ['revenue', 'customer', 'sales', 'conversion', 'growth', 'profit'],
            medium: ['user experience', 'engagement', 'retention', 'satisfaction'],
            low: ['internal', 'technical debt', 'refactor', 'cleanup']
        };
        // High value
        const highMatches = businessKeywords.high.filter(kw => text.includes(kw));
        score += highMatches.length * 10;
        // Medium value
        const mediumMatches = businessKeywords.medium.filter(kw => text.includes(kw));
        score += mediumMatches.length * 5;
        // Low value (reduce score)
        const lowMatches = businessKeywords.low.filter(kw => text.includes(kw));
        score -= lowMatches.length * 5;
        // Labels influence
        if (issue.labels) {
            const valuableLabels = ['customer-request', 'revenue', 'critical-path'];
            const hasValuableLabel = issue.labels.some(label => valuableLabels.some(vl => label.toLowerCase().includes(vl)));
            if (hasValuableLabel)
                score += 15;
        }
        return Math.min(Math.max(score, 0), 100);
    }
    /**
     * Determine risk level
     */
    determineRiskLevel(urgencyScore, impactScore) {
        const combinedScore = (urgencyScore + impactScore) / 2;
        if (combinedScore >= 80)
            return 'critical';
        if (combinedScore >= 65)
            return 'high';
        if (combinedScore >= 40)
            return 'medium';
        return 'low';
    }
    /**
     * Get AI-powered priority suggestion
     */
    async getAIPrioritySuggestion(issue, scores) {
        try {
            const prompt = `Analyze this Jira issue and suggest the optimal priority level.

Issue Details:
- Type: ${issue.type}
- Summary: ${issue.summary}
- Description: ${issue.description || 'No description'}
- Current Priority: ${issue.priority}
- Labels: ${issue.labels?.join(', ') || 'None'}

Calculated Scores:
- Urgency: ${scores.urgencyScore}/100
- Impact: ${scores.impactScore}/100
- Business Value: ${scores.businessValue}/100
- Risk Level: ${scores.riskLevel}

Return ONLY a valid JSON object:
{
  "suggestedPriority": "highest" | "high" | "medium" | "low" | "lowest",
  "confidence": number (0-100),
  "reasons": ["reason1", "reason2", "reason3"]
}

Priority Guidelines:
- HIGHEST: Production outages, security issues, critical bugs affecting all users
- HIGH: Important features, bugs affecting many users, deadline-driven work
- MEDIUM: Standard features, moderate bugs, planned improvements
- LOW: Nice-to-have features, minor bugs, technical debt
- LOWEST: Future considerations, documentation, cleanup tasks

Consider:
1. Urgency vs. Importance matrix
2. Business impact and value
3. Dependencies and blockers
4. Customer/user impact
5. Technical risk`;
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama3.1-8b',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert project manager specializing in issue prioritization. Return only valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0].message.content.trim();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    suggestedPriority: result.suggestedPriority || this.fallbackPriority(scores),
                    confidence: result.confidence || 70,
                    reasons: result.reasons || this.generateReasons(issue, scores)
                };
            }
            return this.fallbackPrioritization(issue, scores);
        }
        catch (error) {
            console.error('AI prioritization failed, using fallback:', error);
            return this.fallbackPrioritization(issue, scores);
        }
    }
    /**
     * Fallback prioritization without AI
     */
    fallbackPrioritization(issue, scores) {
        const priority = this.fallbackPriority(scores);
        const reasons = this.generateReasons(issue, scores);
        return {
            suggestedPriority: priority,
            confidence: 75,
            reasons
        };
    }
    /**
     * Calculate fallback priority
     */
    fallbackPriority(scores) {
        const avgScore = (scores.urgencyScore + scores.impactScore + scores.businessValue) / 3;
        if (avgScore >= 80)
            return 'highest';
        if (avgScore >= 65)
            return 'high';
        if (avgScore >= 45)
            return 'medium';
        if (avgScore >= 25)
            return 'low';
        return 'lowest';
    }
    /**
     * Generate human-readable reasons
     */
    generateReasons(issue, scores) {
        const reasons = [];
        // Urgency reasons
        if (scores.urgencyScore >= 70) {
            reasons.push(`High urgency detected (${scores.urgencyScore}/100)`);
        }
        // Impact reasons
        if (scores.impactScore >= 70) {
            reasons.push(`Significant impact on system (${scores.impactScore}/100)`);
        }
        // Business value reasons
        if (scores.businessValue >= 70) {
            reasons.push(`High business value (${scores.businessValue}/100)`);
        }
        // Risk reasons
        if (scores.riskLevel === 'critical' || scores.riskLevel === 'high') {
            reasons.push(`${scores.riskLevel.charAt(0).toUpperCase() + scores.riskLevel.slice(1)} risk level`);
        }
        // Type-specific reasons
        if (issue.type === 'bug') {
            reasons.push('Bug issues require prompt attention');
        }
        else if (issue.type === 'epic') {
            reasons.push('Epic - strategic importance');
        }
        // Default reason if none found
        if (reasons.length === 0) {
            reasons.push('Based on standard prioritization criteria');
        }
        return reasons.slice(0, 4); // Limit to 4 reasons
    }
    /**
     * Bulk prioritize multiple issues
     */
    async bulkAnalyzePriority(issueIds) {
        const results = [];
        for (const issueId of issueIds) {
            try {
                const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
                const issue = await issueRepo.findOne({ where: { id: issueId } });
                if (!issue)
                    continue;
                const analysis = await this.analyzePriority(issueId);
                results.push({
                    issueId,
                    currentPriority: issue.priority,
                    suggestedPriority: analysis.suggestedPriority,
                    confidence: analysis.confidence,
                    shouldChange: issue.priority !== analysis.suggestedPriority,
                    reasons: analysis.reasons
                });
            }
            catch (error) {
                console.error(`Failed to analyze priority for issue ${issueId}:`, error);
            }
        }
        return results;
    }
    /**
     * Apply suggested priority to issue
     */
    async applyPriority(issueId, priority) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const issue = await issueRepo.findOne({ where: { id: issueId } });
        if (!issue) {
            throw new Error('Issue not found');
        }
        issue.priority = priority;
        await issueRepo.save(issue);
        return issue;
    }
}
exports.AISmartPrioritizationService = AISmartPrioritizationService;
exports.aiSmartPrioritizationService = new AISmartPrioritizationService();
