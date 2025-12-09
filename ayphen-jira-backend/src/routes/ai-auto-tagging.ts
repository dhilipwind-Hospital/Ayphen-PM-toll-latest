import { Router } from 'express';
import { aiAutoTaggingService } from '../services/ai-auto-tagging.service';

const router = Router();

/**
 * POST /api/ai-auto-tagging/suggest/:issueId
 * Get tag suggestions for an issue
 */
router.post('/suggest/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;

    console.log(`🏷️  Tag suggestions requested for issue: ${issueId}`);

    const result = await aiAutoTaggingService.suggestTags(issueId);

    res.json({
      success: true,
      data: result,
      message: `Suggested ${result.tagsToAdd.length} new tags (${result.confidence}% confidence)`
    });
  } catch (error: any) {
    console.error('❌ Tag suggestion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to suggest tags'
    });
  }
});

/**
 * POST /api/ai-auto-tagging/apply/:issueId
 * Apply suggested tags to an issue
 */
router.post('/apply/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { tags, autoApply = true } = req.body;

    console.log(`🏷️  Applying tags for issue: ${issueId}`);

    let tagsToApply: string[];

    if (tags && Array.isArray(tags)) {
      // Use provided tags
      tagsToApply = tags;
    } else {
      // Get AI suggestions
      const result = await aiAutoTaggingService.suggestTags(issueId);
      tagsToApply = result.tagsToAdd;
    }

    if (autoApply && tagsToApply.length > 0) {
      const updatedIssue = await aiAutoTaggingService.applyTags(issueId, tagsToApply);

      res.json({
        success: true,
        data: {
          issue: {
            id: updatedIssue.id,
            key: updatedIssue.key,
            labels: updatedIssue.labels
          },
          appliedTags: tagsToApply,
          applied: true
        },
        message: `Applied ${tagsToApply.length} tags`
      });
    } else {
      res.json({
        success: true,
        data: {
          suggestedTags: tagsToApply,
          applied: false
        },
        message: 'Tag suggestions generated (not applied)'
      });
    }
  } catch (error: any) {
    console.error('❌ Apply tags error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply tags'
    });
  }
});

/**
 * POST /api/ai-auto-tagging/bulk-suggest
 * Get tag suggestions for multiple issues
 */
router.post('/bulk-suggest', async (req, res) => {
  try {
    const { issueIds } = req.body;

    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'issueIds array is required'
      });
    }

    console.log(`🏷️  Bulk tag suggestions for ${issueIds.length} issues`);

    const results = await aiAutoTaggingService.bulkSuggestTags(issueIds);

    // Convert Map to object
    const resultsObj: any = {};
    results.forEach((value, key) => {
      resultsObj[key] = value;
    });

    const totalNewTags = Array.from(results.values())
      .reduce((sum, r) => sum + r.tagsToAdd.length, 0);

    res.json({
      success: true,
      data: resultsObj,
      summary: {
        total: results.size,
        totalNewTags
      },
      message: `Generated ${totalNewTags} tag suggestions for ${results.size} issues`
    });
  } catch (error: any) {
    console.error('❌ Bulk tag suggestion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk suggest tags'
    });
  }
});

/**
 * POST /api/ai-auto-tagging/bulk-apply
 * Apply suggested tags to multiple issues
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

    console.log(`🏷️  Bulk applying tags for ${issueIds.length} issues`);

    const appliedCount = await aiAutoTaggingService.bulkApplyTags(issueIds);

    res.json({
      success: true,
      data: {
        total: issueIds.length,
        applied: appliedCount,
        skipped: issueIds.length - appliedCount
      },
      message: `Applied tags to ${appliedCount} of ${issueIds.length} issues`
    });
  } catch (error: any) {
    console.error('❌ Bulk apply tags error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk apply tags'
    });
  }
});

export default router;
