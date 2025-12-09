"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ayphen JIRA API Documentation',
            version: '1.0.0',
            description: 'Comprehensive REST API documentation for Ayphen JIRA - Enterprise Project Management System',
            contact: {
                name: 'API Support',
                email: 'api@ayphen-jira.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:7500/api',
                description: 'Development server',
            },
            {
                url: 'https://api.ayphen-jira.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                apiKey: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                },
            },
            schemas: {
                Issue: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        key: { type: 'string', example: 'PROJ-123' },
                        summary: { type: 'string', example: 'Fix login bug' },
                        description: { type: 'string' },
                        type: { type: 'string', enum: ['story', 'bug', 'task', 'epic'] },
                        status: { type: 'string', enum: ['To Do', 'In Progress', 'Done'] },
                        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
                        assigneeId: { type: 'string', format: 'uuid' },
                        reporterId: { type: 'string', format: 'uuid' },
                        projectId: { type: 'string', format: 'uuid' },
                        sprintId: { type: 'string', format: 'uuid', nullable: true },
                        storyPoints: { type: 'number', nullable: true },
                        labels: { type: 'array', items: { type: 'string' } },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Project: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'My Project' },
                        key: { type: 'string', example: 'PROJ' },
                        description: { type: 'string' },
                        leadId: { type: 'string', format: 'uuid' },
                        type: { type: 'string', enum: ['software', 'business', 'service'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['admin', 'project_lead', 'developer', 'qa', 'viewer'] },
                        avatar: { type: 'string', format: 'uri', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Comment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        issueId: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        content: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Sprint: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Sprint 1' },
                        goal: { type: 'string' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['planned', 'active', 'completed'] },
                        projectId: { type: 'string', format: 'uuid' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                        statusCode: { type: 'number' },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication information is missing or invalid',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                ForbiddenError: {
                    description: 'Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
            },
        },
        tags: [
            { name: 'Issues', description: 'Issue management endpoints' },
            { name: 'Projects', description: 'Project management endpoints' },
            { name: 'Users', description: 'User management endpoints' },
            { name: 'Comments', description: 'Comment management endpoints' },
            { name: 'Sprints', description: 'Sprint management endpoints' },
            { name: 'Attachments', description: 'File attachment endpoints' },
            { name: 'Reports', description: 'Reporting and analytics endpoints' },
            { name: 'Search', description: 'Search and JQL query endpoints' },
            { name: 'Dashboards', description: 'Dashboard management endpoints' },
            { name: 'Workflows', description: 'Workflow management endpoints' },
            { name: 'Audit', description: 'Audit log endpoints' },
        ],
    },
    apis: ['./src/routes/*.ts'], // Path to the API routes
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
// Example endpoint documentation
/**
 * @swagger
 * /issues:
 *   get:
 *     summary: Get all issues
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *         description: Filter by assignee ID
 *     responses:
 *       200:
 *         description: List of issues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Issue'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Create a new issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Issue'
 *     responses:
 *       201:
 *         description: Issue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
