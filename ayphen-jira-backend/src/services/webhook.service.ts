import { AppDataSource } from '../config/database';
import { Webhook } from '../entities/Webhook';
import axios from 'axios';
import crypto from 'crypto';

export class WebhookService {
  private webhookRepo = AppDataSource.getRepository(Webhook);

  /**
   * Trigger webhooks for an event
   */
  async trigger(event: string, data: any, projectId?: string): Promise<void> {
    try {
      const query = this.webhookRepo
        .createQueryBuilder('webhook')
        .where('webhook.enabled = :enabled', { enabled: true })
        .andWhere(':event = ANY(webhook.events)', { event });

      if (projectId) {
        query.andWhere('(webhook.projectId = :projectId OR webhook.projectId IS NULL)', { projectId });
      }

      const webhooks = await query.getMany();

      // Deliver webhooks in parallel
      await Promise.all(
        webhooks.map(webhook => this.deliver(webhook, event, data))
      );
    } catch (error) {
      console.error('Webhook trigger error:', error);
    }
  }

  /**
   * Deliver webhook payload
   */
  private async deliver(webhook: Webhook, event: string, data: any): Promise<void> {
    try {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      const headers: any = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
      };

      // Add signature if secret is configured
      if (webhook.secret) {
        const signature = this.generateSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 10000, // 10 second timeout
      });

      // Update delivery stats
      await this.webhookRepo.update(webhook.id, {
        deliveryCount: webhook.deliveryCount + 1,
        lastDeliveryAt: new Date(),
      });

      console.log(`✅ Webhook delivered: ${webhook.name} (${event})`);
    } catch (error: any) {
      console.error(`❌ Webhook delivery failed: ${webhook.name}`, error.message);

      // Update failure stats
      await this.webhookRepo.update(webhook.id, {
        failureCount: webhook.failureCount + 1,
        lastFailureAt: new Date(),
        lastError: error.message,
      });

      // Disable webhook after 10 consecutive failures
      if (webhook.failureCount + 1 >= 10) {
        await this.webhookRepo.update(webhook.id, { enabled: false });
        console.log(`⚠️ Webhook disabled due to failures: ${webhook.name}`);
      }
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Create a new webhook
   */
  async create(data: Partial<Webhook>): Promise<Webhook> {
    const webhook = this.webhookRepo.create(data);
    return await this.webhookRepo.save(webhook);
  }

  /**
   * Get all webhooks
   */
  async getAll(projectId?: string): Promise<Webhook[]> {
    const query = this.webhookRepo.createQueryBuilder('webhook');
    
    if (projectId) {
      query.where('webhook.projectId = :projectId OR webhook.projectId IS NULL', { projectId });
    }

    return await query.getMany();
  }

  /**
   * Update webhook
   */
  async update(id: string, data: Partial<Webhook>): Promise<void> {
    await this.webhookRepo.update(id, data);
  }

  /**
   * Delete webhook
   */
  async delete(id: string): Promise<void> {
    await this.webhookRepo.delete(id);
  }

  /**
   * Test webhook delivery
   */
  async test(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const webhook = await this.webhookRepo.findOne({ where: { id } });
      
      if (!webhook) {
        return { success: false, message: 'Webhook not found' };
      }

      await this.deliver(webhook, 'test', {
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
      });

      return { success: true, message: 'Test webhook delivered successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const webhookService = new WebhookService();

// Available webhook events
export const WEBHOOK_EVENTS = {
  // Issue events
  ISSUE_CREATED: 'issue.created',
  ISSUE_UPDATED: 'issue.updated',
  ISSUE_DELETED: 'issue.deleted',
  ISSUE_ASSIGNED: 'issue.assigned',
  ISSUE_TRANSITIONED: 'issue.transitioned',
  
  // Comment events
  COMMENT_CREATED: 'comment.created',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted',
  
  // Sprint events
  SPRINT_CREATED: 'sprint.created',
  SPRINT_STARTED: 'sprint.started',
  SPRINT_COMPLETED: 'sprint.completed',
  
  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
};
