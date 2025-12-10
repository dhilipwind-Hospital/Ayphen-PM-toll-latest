import nodemailer from 'nodemailer';
import { AppDataSource } from '../config/database';
import { NotificationPreference } from '../entities/NotificationPreference';
import { User } from '../entities/User';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@jiraclone.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'Ayphen Project Management';
    
    // Initialize transporter synchronously
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      // Real SMTP configuration (Gmail, etc.)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 10,
        rateDelta: 1000,
        rateLimit: 5,
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,
        socketTimeout: 60000,
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        debug: true, // Enable debug logging
        logger: true
      });
      console.log('📧 Email service initialized with SMTP');
      console.log('   Host:', process.env.SMTP_HOST);
      console.log('   Port:', process.env.SMTP_PORT);
      console.log('   User:', process.env.SMTP_USER);
      console.log('   From:', this.fromEmail);
      console.log('   Connection timeout: 60s');
    } else {
      console.warn('⚠️  SMTP credentials not configured! Emails will NOT be sent.');
      console.warn('   Required env vars: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
      // Create a dummy transporter that will fail gracefully
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 587,
        secure: false,
      });
    }
  }

  // Generic send email method
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}: ${subject}`);
      
      // Log preview URL for Ethereal
      if (process.env.NODE_ENV !== 'production') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  private async shouldSendEmail(userId: string, notificationType: string): Promise<boolean> {
    try {
      const prefRepo = AppDataSource.getRepository(NotificationPreference);
      const preferences = await prefRepo.findOne({ where: { userId } });

      if (!preferences) {
        return true; // Default to sending if no preferences set
      }

      if (!preferences.emailNotifications || preferences.doNotDisturb) {
        return false;
      }

      // Check event-specific preferences
      switch (notificationType) {
        case 'assignment_changed':
          return preferences.notifyOnAssignment;
        case 'mention':
          return preferences.notifyOnMention;
        case 'comment_added':
          return preferences.notifyOnComment;
        case 'status_changed':
          return preferences.notifyOnStatusChange;
        case 'issue_updated':
          return preferences.notifyOnIssueUpdate;
        case 'sprint_started':
          return preferences.notifyOnSprintStart;
        case 'sprint_completed':
          return preferences.notifyOnSprintComplete;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking email preferences:', error);
      return false;
    }
  }

  private getEmailTemplate(type: string, data: any): { subject: string; html: string } {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:1500';
    const issueUrl = data.issueKey ? `${baseUrl}/issue/${data.issueKey}` : '';

    const templates: Record<string, { subject: string; html: string }> = {
      issue_created: {
        subject: `[${data.projectKey}] New Issue: ${data.issueKey} - ${data.summary}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0052CC;">New Issue Assigned to You</h2>
            <p><strong>${data.actorName}</strong> created a new issue and assigned it to you:</p>
            <div style="background: #F4F5F7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Issue:</strong> <a href="${issueUrl}">${data.issueKey}</a></p>
              <p style="margin: 5px 0;"><strong>Summary:</strong> ${data.summary}</p>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${data.type}</p>
              <p style="margin: 5px 0;"><strong>Priority:</strong> ${data.priority}</p>
            </div>
            <p><a href="${issueUrl}" style="background: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">View Issue</a></p>
          </div>
        `,
      },
      issue_updated: {
        subject: `[${data.projectKey}] Updated: ${data.issueKey} - ${data.summary}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0052CC;">Issue Updated</h2>
            <p><strong>${data.actorName}</strong> updated an issue:</p>
            <div style="background: #F4F5F7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Issue:</strong> <a href="${issueUrl}">${data.issueKey}</a></p>
              <p style="margin: 5px 0;"><strong>Summary:</strong> ${data.summary}</p>
              ${data.changes ? `<p style="margin: 5px 0;"><strong>Changes:</strong> ${data.changes}</p>` : ''}
            </div>
            <p><a href="${issueUrl}" style="background: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">View Issue</a></p>
          </div>
        `,
      },
      comment_added: {
        subject: `[${data.projectKey}] Comment on: ${data.issueKey}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0052CC;">New Comment</h2>
            <p><strong>${data.actorName}</strong> commented on <a href="${issueUrl}">${data.issueKey}</a>:</p>
            <div style="background: #F4F5F7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p>${data.comment}</p>
            </div>
            <p><a href="${issueUrl}" style="background: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">View Comment</a></p>
          </div>
        `,
      },
      mention: {
        subject: `[${data.projectKey}] You were mentioned in ${data.issueKey}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0052CC;">You Were Mentioned</h2>
            <p><strong>${data.actorName}</strong> mentioned you in <a href="${issueUrl}">${data.issueKey}</a>:</p>
            <div style="background: #F4F5F7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p>${data.context}</p>
            </div>
            <p><a href="${issueUrl}" style="background: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">View Issue</a></p>
          </div>
        `,
      },
      assignment_changed: {
        subject: `[${data.projectKey}] Assigned: ${data.issueKey} - ${data.summary}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0052CC;">Issue Assigned to You</h2>
            <p><strong>${data.actorName}</strong> assigned <a href="${issueUrl}">${data.issueKey}</a> to you:</p>
            <div style="background: #F4F5F7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Summary:</strong> ${data.summary}</p>
              <p style="margin: 5px 0;"><strong>Priority:</strong> ${data.priority}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${data.status}</p>
            </div>
            <p><a href="${issueUrl}" style="background: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">View Issue</a></p>
          </div>
        `,
      },
      status_changed: {
        subject: `[${data.projectKey}] Status Changed: ${data.issueKey}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0052CC;">Status Changed</h2>
            <p><strong>${data.actorName}</strong> changed the status of <a href="${issueUrl}">${data.issueKey}</a>:</p>
            <div style="background: #F4F5F7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>From:</strong> ${data.oldStatus}</p>
              <p style="margin: 5px 0;"><strong>To:</strong> ${data.newStatus}</p>
            </div>
            <p><a href="${issueUrl}" style="background: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">View Issue</a></p>
          </div>
        `,
      },
      sprint_started: {
        subject: `[${data.projectKey}] Sprint Started: ${data.sprintName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0052CC;">Sprint Started</h2>
            <p>Sprint <strong>${data.sprintName}</strong> has started!</p>
            <div style="background: #F4F5F7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${data.duration}</p>
              <p style="margin: 5px 0;"><strong>Issues:</strong> ${data.issueCount}</p>
            </div>
          </div>
        `,
      },
      sprint_completed: {
        subject: `[${data.projectKey}] Sprint Completed: ${data.sprintName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0052CC;">Sprint Completed</h2>
            <p>Sprint <strong>${data.sprintName}</strong> has been completed!</p>
            <div style="background: #F4F5F7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Completed:</strong> ${data.completedIssues} issues</p>
              <p style="margin: 5px 0;"><strong>Incomplete:</strong> ${data.incompleteIssues} issues</p>
            </div>
          </div>
        `,
      },
    };

    return templates[type] || {
      subject: 'Notification from AYPHEN JIRA',
      html: `<p>${data.message}</p>`,
    };
  }

  public async sendNotificationEmail(userId: string, type: string, data: any) {
    try {
      // Check if user wants email notifications
      const shouldSend = await this.shouldSendEmail(userId, type);
      if (!shouldSend) {
        console.log(`📧 Email notification skipped for user ${userId} (preferences)`);
        return;
      }

      // Get user email
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: userId } });
      
      if (!user || !user.email) {
        console.log(`📧 Email notification skipped for user ${userId} (no email)`);
        return;
      }

      // Get email template
      const { subject, html } = this.getEmailTemplate(type, data);

      // Send email
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@ayphenjira.com';
      const fromName = process.env.SMTP_FROM_NAME || 'Jira Clone';
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: user.email,
        subject,
        html,
      });

      console.log(`📧 Email sent to ${user.email}: ${info.messageId}`);
      
      // In development, log preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  public async sendDigestEmail(userId: string, notifications: any[]) {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: userId } });
      
      if (!user || !user.email) {
        return;
      }

      const notificationsList = notifications
        .map(
          (n) => `
        <li style="margin: 10px 0;">
          <strong>${n.title}</strong><br/>
          ${n.message}<br/>
          <small style="color: #666;">${new Date(n.createdAt).toLocaleString()}</small>
        </li>
      `
        )
        .join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0052CC;">Your Daily Digest</h2>
          <p>Here's what happened in your projects today:</p>
          <ul style="list-style: none; padding: 0;">
            ${notificationsList}
          </ul>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:1500'}" style="background: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">Go to AYPHEN JIRA</a></p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #DFE1E6;"/>
          <p style="color: #666; font-size: 12px;">
            You're receiving this email because you have email notifications enabled.<br/>
            <a href="${process.env.FRONTEND_URL}/settings/notifications">Manage your notification preferences</a>
          </p>
        </div>
      `;

      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@ayphenjira.com';
      const fromName = process.env.SMTP_FROM_NAME || 'Jira Clone';
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: user.email,
        subject: `Your Daily Digest - ${notifications.length} notifications`,
        html,
      });

      console.log(`📧 Digest email sent to ${user.email}: ${info.messageId}`);
    } catch (error) {
      console.error('Error sending digest email:', error);
    }
  }

  /**
   * Send project invitation email
   */
  public async sendProjectInvitation(data: {
    to: string;
    projectName: string;
    inviterName: string;
    role: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    try {
      const { to, projectName, inviterName, role, token, expiresAt } = data;
      
      const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:1600'}/accept-invitation/${token}`;
      const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const subject = `${inviterName} invited you to join "${projectName}"`;
      
      const html = this.getInvitationEmailTemplate({
        projectName,
        inviterName,
        role,
        acceptLink,
        expiryDate,
      });
      
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@ayphenjira.com';
      const fromName = process.env.SMTP_FROM_NAME || 'Ayphen Jira';
      
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text: `
${inviterName} has invited you to join the project "${projectName}" as a ${role}.

Click the link below to accept the invitation:
${acceptLink}

This invitation will expire on ${expiryDate}.

If you didn't expect this invitation, you can safely ignore this email.
        `.trim(),
      });

      console.log(`✅ Invitation email sent to ${to}: ${info.messageId}`);
      
      // In development, log preview URL
      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview invitation email:', previewUrl);
        }
      }
    } catch (error) {
      console.error('❌ Failed to send invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Send invitation reminder
   */
  public async sendInvitationReminder(data: {
    to: string;
    projectName: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    try {
      const { to, projectName, token, expiresAt } = data;
      
      const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:1600'}/accept-invitation/${token}`;
      const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const subject = `Reminder: Join "${projectName}" on Ayphen Jira`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0052CC;">📬 Reminder: You've been invited to join "${projectName}"</h2>
          <p>This is a friendly reminder that you have a pending invitation to join this project.</p>
          <p>
            <a href="${acceptLink}" 
               style="background: #0052CC; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p><strong>⏰ This invitation expires on ${expiryDate}</strong></p>
        </div>
      `;
      
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@ayphenjira.com';
      const fromName = process.env.SMTP_FROM_NAME || 'Ayphen Jira';
      
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      
      console.log(`✅ Invitation reminder sent to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send invitation reminder:', error);
      throw new Error('Failed to send invitation reminder');
    }
  }

  /**
   * HTML template for invitation email
   */
  private getInvitationEmailTemplate(data: {
    projectName: string;
    inviterName: string;
    role: string;
    acceptLink: string;
    expiryDate: string;
  }): string {
    const { projectName, inviterName, role, acceptLink, expiryDate } = data;
    
    const roleDescriptions: Record<string, string> = {
      admin: `
        <li>Full access to all project features</li>
        <li>Manage team members and permissions</li>
        <li>Configure project settings</li>
      `,
      member: `
        <li>View and edit all issues</li>
        <li>Create and manage tasks</li>
        <li>Collaborate with team members</li>
      `,
      viewer: `
        <li>View all project issues</li>
        <li>Add comments and feedback</li>
        <li>Track project progress</li>
      `
    };
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #172B4D; font-size: 24px; font-weight: 600;">
                🎉 You've Been Invited!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #5E6C84; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                <strong style="color: #172B4D;">${inviterName}</strong> has invited you to join the project 
                <strong style="color: #172B4D;">"${projectName}"</strong> as a <strong>${role}</strong>.
              </p>
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${acceptLink}" 
                       style="background: #0052CC; color: white; padding: 14px 32px; text-decoration: none; 
                              border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background: #F4F5F7; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px; color: #172B4D; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                  What you can do as a ${role}:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #5E6C84;">
                  ${roleDescriptions[role] || roleDescriptions.member}
                </ul>
              </div>
              <div style="background: #FFF7E6; border-left: 4px solid #FA8C16; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; color: #5E6C84; font-size: 14px;">
                  <strong style="color: #FA8C16;">⏰ Note:</strong> This invitation will expire on 
                  <strong>${expiryDate}</strong>
                </p>
              </div>
              <p style="color: #8C8C8C; font-size: 12px; margin: 20px 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${acceptLink}" style="color: #0052CC; word-break: break-all;">${acceptLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background: #F4F5F7; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #8C8C8C; font-size: 12px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

export const emailService = new EmailService();
