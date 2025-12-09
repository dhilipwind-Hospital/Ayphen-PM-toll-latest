"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const typeorm_1 = require("typeorm");
const search_engine_service_1 = require("../services/search-engine.service");
const jql_parser_service_1 = require("../services/jql-parser.service");
const router = (0, express_1.Router)();
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
// Enhanced JQL parser with functions
function parseJQL(jql, currentUserId) {
    const where = {};
    // Remove extra spaces
    jql = jql.trim().replace(/\s+/g, ' ');
    // Replace JQL functions
    jql = jql.replace(/currentUser\(\)/gi, currentUserId || 'current-user');
    jql = jql.replace(/now\(\)/gi, new Date().toISOString());
    jql = jql.replace(/startOfDay\(\)/gi, new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    jql = jql.replace(/endOfDay\(\)/gi, new Date(new Date().setHours(23, 59, 59, 999)).toISOString());
    // Parse simple conditions
    const conditions = jql.split(' AND ').map(c => c.trim());
    conditions.forEach(condition => {
        // status = "done"
        if (condition.match(/status\s*=\s*"([^"]+)"/i)) {
            const match = condition.match(/status\s*=\s*"([^"]+)"/i);
            if (match)
                where.status = match[1];
        }
        // type = "bug"
        if (condition.match(/type\s*=\s*"([^"]+)"/i)) {
            const match = condition.match(/type\s*=\s*"([^"]+)"/i);
            if (match)
                where.type = match[1];
        }
        // priority = "high"
        if (condition.match(/priority\s*=\s*"([^"]+)"/i)) {
            const match = condition.match(/priority\s*=\s*"([^"]+)"/i);
            if (match)
                where.priority = match[1];
        }
        // project = "PROJ"
        if (condition.match(/project\s*=\s*"([^"]+)"/i)) {
            const match = condition.match(/project\s*=\s*"([^"]+)"/i);
            if (match)
                where.projectId = match[1];
        }
        // assignee = "user"
        if (condition.match(/assignee\s*=\s*"([^"]+)"/i)) {
            const match = condition.match(/assignee\s*=\s*"([^"]+)"/i);
            if (match)
                where.assigneeId = match[1];
        }
        // status IN ("todo", "in-progress")
        if (condition.match(/status\s+IN\s*\(([^)]+)\)/i)) {
            const match = condition.match(/status\s+IN\s*\(([^)]+)\)/i);
            if (match) {
                const values = match[1].split(',').map(v => v.trim().replace(/"/g, ''));
                where.status = (0, typeorm_1.In)(values);
            }
        }
        // type IN ("bug", "task")
        if (condition.match(/type\s+IN\s*\(([^)]+)\)/i)) {
            const match = condition.match(/type\s+IN\s*\(([^)]+)\)/i);
            if (match) {
                const values = match[1].split(',').map(v => v.trim().replace(/"/g, ''));
                where.type = (0, typeorm_1.In)(values);
            }
        }
        // text ~ "search term"
        if (condition.match(/text\s*~\s*"([^"]+)"/i)) {
            const match = condition.match(/text\s*~\s*"([^"]+)"/i);
            if (match)
                where.summary = (0, typeorm_1.Like)(`%${match[1]}%`);
        }
        // summary ~ "search"
        if (condition.match(/summary\s*~\s*"([^"]+)"/i)) {
            const match = condition.match(/summary\s*~\s*"([^"]+)"/i);
            if (match)
                where.summary = (0, typeorm_1.Like)(`%${match[1]}%`);
        }
        // assignee IS EMPTY
        if (condition.match(/assignee\s+IS\s+EMPTY/i)) {
            where.assigneeId = (0, typeorm_1.IsNull)();
        }
        // assignee IS NOT EMPTY
        if (condition.match(/assignee\s+IS\s+NOT\s+EMPTY/i)) {
            where.assigneeId = (0, typeorm_1.Not)((0, typeorm_1.IsNull)());
        }
    });
    return where;
}
// POST /api/search
// Search issues with JQL or filters
router.post('/', async (req, res) => {
    try {
        const { jql, filters, orderBy = 'createdAt', order = 'DESC', limit = 50, offset = 0 } = req.body;
        let where = {};
        // Parse JQL if provided
        if (jql) {
            where = parseJQL(jql);
        }
        // Apply filters if provided
        if (filters) {
            if (filters.status)
                where.status = filters.status;
            if (filters.type)
                where.type = filters.type;
            if (filters.priority)
                where.priority = filters.priority;
            if (filters.assigneeId)
                where.assigneeId = filters.assigneeId;
            if (filters.projectId)
                where.projectId = filters.projectId;
            if (filters.sprintId)
                where.sprintId = filters.sprintId;
            if (filters.epicLink)
                where.epicLink = filters.epicLink;
            // Text search
            if (filters.text) {
                where.summary = (0, typeorm_1.Like)(`%${filters.text}%`);
            }
            // Date range
            if (filters.createdFrom || filters.createdTo) {
                where.createdAt = (0, typeorm_1.Between)(filters.createdFrom || new Date('2000-01-01'), filters.createdTo || new Date('2100-01-01'));
            }
        }
        const [issues, total] = await issueRepo.findAndCount({
            where,
            order: { [orderBy]: order },
            take: limit,
            skip: offset,
        });
        res.json({
            issues: issues.map(i => ({
                id: i.id,
                key: i.key,
                summary: i.summary,
                description: i.description,
                type: i.type,
                status: i.status,
                priority: i.priority,
                assignee: i.assignee,
                reporter: i.reporter,
                createdAt: i.createdAt,
                updatedAt: i.updatedAt,
                storyPoints: i.storyPoints,
                labels: i.labels,
                sprintId: i.sprintId,
                epicLink: i.epicLink,
            })),
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
        });
    }
    catch (error) {
        console.error('Search failed:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/search/quick
// Quick search by text
router.get('/quick', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        if (!q) {
            return res.json({ issues: [] });
        }
        const issues = await issueRepo.find({
            where: [
                { key: (0, typeorm_1.Like)(`%${q}%`) },
                { summary: (0, typeorm_1.Like)(`%${q}%`) },
            ],
            take: parseInt(limit),
            order: { updatedAt: 'DESC' },
        });
        res.json({
            issues: issues.map(i => ({
                id: i.id,
                key: i.key,
                summary: i.summary,
                type: i.type,
                status: i.status,
            })),
        });
    }
    catch (error) {
        console.error('Quick search failed:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/search/suggestions
// Get search suggestions
router.get('/suggestions', async (req, res) => {
    try {
        const { field, q } = req.query;
        let suggestions = [];
        switch (field) {
            case 'status':
                suggestions = ['todo', 'in-progress', 'in-review', 'done', 'backlog'];
                break;
            case 'type':
                suggestions = ['epic', 'story', 'task', 'bug', 'subtask'];
                break;
            case 'priority':
                suggestions = ['highest', 'high', 'medium', 'low', 'lowest'];
                break;
            default:
                suggestions = [];
        }
        if (q) {
            suggestions = suggestions.filter(s => s.toLowerCase().includes(q.toLowerCase()));
        }
        res.json({ suggestions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/search/validate-jql
// Validate JQL syntax
router.post('/validate-jql', async (req, res) => {
    try {
        const { jql } = req.body;
        // Try to parse JQL
        try {
            const where = parseJQL(jql);
            res.json({ valid: true, where });
        }
        catch (error) {
            res.json({ valid: false, error: error.message });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/search/fields
// Get searchable fields
router.get('/fields', async (req, res) => {
    try {
        const fields = [
            { name: 'status', type: 'select', values: ['todo', 'in-progress', 'in-review', 'done', 'backlog'] },
            { name: 'type', type: 'select', values: ['epic', 'story', 'task', 'bug', 'subtask'] },
            { name: 'priority', type: 'select', values: ['highest', 'high', 'medium', 'low', 'lowest'] },
            { name: 'assignee', type: 'user' },
            { name: 'reporter', type: 'user' },
            { name: 'project', type: 'project' },
            { name: 'sprint', type: 'sprint' },
            { name: 'epic', type: 'epic' },
            { name: 'text', type: 'text' },
            { name: 'summary', type: 'text' },
            { name: 'description', type: 'text' },
            { name: 'labels', type: 'array' },
            { name: 'createdAt', type: 'date' },
            { name: 'updatedAt', type: 'date' },
            { name: 'storyPoints', type: 'number' },
        ];
        res.json({ fields });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// New JQL search endpoint
router.post('/jql', async (req, res) => {
    try {
        const { jql, userId } = req.body;
        const issues = await search_engine_service_1.searchEngineService.executeJQL(jql, userId);
        res.json({ issues, total: issues.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Validate JQL syntax
router.post('/validate', async (req, res) => {
    try {
        const { jql } = req.body;
        const validation = jql_parser_service_1.jqlParserService.validateJQL(jql);
        res.json(validation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
    try {
        const jql = req.query.jql || '';
        const cursor = parseInt(req.query.cursor) || jql.length;
        const suggestions = jql_parser_service_1.jqlParserService.getAutocompleteSuggestions(jql, cursor);
        res.json({ suggestions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Full-text search
router.post('/full-text', async (req, res) => {
    try {
        const { searchText, projectId } = req.body;
        const issues = await search_engine_service_1.searchEngineService.fullTextSearch(searchText, projectId);
        res.json({ issues, total: issues.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
