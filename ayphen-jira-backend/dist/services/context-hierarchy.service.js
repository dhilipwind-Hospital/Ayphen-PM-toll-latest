"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextHierarchyService = exports.ContextHierarchyService = void 0;
const database_1 = require("../config/database");
const Project_1 = require("../entities/Project");
const Issue_1 = require("../entities/Issue");
class ContextHierarchyService {
    constructor() {
        this.projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        this.issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
    }
    /**
     * Get full context for an issue including project, epic, parent, and related issues
     */
    async getIssueContext(params) {
        const context = {
            relatedIssues: [],
            hierarchy: {},
        };
        try {
            // Get project context
            if (params.projectId) {
                const project = await this.projectRepo.findOne({
                    where: { id: params.projectId },
                });
                if (project) {
                    context.project = {
                        id: project.id,
                        name: project.name,
                        key: project.key,
                        description: project.description || '',
                        type: project.type,
                    };
                    context.hierarchy.project = project.name;
                }
            }
            // Get epic context
            if (params.epicId) {
                const epic = await this.issueRepo.findOne({
                    where: { id: params.epicId },
                });
                if (epic) {
                    context.epic = {
                        id: epic.id,
                        key: epic.key,
                        summary: epic.summary,
                        description: epic.description || '',
                    };
                    context.hierarchy.epic = epic.summary;
                }
            }
            // Get parent issue context
            if (params.parentIssueId) {
                const parent = await this.issueRepo.findOne({
                    where: { id: params.parentIssueId },
                });
                if (parent) {
                    context.parentIssue = {
                        id: parent.id,
                        key: parent.key,
                        summary: parent.summary,
                        description: parent.description || '',
                        type: parent.type,
                    };
                    context.hierarchy.parent = parent.summary;
                }
            }
            // Get related issues (same project, same type or related epic)
            if (params.projectId) {
                const relatedQuery = this.issueRepo
                    .createQueryBuilder('issue')
                    .where('issue.projectId = :projectId', { projectId: params.projectId })
                    .andWhere('issue.type = :type', { type: params.issueType })
                    .orderBy('issue.createdAt', 'DESC')
                    .limit(5);
                if (params.epicId) {
                    relatedQuery.andWhere('issue.epicId = :epicId', { epicId: params.epicId });
                }
                const relatedIssues = await relatedQuery.getMany();
                context.relatedIssues = relatedIssues.map(issue => ({
                    id: issue.id,
                    key: issue.key,
                    summary: issue.summary,
                    description: issue.description || '',
                    type: issue.type,
                }));
            }
            return context;
        }
        catch (error) {
            console.error('Error getting issue context:', error);
            return context;
        }
    }
    /**
     * Get project goals and requirements
     */
    async getProjectGoals(projectId) {
        try {
            const project = await this.projectRepo.findOne({
                where: { id: projectId },
            });
            if (project && project.description) {
                // Extract goals from description (simple implementation)
                // In production, you might have a dedicated goals field
                return [project.description];
            }
            return [];
        }
        catch (error) {
            console.error('Error getting project goals:', error);
            return [];
        }
    }
    /**
     * Build a comprehensive context summary for AI
     */
    buildContextSummary(context) {
        const parts = [];
        if (context.project) {
            parts.push(`Project: ${context.project.name} (${context.project.key})`);
            if (context.project.description) {
                parts.push(`Project Description: ${context.project.description}`);
            }
        }
        if (context.epic) {
            parts.push(`Epic: ${context.epic.key} - ${context.epic.summary}`);
            if (context.epic.description) {
                parts.push(`Epic Description: ${context.epic.description}`);
            }
        }
        if (context.parentIssue) {
            parts.push(`Parent ${context.parentIssue.type}: ${context.parentIssue.key} - ${context.parentIssue.summary}`);
            if (context.parentIssue.description) {
                parts.push(`Parent Description: ${context.parentIssue.description}`);
            }
        }
        if (context.relatedIssues.length > 0) {
            parts.push(`Related Issues (${context.relatedIssues.length}):`);
            context.relatedIssues.slice(0, 3).forEach(issue => {
                parts.push(`- ${issue.key}: ${issue.summary}`);
            });
        }
        return parts.join('\n');
    }
}
exports.ContextHierarchyService = ContextHierarchyService;
exports.contextHierarchyService = new ContextHierarchyService();
