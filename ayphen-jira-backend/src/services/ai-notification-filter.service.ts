import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'assignment' | 'comment' | 'status_change' | 'due_date' | 'sprint' | 'other';
  title: string;
  message: string;
  issueKey?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: Date;
  read: boolean;
}

interface FilteredNotifications {
  critical: Notification[];
  important: Notification[];
  batched: Notification[];
  suppressed: Notification[];
  digest: {
    summary: string;
    count: number;
    items: Notification[];
  };
}

interface UserPreferences {
  userId: string;
  quietHours: { start: string; end: string };
  batchNonUrgent: boolean;
  digestFrequency: 'realtime' | 'hourly' | 'daily';
  suppressTypes: string[];
  priorityThreshold: 'critical' | 'high' | 'medium' | 'low';
}

export class AINotificationFilterService {
  // Notification priority rules
  private priorityRules = {
    critical: [
      'production',
      'outage',
      'security',
      'critical bug',
      'blocker',
      'emergency'
    ],
    high: [
      'assigned to you',
      'mentioned you',
      'deadline today',
      'sprint ending',
      'approval needed'
    ],
    medium: [
      'commented',
      'status changed',
      'updated',
      'new issue'
    ],
    low: [
      'watched',
      'subscribed',
      'general update'
    ]
  };

  /**
   * Filter and prioritize notifications for a user
   */
  async filterNotifications(
    userId: string,
    notifications: Notification[]
  ): Promise<FilteredNotifications> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      // Categorize notifications
      const critical: Notification[] = [];
      const important: Notification[] = [];
      const batched: Notification[] = [];
      const suppressed: Notification[] = [];

      for (const notification of notifications) {
        // Check if in quiet hours
        if (this.isQuietHours(preferences)) {
          if (notification.priority === 'critical') {
            critical.push(notification);
          } else {
            batched.push(notification);
          }
          continue;
        }

        // Check if type is suppressed
        if (preferences.suppressTypes.includes(notification.type)) {
          suppressed.push(notification);
          continue;
        }

        // Categorize by priority
        if (notification.priority === 'critical') {
          critical.push(notification);
        } else if (notification.priority === 'high') {
          important.push(notification);
        } else if (preferences.batchNonUrgent) {
          batched.push(notification);
        } else {
          important.push(notification);
        }
      }

      // Generate digest
      const digest = this.generateDigest(batched);

      return {
        critical,
        important,
        batched,
        suppressed,
        digest
      };
    } catch (error: any) {
      console.error('❌ Notification filtering error:', error);
      throw new Error(`Failed to filter notifications: ${error.message}`);
    }
  }

  /**
   * Analyze notification and determine priority
   */
  async analyzePriority(notification: Notification): Promise<'critical' | 'high' | 'medium' | 'low'> {
    const text = `${notification.title} ${notification.message}`.toLowerCase();

    // Check critical keywords
    for (const keyword of this.priorityRules.critical) {
      if (text.includes(keyword)) {
        return 'critical';
      }
    }

    // Check high priority keywords
    for (const keyword of this.priorityRules.high) {
      if (text.includes(keyword)) {
        return 'high';
      }
    }

    // Check medium priority keywords
    for (const keyword of this.priorityRules.medium) {
      if (text.includes(keyword)) {
        return 'medium';
      }
    }

    return 'low';
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    // TODO: Fetch from database
    // For now, return defaults
    return {
      userId,
      quietHours: { start: '22:00', end: '08:00' },
      batchNonUrgent: true,
      digestFrequency: 'daily',
      suppressTypes: [],
      priorityThreshold: 'medium'
    };
  }

  /**
   * Check if current time is in quiet hours
   */
  private isQuietHours(preferences: UserPreferences): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Generate daily digest
   */
  private generateDigest(notifications: Notification[]): {
    summary: string;
    count: number;
    items: Notification[];
  } {
    const count = notifications.length;
    
    if (count === 0) {
      return {
        summary: 'No notifications',
        count: 0,
        items: []
      };
    }

    // Group by type
    const byType: Record<string, number> = {};
    for (const notification of notifications) {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    }

    // Generate summary
    const summaryParts: string[] = [];
    for (const [type, count] of Object.entries(byType)) {
      summaryParts.push(`${count} ${type.replace('_', ' ')}`);
    }

    return {
      summary: `You have ${count} notifications: ${summaryParts.join(', ')}`,
      count,
      items: notifications.slice(0, 10) // Top 10 for digest
    };
  }

  /**
   * Smart batching - group similar notifications
   */
  async batchSimilarNotifications(notifications: Notification[]): Promise<Notification[]> {
    const batched: Notification[] = [];
    const grouped = new Map<string, Notification[]>();

    // Group by issue
    for (const notification of notifications) {
      if (notification.issueKey) {
        const key = notification.issueKey;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(notification);
      } else {
        batched.push(notification);
      }
    }

    // Create batched notifications
    for (const [issueKey, group] of grouped.entries()) {
      if (group.length > 1) {
        batched.push({
          id: `batch-${issueKey}`,
          userId: group[0].userId,
          type: 'other',
          title: `${group.length} updates on ${issueKey}`,
          message: `${group.map(n => n.type).join(', ')}`,
          issueKey,
          priority: group.some(n => n.priority === 'high') ? 'high' : 'medium',
          createdAt: group[0].createdAt,
          read: false
        });
      } else {
        batched.push(group[0]);
      }
    }

    return batched;
  }

  /**
   * Learn from user behavior
   */
  async learnFromUserBehavior(userId: string, action: {
    notificationId: string;
    action: 'read' | 'dismiss' | 'mark_important' | 'mark_spam';
    timestamp: Date;
  }): Promise<void> {
    // TODO: Implement ML-based learning
    // Track which notifications user reads/dismisses
    // Adjust future filtering based on patterns
    console.log(`📊 Learning from user ${userId} action: ${action.action}`);
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string, days: number = 7): Promise<{
    total: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    readRate: number;
    avgResponseTime: number;
  }> {
    // TODO: Implement actual stats from database
    return {
      total: 150,
      byPriority: {
        critical: 5,
        high: 25,
        medium: 70,
        low: 50
      },
      byType: {
        mention: 20,
        assignment: 30,
        comment: 40,
        status_change: 35,
        other: 25
      },
      readRate: 0.75,
      avgResponseTime: 3600 // seconds
    };
  }
}

export const aiNotificationFilterService = new AINotificationFilterService();
