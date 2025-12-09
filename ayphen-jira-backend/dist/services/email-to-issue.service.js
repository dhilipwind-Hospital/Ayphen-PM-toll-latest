"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailToIssueService = exports.EmailToIssueService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const Project_1 = require("../entities/Project");
const User_1 = require("../entities/User");
const axios_1 = __importDefault(require("axios"));
const ai_auto_assignment_service_1 = require("./ai-auto-assignment.service");
const ai_auto_tagging_service_1 = require("./ai-auto-tagging.service");
class EmailToIssueService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        // Email patterns for different sources
        this.emailPatterns = {
            support: ['support@', 'help@', 'customer@', 'feedback@'],
            bug: ['bug', 'error', 'issue', 'problem', 'broken', 'not working'],
            feature: ['feature', 'enhancement', 'request', 'would like', 'can you add'],
            urgent: ['urgent', 'asap', 'critical', 'emergency', 'immediately']
        };
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }
    /**
     * Process email and create issue
     */
    async processEmail(emailData, projectId) {
        try {
            console.log(`📧 Processing email from: ${emailData.from}`);
            // Step 1: Parse email to extract issue details
            const parsed = await this.parseEmailToIssue(emailData, projectId);
            // Step 2: Find or create reporter
            const reporter = await this.findOrCreateReporter(parsed.reporterEmail);
            // Step 3: Determine project
            const finalProjectId = parsed.projectId || projectId || await this.detectProject(emailData);
            if (!finalProjectId) {
                throw new Error('Could not determine project for email');
            }
            // Step 4: Create issue
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const issue = issueRepo.create({
                summary: parsed.summary,
                description: parsed.description,
                type: parsed.type,
                priority: parsed.priority,
                status: 'todo',
                projectId: finalProjectId,
                reporterId: reporter.id,
                labels: parsed.labels,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const savedIssue = await issueRepo.save(issue);
            // Step 5: Auto-assign using AI
            try {
                const assignment = await ai_auto_assignment_service_1.aiAutoAssignmentService.autoAssignIssue(savedIssue.id);
                if (assignment.recommendedAssignee && assignment.recommendedAssignee.confidence >= 70) {
                    savedIssue.assigneeId = assignment.recommendedAssignee.userId;
                    await issueRepo.save(savedIssue);
                    console.log(`✅ Auto-assigned to ${assignment.recommendedAssignee.userName}`);
                }
            }
            catch (error) {
                console.log('⚠️ Auto-assignment skipped:', error);
            }
            // Step 6: Auto-tag using AI
            try {
                const tagging = await ai_auto_tagging_service_1.aiAutoTaggingService.suggestTags(savedIssue.id);
                if (tagging.tagsToAdd.length > 0) {
                    savedIssue.labels = [...(savedIssue.labels || []), ...tagging.tagsToAdd];
                    await issueRepo.save(savedIssue);
                    console.log(`✅ Auto-tagged with: ${tagging.tagsToAdd.join(', ')}`);
                }
            }
            catch (error) {
                console.log('⚠️ Auto-tagging skipped:', error);
            }
            // Step 7: Send confirmation email
            await this.sendConfirmationEmail(emailData.from, savedIssue);
            console.log(`✅ Created issue ${savedIssue.key} from email`);
            return savedIssue;
        }
        catch (error) {
            console.error('❌ Email processing error:', error);
            throw new Error(`Failed to process email: ${error.message}`);
        }
    }
    /**
     * Parse email content to extract issue details using AI
     */
    async parseEmailToIssue(emailData, projectId) {
        try {
            const prompt = `You are an expert at converting emails into Jira issues. Analyze this email and extract issue details.

Email:
From: ${emailData.from}
Subject: ${emailData.subject}
Body: ${emailData.body}

Extract and return ONLY a valid JSON object:
{
  "type": "epic" | "story" | "task" | "bug" | "subtask",
  "summary": "concise title (max 100 chars)",
  "description": "detailed description with context",
  "priority": "highest" | "high" | "medium" | "low" | "lowest",
  "labels": ["label1", "label2"],
  "confidence": number (0-100)
}

Rules:
- If email mentions "bug", "error", "broken", "not working" → type is "bug"
- If email is a feature request → type is "story"
- If email is from support/customer → add "customer-request" label
- If email contains "urgent", "asap", "critical" → priority is "highest" or "high"
- Summary should be clear and actionable
- Description should include all relevant details from email
- Extract technical keywords as labels`;
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama3.1-8b',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at parsing emails into structured issue data. Return only valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 800
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0].message.content.trim();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    type: parsed.type || 'task',
                    summary: parsed.summary || emailData.subject,
                    description: parsed.description || emailData.body,
                    priority: parsed.priority || 'medium',
                    labels: parsed.labels || [],
                    reporterEmail: emailData.from,
                    projectId,
                    confidence: parsed.confidence || 70
                };
            }
            return this.fallbackParsing(emailData, projectId);
        }
        catch (error) {
            console.error('AI parsing failed, using fallback:', error);
            return this.fallbackParsing(emailData, projectId);
        }
    }
    /**
     * Fallback parsing without AI
     */
    fallbackParsing(emailData, projectId) {
        const subject = emailData.subject.toLowerCase();
        const body = emailData.body.toLowerCase();
        const text = `${subject} ${body}`;
        // Detect type
        let type = 'task';
        if (this.emailPatterns.bug.some(kw => text.includes(kw))) {
            type = 'bug';
        }
        else if (this.emailPatterns.feature.some(kw => text.includes(kw))) {
            type = 'story';
        }
        // Detect priority
        let priority = 'medium';
        if (this.emailPatterns.urgent.some(kw => text.includes(kw))) {
            priority = 'highest';
        }
        // Extract labels
        const labels = [];
        if (this.emailPatterns.support.some(pattern => emailData.to.includes(pattern))) {
            labels.push('customer-request');
        }
        if (type === 'bug') {
            labels.push('bug');
        }
        return {
            type,
            summary: emailData.subject.substring(0, 100),
            description: `Email from: ${emailData.from}\n\n${emailData.body}`,
            priority,
            labels,
            reporterEmail: emailData.from,
            projectId,
            confidence: 60
        };
    }
    /**
     * Find existing user or create new one from email
     */
    async findOrCreateReporter(email) {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Try to find existing user
        let user = await userRepo.findOne({ where: { email } });
        if (!user) {
            // Create new user
            const name = email.split('@')[0].replace(/[._-]/g, ' ');
            user = userRepo.create({
                email,
                name: name.charAt(0).toUpperCase() + name.slice(1),
                password: Math.random().toString(36), // Random password, user will reset
                role: 'user',
                createdAt: new Date()
            });
            await userRepo.save(user);
            console.log(`✅ Created new user: ${user.email}`);
        }
        return user;
    }
    /**
     * Detect project from email content
     */
    async detectProject(emailData) {
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const projects = await projectRepo.find();
        if (projects.length === 0)
            return null;
        // Try to match project name in email
        const text = `${emailData.subject} ${emailData.body}`.toLowerCase();
        for (const project of projects) {
            if (text.includes(project.name.toLowerCase()) ||
                text.includes(project.key.toLowerCase())) {
                return project.id;
            }
        }
        // Default to first project
        return projects[0].id;
    }
    /**
     * Send confirmation email to reporter
     */
    async sendConfirmationEmail(to, issue) {
        try {
            // TODO: Implement actual email sending
            // For now, just log
            console.log(`📧 Would send confirmation to ${to} for issue ${issue.key}`);
            // Example email content:
            // Subject: Issue Created: ${issue.key} - ${issue.summary}
            // Body: Your issue has been created and assigned to the team.
            //       Issue Key: ${issue.key}
            //       Status: ${issue.status}
            //       Priority: ${issue.priority}
            //       Track progress at: [link]
        }
        catch (error) {
            console.error('Failed to send confirmation email:', error);
        }
    }
    /**
     * Bulk process multiple emails
     */
    async processEmails(emails, projectId) {
        const issues = [];
        for (const email of emails) {
            try {
                const issue = await this.processEmail(email, projectId);
                issues.push(issue);
            }
            catch (error) {
                console.error(`Failed to process email from ${email.from}:`, error);
            }
        }
        return issues;
    }
    /**
     * Setup email webhook/polling
     */
    async setupEmailIntegration(config) {
        // TODO: Implement email integration setup
        // - Gmail API integration
        // - Outlook API integration
        // - IMAP polling
        console.log(`📧 Email integration setup for ${config.provider}`);
    }
}
exports.EmailToIssueService = EmailToIssueService;
exports.emailToIssueService = new EmailToIssueService();
