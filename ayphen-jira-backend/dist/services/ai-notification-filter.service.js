"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiNotificationFilterService = exports.AINotificationFilterService = void 0;
class AINotificationFilterService {
    constructor() {
        // Notification priority rules
        this.priorityRules = {
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
    }
    /**
     * Filter and prioritize notifications for a user
     */
    async filterNotifications(userId, notifications) {
        try {
            // Get user preferences
            const preferences = await this.getUserPreferences(userId);
            // Categorize notifications
            const critical = [];
            const important = [];
            const batched = [];
            const suppressed = [];
            for (const notification of notifications) {
                // Check if in quiet hours
                if (this.isQuietHours(preferences)) {
                    if (notification.priority === 'critical') {
                        critical.push(notification);
                    }
                    else {
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
                }
                else if (notification.priority === 'high') {
                    important.push(notification);
                }
                else if (preferences.batchNonUrgent) {
                    batched.push(notification);
                }
                else {
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
        }
        catch (error) {
            console.error('❌ Notification filtering error:', error);
            throw new Error(`Failed to filter notifications: ${error.message}`);
        }
    }
    /**
     * Analyze notification and determine priority
     */
    async analyzePriority(notification) {
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
    async getUserPreferences(userId) {
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
    isQuietHours(preferences) {
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
        }
        else {
            // Quiet hours span midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    }
    /**
     * Generate daily digest
     */
    generateDigest(notifications) {
        const count = notifications.length;
        if (count === 0) {
            return {
                summary: 'No notifications',
                count: 0,
                items: []
            };
        }
        // Group by type
        const byType = {};
        for (const notification of notifications) {
            byType[notification.type] = (byType[notification.type] || 0) + 1;
        }
        // Generate summary
        const summaryParts = [];
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
    async batchSimilarNotifications(notifications) {
        const batched = [];
        const grouped = new Map();
        // Group by issue
        for (const notification of notifications) {
            if (notification.issueKey) {
                const key = notification.issueKey;
                if (!grouped.has(key)) {
                    grouped.set(key, []);
                }
                grouped.get(key).push(notification);
            }
            else {
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
            }
            else {
                batched.push(group[0]);
            }
        }
        return batched;
    }
    /**
     * Learn from user behavior
     */
    async learnFromUserBehavior(userId, action) {
        // TODO: Implement ML-based learning
        // Track which notifications user reads/dismisses
        // Adjust future filtering based on patterns
        console.log(`📊 Learning from user ${userId} action: ${action.action}`);
    }
    /**
     * Get notification statistics
     */
    async getNotificationStats(userId, days = 7) {
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
exports.AINotificationFilterService = AINotificationFilterService;
exports.aiNotificationFilterService = new AINotificationFilterService();
