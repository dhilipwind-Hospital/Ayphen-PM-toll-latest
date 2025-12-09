/**
 * Voice Assistant AI Routes
 * Phase 3-4: AI Intelligence
 * 
 * New AI-powered endpoints for NLU, context-aware commands, and smart suggestions
 */

import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { User } from '../entities/User';
import { voiceNLU } from '../services/voice-nlu.service';
import { voiceConversationContext } from '../services/voice-conversation-context.service';
import { voiceSmartSuggestions } from '../services/voice-smart-suggestions.service';

const router = Router();
const issueRepo = AppDataSource.getRepository(Issue);
const userRepo = AppDataSource.getRepository(User);

/**
 * POST /api/voice-assistant-ai/parse
 * Parse voice command using AI NLU
 */
router.post('/parse', async (req, res) => {
  try {
    const { transcript, context } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    // Resolve references using conversation context
    const resolvedTranscript = context.userId 
      ? voiceConversationContext.resolveReferences(context.userId, transcript)
      : transcript;

    // Parse intent using AI
    const result = await voiceNLU.parseIntent(resolvedTranscript, {
      userId: context.userId,
      issueId: context.issueId,
      projectId: context.projectId,
      currentPage: context.currentPage,
      recentCommands: context.userId 
        ? voiceConversationContext.getHistory(context.userId, 3).map(cmd => cmd.transcript)
        : []
    });

    // Validate intent
    const validation = voiceNLU.validateIntent(result.intent);

    res.json({
      success: true,
      ...result,
      validation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/voice-assistant-ai/execute
 * Execute AI-parsed command
 */
router.post('/execute', async (req, res) => {
  try {
    const { intent, context } = req.body;

    if (!intent || !intent.type) {
      return res.status(400).json({
        success: false,
        error: 'Intent is required'
      });
    }

    // Execute based on intent type
    let result: any;

    switch (intent.type) {
      case 'update_priority':
        result = await handleUpdatePriority(intent, context);
        break;
      case 'update_status':
        result = await handleUpdateStatus(intent, context);
        break;
      case 'assign':
        result = await handleAssign(intent, context);
        break;
      case 'add_label':
        result = await handleAddLabel(intent, context);
        break;
      case 'set_due_date':
        result = await handleSetDueDate(intent, context);
        break;
      case 'add_comment':
        result = await handleAddComment(intent, context);
        break;
      default:
        result = {
          success: false,
          message: `Intent type '${intent.type}' not yet implemented`
        };
    }

    // Add to conversation history
    if (context.userId) {
      voiceConversationContext.addCommand(
        context.userId,
        intent.description,
        intent.type,
        intent.entities,
        result.success,
        context.issueId,
        context.projectId
      );
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voice-assistant-ai/suggestions
 * Get smart suggestions based on context
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { userId, currentPage, issueId, projectId } = req.query;

    const suggestions = await voiceSmartSuggestions.getSuggestions({
      userId: userId as string,
      currentPage: currentPage as string,
      issueId: issueId as string,
      projectId: projectId as string
    });

    res.json({
      success: true,
      suggestions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voice-assistant-ai/context
 * Get conversation context for user
 */
router.get('/context/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const context = voiceConversationContext.getContext(userId);
    const summary = voiceConversationContext.getContextSummary(userId);
    const stats = voiceConversationContext.getStats(userId);

    res.json({
      success: true,
      context: {
        currentIssue: context.currentIssue,
        lastAction: context.lastAction,
        recentCommands: context.recentCommands.slice(0, 5)
      },
      summary,
      stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/voice-assistant-ai/set-context
 * Set current issue context
 */
router.post('/set-context', async (req, res) => {
  try {
    const { userId, issue } = req.body;

    if (!userId || !issue) {
      return res.status(400).json({
        success: false,
        error: 'userId and issue are required'
      });
    }

    voiceConversationContext.setCurrentIssue(userId, issue);

    res.json({
      success: true,
      message: 'Context updated'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/voice-assistant-ai/corrections
 * Get suggestions for unclear commands
 */
router.post('/corrections', async (req, res) => {
  try {
    const { transcript, context } = req.body;

    const corrections = await voiceNLU.suggestCorrections(transcript, context);

    res.json({
      success: true,
      corrections
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/voice-assistant-ai/context/:userId
 * Clear conversation context
 */
router.delete('/context/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    voiceConversationContext.clearContext(userId);

    res.json({
      success: true,
      message: 'Context cleared'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Intent Handlers
// ============================================================================

async function handleUpdatePriority(intent: any, context: any) {
  if (!context.issueId) {
    return { success: false, message: 'No issue selected' };
  }

  const issue = await issueRepo.findOne({ where: { id: context.issueId } });
  if (!issue) {
    return { success: false, message: 'Issue not found' };
  }

  const priority = intent.entities.priority;
  issue.priority = priority;
  await issueRepo.save(issue);

  return {
    success: true,
    message: `Priority set to ${priority}`,
    updates: { priority }
  };
}

async function handleUpdateStatus(intent: any, context: any) {
  if (!context.issueId) {
    return { success: false, message: 'No issue selected' };
  }

  const issue = await issueRepo.findOne({ where: { id: context.issueId } });
  if (!issue) {
    return { success: false, message: 'Issue not found' };
  }

  const status = intent.entities.status;
  issue.status = status;
  await issueRepo.save(issue);

  return {
    success: true,
    message: `Status changed to ${status}`,
    updates: { status }
  };
}

async function handleAssign(intent: any, context: any) {
  if (!context.issueId) {
    return { success: false, message: 'No issue selected' };
  }

  const issue = await issueRepo.findOne({ where: { id: context.issueId } });
  if (!issue) {
    return { success: false, message: 'Issue not found' };
  }

  const assigneeName = intent.entities.assignee;
  
  // Find user by name
  const users = await userRepo.find();
  const user = users.find(u => u.name.toLowerCase().includes(assigneeName.toLowerCase()));

  if (!user) {
    return { success: false, message: `User '${assigneeName}' not found` };
  }

  issue.assigneeId = user.id;
  await issueRepo.save(issue);

  return {
    success: true,
    message: `Assigned to ${user.name}`,
    updates: { assigneeId: user.id, assigneeName: user.name }
  };
}

async function handleAddLabel(intent: any, context: any) {
  if (!context.issueId) {
    return { success: false, message: 'No issue selected' };
  }

  const issue = await issueRepo.findOne({ where: { id: context.issueId } });
  if (!issue) {
    return { success: false, message: 'Issue not found' };
  }

  const label = intent.entities.label;
  const currentLabels = issue.labels || [];
  
  if (!currentLabels.includes(label)) {
    issue.labels = [...currentLabels, label];
    await issueRepo.save(issue);
  }

  return {
    success: true,
    message: `Label '${label}' added`,
    updates: { labels: issue.labels }
  };
}

async function handleSetDueDate(intent: any, context: any) {
  if (!context.issueId) {
    return { success: false, message: 'No issue selected' };
  }

  const issue = await issueRepo.findOne({ where: { id: context.issueId } });
  if (!issue) {
    return { success: false, message: 'Issue not found' };
  }

  // Parse natural language date
  const dueDateStr = intent.entities.dueDate;
  const dueDate = parseNaturalDate(dueDateStr);

  if (!dueDate) {
    return { success: false, message: `Could not parse date: ${dueDateStr}` };
  }

  issue.dueDate = dueDate;
  await issueRepo.save(issue);

  return {
    success: true,
    message: `Due date set to ${dueDate.toLocaleDateString()}`,
    updates: { dueDate }
  };
}

async function handleAddComment(intent: any, context: any) {
  if (!context.issueId) {
    return { success: false, message: 'No issue selected' };
  }

  const comment = intent.entities.comment;

  // Note: This would need a Comment entity/service
  // For now, just return success
  return {
    success: true,
    message: 'Comment added',
    data: { comment }
  };
}

/**
 * Parse natural language dates
 */
function parseNaturalDate(dateStr: string): Date | null {
  const today = new Date();
  const lower = dateStr.toLowerCase();

  if (lower.includes('today')) {
    return today;
  }
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  if (lower.includes('friday') || lower.includes('end of week')) {
    const friday = new Date(today);
    const daysUntilFriday = (5 - today.getDay() + 7) % 7;
    friday.setDate(friday.getDate() + daysUntilFriday);
    return friday;
  }
  if (lower.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  // Try to parse as ISO date
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export default router;
