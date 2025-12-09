import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Role } from '../entities/Role';
import { auditService } from '../services/audit.service';

// Permission keys
export const PERMISSIONS = {
  // Project permissions
  PROJECT_ADMINISTER: 'project.administer',
  PROJECT_BROWSE: 'project.browse',
  PROJECT_VIEW_DEV_TOOLS: 'project.view_dev_tools',
  
  // Issue permissions
  ISSUE_CREATE: 'issue.create',
  ISSUE_EDIT: 'issue.edit',
  ISSUE_DELETE: 'issue.delete',
  ISSUE_ASSIGN: 'issue.assign',
  ISSUE_RESOLVE: 'issue.resolve',
  ISSUE_CLOSE: 'issue.close',
  ISSUE_TRANSITION: 'issue.transition',
  ISSUE_MOVE: 'issue.move',
  ISSUE_LINK: 'issue.link',
  
  // Comment permissions
  COMMENT_ADD: 'comment.add',
  COMMENT_EDIT: 'comment.edit',
  COMMENT_DELETE: 'comment.delete',
  
  // Attachment permissions
  ATTACHMENT_CREATE: 'attachment.create',
  ATTACHMENT_DELETE: 'attachment.delete',
  
  // Work log permissions
  WORKLOG_CREATE: 'worklog.create',
  WORKLOG_EDIT: 'worklog.edit',
  WORKLOG_DELETE: 'worklog.delete',
  
  // Admin permissions
  ADMIN_USERS: 'admin.users',
  ADMIN_PROJECTS: 'admin.projects',
  ADMIN_SYSTEM: 'admin.system',
};

// Default roles with permissions
export const DEFAULT_ROLES = {
  ADMIN: {
    key: 'admin',
    name: 'Administrator',
    permissions: Object.values(PERMISSIONS),
  },
  PROJECT_LEAD: {
    key: 'project_lead',
    name: 'Project Lead',
    permissions: [
      PERMISSIONS.PROJECT_ADMINISTER,
      PERMISSIONS.PROJECT_BROWSE,
      PERMISSIONS.PROJECT_VIEW_DEV_TOOLS,
      PERMISSIONS.ISSUE_CREATE,
      PERMISSIONS.ISSUE_EDIT,
      PERMISSIONS.ISSUE_DELETE,
      PERMISSIONS.ISSUE_ASSIGN,
      PERMISSIONS.ISSUE_RESOLVE,
      PERMISSIONS.ISSUE_CLOSE,
      PERMISSIONS.ISSUE_TRANSITION,
      PERMISSIONS.ISSUE_MOVE,
      PERMISSIONS.ISSUE_LINK,
      PERMISSIONS.COMMENT_ADD,
      PERMISSIONS.COMMENT_EDIT,
      PERMISSIONS.COMMENT_DELETE,
      PERMISSIONS.ATTACHMENT_CREATE,
      PERMISSIONS.ATTACHMENT_DELETE,
      PERMISSIONS.WORKLOG_CREATE,
      PERMISSIONS.WORKLOG_EDIT,
      PERMISSIONS.WORKLOG_DELETE,
    ],
  },
  DEVELOPER: {
    key: 'developer',
    name: 'Developer',
    permissions: [
      PERMISSIONS.PROJECT_BROWSE,
      PERMISSIONS.PROJECT_VIEW_DEV_TOOLS,
      PERMISSIONS.ISSUE_CREATE,
      PERMISSIONS.ISSUE_EDIT,
      PERMISSIONS.ISSUE_ASSIGN,
      PERMISSIONS.ISSUE_RESOLVE,
      PERMISSIONS.ISSUE_TRANSITION,
      PERMISSIONS.ISSUE_LINK,
      PERMISSIONS.COMMENT_ADD,
      PERMISSIONS.COMMENT_EDIT,
      PERMISSIONS.ATTACHMENT_CREATE,
      PERMISSIONS.WORKLOG_CREATE,
      PERMISSIONS.WORKLOG_EDIT,
    ],
  },
  QA: {
    key: 'qa',
    name: 'QA Engineer',
    permissions: [
      PERMISSIONS.PROJECT_BROWSE,
      PERMISSIONS.ISSUE_CREATE,
      PERMISSIONS.ISSUE_EDIT,
      PERMISSIONS.ISSUE_TRANSITION,
      PERMISSIONS.ISSUE_LINK,
      PERMISSIONS.COMMENT_ADD,
      PERMISSIONS.ATTACHMENT_CREATE,
    ],
  },
  VIEWER: {
    key: 'viewer',
    name: 'Viewer',
    permissions: [
      PERMISSIONS.PROJECT_BROWSE,
      PERMISSIONS.COMMENT_ADD,
    ],
  },
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const userRole = (req as any).user?.role || 'viewer';

      // Get user's role permissions
      const roleRepo = AppDataSource.getRepository(Role);
      const role = await roleRepo.findOne({ where: { key: userRole } });

      if (!role) {
        await auditService.log({
          userId,
          userName: (req as any).user?.name || 'Anonymous',
          action: 'access_denied',
          entityType: 'permission',
          description: `Permission check failed: ${permission}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failure',
        });

        return res.status(403).json({ error: 'Access denied: Invalid role' });
      }

      // Check if role has the required permission
      if (!role.permissions || !role.permissions.includes(permission)) {
        await auditService.log({
          userId,
          userName: (req as any).user?.name || 'Anonymous',
          action: 'access_denied',
          entityType: 'permission',
          description: `Missing permission: ${permission}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failure',
        });

        return res.status(403).json({ 
          error: 'Access denied: Insufficient permissions',
          required: permission,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const userRole = (req as any).user?.role || 'viewer';

      const roleRepo = AppDataSource.getRepository(Role);
      const role = await roleRepo.findOne({ where: { key: userRole } });

      if (!role) {
        return res.status(403).json({ error: 'Access denied: Invalid role' });
      }

      const hasPermission = permissions.some(p => 
        role.permissions && role.permissions.includes(p)
      );

      if (!hasPermission) {
        await auditService.log({
          userId,
          userName: (req as any).user?.name || 'Anonymous',
          action: 'access_denied',
          entityType: 'permission',
          description: `Missing any of permissions: ${permissions.join(', ')}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failure',
        });

        return res.status(403).json({ 
          error: 'Access denied: Insufficient permissions',
          required: permissions,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Initialize default roles in database
 */
export async function initializeDefaultRoles() {
  const roleRepo = AppDataSource.getRepository(Role);

  for (const [key, roleData] of Object.entries(DEFAULT_ROLES)) {
    const existing = await roleRepo.findOne({ where: { key: roleData.key } });
    
    if (!existing) {
      const role = roleRepo.create({
        key: roleData.key,
        name: roleData.name,
        permissions: roleData.permissions,
        isSystem: true,
        enabled: true,
      });
      await roleRepo.save(role);
      console.log(`✅ Created default role: ${roleData.name}`);
    }
  }
}
