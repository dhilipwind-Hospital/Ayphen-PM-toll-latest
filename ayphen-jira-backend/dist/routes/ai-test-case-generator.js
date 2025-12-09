"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_test_case_generator_service_1 = require("../services/ai-test-case-generator.service");
const router = (0, express_1.Router)();
/**
 * POST /api/ai-test-case-generator/generate/:issueId
 * Generate test cases for an issue
 */
router.post('/generate/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        console.log(`🧪 Generating test cases for issue: ${issueId}`);
        const result = await ai_test_case_generator_service_1.aiTestCaseGeneratorService.generateTestCases(issueId);
        res.json({
            success: true,
            data: result,
            message: `Generated ${result.testCases.length} test cases with ${result.coverage.total} total coverage`
        });
    }
    catch (error) {
        console.error('❌ Test case generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate test cases'
        });
    }
});
/**
 * POST /api/ai-test-case-generator/generate-api-tests
 * Generate API test cases for an endpoint
 */
router.post('/generate-api-tests', async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint || !endpoint.method || !endpoint.path) {
            return res.status(400).json({
                success: false,
                error: 'endpoint object with method and path is required'
            });
        }
        console.log(`🧪 Generating API tests for: ${endpoint.method} ${endpoint.path}`);
        const testCases = await ai_test_case_generator_service_1.aiTestCaseGeneratorService.generateAPITests(endpoint);
        res.json({
            success: true,
            data: { testCases },
            message: `Generated ${testCases.length} API test cases`
        });
    }
    catch (error) {
        console.error('❌ API test generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate API tests'
        });
    }
});
exports.default = router;
