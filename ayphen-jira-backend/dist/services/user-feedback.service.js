"use strict";
/**
 * User Feedback Service
 * Phase 9-10: Analytics & Learning
 *
 * Collects and analyzes user feedback on voice commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFeedback = exports.UserFeedbackService = void 0;
class UserFeedbackService {
    constructor() {
        this.feedback = [];
        this.MAX_FEEDBACK = 10000;
    }
    /**
     * Submit feedback
     */
    submitFeedback(feedback) {
        const newFeedback = {
            id: this.generateId(),
            timestamp: new Date(),
            ...feedback
        };
        this.feedback.push(newFeedback);
        // Keep only recent feedback
        if (this.feedback.length > this.MAX_FEEDBACK) {
            this.feedback = this.feedback.slice(-this.MAX_FEEDBACK);
        }
        return newFeedback;
    }
    /**
     * Submit thumbs up/down
     */
    submitRating(userId, commandId, isPositive, comment) {
        return this.submitFeedback({
            userId,
            feedbackType: isPositive ? 'thumbs_up' : 'thumbs_down',
            commandId,
            comment
        });
    }
    /**
     * Submit correction
     */
    submitCorrection(userId, originalTranscript, correctedTranscript, originalIntent, correctIntent, confidence) {
        return this.submitFeedback({
            userId,
            feedbackType: 'correction',
            transcript: originalTranscript,
            intent: originalIntent,
            confidence,
            comment: `Corrected to: "${correctedTranscript}" (intent: ${correctIntent})`,
            context: {
                correctedTranscript,
                correctIntent
            }
        });
    }
    /**
     * Submit feature request
     */
    submitFeatureRequest(userId, feature, description) {
        return this.submitFeedback({
            userId,
            feedbackType: 'feature_request',
            comment: feature,
            context: { description }
        });
    }
    /**
     * Submit bug report
     */
    submitBugReport(userId, bug, transcript, context) {
        return this.submitFeedback({
            userId,
            feedbackType: 'bug_report',
            transcript,
            comment: bug,
            context
        });
    }
    /**
     * Get feedback summary
     */
    getFeedbackSummary(startDate, endDate, userId) {
        const filtered = this.filterFeedback(startDate, endDate, userId);
        const positiveCount = filtered.filter(f => f.feedbackType === 'thumbs_up').length;
        const negativeCount = filtered.filter(f => f.feedbackType === 'thumbs_down').length;
        const totalRatings = positiveCount + negativeCount;
        const satisfactionScore = totalRatings > 0
            ? Math.round((positiveCount / totalRatings) * 100)
            : 0;
        // Extract top issues from bug reports and thumbs down
        const issues = filtered
            .filter(f => f.feedbackType === 'bug_report' || f.feedbackType === 'thumbs_down')
            .map(f => f.comment || 'Unknown issue');
        const issueCount = this.countOccurrences(issues);
        const topIssues = Object.entries(issueCount)
            .map(([issue, count]) => ({ issue, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        // Extract top feature requests
        const features = filtered
            .filter(f => f.feedbackType === 'feature_request')
            .map(f => f.comment || 'Unknown feature');
        const featureCount = this.countOccurrences(features);
        const topFeatureRequests = Object.entries(featureCount)
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return {
            totalFeedback: filtered.length,
            positiveCount,
            negativeCount,
            satisfactionScore,
            topIssues,
            topFeatureRequests,
            recentFeedback: filtered.slice(-10).reverse()
        };
    }
    /**
     * Get command effectiveness
     */
    getCommandEffectiveness(commandPattern, commandHistory) {
        const matchingCommands = commandHistory.filter(cmd => cmd.transcript.toLowerCase().includes(commandPattern.toLowerCase()) ||
            cmd.intent === commandPattern);
        const totalExecutions = matchingCommands.length;
        const successfulExecutions = matchingCommands.filter(cmd => cmd.success).length;
        const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;
        const averageConfidence = totalExecutions > 0
            ? matchingCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) / totalExecutions
            : 0;
        // Get feedback for these commands
        const commandIds = matchingCommands.map(cmd => cmd.commandId);
        const commandFeedback = this.feedback.filter(f => f.commandId && commandIds.includes(f.commandId));
        const thumbsUp = commandFeedback.filter(f => f.feedbackType === 'thumbs_up').length;
        const thumbsDown = commandFeedback.filter(f => f.feedbackType === 'thumbs_down').length;
        const totalFeedback = thumbsUp + thumbsDown;
        const userSatisfaction = totalFeedback > 0
            ? Math.round((thumbsUp / totalFeedback) * 100)
            : 0;
        // Generate improvement suggestions
        const improvementSuggestions = this.generateImprovementSuggestions({
            successRate,
            averageConfidence,
            userSatisfaction,
            thumbsDown,
            commandFeedback
        });
        return {
            commandPattern,
            totalExecutions,
            successfulExecutions,
            successRate,
            averageConfidence,
            thumbsUp,
            thumbsDown,
            userSatisfaction,
            improvementSuggestions
        };
    }
    /**
     * Generate improvement suggestions
     */
    generateImprovementSuggestions(metrics) {
        const suggestions = [];
        if (metrics.successRate < 0.7) {
            suggestions.push('Low success rate - review command processing logic');
        }
        if (metrics.averageConfidence < 0.7) {
            suggestions.push('Low confidence - add to custom vocabulary or improve NLU training');
        }
        if (metrics.userSatisfaction < 50 && metrics.thumbsDown > 5) {
            suggestions.push('Low user satisfaction - review negative feedback comments');
        }
        // Analyze negative feedback comments
        const negativeComments = metrics.commandFeedback
            .filter(f => f.feedbackType === 'thumbs_down' && f.comment)
            .map(f => f.comment);
        if (negativeComments.length > 0) {
            const commonWords = this.extractCommonWords(negativeComments);
            if (commonWords.length > 0) {
                suggestions.push(`Common issues: ${commonWords.slice(0, 3).join(', ')}`);
            }
        }
        if (suggestions.length === 0) {
            suggestions.push('Command performing well - no improvements needed');
        }
        return suggestions;
    }
    /**
     * Get corrections for learning
     */
    getCorrections(userId) {
        const corrections = this.feedback.filter(f => f.feedbackType === 'correction' &&
            (!userId || f.userId === userId));
        const correctionMap = new Map();
        for (const correction of corrections) {
            if (!correction.context?.correctedTranscript)
                continue;
            const key = `${correction.transcript}:${correction.context.correctedTranscript}`;
            if (!correctionMap.has(key)) {
                correctionMap.set(key, {
                    original: correction.transcript || '',
                    corrected: correction.context.correctedTranscript,
                    originalIntent: correction.intent || '',
                    correctIntent: correction.context.correctIntent || '',
                    count: 0
                });
            }
            correctionMap.get(key).count++;
        }
        return Array.from(correctionMap.values())
            .sort((a, b) => b.count - a.count);
    }
    /**
     * Mark feedback as resolved
     */
    resolveFeedback(feedbackId) {
        const feedback = this.feedback.find(f => f.id === feedbackId);
        if (!feedback)
            return false;
        feedback.resolved = true;
        feedback.resolvedAt = new Date();
        return true;
    }
    /**
     * Get unresolved feedback
     */
    getUnresolvedFeedback(type) {
        return this.feedback.filter(f => !f.resolved &&
            (!type || f.feedbackType === type));
    }
    /**
     * Filter feedback
     */
    filterFeedback(startDate, endDate, userId) {
        return this.feedback.filter(f => {
            if (startDate && f.timestamp < startDate)
                return false;
            if (endDate && f.timestamp > endDate)
                return false;
            if (userId && f.userId !== userId)
                return false;
            return true;
        });
    }
    /**
     * Count occurrences
     */
    countOccurrences(items) {
        const counts = {};
        for (const item of items) {
            counts[item] = (counts[item] || 0) + 1;
        }
        return counts;
    }
    /**
     * Extract common words from comments
     */
    extractCommonWords(comments) {
        const words = comments
            .join(' ')
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3); // Filter short words
        const wordCount = this.countOccurrences(words);
        return Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }
    /**
     * Export feedback
     */
    exportFeedback(startDate, endDate) {
        const filtered = this.filterFeedback(startDate, endDate);
        return JSON.stringify(filtered, null, 2);
    }
    /**
     * Get feedback statistics
     */
    getStatistics() {
        const byType = {};
        let totalRating = 0;
        let ratingCount = 0;
        let resolvedCount = 0;
        for (const f of this.feedback) {
            byType[f.feedbackType] = (byType[f.feedbackType] || 0) + 1;
            if (f.rating) {
                totalRating += f.rating;
                ratingCount++;
            }
            if (f.resolved) {
                resolvedCount++;
            }
        }
        return {
            totalFeedback: this.feedback.length,
            byType,
            averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
            resolvedPercentage: this.feedback.length > 0
                ? (resolvedCount / this.feedback.length) * 100
                : 0
        };
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Clear old feedback
     */
    clearOldFeedback(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const initialCount = this.feedback.length;
        this.feedback = this.feedback.filter(f => f.timestamp >= cutoffDate);
        return initialCount - this.feedback.length;
    }
}
exports.UserFeedbackService = UserFeedbackService;
// Export singleton instance
exports.userFeedback = new UserFeedbackService();
// Cleanup old feedback every 24 hours
setInterval(() => {
    const cleaned = exports.userFeedback.clearOldFeedback(90);
    if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} old feedback entries`);
    }
}, 24 * 60 * 60 * 1000);
