"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const context_hierarchy_service_1 = require("../services/context-hierarchy.service");
const ai_description_prompt_service_1 = require("../services/ai-description-prompt.service");
const ai_duplicate_detector_service_1 = require("../services/ai-duplicate-detector.service");
const axios_1 = __importDefault(require("axios"));
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1';
async function generateAIText(systemPrompt, userPrompt) {
    try {
        const response = await axios_1.default.post(`${CEREBRAS_BASE_URL}/chat/completions`, {
            model: 'llama3.1-8b',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        }, {
            headers: {
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.choices[0].message.content;
    }
    catch (error) {
        if (error.response) {
            console.error('Cerebras API Error:', error.response.status, error.response.data);
        }
        throw error;
    }
}
const router = (0, express_1.Router)();
/**
 * GET /api/ai-description/context
 * Get context for generating issue description
 */
router.get('/context', async (req, res) => {
    try {
        const { projectId, epicId, parentIssueId, issueType } = req.query;
        if (!issueType) {
            return res.status(400).json({ error: 'issueType is required' });
        }
        const context = await context_hierarchy_service_1.contextHierarchyService.getIssueContext({
            projectId: projectId,
            epicId: epicId,
            parentIssueId: parentIssueId,
            issueType: issueType,
        });
        res.json({
            success: true,
            context,
            contextSummary: context_hierarchy_service_1.contextHierarchyService.buildContextSummary(context),
        });
    }
    catch (error) {
        console.error('Error getting context:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/ai-description/generate
 * Generate description suggestions using AI
 */
router.post('/generate', async (req, res) => {
    try {
        const { issueType, issueSummary, userInput, projectId, epicId, parentIssueId, format = 'user-story', } = req.body;
        if (!issueType || !issueSummary || !userInput) {
            return res.status(400).json({
                error: 'issueType, issueSummary, and userInput are required',
            });
        }
        // Get context
        const context = await context_hierarchy_service_1.contextHierarchyService.getIssueContext({
            projectId,
            epicId,
            parentIssueId,
            issueType,
        });
        // Build prompt
        const prompt = ai_description_prompt_service_1.aiDescriptionPromptService.buildPrompt({
            issueType,
            issueSummary,
            userInput,
            context,
            format,
        });
        console.log('🤖 Generating AI description with context...');
        console.log('Issue Type:', issueType);
        console.log('Summary:', issueSummary);
        console.log('User Input:', userInput);
        // Generate variants sequentially to avoid rate limits
        let detailedDesc, conciseDesc, technicalDesc;
        try {
            detailedDesc = await generateAIText('You are an expert Agile project manager. Be detailed and comprehensive.', prompt + '\n\nStyle: Detailed and comprehensive with all possible details.');
        }
        catch (error) {
            console.error('Failed to generate detailed description:', error);
            throw error; // Primary description is required
        }
        try {
            conciseDesc = await generateAIText('You are an expert Agile project manager. Be concise and focused.', prompt + '\n\nStyle: Concise and focused, only essential information.');
        }
        catch (error) {
            console.error('Failed to generate concise description:', error);
            conciseDesc = 'Failed to generate concise version.';
        }
        try {
            technicalDesc = await generateAIText('You are an expert software architect. Be technical and specific.', prompt + '\n\nStyle: Technical and implementation-focused.');
        }
        catch (error) {
            console.error('Failed to generate technical description:', error);
            technicalDesc = 'Failed to generate technical version.';
        }
        const suggestions = [
            {
                id: 1,
                title: 'Detailed & Comprehensive',
                description: detailedDesc,
                style: 'detailed',
                confidence: 0.95,
            },
            {
                id: 2,
                title: 'Concise & Focused',
                description: conciseDesc,
                style: 'concise',
                confidence: 0.92,
            },
            {
                id: 3,
                title: 'Technical & Specific',
                description: technicalDesc,
                style: 'technical',
                confidence: 0.88,
            },
        ];
        res.json({
            success: true,
            suggestions,
            contextUsed: {
                hasProject: !!context.project,
                hasEpic: !!context.epic,
                hasParent: !!context.parentIssue,
                relatedIssuesCount: context.relatedIssues.length,
            },
            metadata: {
                issueType,
                format,
                generatedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('Error generating description:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate description',
            details: error.toString(),
        });
    }
});
/**
 * POST /api/ai-description/quick-generate
 * Quick generation with minimal context (for faster response)
 */
router.post('/quick-generate', async (req, res) => {
    try {
        const { issueType, issueSummary, userInput } = req.body;
        if (!issueType || !issueSummary || !userInput) {
            return res.status(400).json({
                error: 'issueType, issueSummary, and userInput are required',
            });
        }
        const simplePrompt = `Write a clear ${issueType} description for:
Title: "${issueSummary}"
Details: "${userInput}"

Generate a well-structured description that is actionable and clear.`;
        const description = await generateAIText('You are an expert Agile project manager. Generate clear and actionable issue descriptions.', simplePrompt);
        res.json({
            success: true,
            description,
            metadata: {
                issueType,
                generatedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('Error in quick generation:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/ai-description/check-duplicates
 * Check for duplicate issues using AI semantic search
 */
router.post('/check-duplicates', async (req, res) => {
    try {
        const { summary, description, projectId, issueType } = req.body;
        if (!summary || !projectId) {
            return res.status(400).json({
                error: 'summary and projectId are required'
            });
        }
        console.log(`🔍 Checking duplicates for: "${summary}" in project ${projectId}`);
        const result = await ai_duplicate_detector_service_1.aiDuplicateDetector.checkDuplicates(summary, description || '', projectId, issueType);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        console.error('❌ Duplicate check error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            hasDuplicates: false,
            duplicates: [],
            confidence: 0,
            suggestion: 'Error checking for duplicates. You can proceed with creating the issue.'
        });
    }
});
/**
 * POST /api/ai-description/auto-link-duplicate
 * Auto-link issues as duplicates if confidence is high enough
 */
router.post('/auto-link-duplicate', async (req, res) => {
    try {
        const { newIssueId, duplicateIssueId, confidence } = req.body;
        if (!newIssueId || !duplicateIssueId || !confidence) {
            return res.status(400).json({
                error: 'newIssueId, duplicateIssueId, and confidence are required'
            });
        }
        console.log(`🔗 Auto-linking ${newIssueId} to ${duplicateIssueId} (${confidence}% confidence)`);
        const result = await ai_duplicate_detector_service_1.aiDuplicateDetector.autoLinkDuplicates(newIssueId, duplicateIssueId, confidence);
        res.json({
            success: result.success,
            message: result.message
        });
    }
    catch (error) {
        console.error('❌ Auto-link error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
