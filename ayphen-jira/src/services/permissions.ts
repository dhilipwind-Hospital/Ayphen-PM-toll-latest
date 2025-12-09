export enum Permission {
  VIEW_ISSUES = 'view_issues',
  CREATE_ISSUES = 'create_issues',
  EDIT_ISSUES = 'edit_issues',
  DELETE_ISSUES = 'delete_issues',
  MANAGE_PROJECTS = 'manage_projects',
  MANAGE_USERS = 'manage_users',
  MANAGE_SPRINTS = 'manage_sprints',
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',
  ADMIN = 'admin',
}

export enum Role {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  DEVELOPER = 'developer',
  QA = 'qa',
  VIEWER = 'viewer',
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.PROJECT_MANAGER]: [
    Permission.VIEW_ISSUES,
    Permission.CREATE_ISSUES,
    Permission.EDIT_ISSUES,
    Permission.DELETE_ISSUES,
    Permission.MANAGE_PROJECTS,
    Permission.MANAGE_SPRINTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],
  [Role.DEVELOPER]: [
    Permission.VIEW_ISSUES,
    Permission.CREATE_ISSUES,
    Permission.EDIT_ISSUES,
    Permission.VIEW_REPORTS,
  ],
  [Role.QA]: [
    Permission.VIEW_ISSUES,
    Permission.CREATE_ISSUES,
    Permission.EDIT_ISSUES,
    Permission.VIEW_REPORTS,
  ],
  [Role.VIEWER]: [Permission.VIEW_ISSUES, Permission.VIEW_REPORTS],
};

export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  return rolePermissions[userRole]?.includes(permission) || false;
};

export const canEditIssue = (userRole: Role, issueAssignee: string, userId: string): boolean => {
  if (userRole === Role.ADMIN || userRole === Role.PROJECT_MANAGER) return true;
  if (issueAssignee === userId) return true;
  return hasPermission(userRole, Permission.EDIT_ISSUES);
};

export const canDeleteIssue = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.DELETE_ISSUES);
};

export const canManageProject = (userRole: Role): boolean => {
  return hasPermission(userRole, Permission.MANAGE_PROJECTS);
};
