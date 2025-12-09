"use strict";
/**
 * Voice Batch Operations Service
 * Phase 5-6: Advanced Features
 *
 * Handles bulk operations via voice commands
 * Example: "Set all selected to high priority"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceBatchOperations = exports.VoiceBatchOperationsService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const User_1 = require("../entities/User");
class VoiceBatchOperationsService {
    constructor() {
        this.issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        this.userRepo = database_1.AppDataSource.getRepository(User_1.User);
    }
    /**
     * Execute batch operation
     */
    async executeBatch(operation) {
        const startTime = Date.now();
        const result = {
            success: false,
            totalIssues: 0,
            successful: 0,
            failed: 0,
            errors: [],
            updates: [],
            executionTime: 0
        };
        try {
            // Get issues to update
            const issues = await this.getIssues(operation.filter);
            result.totalIssues = issues.length;
            if (issues.length === 0) {
                result.success = true;
                result.executionTime = Date.now() - startTime;
                return result;
            }
            // Execute operation on each issue
            const updates = await Promise.allSettled(issues.map(issue => this.executeOperation(issue, operation)));
            // Process results
            updates.forEach((update, index) => {
                if (update.status === 'fulfilled') {
                    result.successful++;
                    result.updates.push(update.value);
                }
                else {
                    result.failed++;
                    result.errors.push({
                        issueId: issues[index].id,
                        error: update.reason.message
                    });
                }
            });
            result.success = result.failed === 0;
            result.executionTime = Date.now() - startTime;
            return result;
        }
        catch (error) {
            result.executionTime = Date.now() - startTime;
            throw error;
        }
    }
    /**
     * Get issues based on filter
     */
    async getIssues(filter) {
        if (!filter) {
            return [];
        }
        const query = this.issueRepo.createQueryBuilder('issue');
        // Filter by issue IDs
        if (filter.issueIds && filter.issueIds.length > 0) {
            query.andWhere('issue.id IN (:...ids)', { ids: filter.issueIds });
        }
        // Filter by project
        if (filter.projectId) {
            query.andWhere('issue.projectId = :projectId', { projectId: filter.projectId });
        }
        // Filter by status
        if (filter.status) {
            query.andWhere('issue.status = :status', { status: filter.status });
        }
        // Filter by priority
        if (filter.priority) {
            query.andWhere('issue.priority = :priority', { priority: filter.priority });
        }
        // Filter by assignee
        if (filter.assigneeId) {
            query.andWhere('issue.assigneeId = :assigneeId', { assigneeId: filter.assigneeId });
        }
        // Filter by labels
        if (filter.labels && filter.labels.length > 0) {
            query.andWhere('issue.labels && ARRAY[:...labels]', { labels: filter.labels });
        }
        return await query.getMany();
    }
    /**
     * Execute operation on single issue
     */
    async executeOperation(issue, operation) {
        switch (operation.type) {
            case 'update_priority':
                return await this.updatePriority(issue, operation.value);
            case 'update_status':
                return await this.updateStatus(issue, operation.value);
            case 'assign':
                return await this.assign(issue, operation.value);
            case 'add_label':
                return await this.addLabel(issue, operation.value);
            case 'set_due_date':
                return await this.setDueDate(issue, operation.value);
            case 'delete':
                return await this.deleteIssue(issue);
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }
    /**
     * Update priority
     */
    async updatePriority(issue, priority) {
        issue.priority = priority;
        await this.issueRepo.save(issue);
        return { issueId: issue.id, field: 'priority', value: priority };
    }
    /**
     * Update status
     */
    async updateStatus(issue, status) {
        issue.status = status;
        await this.issueRepo.save(issue);
        return { issueId: issue.id, field: 'status', value: status };
    }
    /**
     * Assign issue
     */
    async assign(issue, assigneeId) {
        issue.assigneeId = assigneeId;
        await this.issueRepo.save(issue);
        return { issueId: issue.id, field: 'assigneeId', value: assigneeId };
    }
    /**
     * Add label
     */
    async addLabel(issue, label) {
        const currentLabels = issue.labels || [];
        if (!currentLabels.includes(label)) {
            issue.labels = [...currentLabels, label];
            await this.issueRepo.save(issue);
        }
        return { issueId: issue.id, field: 'labels', value: issue.labels };
    }
    /**
     * Set due date
     */
    async setDueDate(issue, dueDate) {
        issue.dueDate = dueDate;
        await this.issueRepo.save(issue);
        return { issueId: issue.id, field: 'dueDate', value: dueDate };
    }
    /**
     * Delete issue
     */
    async deleteIssue(issue) {
        await this.issueRepo.remove(issue);
        return { issueId: issue.id, deleted: true };
    }
    /**
     * Parse voice command to batch operation
     */
    async parseVoiceCommand(command, context) {
        const cmd = command.toLowerCase();
        // Detect batch keywords
        const isBatch = cmd.includes('all') || cmd.includes('selected') ||
            cmd.includes('these') || cmd.includes('multiple');
        if (!isBatch) {
            return null;
        }
        const operation = {
            type: 'update_priority',
            value: null,
            filter: {}
        };
        // Set filter based on context
        if (cmd.includes('selected') && context.selectedIssueIds) {
            operation.filter.issueIds = context.selectedIssueIds;
        }
        else if (context.projectId) {
            operation.filter.projectId = context.projectId;
        }
        // Detect operation type and value
        if (cmd.includes('priority')) {
            operation.type = 'update_priority';
            if (cmd.includes('high') || cmd.includes('urgent')) {
                operation.value = 'high';
            }
            else if (cmd.includes('medium')) {
                operation.value = 'medium';
            }
            else if (cmd.includes('low')) {
                operation.value = 'low';
            }
        }
        else if (cmd.includes('status')) {
            operation.type = 'update_status';
            if (cmd.includes('progress')) {
                operation.value = 'in-progress';
            }
            else if (cmd.includes('done')) {
                operation.value = 'done';
            }
            else if (cmd.includes('todo')) {
                operation.value = 'todo';
            }
        }
        else if (cmd.includes('assign')) {
            operation.type = 'assign';
            // Extract assignee name
            const match = cmd.match(/assign.*to\s+(\w+)/i);
            if (match) {
                const name = match[1];
                const users = await this.userRepo.find();
                const user = users.find(u => u.name.toLowerCase().includes(name.toLowerCase()));
                if (user) {
                    operation.value = user.id;
                }
            }
        }
        else if (cmd.includes('label') || cmd.includes('tag')) {
            operation.type = 'add_label';
            const match = cmd.match(/(?:label|tag)\s+(\w+)/i);
            if (match) {
                operation.value = match[1];
            }
        }
        else if (cmd.includes('delete') || cmd.includes('remove')) {
            operation.type = 'delete';
        }
        return operation;
    }
    /**
     * Get batch operation preview
     */
    async previewBatch(operation) {
        const issues = await this.getIssues(operation.filter);
        let operationDesc = '';
        switch (operation.type) {
            case 'update_priority':
                operationDesc = `Set priority to ${operation.value}`;
                break;
            case 'update_status':
                operationDesc = `Change status to ${operation.value}`;
                break;
            case 'assign':
                const user = await this.userRepo.findOne({ where: { id: operation.value } });
                operationDesc = `Assign to ${user?.name || 'user'}`;
                break;
            case 'add_label':
                operationDesc = `Add label '${operation.value}'`;
                break;
            case 'delete':
                operationDesc = 'Delete issues';
                break;
        }
        return {
            issueCount: issues.length,
            issues: issues.slice(0, 10).map(i => ({
                id: i.id,
                key: i.key,
                summary: i.summary
            })),
            operation: operationDesc
        };
    }
    /**
     * Undo batch operation
     */
    async undoBatch(batchId) {
        // This would require storing batch history
        // For now, return false
        return false;
    }
}
exports.VoiceBatchOperationsService = VoiceBatchOperationsService;
// Export singleton instance
exports.voiceBatchOperations = new VoiceBatchOperationsService();
