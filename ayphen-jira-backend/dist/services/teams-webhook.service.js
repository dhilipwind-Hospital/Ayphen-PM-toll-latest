"use strict";
/**
 * Microsoft Teams Webhook Notification Service
 *
 * Sends notifications to Teams channels via Incoming Webhooks
 * Configure TEAMS_WEBHOOK_URL in environment variables
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsWebhook = exports.TeamsWebhookService = void 0;
const axios_1 = __importDefault(require("axios"));
class TeamsWebhookService {
    constructor() {
        this.webhookUrl = process.env.TEAMS_WEBHOOK_URL || '';
        this.appUrl = process.env.APP_URL || 'http://localhost:5173';
        this.isConfigured = !!this.webhookUrl;
        this.isPowerAutomate = this.webhookUrl.includes('powerplatform.com') ||
            this.webhookUrl.includes('powerautomate');
        if (this.isConfigured) {
            console.log('✅ Teams Webhook configured:', this.isPowerAutomate ? 'Power Automate' : 'Standard');
        }
        else {
            console.log('⚠️ Teams Webhook not configured - notifications disabled');
        }
    }
    /**
     * Check if Teams notifications are available
     */
    isAvailable() {
        return this.isConfigured;
    }
    /**
     * Get color based on notification type
     */
    getThemeColor(type) {
        switch (type) {
            case 'success': return '00C851';
            case 'warning': return 'FF8800';
            case 'error': return 'FF4444';
            default: return '0EA5E9';
        }
    }
    /**
     * Send notification to Teams channel
     */
    async sendNotification(notification) {
        if (!this.isConfigured) {
            console.log('⚠️ Teams notification skipped - webhook not configured');
            return false;
        }
        try {
            let payload;
            if (this.isPowerAutomate) {
                // Power Automate expects simpler JSON that the workflow processes
                payload = {
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    issueKey: notification.issueKey || null,
                    issueUrl: notification.issueKey ? `${this.appUrl}/issues/${notification.issueKey}` : null,
                    projectName: notification.projectName || null,
                    userName: notification.userName || null,
                    timestamp: new Date().toISOString()
                };
            }
            else {
                // Standard Teams Incoming Webhook MessageCard format
                payload = {
                    '@type': 'MessageCard',
                    '@context': 'http://schema.org/extensions',
                    themeColor: this.getThemeColor(notification.type),
                    summary: notification.title,
                    sections: [
                        {
                            activityTitle: notification.title,
                            activitySubtitle: notification.projectName ? `Project: ${notification.projectName}` : undefined,
                            activityImage: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clipboard/3D/clipboard_3d.png',
                            facts: [
                                ...(notification.issueKey ? [{ name: 'Issue', value: notification.issueKey }] : []),
                                ...(notification.userName ? [{ name: 'By', value: notification.userName }] : []),
                            ].filter(f => f.value),
                            text: notification.message,
                            markdown: true
                        }
                    ],
                    potentialAction: notification.issueKey ? [
                        {
                            '@type': 'OpenUri',
                            name: 'View Issue',
                            targets: [
                                { os: 'default', uri: `${this.appUrl}/issues/${notification.issueKey}` }
                            ]
                        }
                    ] : []
                };
            }
            await axios_1.default.post(this.webhookUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            console.log('✅ Teams notification sent:', notification.title);
            return true;
        }
        catch (error) {
            console.error('❌ Teams notification failed:', error.message);
            return false;
        }
    }
    /**
     * Send issue created notification
     */
    async notifyIssueCreated(issue, userName, projectName) {
        return this.sendNotification({
            title: '🆕 New Issue Created',
            message: `**${issue.key}**: ${issue.summary}`,
            type: 'info',
            issueKey: issue.key,
            projectName,
            userName
        });
    }
    /**
     * Send issue updated notification
     */
    async notifyIssueUpdated(issue, changes, userName, projectName) {
        return this.sendNotification({
            title: '✏️ Issue Updated',
            message: `**${issue.key}**: ${issue.summary}\n\nChanges: ${changes}`,
            type: 'info',
            issueKey: issue.key,
            projectName,
            userName
        });
    }
    /**
     * Send issue status change notification
     */
    async notifyStatusChange(issue, oldStatus, newStatus, userName, projectName) {
        const isCompleted = newStatus.toLowerCase().includes('done') || newStatus.toLowerCase().includes('complete');
        return this.sendNotification({
            title: isCompleted ? '✅ Issue Completed' : '🔄 Status Changed',
            message: `**${issue.key}**: ${issue.summary}\n\n${oldStatus} → **${newStatus}**`,
            type: isCompleted ? 'success' : 'info',
            issueKey: issue.key,
            projectName,
            userName
        });
    }
    /**
     * Send comment notification
     */
    async notifyComment(issue, comment, userName, projectName) {
        return this.sendNotification({
            title: '💬 New Comment',
            message: `**${issue.key}**: ${issue.summary}\n\n"${comment.substring(0, 200)}${comment.length > 200 ? '...' : ''}"`,
            type: 'info',
            issueKey: issue.key,
            projectName,
            userName
        });
    }
    /**
     * Send sprint started notification
     */
    async notifySprint(sprintName, action, projectName) {
        return this.sendNotification({
            title: action === 'started' ? '🏃 Sprint Started' : '🏁 Sprint Completed',
            message: `**${sprintName}** has been ${action}`,
            type: action === 'completed' ? 'success' : 'info',
            projectName
        });
    }
    /**
     * Send alert notification
     */
    async notifyAlert(title, message, severity, projectName) {
        return this.sendNotification({
            title: severity === 'error' ? '🚨 Alert' : '⚠️ Warning',
            message,
            type: severity,
            projectName
        });
    }
}
exports.TeamsWebhookService = TeamsWebhookService;
// Singleton instance
exports.teamsWebhook = new TeamsWebhookService();
