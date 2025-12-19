import axios from 'axios';

export const BASE_URL = 'https://ayphen-pm-toll-latest.onrender.com';
export const API_BASE_URL = `${BASE_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Prevent redirect loop if already on auth pages
        if (!window.location.pathname.startsWith('/auth') &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Projects API
export const projectsApi = {
  getAll: (userId?: string) => api.get('/projects', { params: userId ? { userId } : {} }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getWorkflow: (id: string) => api.get(`/projects/${id}/workflow`),
  updateWorkflow: (id: string, workflowId: string) => api.put(`/projects/${id}/workflow`, { workflowId }),
};

// Add project to store helper
export const addProjectToStore = (project: any) => {
  // This will be called after successful project creation
  return project;
};

// Project Members API
export const projectMembersApi = {
  getByProject: (projectId: string, userId?: string) => api.get(`/project-members/project/${projectId}`, { params: { userId } }),
  getByUser: (userId: string) => api.get(`/project-members/user/${userId}`),
  checkAccess: (projectId: string, userId: string) => api.get(`/project-members/check/${projectId}/${userId}`),
  add: (data: any) => api.post('/project-members', data),
  updateRole: (id: string, data: any) => api.patch(`/project-members/${id}`, data),
  remove: (id: string) => api.delete(`/project-members/${id}`),
  bulkAdd: (data: any) => api.post('/project-members/bulk-add', data),
  bulkRemove: (data: any) => api.post('/project-members/bulk-remove', data),
  bulkUpdateRole: (data: any) => api.post('/project-members/bulk-update-role', data),
};

// Project Invitations API
export const projectInvitationsApi = {
  getByProject: (projectId: string) =>
    api.get(`/project-invitations/project/${projectId}`),
  create: (data: {
    projectId: string;
    email: string;
    role: string;
    invitedById: string;
  }) => api.post('/project-invitations', data),
  verify: (token: string) =>
    api.get(`/project-invitations/verify/${token}`),
  accept: (token: string, userId?: string) =>
    api.post(`/project-invitations/accept/${token}`, { userId }),
  reject: (token: string) =>
    api.post(`/project-invitations/reject/${token}`),
  cancel: (id: string) =>
    api.delete(`/project-invitations/${id}`),
  resend: (id: string) =>
    api.post(`/project-invitations/resend/${id}`),
};

// Issues API
export const issuesApi = {
  getAll: (params?: { projectId?: string; status?: string; assigneeId?: string; userId?: string; epicLink?: string; type?: string }) =>
    api.get('/issues', { params }),
  search: (params: { page: number; limit: number; projectId?: string;[key: string]: any }) =>
    api.get('/issues', { params }),
  getByProject: (projectId: string) => api.get('/issues', { params: { projectId, userId: localStorage.getItem('userId') } }),
  getById: (id: string) => api.get(`/issues/${id}`),
  getByKey: (key: string) => api.get(`/issues/key/${key}`),
  create: (data: any) => api.post('/issues', data),
  update: (id: string, data: any) => api.put(`/issues/${id}`, data),
  delete: (id: string) => api.delete(`/issues/${id}`),
};

// Users API (Enhanced)
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updateProfile: (id: string, data: any) => api.patch(`/users/${id}/profile`, data),
  changePassword: (id: string, data: any) => api.post(`/users/${id}/change-password`, data),
  getPreferences: (id: string) => api.get(`/users/${id}/preferences`),
  updatePreferences: (id: string, data: any) => api.put(`/users/${id}/preferences`, data),
  uploadAvatar: (id: string, formData: FormData) => api.post(`/users/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteAvatar: (id: string) => api.delete(`/users/${id}/avatar`),
  deactivate: (id: string) => api.post(`/users/${id}/deactivate`),
  activate: (id: string) => api.post(`/users/${id}/activate`),
  getSettings: (id: string) => api.get(`/users/${id}/settings`),
  updateSettings: (id: string, data: any) => api.put(`/users/${id}/settings`, data),
};

