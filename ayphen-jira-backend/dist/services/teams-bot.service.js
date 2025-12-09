"use strict";
/**
 * Microsoft Teams Bot Service
 * Phase 7-8: Integrations
 *
 * Handles Teams bot interactions for voice commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsBot = exports.TeamsBotService = void 0;
const botbuilder_1 = require("botbuilder");
const voice_nlu_service_1 = require("./voice-nlu.service");
const voice_conversation_context_service_1 = require("./voice-conversation-context.service");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const User_1 = require("../entities/User");
class TeamsBotService {
    constructor() {
        this.issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        this.userRepo = database_1.AppDataSource.getRepository(User_1.User);
        this.adapter = new botbuilder_1.BotFrameworkAdapter({
            appId: process.env.TEAMS_APP_ID || '',
            appPassword: process.env.TEAMS_APP_PASSWORD || ''
        });
        // Error handler
        this.adapter.onTurnError = async (context, error) => {
            console.error('Teams Bot Error:', error);
            await context.sendActivity('Sorry, something went wrong. Please try again.');
        };
    }
    /**
     * Process incoming Teams message
     */
    async processMessage(req, res) {
        await this.adapter.processActivity(req, res, async (context) => {
            if (context.activity.type === botbuilder_1.ActivityTypes.Message) {
                await this.handleMessage(context);
            }
            else if (context.activity.type === botbuilder_1.ActivityTypes.ConversationUpdate) {
                await this.handleConversationUpdate(context);
            }
        });
    }
    /**
     * Handle incoming message
     */
    async handleMessage(context) {
        const text = context.activity.text?.trim();
        if (!text)
            return;
        const userId = context.activity.from.id;
        const userName = context.activity.from.name;
        try {
            // Check for help command
            if (text.toLowerCase() === 'help') {
                await this.sendHelp(context);
                return;
            }
            // Parse command with AI
            const result = await voice_nlu_service_1.voiceNLU.parseIntent(text, {
                userId,
                currentPage: 'teams'
            });
            // Check confidence
            if (result.intent.confidence < 0.7) {
                await context.sendActivity({
                    type: botbuilder_1.ActivityTypes.Message,
                    text: `I'm not sure I understood that. Did you mean: "${text}"?`,
                    suggestedActions: {
                        to: [],
                        actions: [
                            { type: 'imBack', title: 'Yes, execute it', value: `confirm: ${text}` },
                            { type: 'imBack', title: 'No, cancel', value: 'cancel' },
                            { type: 'imBack', title: 'Show help', value: 'help' }
                        ]
                    }
                });
                return;
            }
            // Execute command
            const executeResult = await this.executeCommand(result.intent, userId);
            // Send response
            if (executeResult.success) {
                await this.sendSuccessCard(context, executeResult);
            }
            else {
                await context.sendActivity(`❌ ${executeResult.message}`);
            }
            // Add to conversation history
            voice_conversation_context_service_1.voiceConversationContext.addCommand(userId, text, result.intent.type, result.intent.entities, executeResult.success);
        }
        catch (error) {
            console.error('Error processing Teams message:', error);
            await context.sendActivity(`❌ Error: ${error.message}`);
        }
    }
    /**
     * Execute command
     */
    async executeCommand(intent, userId) {
        switch (intent.type) {
            case 'update_priority':
                return await this.updatePriority(intent.entities);
            case 'update_status':
                return await this.updateStatus(intent.entities);
            case 'assign':
                return await this.assignIssue(intent.entities, userId);
            case 'create_issue':
                return await this.createIssue(intent.entities, userId);
            case 'search':
                return await this.searchIssues(intent.entities, userId);
            default:
                return {
                    success: false,
                    message: `Command type '${intent.type}' not supported in Teams yet`
                };
        }
    }
    /**
     * Update issue priority
     */
    async updatePriority(entities) {
        const { issueKey, priority } = entities;
        const issue = await this.issueRepo.findOne({ where: { key: issueKey } });
        if (!issue) {
            return { success: false, message: `Issue ${issueKey} not found` };
        }
        issue.priority = priority;
        await this.issueRepo.save(issue);
        return {
            success: true,
            message: `Priority set to ${priority}`,
            issue: {
                key: issue.key,
                summary: issue.summary,
                priority: issue.priority
            }
        };
    }
    /**
     * Update issue status
     */
    async updateStatus(entities) {
        const { issueKey, status } = entities;
        const issue = await this.issueRepo.findOne({ where: { key: issueKey } });
        if (!issue) {
            return { success: false, message: `Issue ${issueKey} not found` };
        }
        issue.status = status;
        await this.issueRepo.save(issue);
        return {
            success: true,
            message: `Status changed to ${status}`,
            issue: {
                key: issue.key,
                summary: issue.summary,
                status: issue.status
            }
        };
    }
    /**
     * Assign issue
     */
    async assignIssue(entities, userId) {
        const { issueKey, assignee } = entities;
        const issue = await this.issueRepo.findOne({ where: { key: issueKey } });
        if (!issue) {
            return { success: false, message: `Issue ${issueKey} not found` };
        }
        // Find user
        const users = await this.userRepo.find();
        const user = assignee === 'me'
            ? users.find(u => u.id === userId)
            : users.find(u => u.name.toLowerCase().includes(assignee.toLowerCase()));
        if (!user) {
            return { success: false, message: `User '${assignee}' not found` };
        }
        issue.assigneeId = user.id;
        await this.issueRepo.save(issue);
        return {
            success: true,
            message: `Assigned to ${user.name}`,
            issue: {
                key: issue.key,
                summary: issue.summary,
                assignee: user.name
            }
        };
    }
    /**
     * Create new issue
     */
    async createIssue(entities, userId) {
        const { summary, type, priority } = entities;
        const issue = this.issueRepo.create({
            summary: summary || 'New issue from Teams',
            type: type || 'task',
            priority: priority || 'medium',
            status: 'todo',
            reporterId: userId,
            createdAt: new Date()
        });
        await this.issueRepo.save(issue);
        return {
            success: true,
            message: `Created ${type || 'issue'}: ${issue.key}`,
            issue: {
                key: issue.key,
                summary: issue.summary,
                type: issue.type,
                priority: issue.priority
            }
        };
    }
    /**
     * Search issues
     */
    async searchIssues(entities, userId) {
        const { query, assignee, status } = entities;
        const queryBuilder = this.issueRepo.createQueryBuilder('issue');
        if (assignee === 'me') {
            queryBuilder.andWhere('issue.assigneeId = :userId', { userId });
        }
        if (status) {
            queryBuilder.andWhere('issue.status = :status', { status });
        }
        if (query) {
            queryBuilder.andWhere('issue.summary ILIKE :query', { query: `%${query}%` });
        }
        const issues = await queryBuilder.take(5).getMany();
        return {
            success: true,
            message: `Found ${issues.length} issue(s)`,
            issues: issues.map(i => ({
                key: i.key,
                summary: i.summary,
                status: i.status,
                priority: i.priority
            }))
        };
    }
    /**
     * Send success card
     */
    async sendSuccessCard(context, result) {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '✅ Success',
                    weight: 'Bolder',
                    size: 'Medium',
                    color: 'Good'
                },
                {
                    type: 'TextBlock',
                    text: result.message,
                    wrap: true
                }
            ]
        };
        // Add issue details if available
        if (result.issue) {
            card.body.push({
                type: 'FactSet',
                facts: [
                    { title: 'Issue', value: result.issue.key },
                    { title: 'Summary', value: result.issue.summary },
                    ...(result.issue.status ? [{ title: 'Status', value: result.issue.status }] : []),
                    ...(result.issue.priority ? [{ title: 'Priority', value: result.issue.priority }] : []),
                    ...(result.issue.assignee ? [{ title: 'Assignee', value: result.issue.assignee }] : [])
                ]
            });
        }
        // Add issues list if available
        if (result.issues && result.issues.length > 0) {
            card.body.push({
                type: 'TextBlock',
                text: 'Issues:',
                weight: 'Bolder',
                spacing: 'Medium'
            });
            result.issues.forEach((issue) => {
                card.body.push({
                    type: 'FactSet',
                    facts: [
                        { title: 'Key', value: issue.key },
                        { title: 'Summary', value: issue.summary },
                        { title: 'Status', value: issue.status },
                        { title: 'Priority', value: issue.priority }
                    ],
                    separator: true
                });
            });
        }
        await context.sendActivity({
            type: botbuilder_1.ActivityTypes.Message,
            attachments: [{
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    content: card
                }]
        });
    }
    /**
     * Send help message
     */
    async sendHelp(context) {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '🎤 Jira Voice Assistant',
                    weight: 'Bolder',
                    size: 'Large'
                },
                {
                    type: 'TextBlock',
                    text: 'I can help you manage Jira issues using natural language!',
                    wrap: true,
                    spacing: 'Medium'
                },
                {
                    type: 'TextBlock',
                    text: 'Examples:',
                    weight: 'Bolder',
                    spacing: 'Medium'
                },
                {
                    type: 'TextBlock',
                    text: '• "Set PROJ-123 to high priority"\n• "Move PROJ-456 to in progress"\n• "Assign PROJ-789 to me"\n• "Create a bug for login issue"\n• "Show my open issues"\n• "Find issues with status todo"',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: 'Supported Commands:',
                    weight: 'Bolder',
                    spacing: 'Medium'
                },
                {
                    type: 'FactSet',
                    facts: [
                        { title: 'Priority', value: 'set [issue] to [high/medium/low] priority' },
                        { title: 'Status', value: 'move [issue] to [status]' },
                        { title: 'Assign', value: 'assign [issue] to [name/me]' },
                        { title: 'Create', value: 'create a [bug/story/task]' },
                        { title: 'Search', value: 'show my issues / find [query]' }
                    ]
                }
            ]
        };
        await context.sendActivity({
            type: botbuilder_1.ActivityTypes.Message,
            attachments: [{
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    content: card
                }]
        });
    }
    /**
     * Handle conversation update (bot added to chat)
     */
    async handleConversationUpdate(context) {
        const membersAdded = context.activity.membersAdded || [];
        for (const member of membersAdded) {
            if (member.id !== context.activity.recipient.id) {
                await context.sendActivity('👋 Hi! I\'m your Jira Voice Assistant. Type "help" to see what I can do!');
            }
        }
    }
    /**
     * Send proactive message to user
     */
    async sendProactiveMessage(conversationReference, message) {
        await this.adapter.continueConversation(conversationReference, async (context) => {
            await context.sendActivity(message);
        });
    }
    /**
     * Send notification about issue update
     */
    async sendIssueNotification(conversationReference, issue, action) {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: `🔔 Issue ${action}`,
                    weight: 'Bolder',
                    size: 'Medium'
                },
                {
                    type: 'FactSet',
                    facts: [
                        { title: 'Issue', value: issue.key },
                        { title: 'Summary', value: issue.summary },
                        { title: 'Status', value: issue.status },
                        { title: 'Priority', value: issue.priority }
                    ]
                }
            ],
            actions: [
                {
                    type: 'Action.OpenUrl',
                    title: 'View Issue',
                    url: `${process.env.APP_URL}/issues/${issue.key}`
                }
            ]
        };
        await this.adapter.continueConversation(conversationReference, async (context) => {
            await context.sendActivity({
                type: botbuilder_1.ActivityTypes.Message,
                attachments: [{
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: card
                    }]
            });
        });
    }
}
exports.TeamsBotService = TeamsBotService;
// Export singleton instance
exports.teamsBot = new TeamsBotService();
