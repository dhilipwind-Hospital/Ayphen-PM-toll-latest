"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pmBotService = exports.PMBotService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const User_1 = require("../entities/User");
const ProjectMember_1 = require("../entities/ProjectMember");
const typeorm_1 = require("typeorm");
class PMBotService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        // Configuration
        this.STALE_THRESHOLD_DAYS = 7;
        this.ESCALATION_THRESHOLD_DAYS = 14;
        this.MAX_WORKLOAD_POINTS = 25; // Max story points per person
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }
    /**
     * Smart Auto-Assignment
     * Analyzes issue and assigns to best developer based on:
     * - Past work on similar issues
     * - Current workload
     * - Expertise match
     */
    async autoAssignIssue(issueId) {
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const userRepo = database_1.AppDataSource.getRepository(User_1.User);
            const memberRepo = database_1.AppDataSource.getRepository(ProjectMember_1.ProjectMember);
            const issue = await issueRepo.findOne({
                where: { id: issueId },
                relations: ['project']
            });
            if (!issue) {
                throw new Error('Issue not found');
            }
            // Get all project members
            const members = await memberRepo.find({
                where: { projectId: issue.projectId },
                relations: ['user']
            });
            if (members.length === 0) {
                return {
                    assignedTo: null,
                    confidence: 0,
                    reasoning: ['No team members found in project']
                };
            }
            // Score each team member
            const scores = [];
            for (const member of members) {
                if (!member.user)
                    continue;
                const score = await this.calculateAssignmentScore(issue, member.user, issue.projectId);
                scores.push(score);
            }
            // Sort by score (highest first)
            scores.sort((a, b) => b.score - a.score);
            const bestMatch = scores[0];
            if (bestMatch && bestMatch.score > 0) {
                const assignee = await userRepo.findOne({
                    where: { id: bestMatch.userId }
                });
                // Actually assign the issue
                if (assignee) {
                    issue.assigneeId = assignee.id;
                    await issueRepo.save(issue);
                    // Log PMBot action
                    await this.logPMBotAction('auto_assign', {
                        issueId: issue.id,
                        issueKey: issue.key,
                        assignedTo: assignee.name,
                        score: bestMatch.score,
                        reasons: bestMatch.reasons
                    });
                }
                return {
                    assignedTo: assignee || null,
                    confidence: Math.min(bestMatch.score / 100, 1),
                    reasoning: bestMatch.reasons
                };
            }
            return {
                assignedTo: null,
                confidence: 0,
                reasoning: ['No suitable assignee found']
            };
        }
        catch (error) {
            console.error('❌ PMBot auto-assign error:', error);
            throw new Error(`Auto-assignment failed: ${error.message}`);
        }
    }
    /**
     * Calculate assignment score for a user
     */
    async calculateAssignmentScore(issue, user, projectId) {
        const reasons = [];
        let totalScore = 0;
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // 1. Check current workload (40 points)
        const assignedIssues = await issueRepo.find({
            where: {
                assigneeId: user.id,
                status: (0, typeorm_1.Not)('done')
            }
        });
        const currentWorkload = assignedIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        const workloadScore = Math.max(0, 40 - (currentWorkload / this.MAX_WORKLOAD_POINTS) * 40);
        totalScore += workloadScore;
        if (currentWorkload < this.MAX_WORKLOAD_POINTS * 0.5) {
            reasons.push(`✅ Low workload (${currentWorkload} points)`);
        }
        else if (currentWorkload > this.MAX_WORKLOAD_POINTS * 0.9) {
            reasons.push(`⚠️ High workload (${currentWorkload} points)`);
        }
        // 2. Check expertise (similar issues worked on) (30 points)
        const keywords = this.extractKeywords(issue.summary + ' ' + (issue.description || ''));
        const pastWork = await issueRepo.find({
            where: {
                assigneeId: user.id,
                projectId,
                status: 'done'
            },
            take: 50
        });
        let similarIssues = 0;
        for (const pastIssue of pastWork) {
            const pastKeywords = this.extractKeywords(pastIssue.summary + ' ' + (pastIssue.description || ''));
            const commonKeywords = keywords.filter(k => pastKeywords.includes(k));
            if (commonKeywords.length >= 2) {
                similarIssues++;
            }
        }
        const expertiseScore = Math.min(30, similarIssues * 5);
        totalScore += expertiseScore;
        if (similarIssues > 0) {
            reasons.push(`🎯 Worked on ${similarIssues} similar issue(s)`);
        }
        // 3. Issue type match (15 points)
        const typeWork = pastWork.filter(i => i.type === issue.type).length;
        const typeScore = Math.min(15, typeWork * 2);
        totalScore += typeScore;
        if (typeWork > 3) {
            reasons.push(`💼 Experienced with ${issue.type}s`);
        }
        // 4. Recent activity (15 points)
        const recentIssues = pastWork.filter(i => {
            const updatedDate = new Date(i.updatedAt);
            const daysSince = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince <= 14;
        });
        const activityScore = Math.min(15, recentIssues.length * 3);
        totalScore += activityScore;
        if (recentIssues.length > 2) {
            reasons.push(`🔥 Active contributor (${recentIssues.length} issues in 2 weeks)`);
        }
        if (reasons.length === 0) {
            reasons.push('New team member');
        }
        return {
            userId: user.id,
            userName: user.name,
            score: Math.round(totalScore),
            reasons
        };
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were'];
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.includes(word));
    }
    /**
     * Detect stale issues and post follow-up comments
     */
    async detectAndFollowUpStaleIssues(projectId) {
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            // Find issues with no recent activity
            const allIssues = await issueRepo.find({
                where: {
                    projectId,
                    status: (0, typeorm_1.Not)('done')
                },
                relations: ['assignee']
            });
            const now = Date.now();
            const staleIssues = [];
            let actionsTaken = 0;
            for (const issue of allIssues) {
                const lastUpdate = new Date(issue.updatedAt);
                const daysSinceActivity = (now - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceActivity >= this.STALE_THRESHOLD_DAYS) {
                    const shouldEscalate = daysSinceActivity >= this.ESCALATION_THRESHOLD_DAYS;
                    staleIssues.push({
                        issue,
                        daysSinceActivity: Math.floor(daysSinceActivity),
                        shouldEscalate
                    });
                    // Post automated comment
                    const commentPosted = await this.postStaleIssueComment(issue, daysSinceActivity, shouldEscalate);
                    if (commentPosted)
                        actionsTaken++;
                }
            }
            // Log PMBot sweep
            await this.logPMBotAction('stale_sweep', {
                projectId,
                staleCount: staleIssues.length,
                actionsTaken
            });
            return {
                staleIssues,
                actionsTaken
            };
        }
        catch (error) {
            console.error('❌ PMBot stale detection error:', error);
            throw new Error(`Stale detection failed: ${error.message}`);
        }
    }
    /**
     * Post automated comment on stale issue
     */
    async postStaleIssueComment(issue, daysSinceActivity, shouldEscalate) {
        try {
            // Check if PMBot already commented recently (prevent spam)
            // In a real implementation, you'd check the comments table
            const assigneeMention = issue.assigneeId ? `@${issue.assigneeId}` : 'Team';
            let comment = '';
            if (shouldEscalate) {
                comment = `🤖 **PMBot Alert**: This issue has been inactive for ${Math.floor(daysSinceActivity)} days.\n\n`;
                comment += `${assigneeMention}, this issue needs immediate attention. If it's blocked, please flag it or provide an update.\n\n`;
                comment += `**Recommended actions:**\n`;
                comment += `- Update the status\n`;
                comment += `- Add a comment with current progress\n`;
                comment += `- Flag if blocked\n`;
                comment += `- Close if no longer needed`;
            }
            else {
                comment = `🤖 **PMBot Reminder**: This issue hasn't been updated in ${Math.floor(daysSinceActivity)} days.\n\n`;
                comment += `${assigneeMention}, is there any progress on this? Do you need help?\n\n`;
                comment += `Please update the status or add a comment to keep the team informed.`;
            }
            // In a real implementation, create a comment via the comments API
            console.log(`📝 PMBot would post comment on ${issue.key}:`, comment);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to post stale comment:', error);
            return false;
        }
    }
    /**
     * Auto-triage: Analyze issue and suggest labels, priority, epic
     */
    async autoTriageIssue(issueId) {
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const issue = await issueRepo.findOne({ where: { id: issueId } });
            if (!issue) {
                throw new Error('Issue not found');
            }
            const text = `${issue.summary} ${issue.description || ''}`.toLowerCase();
            // Detect labels based on keywords
            const suggestedLabels = [];
            const labelKeywords = {
                'frontend': ['ui', 'frontend', 'react', 'component', 'css', 'style'],
                'backend': ['api', 'backend', 'server', 'database', 'endpoint'],
                'security': ['security', 'auth', 'authentication', 'permission', 'vulnerability'],
                'performance': ['performance', 'slow', 'optimization', 'speed', 'latency'],
                'documentation': ['documentation', 'docs', 'readme', 'guide'],
                'testing': ['test', 'testing', 'qa', 'automation']
            };
            for (const [label, keywords] of Object.entries(labelKeywords)) {
                if (keywords.some(keyword => text.includes(keyword))) {
                    suggestedLabels.push(label);
                }
            }
            // Detect priority based on urgency keywords
            let suggestedPriority = 'medium';
            const urgencyKeywords = {
                highest: ['critical', 'urgent', 'blocker', 'production down', 'asap'],
                high: ['important', 'high priority', 'should fix', 'needs attention'],
                low: ['minor', 'nice to have', 'enhancement', 'future']
            };
            for (const [priority, keywords] of Object.entries(urgencyKeywords)) {
                if (keywords.some(keyword => text.includes(keyword))) {
                    suggestedPriority = priority;
                    break;
                }
            }
            const reasoning = `Analyzed issue content and detected ${suggestedLabels.length} relevant labels and suggested priority: ${suggestedPriority}`;
            return {
                suggestedLabels,
                suggestedPriority,
                confidence: 0.75,
                reasoning
            };
        }
        catch (error) {
            console.error('❌ PMBot triage error:', error);
            throw new Error(`Triage failed: ${error.message}`);
        }
    }
    /**
     * Log PMBot actions for audit trail
     */
    async logPMBotAction(action, data) {
        // In a real implementation, save to a PMBotLog table
        console.log(`🤖 PMBot Action:`, {
            timestamp: new Date().toISOString(),
            action,
            data
        });
    }
    /**
     * Get PMBot activity summary
     */
    async getActivitySummary(projectId, days = 7) {
        // Mock implementation - in reality, query PMBotLog table
        return {
            assignmentsToday: 5,
            staleIssuesDetected: 12,
            triagesPerformed: 8
        };
    }
}
exports.PMBotService = PMBotService;
exports.pmBotService = new PMBotService();