// Sprints API
export const sprintsApi = {
  getAll: (projectId?: string, userId?: string) => api.get('/sprints', { params: { projectId, userId } }),
  create: (data: any) => api.post('/sprints', data),
  update: (id: string, data: any) => api.put(`/sprints/${id}`, data),
  delete: (id: string) => api.delete(`/sprints/${id}`),
  start: (id: string, data: any) => api.post(`/sprints/${id}/start`, data),
  complete: (id: string, data: any) => api.post(`/sprints/${id}/complete`, data),
  getReport: (id: string) => api.get(`/sprints/${id}/report`),
  getBurndown: (id: string) => api.get(`/sprints/${id}/burndown`),
  getVelocity: (projectId: string) => api.get('/sprints/velocity', { params: { projectId } }),
};

// Comments API
export const commentsApi = {
  getByIssue: (issueId: string) => api.get(`/comments/issue/${issueId}`),
  create: (data: any) => api.post('/comments', data),
  update: (id: string, data: any) => api.put(`/comments/${id}`, data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// Attachments API
export const attachmentsApi = {
  getByIssue: (issueId: string) => api.get(`/attachments/issue/${issueId}`),
  create: (data: any) => api.post('/attachments', data),
  delete: (id: string) => api.delete(`/attachments/${id}`),
};

// Dashboards API
export const dashboardsApi = {
  getAll: () => api.get('/dashboards'),
  getById: (id: string) => api.get(`/dashboards/${id}`),
  create: (data: any) => api.post('/dashboards', data),
  update: (id: string, data: any) => api.put(`/dashboards/${id}`, data),
  delete: (id: string) => api.delete(`/dashboards/${id}`),
};

// Filters API
export const filtersApi = {
  getAll: () => api.get('/filters'),
  getById: (id: string) => api.get(`/filters/${id}`),
  create: (data: any) => api.post('/filters', data),
  update: (id: string, data: any) => api.put(`/filters/${id}`, data),
  delete: (id: string) => api.delete(`/filters/${id}`),
};

// Issue Links API
export const issueLinksApi = {
  getByIssue: (issueId: string) => api.get(`/issue-links/issue/${issueId}`),
  create: (data: any) => api.post('/issue-links', data),
  delete: (id: string) => api.delete(`/issue-links/${id}`),
};

// Subtasks API
export const subtasksApi = {
  getByParent: (parentId: string) => api.get(`/subtasks/parent/${parentId}`),
  create: (data: any) => api.post('/subtasks', data),
  update: (id: string, data: any) => api.put(`/subtasks/${id}`, data),
  delete: (id: string) => api.delete(`/subtasks/${id}`),
};

// History API
export const historyApi = {
  getByIssue: (issueId: string) => api.get(`/history/issue/${issueId}`),
  create: (data: any) => api.post('/history', data),
};

// Workflows API
export const workflowsApi = {
  getAll: (projectId?: string) => api.get('/workflows', { params: { projectId } }),
  getById: (id: string) => api.get(`/workflows/${id}`),
  create: (data: any) => api.post('/workflows', data),
  update: (id: string, data: any) => api.put(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  setDefault: (id: string) => api.post(`/workflows/${id}/set-default`),
  getDiagram: (id: string) => api.get(`/workflows/${id}/diagram`),
};

// Settings API
export const settingsApi = {
  getWorkflows: () => api.get('/settings/workflows'),
  createWorkflow: (data: any) => api.post('/settings/workflows', data),
  updateWorkflow: (id: string, data: any) => api.put(`/settings/workflows/${id}`, data),
  deleteWorkflow: (id: string) => api.delete(`/settings/workflows/${id}`),

  // Issue Types
  getIssueTypes: () => api.get('/settings/issue-types'),
  createIssueType: (data: any) => api.post('/settings/issue-types', data),
  updateIssueType: (id: string, data: any) => api.put(`/settings/issue-types/${id}`, data),
  deleteIssueType: (id: string) => api.delete(`/settings/issue-types/${id}`),

  // Custom Fields
  getCustomFields: () => api.get('/settings/custom-fields'),
  createCustomField: (data: any) => api.post('/settings/custom-fields', data),
  updateCustomField: (id: string, data: any) => api.put(`/settings/custom-fields/${id}`, data),
  deleteCustomField: (id: string) => api.delete(`/settings/custom-fields/${id}`),

  // Automation Rules
  getAutomationRules: () => api.get('/settings/automation-rules'),
  createAutomationRule: (data: any) => api.post('/settings/automation-rules', data),
  updateAutomationRule: (id: string, data: any) => api.put(`/settings/automation-rules/${id}`, data),
  deleteAutomationRule: (id: string) => api.delete(`/settings/automation-rules/${id}`),

  // Team Members
  getProjectMembers: (projectId: string) => api.get(`/settings/project/${projectId}/members`),
  addProjectMember: (projectId: string, data: any) => api.post(`/settings/project/${projectId}/members`, data),
  updateMemberRole: (projectId: string, userId: string, data: any) => api.put(`/settings/project/${projectId}/members/${userId}`, data),
  removeMember: (projectId: string, userId: string) => api.delete(`/settings/project/${projectId}/members/${userId}`),

  // Permissions
  getPermissions: () => api.get('/settings/permissions'),
  updatePermission: (id: string, data: any) => api.put(`/settings/permissions/${id}`, data),
};

// Enhanced Projects API
export const projectsEnhancedApi = {
  archive: (id: string, userId: string) => api.post(`/projects/${id}/archive`, { userId }),
  restore: (id: string) => api.post(`/projects/${id}/restore`),
  getPermissions: (id: string) => api.get(`/projects/${id}/permissions`),
  updatePermissions: (id: string, permissions: any) => api.put(`/projects/${id}/permissions`, permissions),
  exportProject: (id: string, format: string) => api.post(`/projects/${id}/export`, { format }),
  importProject: (projectData: any, options: any) => api.post('/projects/import', { projectData, options }),
  getMembers: (id: string) => api.get(`/projects/${id}/members`),
  addMember: (id: string, userId: string, role: string) => api.post(`/projects/${id}/members`, { userId, role }),
  removeMember: (id: string, userId: string) => api.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id: string, userId: string, role: string) => api.put(`/projects/${id}/members/${userId}/role`, { role }),
};

// Enhanced Issues API
export const issuesEnhancedApi = {
  bulkEdit: (issueIds: string[], updates: any) => api.post('/issues/bulk-edit', { issueIds, updates }),
  duplicate: (id: string) => api.post(`/issues/${id}/duplicate`),
  getTemplates: () => api.get('/issues/templates/list'),
  createTemplate: (name: string, type: string, fields: any) => api.post('/issues/templates/create', { name, type, fields }),
  convert: (id: string, newType: string) => api.post(`/issues/${id}/convert`, { newType }),
  move: (id: string, targetProjectId: string) => api.post(`/issues/${id}/move`, { targetProjectId }),
  getTimeTracking: (id: string) => api.get(`/issues/${id}/time-tracking`),
  logWork: (id: string, timeSpentMinutes: number, comment: string, userId: string) =>
    api.post(`/issues/${id}/time-tracking`, { timeSpentMinutes, comment, userId }),
  getWorklog: (id: string) => api.get(`/issues/${id}/worklog`),
  flag: (id: string, flagged: boolean, userId: string) => api.post(`/issues/${id}/flag`, { flagged, userId }),
};

// Reports API
export const reportsApi = {
  getCustom: (params: any) => api.get('/reports-v2/custom', { params }),
  generate: (reportConfig: any) => api.post('/reports-v2/generate', { reportConfig }),
  export: (format: string, reportId: string) => api.get(`/reports-v2/export/${format}`, { params: { reportId } }),
  schedule: (reportConfig: any, frequency: string, recipients: string[]) =>
    api.post('/reports-v2/schedule', { reportConfig, frequency, recipients }),
  getBurndown: (sprintId: string) => api.get('/reports-v2/burndown-chart', { params: { sprintId } }),
  getVelocity: (projectId: string) => api.get('/reports-v2/velocity-chart', { params: { projectId } }),
  getCumulativeFlow: (projectId: string, startDate?: string, endDate?: string) =>
    api.get('/reports-v2/cumulative-flow', { params: { projectId, startDate, endDate } }),
  getControlChart: (projectId: string) => api.get('/reports-v2/control-chart', { params: { projectId } }),
  getTimeTracking: (projectId: string, startDate?: string, endDate?: string) =>
    api.get('/reports-v2/time-tracking', { params: { projectId, startDate, endDate } }),
  getUserWorkload: (projectId: string) => api.get('/reports-v2/user-workload', { params: { projectId } }),
};

// Notifications Enhanced API
export const notificationsEnhancedApi = {
  sendEmail: (to: string, subject: string, body: string, template?: string) =>
    api.post('/notifications-v2/email/send', { to, subject, body, template }),
  sendPush: (userId: string, title: string, message: string, data?: any) =>
    api.post('/notifications-v2/push/send', { userId, title, message, data }),
  sendBulk: (userIds: string[], notification: any) => api.post('/notifications-v2/bulk', { userIds, notification }),
  getTemplates: () => api.get('/notifications-v2/templates'),
  createTemplate: (name: string, subject: string, body: string, variables: string[]) =>
    api.post('/notifications-v2/templates', { name, subject, body, variables }),
  getDigest: (userId: string, period: string) => api.get('/notifications-v2/digest', { params: { userId, period } }),
  subscribe: (userId: string, eventTypes: string[], projectIds: string[]) =>
    api.post('/notifications-v2/subscribe', { userId, eventTypes, projectIds }),
  unsubscribe: (userId: string, subscriptionId: string) =>
    api.post('/notifications-v2/unsubscribe', { userId, subscriptionId }),
  getChannels: () => api.get('/notifications-v2/channels'),
  test: (userId: string, channel: string, message: string) =>
    api.post('/notifications-v2/test', { userId, channel, message }),
};

// Bulk Operations API
export const bulkOperationsApi = {
  bulkUpdate: (issueIds: string[], updates: any) =>
    api.patch('/issues/bulk/update', { issueIds, updates }),
  bulkDelete: (issueIds: string[]) =>
    api.delete('/issues/bulk/delete', { data: { issueIds } }),
};

// Board Views API (Saved Views)
export const boardViewsApi = {
  getAll: (userId: string) =>
    api.get('/board-views', { params: { userId } }),
  getById: (id: string) =>
    api.get(`/board-views/${id}`),
  create: (data: any) =>
    api.post('/board-views', data),
  update: (id: string, data: any) =>
    api.patch(`/board-views/${id}`, data),
  delete: (id: string) =>
    api.delete(`/board-views/${id}`),
};

// Health check
export const healthCheck = () => axios.get(`${API_BASE_URL.replace('/api', '')}/health`);

// Gadgets API
export const gadgetsApi = {
  getByDashboard: (dashboardId: string) => api.get(`/gadgets/dashboard/${dashboardId}`),
  create: (data: any) => api.post('/gadgets', data),
  update: (id: string, data: any) => api.put(`/gadgets/${id}`, data),
  delete: (id: string) => api.delete(`/gadgets/${id}`),
};

// Dashboards V2 API
export const dashboardsV2Api = {
  getAll: (userId: string) => api.get('/dashboards-v2', { params: { userId } }),
  create: (data: any) => api.post('/dashboards-v2', data),
  clone: (id: string, data: any) => api.post(`/dashboards-v2/${id}/clone`, data),
  toggleStar: (id: string) => api.post(`/dashboards-v2/${id}/star`),
};

// Extended Reports API
export const reportsLegacyApi = {
  getSprintBurndown: (sprintId: string) => api.get(`/reports/sprint-burndown/${sprintId}`),
  getVelocity: (projectId: string) => api.get(`/reports/velocity/${projectId}`),
  getCumulativeFlow: (projectId: string) => api.get(`/reports/cumulative-flow/${projectId}`),
  getCreatedVsResolved: (projectId: string) => api.get(`/reports/created-vs-resolved/${projectId}`),
  getPieChart: (projectId: string, groupBy: string) => api.get(`/reports/pie-chart/${projectId}`, { params: { groupBy } }),
  getTimeTracking: (projectId: string) => api.get(`/reports/time-tracking/${projectId}`),
  getAverageAge: (projectId: string) => api.get(`/reports/average-age/${projectId}`),
  getResolutionTime: (projectId: string) => api.get(`/reports/resolution-time/${projectId}`),
  getUserWorkload: (projectId: string) => api.get(`/reports/user-workload/${projectId}`),
  getSprintReport: (sprintId: string) => api.get(`/reports/sprint-report/${sprintId}`),
};
