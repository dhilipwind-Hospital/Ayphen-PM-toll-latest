"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionItemTrackerService = exports.ActionItemTrackerService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const SprintRetrospective_1 = require("../entities/SprintRetrospective");
const Project_1 = require("../entities/Project");
class ActionItemTrackerService {
    /**
     * Create Jira tasks from retrospective action items
     */
    async createTasksFromActionItems(retrospectiveId, actionItems) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const retroRepo = database_1.AppDataSource.getRepository(SprintRetrospective_1.SprintRetrospective);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        try {
            const retro = await retroRepo.findOne({
                where: { id: retrospectiveId },
                relations: ['sprint']
            });
            if (!retro) {
                throw new Error('Retrospective not found');
            }
            const project = await projectRepo.findOne({
                where: { id: retro.sprint.projectId }
            });
            const createdTasks = [];
            for (const item of actionItems) {
                const key = await this.generateIssueKey(retro.sprint.projectId);
                const task = issueRepo.create({
                    key,
                    summary: item.task,
                    description: `Action item from Sprint ${retro.sprint.name} retrospective\n\nThis task was automatically created to track a retrospective action item.`,
                    type: 'task',
                    status: 'todo',
                    priority: item.priority || 'medium',
                    projectId: retro.sprint.projectId,
                    assigneeId: item.assigneeId || null,
                    reporterId: retro.createdById,
                    labels: ['retrospective-action', `sprint-${retro.sprint.name}`],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                const saved = await issueRepo.save(task);
                createdTasks.push(saved);
                console.log(`✅ Created action item task: ${saved.key} - ${saved.summary}`);
            }
            return createdTasks;
        }
        catch (error) {
            console.error('❌ Failed to create action item tasks:', error);
            throw error;
        }
    }
    /**
     * Track progress of action items from a retrospective
     */
    async trackActionItemProgress(retrospectiveId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const retroRepo = database_1.AppDataSource.getRepository(SprintRetrospective_1.SprintRetrospective);
        try {
            const retro = await retroRepo.findOne({
                where: { id: retrospectiveId },
                relations: ['sprint']
            });
            if (!retro) {
                throw new Error('Retrospective not found');
            }
            // Find all tasks with retrospective-action label for this sprint
            const tasks = await issueRepo
                .createQueryBuilder('issue')
                .where('issue.projectId = :projectId', { projectId: retro.sprint.projectId })
                .andWhere('issue.type = :type', { type: 'task' })
                .andWhere('issue.labels LIKE :label', { label: `%sprint-${retro.sprint.name}%` })
                .getMany();
            const total = tasks.length;
            const completed = tasks.filter(t => t.status === 'done' || t.status === 'closed').length;
            const overdue = tasks.filter(t => t.dueDate &&
                new Date(t.dueDate) < new Date() &&
                t.status !== 'done' &&
                t.status !== 'closed').length;
            return {
                totalItems: total,
                completedItems: completed,
                completionRate: total > 0 ? (completed / total) * 100 : 0,
                overdueItems: overdue,
                items: tasks.map(t => ({
                    id: t.id,
                    key: t.key,
                    summary: t.summary,
                    status: t.status,
                    assignee: t.assigneeId,
                    dueDate: t.dueDate
                }))
            };
        }
        catch (error) {
            console.error('❌ Failed to track action item progress:', error);
            throw error;
        }
    }
    /**
     * Generate unique issue key for a project
     */
    async generateIssueKey(projectId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        try {
            const project = await projectRepo.findOne({ where: { id: projectId } });
            const prefix = project?.key || 'TASK';
            const allIssues = await issueRepo
                .createQueryBuilder('issue')
                .where('issue.projectId = :projectId', { projectId })
                .andWhere('issue.key LIKE :prefix', { prefix: `${prefix}-%` })
                .getMany();
            let maxNumber = 0;
            allIssues.forEach(issue => {
                const match = issue.key.match(/(\d+)$/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNumber)
                        maxNumber = num;
                }
            });
            return `${prefix}-${maxNumber + 1}`;
        }
        catch (error) {
            console.error('Error generating issue key:', error);
            return `TASK-${Date.now()}`;
        }
    }
}
exports.ActionItemTrackerService = ActionItemTrackerService;
// Export singleton instance
exports.actionItemTrackerService = new ActionItemTrackerService();
