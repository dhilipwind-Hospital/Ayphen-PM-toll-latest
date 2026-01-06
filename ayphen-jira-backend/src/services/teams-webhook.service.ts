/**
 * Microsoft Teams Webhook Notification Service
 * 
 * Sends notifications to Teams channels via Incoming Webhooks
 * Configure TEAMS_WEBHOOK_URL in environment variables
 */

import axios from 'axios';

export interface TeamsNotification {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  issueKey?: string;
  issueUrl?: string;
  projectName?: string;
  userName?: string;
}

export class TeamsWebhookService {
  private webhookUrl: string;
  private isConfigured: boolean;
  private appUrl: string;

  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL || '';
    this.appUrl = process.env.APP_URL || 'http://localhost:5173';
    this.isConfigured = !!this.webhookUrl;
    
    if (this.isConfigured) {
      console.log('✅ Teams Webhook configured');
    } else {
      console.log('⚠️ Teams Webhook not configured - notifications disabled');
    }
  }

  /**
   * Check if Teams notifications are available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Get color based on notification type
   */
  private getThemeColor(type: string): string {
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
  async sendNotification(notification: TeamsNotification): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('⚠️ Teams notification skipped - webhook not configured');
      return false;
    }

    try {
      const card = {
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

      await axios.post(this.webhookUrl, card, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('✅ Teams notification sent:', notification.title);
      return true;
    } catch (error: any) {
      console.error('❌ Teams notification failed:', error.message);
      return false;
    }
  }

  /**
   * Send issue created notification
   */
  async notifyIssueCreated(issue: any, userName: string, projectName: string): Promise<boolean> {
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
  async notifyIssueUpdated(issue: any, changes: string, userName: string, projectName: string): Promise<boolean> {
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
  async notifyStatusChange(issue: any, oldStatus: string, newStatus: string, userName: string, projectName: string): Promise<boolean> {
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
  async notifyComment(issue: any, comment: string, userName: string, projectName: string): Promise<boolean> {
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
  async notifySprint(sprintName: string, action: 'started' | 'completed', projectName: string): Promise<boolean> {
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
  async notifyAlert(title: string, message: string, severity: 'warning' | 'error', projectName?: string): Promise<boolean> {
    return this.sendNotification({
      title: severity === 'error' ? '🚨 Alert' : '⚠️ Warning',
      message,
      type: severity,
      projectName
    });
  }
}

// Singleton instance
export const teamsWebhook = new TeamsWebhookService();
