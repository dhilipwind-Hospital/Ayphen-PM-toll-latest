"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowService = exports.WorkflowService = void 0;
const database_1 = require("../config/database");
const Project_1 = require("../entities/Project");
class WorkflowService {
    constructor() {
        this.workflows = [
            {
                id: 'workflow-1',
                name: 'Default Workflow',
                description: 'Standard workflow for most issues',
                isDefault: true,
                statuses: [
                    { id: 'todo', name: 'To Do', category: 'TODO', position: { x: 100, y: 100 } },
                    { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS', position: { x: 300, y: 100 } },
                    { id: 'in-review', name: 'In Review', category: 'IN_PROGRESS', position: { x: 500, y: 100 } },
                    { id: 'done', name: 'Done', category: 'DONE', position: { x: 700, y: 100 } },
                    { id: 'backlog', name: 'Backlog', category: 'TODO', position: { x: -100, y: 100 } },
                ],
                transitions: [],
                projectIds: [],
            },
            {
                id: 'workflow-2',
                name: 'Bug Workflow',
                description: 'Simplified workflow for bug tracking',
                isDefault: false,
                statuses: [
                    { id: 'open', name: 'Open', category: 'TODO', position: { x: 150, y: 150 } },
                    { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS', position: { x: 400, y: 150 } },
                    { id: 'closed', name: 'Closed', category: 'DONE', position: { x: 650, y: 150 } },
                ],
                transitions: [],
                projectIds: [],
            },
        ];
    }
    async getAll() {
        return this.workflows;
    }
    async getById(id) {
        return this.workflows.find(w => w.id === id);
    }
    async getProjectWorkflow(projectId) {
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const project = await projectRepo.findOne({ where: { id: projectId } });
        const workflowId = project?.workflowId || 'workflow-1';
        return (await this.getById(workflowId)) || this.workflows[0];
    }
    async getDoneStatuses(projectId) {
        const workflow = await this.getProjectWorkflow(projectId);
        return workflow.statuses
            .filter(s => s.category === 'DONE')
            .map(s => s.id);
    }
    async getStatusCategory(projectId, status) {
        const workflow = await this.getProjectWorkflow(projectId);
        const statusObj = workflow.statuses.find(s => s.id === status.toLowerCase() || s.name.toLowerCase() === status.toLowerCase());
        return statusObj?.category || 'IN_PROGRESS';
    }
    async isDone(projectId, status) {
        const category = await this.getStatusCategory(projectId, status);
        return category === 'DONE';
    }
    // Create/Update methods would normally save to DB, for now we update in-memory
    async addStatus(workflowId, status) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (workflow) {
            // Check for duplicates
            if (!workflow.statuses.find(s => s.id === status.id)) {
                workflow.statuses.push(status);
            }
            return workflow;
        }
        return undefined;
    }
}
exports.WorkflowService = WorkflowService;
exports.workflowService = new WorkflowService();
