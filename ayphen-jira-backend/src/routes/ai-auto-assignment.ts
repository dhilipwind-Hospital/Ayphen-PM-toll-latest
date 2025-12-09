import { Router } from 'express';
import { aiAutoAssignmentService } from '../services/ai-auto-assignment.service';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';

const router = Router();

/**
 * POST /api/ai-auto-assignment/suggest/:issueId
 * Get auto-assignment suggestion for an issue
 */
router.post('/suggest/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;

    console.log(`🤖 Auto-assignment requested for issue: ${issueId}`);

    const result = await aiAutoAssignmentService.autoAssignIssue(issueId);

    res.json({
      success: true,
      data: result,
      message: `Recommended assignee: ${result.recommendedAssignee.userName} (${Math.round(result.recommendedAssignee.confidence)}% confidence)`
    });
  } catch (error: any) {
    console.error('❌ Auto-assignment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-assign issue'
    });
  }
});

/**
 * POST /api/ai-auto-assignment/assign/:issueId
 * Auto-assign and update issue in one step
 */
router.post('/assign/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { autoApply = true } = req.body;

    console.log(`🤖 Auto-assigning issue: ${issueId}`);

    // Get suggestion
    const result = await aiAutoAssignmentService.autoAssignIssue(issueId);

    // Apply assignment if requested
    if (autoApply) {
      const issueRepo = AppDataSource.getRepository(Issue);
      const issue = await issueRepo.findOne({ where: { id: issueId } });

      if (!issue) {
        return res.status(404).json({
          success: false,
          error: 'Issue not found'
        });
      }

      // Update assignee
      issue.assigneeId = result.recommendedAssignee.userId;
      await issueRepo.save(issue);

      console.log(`✅ Issue ${issueId} assigned to ${result.recommendedAssignee.userName}`);

      res.json({
        success: true,
        data: {
          ...result,
          applied: true,
          issue: {
            id: issue.id,
            key: issue.key,
            assigneeId: issue.assigneeId
          }
        },
        message: `Issue assigned to ${result.recommendedAssignee.userName}`
      });
    } else {
      res.json({
        success: true,
        data: {
          ...result,
          applied: false
        },
        message: 'Assignment suggestion generated (not applied)'
      });
    }
  } catch (error: any) {
    console.error('❌ Auto-assign and update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign issue'
    });
  }
});

/**
 * POST /api/ai-auto-assignment/bulk-suggest
 * Get auto-assignment suggestions for multiple issues
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

    console.log(`🤖 Bulk auto-assignment for ${issueIds.length} issues`);

    const results = await aiAutoAssignmentService.bulkAutoAssign(issueIds);

    // Convert Map to object for JSON response
    const resultsObj: any = {};
    results.forEach((value, key) => {
      resultsObj[key] = value;
    });

    res.json({
      success: true,
      data: resultsObj,
      count: results.size,
      message: `Generated assignments for ${results.size} issues`
    });
  } catch (error: any) {
    console.error('❌ Bulk auto-assignment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk auto-assign'
    });
  }
});

/**
 * POST /api/ai-auto-assignment/bulk-assign
 * Auto-assign multiple issues at once
 */
router.post('/bulk-assign', async (req, res) => {
  try {
    const { issueIds } = req.body;

    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'issueIds array is required'
      });
    }

    console.log(`🤖 Bulk assigning ${issueIds.length} issues`);

    const results = await aiAutoAssignmentService.bulkAutoAssign(issueIds);
    const issueRepo = AppDataSource.getRepository(Issue);

    let assignedCount = 0;
    const assignments: any[] = [];

    // Apply assignments
    for (const [issueId, result] of results.entries()) {
      try {
        const issue = await issueRepo.findOne({ where: { id: issueId } });
        if (issue) {
          issue.assigneeId = result.recommendedAssignee.userId;
          await issueRepo.save(issue);
          assignedCount++;
          
          assignments.push({
            issueId,
            issueKey: issue.key,
            assignedTo: result.recommendedAssignee.userName,
            confidence: result.recommendedAssignee.confidence
          });
        }
      } catch (error) {
        console.error(`Failed to assign issue ${issueId}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        total: issueIds.length,
        assigned: assignedCount,
        assignments
      },
      message: `Successfully assigned ${assignedCount} of ${issueIds.length} issues`
    });
  } catch (error: any) {
    console.error('❌ Bulk assign error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk assign issues'
    });
  }
});

/**
 * POST /api/ai-auto-assignment/feedback
 * Record feedback for learning
 */
router.post('/feedback', async (req, res) => {
  try {
    const { issueId, recommendedUserId, actualUserId, wasAccepted } = req.body;

    if (!issueId || !recommendedUserId || !actualUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    await aiAutoAssignmentService.recordAssignmentFeedback(
      issueId,
      recommendedUserId,
      actualUserId,
      wasAccepted
    );

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error: any) {
    console.error('❌ Feedback recording error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record feedback'
    });
  }
});

/**
 * GET /api/ai-auto-assignment/stats/:projectId
 * Get auto-assignment statistics for a project
 */
router.get('/stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // TODO: Implement statistics tracking
    // For now, return placeholder data
    res.json({
      success: true,
      data: {
        projectId,
        totalAutoAssignments: 0,
        acceptanceRate: 0,
        averageConfidence: 0,
        topAssignees: []
      },
      message: 'Statistics feature coming soon'
    });
  } catch (error: any) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get statistics'
    });
  }
});

export default router;
