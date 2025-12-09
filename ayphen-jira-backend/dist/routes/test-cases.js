"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const test_case_service_1 = require("../services/test-case.service");
const router = (0, express_1.Router)();
// Get test cases by issue ID
router.get('/issue/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const testCases = await test_case_service_1.testCaseService.getByIssueId(issueId);
        res.json({ success: true, data: testCases });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Create a new test case
router.post('/', async (req, res) => {
    try {
        const testCase = await test_case_service_1.testCaseService.create(req.body);
        res.json({ success: true, data: testCase });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Create multiple test cases (e.g., from AI generation)
router.post('/batch', async (req, res) => {
    try {
        const testCases = await test_case_service_1.testCaseService.createMultiple(req.body.testCases);
        res.json({ success: true, data: testCases });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Update test case status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const testCase = await test_case_service_1.testCaseService.updateStatus(id, status);
        res.json({ success: true, data: testCase });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Delete test case
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await test_case_service_1.testCaseService.delete(id);
        res.json({ success: true, message: 'Test case deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
