"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateLearningService = exports.DuplicateLearningService = void 0;
const database_1 = require("../config/database");
const DuplicateFeedback_1 = require("../entities/DuplicateFeedback");
class DuplicateLearningService {
    /**
     * Record user feedback on duplicate suggestion
     */
    async recordFeedback(feedback) {
        const feedbackRepo = database_1.AppDataSource.getRepository(DuplicateFeedback_1.DuplicateFeedback);
        try {
            // Determine if the AI was correct
            // Linked or merged = AI was correct
            // Dismissed or blocked = AI was wrong
            const wasCorrect = feedback.userAction === 'linked' || feedback.userAction === 'merged';
            const feedbackEntry = feedbackRepo.create({
                issueId: feedback.issueId,
                suggestedDuplicateId: feedback.suggestedDuplicateId,
                aiConfidence: feedback.aiConfidence,
                userAction: feedback.userAction,
                wasCorrect,
                userId: feedback.userId
            });
            await feedbackRepo.save(feedbackEntry);
            console.log(`📊 Feedback recorded: ${feedback.userAction} (${feedback.aiConfidence}% confidence, ${wasCorrect ? 'correct' : 'incorrect'})`);
        }
        catch (error) {
            console.error('❌ Failed to record feedback:', error);
            throw error;
        }
    }
    /**
     * Get accuracy metrics for duplicate detection
     */
    async getAccuracyMetrics() {
        const feedbackRepo = database_1.AppDataSource.getRepository(DuplicateFeedback_1.DuplicateFeedback);
        try {
            // Get all feedback
            const allFeedback = await feedbackRepo.find();
            if (allFeedback.length === 0) {
                return {
                    totalSuggestions: 0,
                    correctSuggestions: 0,
                    accuracy: 0,
                    byConfidenceRange: [],
                    byAction: []
                };
            }
            const total = allFeedback.length;
            const correct = allFeedback.filter(f => f.wasCorrect).length;
            const accuracy = (correct / total) * 100;
            // Group by confidence range
            const ranges = {
                '90-100%': allFeedback.filter(f => f.aiConfidence >= 90),
                '80-89%': allFeedback.filter(f => f.aiConfidence >= 80 && f.aiConfidence < 90),
                '70-79%': allFeedback.filter(f => f.aiConfidence >= 70 && f.aiConfidence < 80),
                '60-69%': allFeedback.filter(f => f.aiConfidence >= 60 && f.aiConfidence < 70)
            };
            const byConfidenceRange = Object.entries(ranges).map(([range, items]) => ({
                range,
                total: items.length,
                correct: items.filter(f => f.wasCorrect).length,
                accuracy: items.length > 0 ? (items.filter(f => f.wasCorrect).length / items.length) * 100 : 0
            })).filter(r => r.total > 0);
            // Group by action
            const actions = ['dismissed', 'linked', 'merged', 'blocked'];
            const byAction = actions.map(action => {
                const count = allFeedback.filter(f => f.userAction === action).length;
                return {
                    action,
                    count,
                    percentage: (count / total) * 100
                };
            }).filter(a => a.count > 0);
            return {
                totalSuggestions: total,
                correctSuggestions: correct,
                accuracy,
                byConfidenceRange,
                byAction
            };
        }
        catch (error) {
            console.error('❌ Failed to get accuracy metrics:', error);
            throw error;
        }
    }
    /**
     * Adjust AI confidence based on historical accuracy
     */
    async adjustConfidence(rawConfidence) {
        try {
            const metrics = await this.getAccuracyMetrics();
            if (metrics.totalSuggestions < 10) {
                // Not enough data, return raw confidence
                return rawConfidence;
            }
            // Find accuracy for this confidence range
            const range = rawConfidence >= 90 ? '90-100%' :
                rawConfidence >= 80 ? '80-89%' :
                    rawConfidence >= 70 ? '70-79%' : '60-69%';
            const rangeMetrics = metrics.byConfidenceRange.find(m => m.range === range);
            if (!rangeMetrics || rangeMetrics.total < 5) {
                // Not enough data for this range
                return rawConfidence;
            }
            // Adjust confidence based on historical accuracy
            // If AI says 95% but historical accuracy is 80%, adjust down
            const adjustmentFactor = rangeMetrics.accuracy / 100;
            const adjustedConfidence = rawConfidence * adjustmentFactor;
            console.log(`📊 Confidence adjusted: ${rawConfidence}% → ${Math.round(adjustedConfidence)}% (based on ${rangeMetrics.accuracy.toFixed(1)}% historical accuracy)`);
            return Math.round(adjustedConfidence);
        }
        catch (error) {
            console.error('⚠️ Failed to adjust confidence, using raw value:', error);
            return rawConfidence;
        }
    }
    /**
     * Get recent feedback for analysis
     */
    async getRecentFeedback(limit = 100) {
        const feedbackRepo = database_1.AppDataSource.getRepository(DuplicateFeedback_1.DuplicateFeedback);
        try {
            return await feedbackRepo.find({
                order: { createdAt: 'DESC' },
                take: limit,
                relations: ['issue', 'suggestedDuplicate', 'user']
            });
        }
        catch (error) {
            console.error('❌ Failed to get recent feedback:', error);
            return [];
        }
    }
}
exports.DuplicateLearningService = DuplicateLearningService;
// Export singleton instance
exports.duplicateLearningService = new DuplicateLearningService();
