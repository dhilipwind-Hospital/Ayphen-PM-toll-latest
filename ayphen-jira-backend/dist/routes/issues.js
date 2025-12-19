"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const User_1 = require("../entities/User");
const Project_1 = require("../entities/Project");
const projectAccess_1 = require("../middleware/projectAccess");
const ai_duplicate_detector_service_1 = require("../services/ai-duplicate-detector.service");
const websocket_service_1 = require("../services/websocket.service");
const email_service_1 = require("../services/email.service");
const workflow_service_1 = require("../services/workflow.service");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
// Helper function to generate unique issue key
// Uses project.lastIssueNumber to ensure sequential keys even after deletes
async function generateIssueKey(projectId) {
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
    }
    catch (error) {
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
        const accessibleProjectIds = await (0, projectAccess_1.getUserProjectIds)(userId);
        // Build where clause
        const where = {};
        if (projectId) {
            // Check if user has access to the requested project
            if (!accessibleProjectIds.includes(projectId)) {
                return res.status(403).json({ error: 'Access denied to this project' });
            }
            where.projectId = projectId;
        }
        else {
            // Filter by all accessible projects
            where.projectId = (0, typeorm_1.In)(accessibleProjectIds);
        }
        if (status)
            where.status = status;
        if (assigneeId)
            where.assigneeId = assigneeId;
        if (type)
            where.type = type;
        if (req.query.parentId)
            where.parentId = req.query.parentId;
        if (req.query.epicLink)
            where.epicLink = req.query.epicLink;
        const page = req.query.page ? parseInt(req.query.page) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        if (page && limit) {
            const [issues, total] = await issueRepo.findAndCount({
                where,
                relations: ['reporter', 'assignee', 'project'],
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit,
            });
            return res.json({ data: issues, total, page, limit });
        }
        const issues = await issueRepo.find({
            where,
            relations: ['reporter', 'assignee', 'project'],
            order: { createdAt: 'DESC' },
            take: 1000 // Safety limit for non-paginated calls
        });
        res.json(issues);
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
                const duplicateCheck = await ai_duplicate_detector_service_1.aiDuplicateDetector.checkDuplicates(req.body.summary, req.body.description || '', req.body.projectId, req.body.type);
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
            }
            catch (dupError) {
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
        const savedIssue = await issueRepo.save(issue);
        console.log('✅ Issue created:', savedIssue.id);
        const fullIssue = await issueRepo.findOne({
            where: { id: savedIssue.id },
            relations: ['reporter', 'assignee', 'project'],
        });
        // Notify via WebSocket
        if (websocket_service_1.websocketService && fullIssue) {
            websocket_service_1.websocketService.notifyIssueCreated(fullIssue, req.body.reporterId || 'system');
        }
        // Send email notification if assignee is set
        if (fullIssue.assignee && fullIssue.assignee.id) {
            try {
                const reporter = fullIssue.reporter || { name: 'System' };
                await email_service_1.emailService.sendNotificationEmail(fullIssue.assignee.id, 'issue_created', {
                    actorName: reporter.name,
                    projectKey: fullIssue.project?.key || 'PROJECT',
                    issueKey: fullIssue.key,
                    summary: fullIssue.summary,
                    type: fullIssue.type,
                    priority: fullIssue.priority,
                });
                console.log(`📧 Email notification sent to assignee: ${fullIssue.assignee.email}`);
            }
            catch (emailError) {
                console.error('Failed to send email notification:', emailError);
                // Don't fail the request if email fails
            }
        }
        res.status(201).json(fullIssue);
    }
    catch (error) {
        console.error('❌ Failed to create issue:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to create issue', details: error.message });
    }
});
// PUT update issue
router.put('/:id', async (req, res) => {
    try {
        // 1. VALIDATE INPUT FIRST
        const { assigneeId, reporterId, status, priority, type } = req.body;
        // Validate UUID formats
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (assigneeId && !uuidRegex.test(assigneeId)) {
            return res.status(400).json({ error: `Invalid assignee ID format: ${assigneeId}` });
        }
        if (reporterId && !uuidRegex.test(reporterId)) {
            return res.status(400).json({ error: `Invalid reporter ID format: ${reporterId}` });
        }
        // Validate enum values
        const validStatuses = ['backlog', 'todo', 'in-progress', 'in-review', 'done', 'selected-for-development', 'blocked'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` });
        }
        const validPriorities = ['highest', 'high', 'medium', 'low', 'lowest'];
        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({ error: `Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}` });
        }
        const validTypes = ['epic', 'story', 'task', 'bug', 'subtask'];
        if (type && !validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}` });
        }
        // 2. CHECK IF ISSUE EXISTS
        const existingIssue = await issueRepo.findOne({
            where: { id: req.params.id },
            relations: ['reporter', 'assignee', 'project']
        });
        if (!existingIssue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        // 3. VALIDATE ASSIGNEE EXISTS (if being changed)
        if (assigneeId !== undefined && assigneeId !== null) {
            const userRepo = database_1.AppDataSource.getRepository(User_1.User);
            const assigneeUser = await userRepo.findOne({ where: { id: assigneeId } });
            if (!assigneeUser) {
                return res.status(400).json({ error: `Assignee user not found: ${assigneeId}` });
            }
        }
        // 4. UPDATE ISSUE - Filter to only valid Issue entity fields
        // These fields should NOT be passed to the update query
        const { userId, updatedBy, createdAt, updatedAt, id, key, ...validUpdateFields } = req.body;
        // Only update with valid Issue entity fields
        const allowedFields = [
            'summary', 'description', 'type', 'status', 'priority',
            'assigneeId', 'reporterId', 'projectId', 'sprintId',
            'storyPoints', 'dueDate', 'labels', 'components', 'fixVersions',
            'epicLink', 'epicId', 'epicKey', 'epicName', 'parentId',
            'environment', 'originalEstimate', 'remainingEstimate', 'timeSpent'
        ];
        const updatePayload = {};
        for (const field of allowedFields) {
            if (validUpdateFields[field] !== undefined) {
                updatePayload[field] = validUpdateFields[field];
            }
        }
        // Automatically set resolvedAt if status is entering DONE category
        if (updatePayload.status && updatePayload.status !== existingIssue.status) {
            const isDone = await workflow_service_1.workflowService.isDone(existingIssue.projectId, updatePayload.status);
            if (isDone) {
                updatePayload.resolvedAt = new Date();
            }
            else {
                updatePayload.resolvedAt = null;
            }
        }
        console.log('📝 Updating issue with payload:', JSON.stringify(updatePayload, null, 2));
        if (Object.keys(updatePayload).length > 0) {
            await issueRepo.update(req.params.id, updatePayload);
        }
        // 5. GET UPDATED ISSUE WITH RELATIONS
        const updatedIssue = await issueRepo.findOne({
            where: { id: req.params.id },
            relations: ['reporter', 'assignee', 'project'],
        });
        if (!updatedIssue) {
            return res.status(500).json({ error: 'Issue was updated but could not be retrieved' });
        }
        // 6. RECORD HISTORY (with safe error handling)
        // userId and updatedBy were already extracted at line 304
        const historyUserId = userId || updatedBy || null;
        const trackableFields = ['status', 'priority', 'assigneeId', 'summary', 'description', 'type', 'storyPoints', 'dueDate', 'labels', 'sprintId', 'epicLink'];
        const changedFields = trackableFields.filter(key => req.body[key] !== undefined && existingIssue[key] !== req.body[key]);
        if (changedFields.length > 0) {
            try {
                const { History } = require('../entities/History');
                const historyRepo = database_1.AppDataSource.getRepository(History);
                for (const field of changedFields) {
                    try {
                        // Generate human-readable description
                        let description = `updated ${field}`;
                        const oldVal = existingIssue[field];
                        const newVal = req.body[field];
                        switch (field) {
                            case 'status':
                                description = `changed status from "${oldVal || 'none'}" to "${newVal}"`;
                                break;
                            case 'priority':
                                description = `changed priority from "${oldVal || 'none'}" to "${newVal}"`;
                                break;
                            case 'assigneeId':
                                description = `changed assignee`;
                                break;
                            case 'summary':
                                description = `updated summary`;
                                break;
                            case 'description':
                                description = `updated description`;
                                break;
                            case 'type':
                                description = `changed type from "${oldVal}" to "${newVal}"`;
                                break;
                            case 'storyPoints':
                                description = `changed story points from "${oldVal || 0}" to "${newVal}"`;
                                break;
                            case 'dueDate':
                                description = `changed due date`;
                                break;
                            case 'sprintId':
                                description = `moved to a different sprint`;
                                break;
                        }
                        const historyEntry = historyRepo.create({
                            issueId: req.params.id,
                            userId: historyUserId,
                            field,
                            oldValue: oldVal !== undefined ? JSON.stringify(oldVal) : null,
                            newValue: newVal !== undefined ? JSON.stringify(newVal) : null,
                            changeType: 'field_change',
                            description,
                            projectId: existingIssue.projectId,
                        });
                        await historyRepo.save(historyEntry);
                        console.log(`📝 History recorded: ${description} for issue ${existingIssue.key}`);
                    }
                    catch (historyError) {
                        console.error('⚠️ History logging failed (non-critical):', historyError);
                        // Continue - history failure shouldn't block the update
                    }
                }
            }
            catch (historySetupError) {
                console.error('⚠️ History system error (non-critical):', historySetupError);
            }
        }
        // 7. NOTIFICATIONS (with safe error handling)
        try {
            if (websocket_service_1.websocketService && updatedIssue) {
                const userId = req.body.updatedBy || req.body.userId || 'system';
                websocket_service_1.websocketService.notifyIssueUpdated(updatedIssue, userId, req.body);
                // Status change notification
                if (existingIssue.status !== updatedIssue.status) {
                    websocket_service_1.websocketService.notifyStatusChanged(updatedIssue, existingIssue.status, updatedIssue.status, userId);
                    // Email for status change
                    if (updatedIssue.assignee && updatedIssue.assignee.id) {
                        try {
                            const userRepo = database_1.AppDataSource.getRepository(User_1.User);
                            const actor = await userRepo.findOne({ where: { id: userId } });
                            await email_service_1.emailService.sendNotificationEmail(updatedIssue.assignee.id, 'status_changed', {
                                actorName: actor?.name || 'Someone',
                                projectKey: updatedIssue.project?.key || 'PROJECT',
                                issueKey: updatedIssue.key,
                                oldStatus: existingIssue.status,
                                newStatus: updatedIssue.status,
                            });
                            console.log(`📧 Status change email sent to: ${updatedIssue.assignee.email}`);
                        }
                        catch (emailError) {
                            console.error('⚠️ Status change email failed (non-critical):', emailError);
                        }
                    }
                }
                // Assignment change notification
                if (existingIssue.assigneeId !== updatedIssue.assigneeId && updatedIssue.assigneeId) {
                    websocket_service_1.websocketService.notifyAssignmentChanged(updatedIssue, updatedIssue.assigneeId, userId);
                    // Email for assignment change
                    if (updatedIssue.assignee && updatedIssue.assignee.id) {
                        try {
                            const userRepo = database_1.AppDataSource.getRepository(User_1.User);
                            const actor = await userRepo.findOne({ where: { id: userId } });
                            await email_service_1.emailService.sendNotificationEmail(updatedIssue.assignee.id, 'assignment_changed', {
                                actorName: actor?.name || 'Someone',
                                projectKey: updatedIssue.project?.key || 'PROJECT',
                                issueKey: updatedIssue.key,
                                summary: updatedIssue.summary,
                                priority: updatedIssue.priority,
                                status: updatedIssue.status,
                            });
                            console.log(`📧 Assignment email sent to: ${updatedIssue.assignee.email}`);
                        }
                        catch (emailError) {
                            console.error('⚠️ Assignment email failed (non-critical):', emailError);
                        }
                    }
                }
            }
        }
        catch (notificationError) {
            console.error('⚠️ Notification error (non-critical):', notificationError);
            // Continue - notification failure shouldn't block the update
        }
        // 8. RETURN SUCCESS
        console.log(`✅ Issue ${updatedIssue.key} updated successfully`);
        res.json(updatedIssue);
    }
    catch (error) {
        console.error('❌ Failed to update issue:', error);
        res.status(500).json({
            error: 'Failed to update issue',
            details: error.message,
            code: error.code
        });
    }
});
// DELETE issue
router.delete('/:id', async (req, res) => {
    try {
        const issue = await issueRepo.findOne({ where: { id: req.params.id } });
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        await issueRepo.delete(req.params.id);
        // Notify via WebSocket
        if (websocket_service_1.websocketService) {
            const deleterId = req.body.userId || 'system';
            websocket_service_1.websocketService.notifyIssueDeleted(issue.id, issue.projectId, deleterId);
        }
        res.status(204).send();
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        }
        else if (oldType === 'epic' && newType !== 'epic') {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        const results = await Promise.all(issueIds.map(async (id) => {
            try {
                await issueRepo.update(id, updates);
                return { id, success: true };
            }
            catch (error) {
                console.error(`Failed to update issue ${id}:`, error);
                return { id, success: false, error: error.message };
            }
        }));
        // Get updated issues
        const updatedIssues = await issueRepo.find({
            where: issueIds.map(id => ({ id })),
            relations: ['reporter', 'assignee', 'project'],
        });
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Bulk update complete: ${successCount}/${issueIds.length} successful`);
        // Notify via WebSocket
        if (websocket_service_1.websocketService && updatedIssues.length > 0) {
            updatedIssues.forEach(issue => {
                websocket_service_1.websocketService.notifyIssueUpdated(issue, 'bulk-operation', updates);
            });
        }
        res.json({
            success: true,
            updated: successCount,
            total: issueIds.length,
            issues: updatedIssues,
            results,
        });
    }
    catch (error) {
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
        const results = await Promise.all(issueIds.map(async (id) => {
            try {
                await issueRepo.delete(id);
                return { id, success: true };
            }
            catch (error) {
                console.error(`Failed to delete issue ${id}:`, error);
                return { id, success: false, error: error.message };
            }
        }));
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Bulk delete complete: ${successCount}/${issueIds.length} successful`);
        res.json({
            success: true,
            deleted: successCount,
            total: issueIds.length,
            results,
        });
    }
    catch (error) {
        console.error('Bulk delete failed:', error);
        res.status(500).json({ error: 'Failed to bulk delete issues' });
    }
});
exports.default = router;
