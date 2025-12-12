import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { getUserProjectIds } from '../middleware/projectAccess';
import { aiDuplicateDetector } from '../services/ai-duplicate-detector.service';
import { websocketService } from '../services/websocket.service';
import { emailService } from '../services/email.service';
import { In } from 'typeorm';

const router = Router();
const issueRepo = AppDataSource.getRepository(Issue);
const projectRepo = AppDataSource.getRepository(Project);

// Helper function to generate unique issue key
// Uses project.lastIssueNumber to ensure sequential keys even after deletes
async function generateIssueKey(projectId: string): Promise<string> {
  try {
    // Get project to get the key prefix and last issue number
    const project = await projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      console.error('Project not found:', projectId);
      return `PROJ-${Date.now()}`;
    }
    
    const prefix = project.key || 'PROJ';
    
    // Use the stored lastIssueNumber for true sequential numbering
    // This ensures deleted issues don't cause number reuse
    let nextNumber = (project.lastIssueNumber || 0) + 1;
    
    // Also check current issues as a fallback (for existing data migration)
    const allIssues = await issueRepo
      .createQueryBuilder('issue')
      .where('issue.projectId = :projectId', { projectId })
      .andWhere('issue.key LIKE :prefix', { prefix: `${prefix}-%` })
      .getMany();
    
    let maxExistingNumber = 0;
    allIssues.forEach(issue => {
      if (issue.key) {
        const match = issue.key.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxExistingNumber) {
            maxExistingNumber = num;
          }
        }
      }
    });
    
    // Use the higher of stored counter or existing max
    nextNumber = Math.max(nextNumber, maxExistingNumber + 1);
    
    const newKey = `${prefix}-${nextNumber}`;
    
    // Update project's lastIssueNumber to track this allocation
    project.lastIssueNumber = nextNumber;
    await projectRepo.save(project);
    
    // Double-check key doesn't exist (race condition protection)
    const existingIssue = await issueRepo.findOne({ where: { key: newKey } });
    if (existingIssue) {
      // If key exists, increment and try again
      const retryNumber = nextNumber + 1;
      project.lastIssueNumber = retryNumber;
      await projectRepo.save(project);
      return `${prefix}-${retryNumber}`;
    }
    
    return newKey;
  } catch (error) {
    console.error('Error generating issue key:', error);
    // Fallback with timestamp to ensure uniqueness
    return `PROJ-${Date.now()}`;
  }
}

