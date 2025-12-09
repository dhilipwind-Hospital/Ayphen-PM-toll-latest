"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const description_templates_service_1 = require("../services/description-templates.service");
const router = (0, express_1.Router)();
/**
 * GET /api/templates
 * Get all templates with optional filters
 */
router.get('/', (req, res) => {
    try {
        const { issueType, category, tags, userId, teamId } = req.query;
        const filters = {};
        if (issueType)
            filters.issueType = issueType;
        if (category)
            filters.category = category;
        if (tags)
            filters.tags = tags.split(',');
        if (userId)
            filters.userId = userId;
        if (teamId)
            filters.teamId = teamId;
        const templates = description_templates_service_1.descriptionTemplates.getTemplates(filters);
        res.json({
            success: true,
            count: templates.length,
            templates
        });
    }
    catch (error) {
        console.error('❌ Error getting templates:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/templates/:id
 * Get specific template by ID
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const template = description_templates_service_1.descriptionTemplates.getTemplate(id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json({
            success: true,
            template
        });
    }
    catch (error) {
        console.error('❌ Error getting template:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/templates/:id/fill
 * Fill template with AI-generated content
 */
router.post('/:id/fill', async (req, res) => {
    try {
        const { id } = req.params;
        const { summary, context } = req.body;
        if (!summary) {
            return res.status(400).json({ error: 'Summary is required' });
        }
        console.log(`🤖 Filling template ${id} for: "${summary}"`);
        const filledTemplate = await description_templates_service_1.descriptionTemplates.fillTemplate(id, summary, context);
        res.json({
            success: true,
            filledTemplate
        });
    }
    catch (error) {
        console.error('❌ Error filling template:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/templates
 * Create custom template
 */
router.post('/', (req, res) => {
    try {
        const { template, userId } = req.body;
        if (!template || !userId) {
            return res.status(400).json({ error: 'Template and userId are required' });
        }
        // Validate template structure
        if (!template.name || !template.issueTypes || !template.sections) {
            return res.status(400).json({
                error: 'Template must have name, issueTypes, and sections'
            });
        }
        const newTemplate = description_templates_service_1.descriptionTemplates.createTemplate(template, userId);
        res.json({
            success: true,
            template: newTemplate
        });
    }
    catch (error) {
        console.error('❌ Error creating template:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * PUT /api/templates/:id
 * Update template
 */
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { updates } = req.body;
        if (!updates) {
            return res.status(400).json({ error: 'Updates are required' });
        }
        const success = description_templates_service_1.descriptionTemplates.updateTemplate(id, updates);
        if (!success) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json({
            success: true,
            message: 'Template updated successfully'
        });
    }
    catch (error) {
        console.error('❌ Error updating template:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * DELETE /api/templates/:id
 * Delete template
 */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const success = description_templates_service_1.descriptionTemplates.deleteTemplate(id, userId);
        if (!success) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    }
    catch (error) {
        console.error('❌ Error deleting template:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/templates/:id/rate
 * Rate template
 */
router.post('/:id/rate', (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        if (rating === undefined || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        const success = description_templates_service_1.descriptionTemplates.rateTemplate(id, rating);
        if (!success) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json({
            success: true,
            message: 'Template rated successfully'
        });
    }
    catch (error) {
        console.error('❌ Error rating template:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/templates/popular
 * Get popular templates
 */
router.get('/stats/popular', (req, res) => {
    try {
        const { limit } = req.query;
        const limitNum = limit ? parseInt(limit) : 5;
        const templates = description_templates_service_1.descriptionTemplates.getPopularTemplates(limitNum);
        res.json({
            success: true,
            templates
        });
    }
    catch (error) {
        console.error('❌ Error getting popular templates:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/templates/search
 * Search templates
 */
router.get('/search/query', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter q is required' });
        }
        const templates = description_templates_service_1.descriptionTemplates.searchTemplates(q);
        res.json({
            success: true,
            count: templates.length,
            templates
        });
    }
    catch (error) {
        console.error('❌ Error searching templates:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
