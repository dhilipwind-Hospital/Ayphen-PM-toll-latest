"use strict";
/**
 * Voice Smart Suggestions Service
 * Phase 3-4: AI Intelligence
 *
 * Provides context-aware command suggestions based on:
 * - Current page/issue
 * - User patterns
 * - Time of day
 * - Recent actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceSmartSuggestions = exports.VoiceSmartSuggestionsService = void 0;
const voice_conversation_context_service_1 = require("./voice-conversation-context.service");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
class VoiceSmartSuggestionsService {
    constructor() {
        this.issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
    }
    /**
     * Get smart suggestions based on context
     */
    async getSuggestions(context) {
        const suggestions = [];
        // 1. Page-based suggestions
        const pageSuggestions = this.getPageBasedSuggestions(context);
        suggestions.push(...pageSuggestions);
        // 2. Issue-based suggestions
        if (context.issueId) {
            const issueSuggestions = await this.getIssueBasedSuggestions(context.issueId);
            suggestions.push(...issueSuggestions);
        }
        // 3. User pattern suggestions
        const patternSuggestions = this.getUserPatternSuggestions(context.userId);
        suggestions.push(...patternSuggestions);
        // 4. Time-based suggestions
        const timeSuggestions = this.getTimeBasedSuggestions(context);
        suggestions.push(...timeSuggestions);
        // 5. Workflow suggestions
        const workflowSuggestions = await this.getWorkflowSuggestions(context);
        suggestions.push(...workflowSuggestions);
        // Sort by confidence and return top 10
        return suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10);
    }
    /**
     * Get suggestions based on current page
     */
    getPageBasedSuggestions(context) {
        const suggestions = [];
        switch (context.currentPage) {
            case 'issue-detail':
                suggestions.push({
                    id: 'set-priority',
                    text: 'Set priority to high',
                    icon: '🔴',
                    confidence: 0.9,
                    category: 'quick_action',
                    shortcut: 'Ctrl+Shift+P',
                    description: 'Change issue priority'
                }, {
                    id: 'change-status',
                    text: 'Move to in progress',
                    icon: '▶️',
                    confidence: 0.85,
                    category: 'workflow',
                    description: 'Update issue status'
                }, {
                    id: 'assign-issue',
                    text: 'Assign to me',
                    icon: '👤',
                    confidence: 0.8,
                    category: 'quick_action',
                    description: 'Assign issue to yourself'
                });
                break;
            case 'board':
                suggestions.push({
                    id: 'create-issue',
                    text: 'Create a new bug',
                    icon: '🐛',
                    confidence: 0.85,
                    category: 'creation',
                    description: 'Create new bug issue'
                }, {
                    id: 'filter-my-issues',
                    text: 'Show my issues',
                    icon: '🔍',
                    confidence: 0.8,
                    category: 'navigation',
                    description: 'Filter to your assigned issues'
                });
                break;
            case 'backlog':
                suggestions.push({
                    id: 'create-story',
                    text: 'Create a new story',
                    icon: '📝',
                    confidence: 0.85,
                    category: 'creation',
                    description: 'Create new user story'
                }, {
                    id: 'prioritize',
                    text: 'Set top items to high priority',
                    icon: '⬆️',
                    confidence: 0.75,
                    category: 'workflow',
                    description: 'Bulk update priorities'
                });
                break;
            case 'dashboard':
                suggestions.push({
                    id: 'go-to-board',
                    text: 'Take me to the board',
                    icon: '📊',
                    confidence: 0.9,
                    category: 'navigation',
                    description: 'Navigate to board view'
                }, {
                    id: 'my-issues',
                    text: 'Show my open issues',
                    icon: '📋',
                    confidence: 0.85,
                    category: 'navigation',
                    description: 'View your assigned issues'
                });
                break;
        }
        return suggestions;
    }
    /**
     * Get suggestions based on current issue state
     */
    async getIssueBasedSuggestions(issueId) {
        const suggestions = [];
        try {
            const issue = await this.issueRepo.findOne({ where: { id: issueId } });
            if (!issue)
                return suggestions;
            // Suggest next logical steps based on status
            switch (issue.status) {
                case 'todo':
                    suggestions.push({
                        id: 'start-work',
                        text: 'Move to in progress',
                        icon: '▶️',
                        confidence: 0.95,
                        category: 'workflow',
                        description: 'Start working on this issue'
                    });
                    break;
                case 'in-progress':
                    suggestions.push({
                        id: 'move-to-review',
                        text: 'Move to code review',
                        icon: '👀',
                        confidence: 0.9,
                        category: 'workflow',
                        description: 'Submit for code review'
                    }, {
                        id: 'add-comment',
                        text: 'Add a progress update',
                        icon: '💬',
                        confidence: 0.75,
                        category: 'quick_action',
                        description: 'Add comment about progress'
                    });
                    break;
                case 'in-review':
                    suggestions.push({
                        id: 'mark-done',
                        text: 'Mark as done',
                        icon: '✅',
                        confidence: 0.9,
                        category: 'workflow',
                        description: 'Complete this issue'
                    });
                    break;
            }
            // Suggest based on priority
            if (!issue.priority || issue.priority === 'low') {
                suggestions.push({
                    id: 'increase-priority',
                    text: 'Increase priority',
                    icon: '⬆️',
                    confidence: 0.7,
                    category: 'quick_action',
                    description: 'Make this issue higher priority'
                });
            }
            // Suggest based on assignment
            if (!issue.assigneeId) {
                suggestions.push({
                    id: 'assign-to-me',
                    text: 'Assign to me',
                    icon: '👤',
                    confidence: 0.85,
                    category: 'quick_action',
                    description: 'Take ownership of this issue'
                });
            }
        }
        catch (error) {
            console.error('Error getting issue-based suggestions:', error);
        }
        return suggestions;
    }
    /**
     * Get suggestions based on user patterns
     */
    getUserPatternSuggestions(userId) {
        const suggestions = [];
        const stats = voice_conversation_context_service_1.voiceConversationContext.getStats(userId);
        // Suggest based on top intents
        stats.topIntents.forEach((intent, index) => {
            if (index < 2) { // Top 2 intents
                const suggestion = this.intentToSuggestion(intent.intent, 0.8 - (index * 0.1));
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            }
        });
        return suggestions;
    }
    /**
     * Get suggestions based on time of day
     */
    getTimeBasedSuggestions(context) {
        const suggestions = [];
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        switch (timeOfDay) {
            case 'morning':
                // Morning: standup, planning
                suggestions.push({
                    id: 'standup',
                    text: 'Generate my standup update',
                    icon: '📊',
                    confidence: 0.85,
                    category: 'smart',
                    description: 'Create daily standup summary'
                }, {
                    id: 'plan-day',
                    text: 'Show my tasks for today',
                    icon: '📅',
                    confidence: 0.8,
                    category: 'navigation',
                    description: 'View today\'s work'
                });
                break;
            case 'afternoon':
                // Afternoon: progress updates
                suggestions.push({
                    id: 'update-progress',
                    text: 'Add progress update',
                    icon: '💬',
                    confidence: 0.75,
                    category: 'quick_action',
                    description: 'Update issue progress'
                });
                break;
            case 'evening':
                // Evening: wrap up
                suggestions.push({
                    id: 'mark-done',
                    text: 'Mark completed items as done',
                    icon: '✅',
                    confidence: 0.8,
                    category: 'workflow',
                    description: 'Close finished issues'
                }, {
                    id: 'plan-tomorrow',
                    text: 'Plan tasks for tomorrow',
                    icon: '📋',
                    confidence: 0.75,
                    category: 'smart',
                    description: 'Set up tomorrow\'s work'
                });
                break;
        }
        // Friday afternoon: sprint wrap-up
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 5 && timeOfDay === 'afternoon') {
            suggestions.push({
                id: 'sprint-summary',
                text: 'Generate sprint summary',
                icon: '📈',
                confidence: 0.9,
                category: 'smart',
                description: 'Create end-of-sprint report'
            });
        }
        return suggestions;
    }
    /**
     * Get workflow-based suggestions
     */
    async getWorkflowSuggestions(context) {
        const suggestions = [];
        if (!context.userId)
            return suggestions;
        try {
            // Find blocked issues
            const blockedIssues = await this.issueRepo.find({
                where: {
                    assigneeId: context.userId,
                    status: 'blocked'
                },
                take: 5
            });
            if (blockedIssues.length > 0) {
                suggestions.push({
                    id: 'show-blocked',
                    text: `Show my ${blockedIssues.length} blocked issues`,
                    icon: '🚫',
                    confidence: 0.95,
                    category: 'smart',
                    description: 'View and resolve blockers'
                });
            }
            // Find overdue issues
            const now = new Date();
            const overdueIssues = await this.issueRepo
                .createQueryBuilder('issue')
                .where('issue.assigneeId = :userId', { userId: context.userId })
                .andWhere('issue.dueDate < :now', { now })
                .andWhere('issue.status != :done', { done: 'done' })
                .getMany();
            if (overdueIssues.length > 0) {
                suggestions.push({
                    id: 'show-overdue',
                    text: `${overdueIssues.length} overdue issues need attention`,
                    icon: '⚠️',
                    confidence: 0.98,
                    category: 'smart',
                    description: 'Address overdue items'
                });
            }
        }
        catch (error) {
            console.error('Error getting workflow suggestions:', error);
        }
        return suggestions;
    }
    /**
     * Convert intent to suggestion
     */
    intentToSuggestion(intent, confidence) {
        const intentMap = {
            'update_priority': {
                text: 'Set priority',
                icon: '🔴',
                category: 'quick_action',
                description: 'Change issue priority'
            },
            'update_status': {
                text: 'Change status',
                icon: '▶️',
                category: 'workflow',
                description: 'Update issue status'
            },
            'assign': {
                text: 'Assign issue',
                icon: '👤',
                category: 'quick_action',
                description: 'Assign to team member'
            },
            'navigate': {
                text: 'Go to board',
                icon: '📊',
                category: 'navigation',
                description: 'Navigate to board view'
            },
            'create_issue': {
                text: 'Create new issue',
                icon: '➕',
                category: 'creation',
                description: 'Create a new issue'
            }
        };
        const template = intentMap[intent];
        if (!template)
            return null;
        return {
            id: `pattern-${intent}`,
            ...template,
            confidence
        };
    }
    /**
     * Get contextual help for current situation
     */
    getContextualHelp(context) {
        const help = [];
        if (context.currentPage === 'issue-detail') {
            help.push('Try: "set priority to high"');
            help.push('Try: "move to in progress"');
            help.push('Try: "assign to [name]"');
        }
        else if (context.currentPage === 'board') {
            help.push('Try: "create a bug"');
            help.push('Try: "show my issues"');
            help.push('Try: "go to backlog"');
        }
        else {
            help.push('Try: "take me to the board"');
            help.push('Try: "show my open issues"');
            help.push('Try: "create a new story"');
        }
        return help;
    }
}
exports.VoiceSmartSuggestionsService = VoiceSmartSuggestionsService;
// Export singleton instance
exports.voiceSmartSuggestions = new VoiceSmartSuggestionsService();