// GET all issues (filtered by user's accessible projects)
router.get('/', async (req, res) => {
  try {
    const { projectId, status, assigneeId, userId, type } = req.query;
    
    // REQUIRE userId FOR DATA ISOLATION
    if (!userId) {
      return res.json([]); // No userId = No data
    }
    
    // Get user's accessible projects
    const accessibleProjectIds = await getUserProjectIds(userId as string);
    
    // Build where clause
    const where: any = {};
    
    if (projectId) {
      // Check if user has access to the requested project
      if (!accessibleProjectIds.includes(projectId as string)) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
      where.projectId = projectId;
    } else {
      // Filter by all accessible projects
      where.projectId = In(accessibleProjectIds);
    }
    
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (type) where.type = type;

    const issues = await issueRepo.find({
      where,
      relations: ['reporter', 'assignee', 'project'],
      order: { createdAt: 'DESC' },
    });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// GET issue by ID
router.get('/:id', async (req, res) => {
  try {
    const issue = await issueRepo.findOne({
      where: { id: req.params.id },
      relations: ['reporter', 'assignee', 'project'],
    });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// GET issue by key
router.get('/key/:key', async (req, res) => {
  try {
    const issue = await issueRepo.findOne({
      where: { key: req.params.key },
      relations: ['reporter', 'assignee', 'project'],
    });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// POST create issue
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating issue with data:', req.body);
    
    // Check for exact duplicates (98%+ confidence) unless override is set
    if (req.body.summary && req.body.projectId && !req.body.overrideDuplicate) {
      try {
        const duplicateCheck = await aiDuplicateDetector.checkDuplicates(
          req.body.summary,
          req.body.description || '',
          req.body.projectId,
          req.body.type
        );
        
        // Block if exact duplicate found (98%+ confidence)
        if (duplicateCheck.confidence >= 98 && duplicateCheck.duplicates.length > 0) {
          console.log(`⛔ Blocking duplicate creation: ${duplicateCheck.confidence}% match with ${duplicateCheck.duplicates[0].key}`);
          return res.status(409).json({
            error: 'Exact duplicate detected',
            code: 'DUPLICATE_ISSUE',
            duplicate: duplicateCheck.duplicates[0],
            confidence: duplicateCheck.confidence,
            message: `This issue appears to be an exact duplicate of ${duplicateCheck.duplicates[0].key}. Please review before creating.`
          });
        }
      } catch (dupError) {
        console.error('⚠️ Duplicate check failed, proceeding with creation:', dupError);
        // Continue with creation if duplicate check fails
      }
    }
    
    // Generate unique key if not provided
    if (!req.body.key && req.body.projectId) {
      req.body.key = await generateIssueKey(req.body.projectId);
      console.log('🔑 Generated issue key:', req.body.key);
    }
    
    // Force status to backlog for new issues if not specified or todo
    if (!req.body.status || req.body.status === 'todo') {
      req.body.status = 'backlog';
    }
    
    // Validate assigneeId - if invalid or placeholder, set to null
    if (req.body.assigneeId && !req.body.assigneeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('⚠️  Invalid assigneeId, setting to null:', req.body.assigneeId);
      req.body.assigneeId = null;
    }
    
    // Validate reporterId - if invalid, use first user or fail
    if (req.body.reporterId && !req.body.reporterId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('⚠️  Invalid reporterId, setting to null:', req.body.reporterId);
      req.body.reporterId = null;
    }
    
    const issue = issueRepo.create(req.body);
    const savedIssue = await issueRepo.save(issue) as any;
    console.log('✅ Issue created:', savedIssue.id);
    const fullIssue = await issueRepo.findOne({
      where: { id: savedIssue.id },
      relations: ['reporter', 'assignee', 'project'],
    });

    // Notify via WebSocket
    if (websocketService && fullIssue) {
      websocketService.notifyIssueCreated(fullIssue, req.body.reporterId || 'system');
    }

    // Send email notification if assignee is set
    if (fullIssue.assignee && fullIssue.assignee.id) {
      try {
        const reporter = fullIssue.reporter || { name: 'System' };
        await emailService.sendNotificationEmail(fullIssue.assignee.id, 'issue_created', {
          actorName: reporter.name,
          projectKey: fullIssue.project?.key || 'PROJECT',
          issueKey: fullIssue.key,
          summary: fullIssue.summary,
          type: fullIssue.type,
          priority: fullIssue.priority,
        });
        console.log(`📧 Email notification sent to assignee: ${fullIssue.assignee.email}`);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json(fullIssue);
  } catch (error: any) {
    console.error('❌ Failed to create issue:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create issue', details: error.message });
  }
});

// PUT update issue
router.put('/:id', async (req, res) => {
  try {
    const existingIssue = await issueRepo.findOne({ where: { id: req.params.id } });
    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issueRepo.update(req.params.id, req.body);
    const updatedIssue = await issueRepo.findOne({
      where: { id: req.params.id },
      relations: ['reporter', 'assignee', 'project'],
    });

    // Record history for field changes
    const userId = req.body.updatedBy || 'system';
    const changedFields = Object.keys(req.body).filter(key => 
      key !== 'updatedBy' && existingIssue[key] !== req.body[key]
    );
    
    for (const field of changedFields) {
      try {
        const historyEntry = {
          id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          issueId: req.params.id,
          userId,
          field,
          oldValue: JSON.stringify(existingIssue[field]),
          newValue: JSON.stringify(req.body[field]),
          changeType: 'field_change',
          projectId: existingIssue.projectId,
          createdAt: new Date().toISOString(),
        };
        // Store in global history array (imported from history route)
        if (global.historyEntries) {
          global.historyEntries.push(historyEntry);
        }
      } catch (historyError) {
        console.error('Failed to record history:', historyError);
      }
    }

    // Notify via WebSocket
    if (websocketService && updatedIssue) {
      const userId = req.body.updatedBy || 'system'; // Client should send updatedBy
      
      websocketService.notifyIssueUpdated(updatedIssue, userId, req.body);

      if (existingIssue.status !== updatedIssue.status) {
        websocketService.notifyStatusChanged(
          updatedIssue, 
          existingIssue.status, 
          updatedIssue.status, 
          userId
        );
        
        // Send email notification for status change
        if (updatedIssue.assignee && updatedIssue.assignee.id) {
          try {
            const userRepo = AppDataSource.getRepository(User);
            const actor = await userRepo.findOne({ where: { id: userId } });
            await emailService.sendNotificationEmail(updatedIssue.assignee.id, 'status_changed', {
              actorName: actor?.name || 'Someone',
              projectKey: updatedIssue.project?.key || 'PROJECT',
              issueKey: updatedIssue.key,
              oldStatus: existingIssue.status,
              newStatus: updatedIssue.status,
            });
            console.log(`📧 Status change email sent to assignee: ${updatedIssue.assignee.email}`);
          } catch (emailError) {
            console.error('Failed to send status change email:', emailError);
          }
        }
      }

      if (existingIssue.assigneeId !== updatedIssue.assigneeId && updatedIssue.assigneeId) {
        websocketService.notifyAssignmentChanged(
          updatedIssue,
          updatedIssue.assigneeId,
          userId
        );
        
        // Send email notification for assignment change
        if (updatedIssue.assignee && updatedIssue.assignee.id) {
          try {
            const userRepo = AppDataSource.getRepository(User);
            const actor = await userRepo.findOne({ where: { id: userId } });
            await emailService.sendNotificationEmail(updatedIssue.assignee.id, 'assignment_changed', {
              actorName: actor?.name || 'Someone',
              projectKey: updatedIssue.project?.key || 'PROJECT',
              issueKey: updatedIssue.key,
              summary: updatedIssue.summary,
              priority: updatedIssue.priority,
              status: updatedIssue.status,
            });
            console.log(`📧 Assignment email sent to new assignee: ${updatedIssue.assignee.email}`);
          } catch (emailError) {
            console.error('Failed to send assignment email:', emailError);
          }
        }
      }
    }

    res.json(updatedIssue);
  } catch (error) {
    console.error('Failed to update issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// DELETE issue
router.delete('/:id', async (req, res) => {
  try {
    await issueRepo.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

// POST bulk update issues
router.patch('/bulk/update', async (req, res) => {
  try {
    const { issueIds, updates } = req.body;

    if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
      return res.status(400).json({ error: 'Issue IDs are required' });
    }

    // Update all issues
    for (const issueId of issueIds) {
      await issueRepo.update(issueId, updates);
    }

    // Fetch updated issues
    const updatedIssues = await issueRepo.find({
      where: issueIds.map(id => ({ id })),
      relations: ['reporter', 'assignee', 'project'],
    });

    res.json({ 
      message: `${issueIds.length} issues updated successfully`,
      issues: updatedIssues 
    });
  } catch (error: any) {
    console.error('Bulk update failed:', error);
    res.status(500).json({ error: 'Failed to bulk update issues' });
  }
});

// POST clone issue
router.post('/:id/clone', async (req, res) => {
  try {
    const original = await issueRepo.findOne({ 
      where: { id: req.params.id },
      relations: ['reporter', 'assignee', 'project']
    });
    
    if (!original) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const { includeSubtasks = false } = req.body;

    // Generate new key
    const newKey = await generateIssueKey(original.projectId);

    // Clone issue
    const cloned = issueRepo.create({
      projectId: original.projectId,
      key: newKey,
      summary: `${original.summary} (Copy)`,
      description: original.description,
      type: original.type,
      status: 'backlog',
      priority: original.priority,
      storyPoints: original.storyPoints,
      labels: original.labels,
      reporterId: original.reporterId,
      assigneeId: original.assigneeId,
    });

    await issueRepo.save(cloned);

    // Clone subtasks if requested
    if (includeSubtasks) {
      const subtasks = await issueRepo.find({ 
        where: { parentId: original.id } 
      });
      
      for (const subtask of subtasks) {
        const clonedSubtask = issueRepo.create({
          ...subtask,
          id: undefined,
          key: await generateIssueKey(original.projectId),
          parentId: cloned.id,
          createdAt: undefined,
          updatedAt: undefined,
        });
        await issueRepo.save(clonedSubtask);
      }
    }

    const fullCloned = await issueRepo.findOne({
      where: { id: cloned.id },
      relations: ['reporter', 'assignee', 'project'],
    });

    res.status(201).json(fullCloned);
  } catch (error: any) {
    console.error('Failed to clone issue:', error);
    res.status(500).json({ error: 'Failed to clone issue' });
  }
});

// Convert issue type
router.patch('/:id/convert-type', async (req, res) => {
  try {
    const { id } = req.params;
    const { newType } = req.body;
    
    const issue = await issueRepo.findOne({ where: { id } });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const oldType = issue.type;
    issue.type = newType;
    
    // Handle type-specific field adjustments
    if (newType === 'epic') {
      // Converting to epic - clear epic link
      issue.epicLink = null;
    } else if (oldType === 'epic' && newType !== 'epic') {
      // Converting from epic - handle child stories
      // Child stories will need to be unlinked separately
    }
    
    await issueRepo.save(issue);
    
    console.log(`🔄 Converted issue ${issue.key} from ${oldType} to ${newType}`);
    
    res.json({
      success: true,
      issue,
      message: `Successfully converted from ${oldType} to ${newType}`,
    });
  } catch (error: any) {
    console.error('❌ Error converting issue type:', error);
    res.status(500).json({ error: 'Failed to convert issue type' });
  }
});

// GET all stories for an epic
router.get('/epic/:epicKey/stories', async (req, res) => {
  try {
    const { epicKey } = req.params;
    console.log(`📊 Fetching stories for epic: ${epicKey}`);
    
    // Get all stories linked to this epic
    const stories = await issueRepo.find({
      where: {
        epicLink: epicKey,
        type: 'story',
      },
      relations: ['reporter', 'assignee'],
      order: { createdAt: 'ASC' },
    });
    
    // Calculate progress
    const total = stories.length;
    const completed = stories.filter(s => s.status === 'done').length;
    const inProgress = stories.filter(s => s.status === 'in-progress').length;
    const todo = stories.filter(s => s.status === 'todo' || s.status === 'backlog').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const progress = {
      total,
      completed,
      inProgress,
      todo,
      percentage,
    };
    
    console.log(`✅ Found ${total} stories for epic ${epicKey} (${percentage}% complete)`);
    
    res.json({
      epicKey,
      stories,
      progress,
    });
  } catch (error: any) {
    console.error('❌ Error fetching epic stories:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST bulk edit issues
router.post('/bulk-edit', async (req, res) => {
  try {
    const { issueIds, updates } = req.body;
    
    if (!issueIds || !Array.isArray(issueIds)) {
      return res.status(400).json({ error: 'issueIds array required' });
    }
    
    const results = [];
    for (const issueId of issueIds) {
      await issueRepo.update(issueId, updates);
      const updated = await issueRepo.findOne({ where: { id: issueId } });
      results.push(updated);
    }
    
    res.json({ success: true, updated: results.length, issues: results });
  } catch (error) {
    console.error('Failed to bulk edit issues:', error);
    res.status(500).json({ error: 'Failed to bulk edit issues' });
  }
});

// POST duplicate issue
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await issueRepo.findOne({ where: { id: req.params.id } });
    if (!original) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const duplicate = issueRepo.create({
      ...original,
      id: undefined,
      key: undefined,
      summary: `${original.summary} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined,
    });
    
    const saved = await issueRepo.save(duplicate);
    res.json(saved);
  } catch (error) {
    console.error('Failed to duplicate issue:', error);
    res.status(500).json({ error: 'Failed to duplicate issue' });
  }
});

// GET issue templates
router.get('/templates/list', async (req, res) => {
  try {
    const templates = [
      { id: 'bug-template', name: 'Bug Report', type: 'bug', fields: {} },
      { id: 'story-template', name: 'User Story', type: 'story', fields: {} },
      { id: 'task-template', name: 'Task', type: 'task', fields: {} },
    ];
    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST create template
router.post('/templates/create', async (req, res) => {
  try {
    const { name, type, fields } = req.body;
    const template = {
      id: `template-${Date.now()}`,
      name,
      type,
      fields,
      createdAt: new Date(),
    };
    res.json(template);
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// POST convert issue type
router.post('/:id/convert', async (req, res) => {
  try {
    const { newType } = req.body;
    
    if (!newType) {
      return res.status(400).json({ error: 'newType required' });
    }
    
    await issueRepo.update(req.params.id, { type: newType });
    const updated = await issueRepo.findOne({
      where: { id: req.params.id },
      relations: ['reporter', 'assignee', 'project'],
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Failed to convert issue:', error);
    res.status(500).json({ error: 'Failed to convert issue' });
  }
});

// POST move issue to different project
router.post('/:id/move', async (req, res) => {
  try {
    const { targetProjectId } = req.body;
    
    if (!targetProjectId) {
      return res.status(400).json({ error: 'targetProjectId required' });
    }
    
    await issueRepo.update(req.params.id, { projectId: targetProjectId });
    const updated = await issueRepo.findOne({
      where: { id: req.params.id },
      relations: ['reporter', 'assignee', 'project'],
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Failed to move issue:', error);
    res.status(500).json({ error: 'Failed to move issue' });
  }
});

// GET time tracking
router.get('/:id/time-tracking', async (req, res) => {
  try {
    const issue = await issueRepo.findOne({ where: { id: req.params.id } });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const timeTracking = {
      originalEstimate: issue.originalEstimate || 0,
      remainingEstimate: issue.remainingEstimate || 0,
      timeSpent: issue.timeSpent || 0,
      workLogs: issue.workLogs || [],
    };
    
    res.json(timeTracking);
  } catch (error) {
    console.error('Failed to fetch time tracking:', error);
    res.status(500).json({ error: 'Failed to fetch time tracking' });
  }
});

// POST log work
router.post('/:id/time-tracking', async (req, res) => {
  try {
    const { timeSpentMinutes, comment, userId } = req.body;
    
    const issue = await issueRepo.findOne({ where: { id: req.params.id } });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const workLogs = issue.workLogs || [];
    workLogs.push({
      id: `log-${Date.now()}`,
      timeSpentMinutes,
      comment,
      userId,
      createdAt: new Date(),
    });
    
    const totalTimeSpent = (issue.timeSpent || 0) + timeSpentMinutes;
    
    await issueRepo.update(req.params.id, {
      workLogs,
      timeSpent: totalTimeSpent,
    });
    
    res.json({ success: true, timeSpent: totalTimeSpent, workLogs });
  } catch (error) {
    console.error('Failed to log work:', error);
    res.status(500).json({ error: 'Failed to log work' });
  }
});

// GET work log history
router.get('/:id/worklog', async (req, res) => {
  try {
    const issue = await issueRepo.findOne({ where: { id: req.params.id } });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.json({
      workLogs: issue.workLogs || [],
      totalTimeSpent: issue.timeSpent || 0,
    });
  } catch (error) {
    console.error('Failed to fetch worklog:', error);
    res.status(500).json({ error: 'Failed to fetch worklog' });
  }
});

// POST flag/unflag issue
router.post('/:id/flag', async (req, res) => {
  try {
    const { flagged, userId } = req.body;
    
    await issueRepo.update(req.params.id, {
      isFlagged: flagged,
      flaggedAt: flagged ? new Date() : null,
      flaggedBy: flagged ? userId : null,
    });
    
    const updated = await issueRepo.findOne({
      where: { id: req.params.id },
      relations: ['reporter', 'assignee', 'project'],
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Failed to flag issue:', error);
    res.status(500).json({ error: 'Failed to flag issue' });
  }
});

// BULK OPERATIONS

// Bulk update issues
router.patch('/bulk/update', async (req, res) => {
  try {
    const { issueIds, updates } = req.body;

    if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
      return res.status(400).json({ error: 'issueIds array is required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'updates object is required' });
    }

    console.log(`📦 Bulk updating ${issueIds.length} issues`, updates);

    // Update all issues
    const results = await Promise.all(
      issueIds.map(async (id) => {
        try {
          await issueRepo.update(id, updates);
          return { id, success: true };
        } catch (error) {
          console.error(`Failed to update issue ${id}:`, error);
          return { id, success: false, error: (error as Error).message };
        }
      })
    );

    // Get updated issues
    const updatedIssues = await issueRepo.find({
      where: issueIds.map(id => ({ id })),
      relations: ['reporter', 'assignee', 'project'],
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Bulk update complete: ${successCount}/${issueIds.length} successful`);

    // Notify via WebSocket
    if (websocketService && updatedIssues.length > 0) {
      updatedIssues.forEach(issue => {
        websocketService.notifyIssueUpdated(issue, 'bulk-operation', updates);
      });
    }

    res.json({
      success: true,
      updated: successCount,
      total: issueIds.length,
      issues: updatedIssues,
      results,
    });
  } catch (error) {
    console.error('Bulk update failed:', error);
    res.status(500).json({ error: 'Failed to bulk update issues' });
  }
});

// Bulk delete issues
router.delete('/bulk/delete', async (req, res) => {
  try {
    const { issueIds } = req.body;

    if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
      return res.status(400).json({ error: 'issueIds array is required' });
    }

    console.log(`🗑️ Bulk deleting ${issueIds.length} issues`);

    // Delete all issues
    const results = await Promise.all(
      issueIds.map(async (id) => {
        try {
          await issueRepo.delete(id);
          return { id, success: true };
        } catch (error) {
          console.error(`Failed to delete issue ${id}:`, error);
          return { id, success: false, error: (error as Error).message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Bulk delete complete: ${successCount}/${issueIds.length} successful`);

    res.json({
      success: true,
      deleted: successCount,
      total: issueIds.length,
      results,
    });
  } catch (error) {
    console.error('Bulk delete failed:', error);
    res.status(500).json({ error: 'Failed to bulk delete issues' });
  }
});

export default router;
