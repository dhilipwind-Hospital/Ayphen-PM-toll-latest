"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const User_1 = require("../entities/User");
const Project_1 = require("../entities/Project");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
/**
 * Enhanced voice command processor
 * Supports navigation, search, creation, and batch operations
 */
router.post('/process-enhanced', async (req, res) => {
    try {
        const { command, context } = req.body;
        const { issueId, projectId, userId } = context || {};
        const result = await processEnhancedCommand(command.toLowerCase(), {
            issueId,
            projectId,
            userId
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            action: 'unknown',
            message: error.message
        });
    }
});
/**
 * Process enhanced voice commands with AI understanding
 */
async function processEnhancedCommand(command, context) {
    const cmd = command.toLowerCase().trim();
    // Navigation commands
    if (isNavigationCommand(cmd)) {
        return handleNavigationCommand(cmd);
    }
    // Issue creation commands
    if (isCreationCommand(cmd)) {
        return await handleCreationCommand(cmd, context);
    }
    // Search and filter commands
    if (isSearchCommand(cmd)) {
        return await handleSearchCommand(cmd, context);
    }
    // Batch operations
    if (isBatchCommand(cmd)) {
        return await handleBatchCommand(cmd, context);
    }
    // Fall back to basic issue updates
    if (context.issueId) {
        const issue = await issueRepo.findOne({ where: { id: context.issueId } });
        if (issue) {
            const basicResult = await processBasicCommand(cmd, issue);
            if (basicResult.updates) {
                await issueRepo.save({ ...issue, ...basicResult.updates });
                return {
                    success: true,
                    action: 'update',
                    message: basicResult.message,
                    updates: basicResult.updates
                };
            }
        }
    }
    return {
        success: false,
        action: 'unknown',
        message: "I didn't understand that command. Try: 'show me the board', 'create a bug', 'find my issues'"
    };
}
/**
 * Navigation command detection
 */
function isNavigationCommand(cmd) {
    const navKeywords = [
        'take me', 'show me', 'go to', 'open', 'navigate',
        'board', 'backlog', 'dashboard', 'roadmap', 'sprint'
    ];
    return navKeywords.some(keyword => cmd.includes(keyword));
}
/**
 * Handle navigation commands
 */
function handleNavigationCommand(cmd) {
    let route = '/dashboard';
    let message = 'Navigating to Dashboard';
    if (cmd.includes('board') || cmd.includes('kanban')) {
        route = '/board';
        message = 'Navigating to Board';
    }
    else if (cmd.includes('backlog')) {
        route = '/backlog';
        message = 'Navigating to Backlog';
    }
    else if (cmd.includes('roadmap')) {
        route = '/roadmap';
        message = 'Navigating to Roadmap';
    }
    else if (cmd.includes('sprint planning')) {
        route = '/sprint-planning';
        message = 'Opening Sprint Planning';
    }
    else if (cmd.includes('reports')) {
        route = '/reports';
        message = 'Opening Reports';
    }
    else if (cmd.includes('people') || cmd.includes('team')) {
        route = '/people';
        message = 'Navigating to People';
    }
    return {
        success: true,
        action: 'navigate',
        message,
        data: { route }
    };
}
/**
 * Creation command detection
 */
function isCreationCommand(cmd) {
    const createKeywords = ['create', 'add', 'new'];
    const issueTypes = ['bug', 'story', 'task', 'epic', 'issue'];
    return createKeywords.some(k => cmd.includes(k)) &&
        issueTypes.some(t => cmd.includes(t));
}
/**
 * Handle issue creation commands
 */
async function handleCreationCommand(cmd, context) {
    let type = 'task';
    let priority = 'medium';
    // Detect type
    if (cmd.includes('bug'))
        type = 'bug';
    else if (cmd.includes('story'))
        type = 'story';
    else if (cmd.includes('epic'))
        type = 'epic';
    else if (cmd.includes('task'))
        type = 'task';
    // Detect priority
    if (cmd.includes('critical') || cmd.includes('urgent') || cmd.includes('highest')) {
        priority = 'highest';
    }
    else if (cmd.includes('high priority') || cmd.includes('important')) {
        priority = 'high';
    }
    else if (cmd.includes('low priority')) {
        priority = 'low';
    }
    // Extract summary from command
    const summary = extractSummaryFromCommand(cmd, type);
    return {
        success: true,
        action: 'create',
        message: `Ready to create ${type}`,
        data: {
            type,
            priority,
            summary,
            projectId: context.projectId
        }
    };
}
/**
 * Extract summary from creation command
 */
