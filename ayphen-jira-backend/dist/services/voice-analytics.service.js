"use strict";
/**
 * Voice Analytics Service
 * Phase 5-6: Advanced Features
 *
 * Tracks and analyzes voice assistant usage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceAnalytics = exports.VoiceAnalyticsService = void 0;
const voice_conversation_context_service_1 = require("./voice-conversation-context.service");
class VoiceAnalyticsService {
    constructor() {
        this.events = [];
        this.MAX_EVENTS = 10000;
        this.TIME_SAVED_PER_COMMAND = 0.5; // minutes
    }
    /**
     * Track analytics event
     */
    trackEvent(event) {
        const analyticsEvent = {
            id: this.generateId(),
            timestamp: Date.now(),
            ...event
        };
        this.events.push(analyticsEvent);
        // Keep only recent events
        if (this.events.length > this.MAX_EVENTS) {
            this.events = this.events.slice(-this.MAX_EVENTS);
        }
    }
    /**
     * Track command execution
     */
    trackCommand(userId, transcript, intent, confidence, success, executionTime, mode) {
        this.trackEvent({
            userId,
            eventType: 'command',
            data: {
                transcript,
                intent,
                confidence,
                success,
                executionTime,
                mode
            }
        });
    }
    /**
     * Track error
     */
    trackError(userId, errorType, details) {
        this.trackEvent({
            userId,
            eventType: 'error',
            data: {
                errorType,
                ...details
            }
        });
    }
    /**
     * Track suggestion usage
     */
    trackSuggestionUsed(userId, suggestion, source) {
        this.trackEvent({
            userId,
            eventType: 'suggestion_used',
            data: {
                suggestion,
                source
            }
        });
    }
    /**
     * Get analytics summary for time range
     */
    getSummary(startDate, endDate, userId) {
        const filteredEvents = this.filterEvents(startDate, endDate, userId);
        const commandEvents = filteredEvents.filter(e => e.eventType === 'command');
        if (commandEvents.length === 0) {
            return this.getEmptySummary();
        }
        // Calculate metrics
        const totalCommands = commandEvents.length;
        const successfulCommands = commandEvents.filter(e => e.data.success).length;
        const successRate = successfulCommands / totalCommands;
        const avgConfidence = commandEvents.reduce((sum, e) => sum + (e.data.confidence || 0), 0) / totalCommands;
        const avgExecutionTime = commandEvents.reduce((sum, e) => sum + (e.data.executionTime || 0), 0) / totalCommands;
        // Top intents
        const intentCounts = {};
        commandEvents.forEach(e => {
            const intent = e.data.intent || 'unknown';
            if (!intentCounts[intent]) {
                intentCounts[intent] = { count: 0, successful: 0 };
            }
            intentCounts[intent].count++;
            if (e.data.success) {
                intentCounts[intent].successful++;
            }
        });
        const topIntents = Object.entries(intentCounts)
            .map(([intent, data]) => ({
            intent,
            count: data.count,
            successRate: data.successful / data.count
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Top errors
        const errorEvents = filteredEvents.filter(e => e.eventType === 'error');
        const errorCounts = {};
        errorEvents.forEach(e => {
            const errorType = e.data.errorType || 'unknown';
            errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
        });
        const topErrors = Object.entries(errorCounts)
            .map(([error, count]) => ({ error, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        // Usage by hour
        const usageByHour = {};
        commandEvents.forEach(e => {
            const hour = new Date(e.timestamp).getHours();
            usageByHour[hour] = (usageByHour[hour] || 0) + 1;
        });
        // Usage by day
        const usageByDay = {};
        commandEvents.forEach(e => {
            const day = new Date(e.timestamp).toISOString().split('T')[0];
            usageByDay[day] = (usageByDay[day] || 0) + 1;
        });
        // Mode distribution
        const modeDistribution = {};
        commandEvents.forEach(e => {
            const mode = e.data.mode || 'unknown';
            modeDistribution[mode] = (modeDistribution[mode] || 0) + 1;
        });
        // Time saved
        const timeSaved = totalCommands * this.TIME_SAVED_PER_COMMAND;
        return {
            totalCommands,
            successRate,
            avgConfidence,
            avgExecutionTime,
            topIntents,
            topErrors,
            usageByHour,
            usageByDay,
            modeDistribution,
            timeSaved
        };
    }
    /**
     * Get user insights
     */
    getUserInsights(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const endDate = new Date();
        const summary = this.getSummary(startDate, endDate, userId);
        const conversationStats = voice_conversation_context_service_1.voiceConversationContext.getStats(userId);
        // Calculate efficiency (0-100)
        const efficiency = Math.round((summary.successRate * 40) +
            (summary.avgConfidence * 30) +
            (Math.min(summary.totalCommands / 100, 1) * 30));
        // Get favorite commands
        const favoriteCommands = summary.topIntents
            .slice(0, 3)
            .map(i => i.intent);
        // Determine peak usage time
        const peakHour = Object.entries(summary.usageByHour)
            .sort(([, a], [, b]) => b - a)[0];
        const peakUsageTime = peakHour
            ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00`
            : 'N/A';
        // Generate improvement suggestions
        const improvementSuggestions = this.generateImprovementSuggestions(summary, conversationStats);
        return {
            userId,
            totalCommands: summary.totalCommands,
            successRate: summary.successRate,
            favoriteCommands,
            peakUsageTime,
            improvementSuggestions,
            efficiency
        };
    }
    /**
     * Generate improvement suggestions
     */
    generateImprovementSuggestions(summary, conversationStats) {
        const suggestions = [];
        // Low success rate
        if (summary.successRate < 0.7) {
            suggestions.push('Try speaking more clearly or using simpler commands');
        }
        // Low confidence
        if (summary.avgConfidence < 0.7) {
            suggestions.push('Use more specific keywords like "priority", "status", "assign"');
        }
        // Not using suggestions
        const suggestionEvents = this.events.filter(e => e.eventType === 'suggestion_used');
        if (suggestionEvents.length < summary.totalCommands * 0.1) {
            suggestions.push('Try using the suggested commands for faster workflow');
        }
        // Single mode usage
        const modes = Object.keys(summary.modeDistribution);
        if (modes.length === 1) {
            suggestions.push('Try multi-modal input (voice + touch) for more efficient commands');
        }
        // Low usage
        if (summary.totalCommands < 10) {
            suggestions.push('Use voice commands more often to save time on repetitive tasks');
        }
        // High error rate
        if (summary.topErrors.length > 0 && summary.topErrors[0].count > summary.totalCommands * 0.2) {
            suggestions.push(`Common error: ${summary.topErrors[0].error}. Check microphone settings`);
        }
        return suggestions.slice(0, 5);
    }
    /**
     * Get real-time metrics
     */
    getRealTimeMetrics() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentEvents = this.events.filter(e => e.timestamp >= oneHourAgo.getTime());
        const commandEvents = recentEvents.filter(e => e.eventType === 'command');
        const activeUsers = new Set(recentEvents.map(e => e.userId)).size;
        const commandsLastHour = commandEvents.length;
        const avgResponseTime = commandEvents.length > 0
            ? commandEvents.reduce((sum, e) => sum + (e.data.executionTime || 0), 0) / commandEvents.length
            : 0;
        const successfulCommands = commandEvents.filter(e => e.data.success).length;
        const currentSuccessRate = commandEvents.length > 0
            ? successfulCommands / commandEvents.length
            : 0;
        return {
            activeUsers,
            commandsLastHour,
            avgResponseTime,
            currentSuccessRate
        };
    }
    /**
     * Export analytics data
     */
    exportData(startDate, endDate, format = 'json') {
        const filteredEvents = this.filterEvents(startDate, endDate);
        if (format === 'csv') {
            return this.eventsToCSV(filteredEvents);
        }
        return JSON.stringify(filteredEvents, null, 2);
    }
    /**
     * Convert events to CSV
     */
    eventsToCSV(events) {
        const headers = ['id', 'userId', 'timestamp', 'eventType', 'transcript', 'intent', 'confidence', 'success', 'executionTime'];
        const rows = events.map(e => [
            e.id,
            e.userId,
            new Date(e.timestamp).toISOString(),
            e.eventType,
            e.data.transcript || '',
            e.data.intent || '',
            e.data.confidence || '',
            e.data.success || '',
            e.data.executionTime || ''
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    /**
     * Filter events by date range and user
     */
    filterEvents(startDate, endDate, userId) {
        return this.events.filter(e => {
            const inDateRange = e.timestamp >= startDate.getTime() && e.timestamp <= endDate.getTime();
            const matchesUser = !userId || e.userId === userId;
            return inDateRange && matchesUser;
        });
    }
    /**
     * Get empty summary
     */
    getEmptySummary() {
        return {
            totalCommands: 0,
            successRate: 0,
            avgConfidence: 0,
            avgExecutionTime: 0,
            topIntents: [],
            topErrors: [],
            usageByHour: {},
            usageByDay: {},
            modeDistribution: {},
            timeSaved: 0
        };
    }
    /**
     * Clear old events
     */
    clearOldEvents(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const initialCount = this.events.length;
        this.events = this.events.filter(e => e.timestamp >= cutoffDate.getTime());
        return initialCount - this.events.length;
    }
    /**
     * Get total events count
     */
    getTotalEvents() {
        return this.events.length;
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.VoiceAnalyticsService = VoiceAnalyticsService;
// Export singleton instance
exports.voiceAnalytics = new VoiceAnalyticsService();
// Cleanup old events every 24 hours
setInterval(() => {
    const cleaned = exports.voiceAnalytics.clearOldEvents(90);
    if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} old voice analytics events`);
    }
}, 24 * 60 * 60 * 1000);
