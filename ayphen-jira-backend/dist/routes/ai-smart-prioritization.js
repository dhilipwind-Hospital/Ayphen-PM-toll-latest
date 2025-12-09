"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_smart_prioritization_service_1 = require("../services/ai-smart-prioritization.service");
const router = (0, express_1.Router)();
/**
 * POST /api/ai-smart-prioritization/analyze/:issueId
 * Analyze and suggest priority for an issue
 */
router.post('/analyze/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        console.log(`🎯 Priority analysis requested for issue: ${issueId}`);
        const result = await ai_smart_prioritization_service_1.aiSmartPrioritizationService.analyzePriority(issueId);
        res.json({
            success: true,
            data: result,
            message: `Suggested priority: ${result.suggestedPriority} (${Math.round(result.confidence)}% confidence)`
        });
    }
    catch (error) {
        console.error('❌ Priority analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze priority'
        });
    }
});
/**
 * POST /api/ai-smart-prioritization/apply/:issueId
 * Analyze and apply suggested priority
 */
router.post('/apply/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const { autoApply = true } = req.body;
        console.log(`🎯 Applying smart priority for issue: ${issueId}`);
        const analysis = await ai_smart_prioritization_service_1.aiSmartPrioritizationService.analyzePriority(issueId);
        if (autoApply) {
            const updatedIssue = await ai_smart_prioritization_service_1.aiSmartPrioritizationService.applyPriority(issueId, analysis.suggestedPriority);
            res.json({
                success: true,
                data: {
                    analysis,
                    issue: {
                        id: updatedIssue.id,
                        key: updatedIssue.key,
                        priority: updatedIssue.priority
                    },
                    applied: true
                },
                message: `Priority updated to ${analysis.suggestedPriority}`
            });
        }
        else {
            res.json({
                success: true,
                data: {
                    analysis,
                    applied: false
                },
                message: 'Priority suggestion generated (not applied)'
            });
        }
    }
    catch (error) {
        console.error('❌ Apply priority error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to apply priority'
        });
    }
});
/**
 * POST /api/ai-smart-prioritization/bulk-analyze
 * Analyze priority for multiple issues
 */
router.post('/bulk-analyze', async (req, res) => {
    try {
        const { issueIds } = req.body;
        if (!Array.isArray(issueIds) || issueIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'issueIds array is required'
            });
        }
        console.log(`🎯 Bulk priority analysis for ${issueIds.length} issues`);
        const results = await ai_smart_prioritization_service_1.aiSmartPrioritizationService.bulkAnalyzePriority(issueIds);
        const needsChange = results.filter(r => r.shouldChange).length;
        res.json({
            success: true,
            data: results,
            summary: {
                total: results.length,
                needsChange,
                upToDate: results.length - needsChange
            },
            message: `Analyzed ${results.length} issues, ${needsChange} need priority adjustment`
        });
    }
    catch (error) {
        console.error('❌ Bulk priority analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to bulk analyze priorities'
        });
    }
});
/**
 * POST /api/ai-smart-prioritization/bulk-apply
 * Apply suggested priorities to multiple issues
 */
router.post('/bulk-apply', async (req, res) => {
    try {
        const { issueIds } = req.body;
        if (!Array.isArray(issueIds) || issueIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'issueIds array is required'
            });
        }
        console.log(`🎯 Bulk applying priorities for ${issueIds.length} issues`);
        const analyses = await ai_smart_prioritization_service_1.aiSmartPrioritizationService.bulkAnalyzePriority(issueIds);
        let appliedCount = 0;
        const updates = [];
        for (const analysis of analyses) {
            if (analysis.shouldChange) {
                try {
                    await ai_smart_prioritization_service_1.aiSmartPrioritizationService.applyPriority(analysis.issueId, analysis.suggestedPriority);
                    appliedCount++;
                    updates.push({
                        issueId: analysis.issueId,
                        from: analysis.currentPriority,
                        to: analysis.suggestedPriority,
                        confidence: analysis.confidence
                    });
                }
                catch (error) {
                    console.error(`Failed to apply priority for issue ${analysis.issueId}:`, error);
                }
            }
        }
        res.json({
            success: true,
            data: {
                total: issueIds.length,
                applied: appliedCount,
                skipped: issueIds.length - appliedCount,
                updates
            },
            message: `Updated priority for ${appliedCount} of ${issueIds.length} issues`
        });
    }
    catch (error) {
        console.error('❌ Bulk apply priority error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to bulk apply priorities'
        });
    }
});
exports.default = router;
