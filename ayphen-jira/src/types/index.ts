// Core Types for Ayphen Jira

export type IssueType = 'epic' | 'story' | 'task' | 'bug' | 'subtask';
export type IssuePriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type IssueStatus = 'todo' | 'in-progress' | 'in-review' | 'done' | 'backlog';
export type ProjectType = 'scrum' | 'kanban';
export type BoardType = 'scrum' | 'kanban';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  department?: string;
  jobTitle?: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: ProjectType;
  lead: User;
  avatar?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  members: User[];
  isStarred?: boolean;
  workflowId?: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: 'future' | 'active' | 'completed';
  projectId: string;
  issueIds: string[];
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt?: string;
  isInternal?: boolean;
  likes?: string[]; // user IDs
  replies?: Comment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: User;
  uploadedAt: string;
}

export interface WorkLog {
  id: string;
  timeSpent: string;
  description?: string;
  author: User;
  startDate: string;
  createdAt: string;
}

export interface IssueLink {
  id: string;
  type: 'blocks' | 'blocked-by' | 'clones' | 'cloned-by' | 'duplicates' | 'duplicated-by' | 'relates-to' | 'causes' | 'caused-by';
  issueId: string;
  linkedIssueId: string;
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: string;
  reporter: User;
  assignee?: User;
  labels: string[];
  components: string[];
  fixVersions: string[];
  epicLink?: string;
  sprintId?: string;
  storyPoints?: number;
  originalEstimate?: string;
  remainingEstimate?: string;
  timeSpent?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  parentId?: string;
  subtasks: string[];
  attachments: Attachment[];
  comments: Comment[];
  workLogs: WorkLog[];
  links: IssueLink[];
  watchers: string[]; // user IDs
  voters: string[]; // user IDs
  environment?: string;
  updatedBy?: string; // User ID who last updated
}

export interface Board {
  id: string;
  name: string;
  type: BoardType;
  projectId: string;
  columns: BoardColumn[];
  swimlanes?: Swimlane[];
  filters?: BoardFilter;
  isStarred?: boolean;
}

export interface BoardColumn {
  id: string;
  name: string;
  status: IssueStatus[];
  wipLimit?: number;
  issueIds: string[];
}

export interface Swimlane {
  id: string;
  name: string;
  type: 'epic' | 'assignee' | 'priority' | 'query';
  query?: string;
}

export interface BoardFilter {
  assignees?: string[];
  epics?: string[];
  labels?: string[];
  quickFilters?: QuickFilter[];
}

export interface QuickFilter {
  id: string;
  name: string;
  query: string;
}

export interface Filter {
  id: string;
  name: string;
  description?: string;
  jql: string;
  owner: User;
  isStarred?: boolean;
  isShared?: boolean;
  subscribers?: string[]; // user IDs
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  owner: User;
  isStarred?: boolean;
  layout: DashboardLayout;
  gadgets: Gadget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLayout {
  columns: number;
  type: 'grid' | 'canvas';
}

export interface Gadget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
  refreshInterval?: number;
}

export interface Notification {
  id: string;
  type: 'issue-assigned' | 'issue-updated' | 'comment' | 'mention' | 'sprint' | 'version';
  title: string;
  message: string;
  issueId?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Component {
  id: string;
  name: string;
  description?: string;
  lead?: User;
  projectId: string;
}

export interface Version {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  releaseDate?: string;
  status: 'unreleased' | 'released' | 'archived';
  projectId: string;
}

export interface Epic {
  id: string;
  name: string;
  color: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
  childIssues: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
}

export interface WorkflowStatus {
  id: string;
  name: string;
  category: 'todo' | 'in-progress' | 'done';
}

export interface WorkflowTransition {
  id: string;
  name: string;
  from: string;
  to: string;
  conditions?: string[];
  validators?: string[];
  postFunctions?: string[];
}

export interface SearchResult {
  issues: Issue[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActivityItem {
  id: string;
  type: 'comment' | 'status-change' | 'assignment' | 'field-update' | 'worklog';
  user: User;
  timestamp: string;
  issueId: string;
  details: Record<string, any>;
}
