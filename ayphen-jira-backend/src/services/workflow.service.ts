import { AppDataSource } from '../config/database';
import { Project } from '../entities/Project';

export interface WorkflowStatus {
    id: string;
    name: string;
    category: 'TODO' | 'IN_PROGRESS' | 'DONE';
    position?: { x: number; y: number };
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    isDefault: boolean;
    statuses: WorkflowStatus[];
    transitions: any[];
    projectIds: string[];
}

export class WorkflowService {
    private workflows: Workflow[] = [
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

    public async getAll(): Promise<Workflow[]> {
        return this.workflows;
    }

    public async getById(id: string): Promise<Workflow | undefined> {
        return this.workflows.find(w => w.id === id);
    }

    public async getProjectWorkflow(projectId: string): Promise<Workflow> {
        const projectRepo = AppDataSource.getRepository(Project);
        const project = await projectRepo.findOne({ where: { id: projectId } });

        const workflowId = project?.workflowId || 'workflow-1';
        return (await this.getById(workflowId)) || this.workflows[0];
    }

    public async getDoneStatuses(projectId: string): Promise<string[]> {
        const workflow = await this.getProjectWorkflow(projectId);
        return workflow.statuses
            .filter(s => s.category === 'DONE')
            .map(s => s.id);
    }

    public async getStatusCategory(projectId: string, status: string): Promise<'TODO' | 'IN_PROGRESS' | 'DONE'> {
        const workflow = await this.getProjectWorkflow(projectId);
        const statusObj = workflow.statuses.find(s => s.id === status.toLowerCase() || s.name.toLowerCase() === status.toLowerCase());
        return statusObj?.category || 'IN_PROGRESS';
    }

    public async isDone(projectId: string, status: string): Promise<boolean> {
        const category = await this.getStatusCategory(projectId, status);
        return category === 'DONE';
    }

    // Create/Update methods would normally save to DB, for now we update in-memory
    public async addStatus(workflowId: string, status: WorkflowStatus): Promise<Workflow | undefined> {
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

export const workflowService = new WorkflowService();