function extractSummaryFromCommand(cmd, type) {
    // Remove common command words
    let summary = cmd
        .replace(/create|add|new/gi, '')
        .replace(/bug|story|task|epic/gi, '')
        .replace(/for|about|regarding/gi, '')
        .replace(/high|low|medium|priority/gi, '')
        .trim();
    // Capitalize first letter
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
    return summary || `New ${type}`;
}
/**
 * Search command detection
 */
function isSearchCommand(cmd) {
    const searchKeywords = ['find', 'search', 'show', 'list', 'get'];
    const filterKeywords = ['my', 'assigned', 'blocked', 'priority', 'status'];
    return searchKeywords.some(k => cmd.includes(k)) &&
        filterKeywords.some(f => cmd.includes(f));
}
/**
 * Handle search and filter commands
 */
async function handleSearchCommand(cmd, context) {
    const filters = {};
    // My issues
    if (cmd.includes('my') || cmd.includes('assigned to me')) {
        filters.assigneeId = context.userId;
    }
    // Priority filter
    if (cmd.includes('high priority')) {
        filters.priority = 'high';
    }
    else if (cmd.includes('critical')) {
        filters.priority = 'highest';
    }
    // Status filter
    if (cmd.includes('blocked')) {
        filters.status = 'blocked';
    }
    else if (cmd.includes('in progress')) {
        filters.status = 'in-progress';
    }
    else if (cmd.includes('done')) {
        filters.status = 'done';
    }
    // Type filter
    if (cmd.includes('bugs')) {
        filters.type = 'bug';
    }
    else if (cmd.includes('stories')) {
        filters.type = 'story';
    }
    // Execute search
    const issues = await issueRepo.find({
        where: filters,
        take: 50
    });
    return {
        success: true,
        action: 'search',
        message: `Found ${issues.length} issues`,
        data: {
            filters,
            results: issues.map(i => ({
                id: i.id,
                key: i.key,
                summary: i.summary,
                status: i.status,
                priority: i.priority
            }))
        }
    };
}
/**
 * Batch command detection
 */
function isBatchCommand(cmd) {
    const batchKeywords = ['all', 'bulk', 'multiple', 'these'];
    return batchKeywords.some(k => cmd.includes(k));
}
/**
 * Handle batch operations
 */
async function handleBatchCommand(cmd, context) {
    // This would require issue IDs from context
    // For now, return a message indicating batch mode
    return {
        success: true,
        action: 'batch',
        message: 'Batch operation mode activated. Please select issues to update.',
        data: {
            batchMode: true,
            command: cmd
        }
    };
}
/**
 * Basic command processor (backward compatible)
 */
async function processBasicCommand(command, issue) {
    const updates = {};
    let message = '';
    const cmd = command.toLowerCase().trim();
    // Priority commands
    if (cmd.includes('priority')) {
        if (cmd.includes('high') || cmd.includes('urgent')) {
            updates.priority = 'high';
            message = 'Priority set to High';
        }
        else if (cmd.includes('medium') || cmd.includes('normal')) {
            updates.priority = 'medium';
            message = 'Priority set to Medium';
        }
        else if (cmd.includes('low')) {
            updates.priority = 'low';
            message = 'Priority set to Low';
        }
    }
    // Status commands
    else if (cmd.includes('status') || cmd.includes('move') || cmd.includes('change')) {
        if (cmd.includes('todo') || cmd.includes('to do') || cmd.includes('backlog')) {
            updates.status = 'todo';
            message = 'Status changed to To Do';
        }
        else if (cmd.includes('progress')) {
            updates.status = 'in-progress';
            message = 'Status changed to In Progress';
        }
        else if (cmd.includes('done') || cmd.includes('complete')) {
            updates.status = 'done';
            message = 'Status changed to Done';
        }
        else if (cmd.includes('review')) {
            updates.status = 'in-review';
            message = 'Status changed to In Review';
        }
    }
    // Assign commands
    else if (cmd.includes('assign')) {
        const users = await userRepo.find();
        const nameMatch = cmd.match(/assign\s+(?:to\s+)?(\w+)/i);
        if (nameMatch) {
            const name = nameMatch[1];
            const user = users.find(u => u.name.toLowerCase().includes(name.toLowerCase()));
            if (user) {
                updates.assigneeId = user.id;
                message = `Assigned to ${user.name}`;
            }
            else {
                message = `User ${name} not found`;
            }
        }
    }
    return { updates, message };
}
// Keep the original endpoint for backward compatibility
router.post('/process', async (req, res) => {
    try {
        const { command, issueId } = req.body;
        const issue = await issueRepo.findOne({ where: { id: issueId } });
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        const result = await processBasicCommand(command.toLowerCase(), issue);
        if (result.updates) {
            await issueRepo.save({ ...issue, ...result.updates });
        }
        res.json({
            success: true,
            message: result.message,
            updates: result.updates
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
