"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const issue_merge_service_1 = require("../services/issue-merge.service");
const router = (0, express_1.Router)();
/**
 * POST /api/issues/merge
 * Merge two duplicate issues into one
 */
router.post('/merge', async (req, res) => {
    try {
        const { sourceIssueId, targetIssueId, mergeComments = true, mergeAttachments = true, mergeHistory = true, closeSource = true } = req.body;
        if (!sourceIssueId || !targetIssueId) {
            return res.status(400).json({
                error: 'sourceIssueId and targetIssueId are required'
            });
        }
        if (sourceIssueId === targetIssueId) {
            return res.status(400).json({
                error: 'Cannot merge an issue with itself'
            });
        }
        console.log(`🔀 Merging ${sourceIssueId} into ${targetIssueId}`);
        const result = await issue_merge_service_1.issueMergeService.mergeIssues({
            sourceIssueId,
            targetIssueId,
            mergeComments,
            mergeAttachments,
            mergeHistory,
            closeSource
        });
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        console.error('❌ Merge error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to merge issues'
        });
    }
});
/**
 * POST /api/issues/merge/preview
 * Preview what would be merged (dry run)
 */
router.post('/merge/preview', async (req, res) => {
    try {
        const { sourceIssueId, targetIssueId } = req.body;
        if (!sourceIssueId || !targetIssueId) {
            return res.status(400).json({
                error: 'sourceIssueId and targetIssueId are required'
            });
        }
        const preview = await issue_merge_service_1.issueMergeService.previewMerge(sourceIssueId, targetIssueId);
        res.json({
            success: true,
            ...preview
        });
    }
    catch (error) {
        console.error('❌ Preview error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to preview merge'
        });
    }
});
exports.default = router;
