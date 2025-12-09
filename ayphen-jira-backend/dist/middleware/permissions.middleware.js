"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyPermission = exports.requirePermission = exports.DEFAULT_ROLES = exports.PERMISSIONS = void 0;
exports.initializeDefaultRoles = initializeDefaultRoles;
const database_1 = require("../config/database");
const Role_1 = require("../entities/Role");
const audit_service_1 = require("../services/audit.service");
// Permission keys
exports.PERMISSIONS = {
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
exports.DEFAULT_ROLES = {
    ADMIN: {
        key: 'admin',
        name: 'Administrator',
        permissions: Object.values(exports.PERMISSIONS),
    },
    PROJECT_LEAD: {
        key: 'project_lead',
        name: 'Project Lead',
        permissions: [
            exports.PERMISSIONS.PROJECT_ADMINISTER,
            exports.PERMISSIONS.PROJECT_BROWSE,
            exports.PERMISSIONS.PROJECT_VIEW_DEV_TOOLS,
            exports.PERMISSIONS.ISSUE_CREATE,
            exports.PERMISSIONS.ISSUE_EDIT,
            exports.PERMISSIONS.ISSUE_DELETE,
            exports.PERMISSIONS.ISSUE_ASSIGN,
            exports.PERMISSIONS.ISSUE_RESOLVE,
            exports.PERMISSIONS.ISSUE_CLOSE,
            exports.PERMISSIONS.ISSUE_TRANSITION,
            exports.PERMISSIONS.ISSUE_MOVE,
            exports.PERMISSIONS.ISSUE_LINK,
            exports.PERMISSIONS.COMMENT_ADD,
            exports.PERMISSIONS.COMMENT_EDIT,
            exports.PERMISSIONS.COMMENT_DELETE,
            exports.PERMISSIONS.ATTACHMENT_CREATE,
            exports.PERMISSIONS.ATTACHMENT_DELETE,
            exports.PERMISSIONS.WORKLOG_CREATE,
            exports.PERMISSIONS.WORKLOG_EDIT,
            exports.PERMISSIONS.WORKLOG_DELETE,
        ],
    },
    DEVELOPER: {
        key: 'developer',
        name: 'Developer',
        permissions: [
            exports.PERMISSIONS.PROJECT_BROWSE,
            exports.PERMISSIONS.PROJECT_VIEW_DEV_TOOLS,
            exports.PERMISSIONS.ISSUE_CREATE,
            exports.PERMISSIONS.ISSUE_EDIT,
            exports.PERMISSIONS.ISSUE_ASSIGN,
            exports.PERMISSIONS.ISSUE_RESOLVE,
            exports.PERMISSIONS.ISSUE_TRANSITION,
            exports.PERMISSIONS.ISSUE_LINK,
            exports.PERMISSIONS.COMMENT_ADD,
            exports.PERMISSIONS.COMMENT_EDIT,
            exports.PERMISSIONS.ATTACHMENT_CREATE,
            exports.PERMISSIONS.WORKLOG_CREATE,
            exports.PERMISSIONS.WORKLOG_EDIT,
        ],
    },
    QA: {
        key: 'qa',
        name: 'QA Engineer',
        permissions: [
            exports.PERMISSIONS.PROJECT_BROWSE,
            exports.PERMISSIONS.ISSUE_CREATE,
            exports.PERMISSIONS.ISSUE_EDIT,
            exports.PERMISSIONS.ISSUE_TRANSITION,
            exports.PERMISSIONS.ISSUE_LINK,
            exports.PERMISSIONS.COMMENT_ADD,
            exports.PERMISSIONS.ATTACHMENT_CREATE,
        ],
    },
    VIEWER: {
        key: 'viewer',
        name: 'Viewer',
        permissions: [
            exports.PERMISSIONS.PROJECT_BROWSE,
            exports.PERMISSIONS.COMMENT_ADD,
        ],
    },
};
/**
 * Middleware to check if user has required permission
 */
const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || 'anonymous';
            const userRole = req.user?.role || 'viewer';
            // Get user's role permissions
            const roleRepo = database_1.AppDataSource.getRepository(Role_1.Role);
            const role = await roleRepo.findOne({ where: { key: userRole } });
            if (!role) {
                await audit_service_1.auditService.log({
                    userId,
                    userName: req.user?.name || 'Anonymous',
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
                await audit_service_1.auditService.log({
                    userId,
                    userName: req.user?.name || 'Anonymous',
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
        }
        catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if user has any of the required permissions
 */
const requireAnyPermission = (permissions) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || 'anonymous';
            const userRole = req.user?.role || 'viewer';
            const roleRepo = database_1.AppDataSource.getRepository(Role_1.Role);
            const role = await roleRepo.findOne({ where: { key: userRole } });
            if (!role) {
                return res.status(403).json({ error: 'Access denied: Invalid role' });
            }
            const hasPermission = permissions.some(p => role.permissions && role.permissions.includes(p));
            if (!hasPermission) {
                await audit_service_1.auditService.log({
                    userId,
                    userName: req.user?.name || 'Anonymous',
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
        }
        catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
};
exports.requireAnyPermission = requireAnyPermission;
/**
 * Initialize default roles in database
 */
async function initializeDefaultRoles() {
    const roleRepo = database_1.AppDataSource.getRepository(Role_1.Role);
    for (const [key, roleData] of Object.entries(exports.DEFAULT_ROLES)) {
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
