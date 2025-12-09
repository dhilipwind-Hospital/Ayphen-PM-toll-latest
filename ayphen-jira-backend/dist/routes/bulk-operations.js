"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
// Bulk update issues
router.post('/update', async (req, res) => {
    try {
        const { issueIds, updates } = req.body;
        if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
            return res.status(400).json({ error: 'issueIds array is required' });
        }
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'updates object is required' });
        }
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // Find all issues
        const issues = await issueRepo.find({
            where: { id: (0, typeorm_1.In)(issueIds) }
        });
        if (issues.length === 0) {
            return res.status(404).json({ error: 'No issues found' });
        }
        // Update each issue
        const updatedIssues = await Promise.all(issues.map(async (issue) => {
            Object.assign(issue, updates);
            return await issueRepo.save(issue);
        }));
        res.json({
            success: true,
            updated: updatedIssues.length,
            issues: updatedIssues
        });
    }
    catch (error) {
        console.error('Error bulk updating issues:', error);
        res.status(500).json({ error: 'Failed to bulk update issues' });
    }
});
// Bulk delete issues
router.post('/delete', async (req, res) => {
    try {
        const { issueIds } = req.body;
        if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
            return res.status(400).json({ error: 'issueIds array is required' });
        }
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // Find all issues
        const issues = await issueRepo.find({
            where: { id: (0, typeorm_1.In)(issueIds) }
        });
        if (issues.length === 0) {
            return res.status(404).json({ error: 'No issues found' });
        }
        // Delete all issues
        await issueRepo.remove(issues);
        res.json({
            success: true,
            deleted: issues.length
        });
    }
    catch (error) {
        console.error('Error bulk deleting issues:', error);
        res.status(500).json({ error: 'Failed to bulk delete issues' });
    }
});
// Bulk move to sprint
router.post('/move-to-sprint', async (req, res) => {
    try {
        const { issueIds, sprintId } = req.body;
        if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
            return res.status(400).json({ error: 'issueIds array is required' });
        }
        if (!sprintId) {
            return res.status(400).json({ error: 'sprintId is required' });
        }
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // Find all issues
        const issues = await issueRepo.find({
            where: { id: (0, typeorm_1.In)(issueIds) }
        });
        if (issues.length === 0) {
            return res.status(404).json({ error: 'No issues found' });
        }
        // Update sprint for all issues
        const updatedIssues = await Promise.all(issues.map(async (issue) => {
            issue.sprintId = sprintId;
            return await issueRepo.save(issue);
        }));
        res.json({
            success: true,
            moved: updatedIssues.length,
            issues: updatedIssues
        });
    }
    catch (error) {
        console.error('Error bulk moving issues:', error);
        res.status(500).json({ error: 'Failed to bulk move issues' });
    }
});
// Bulk assign
router.post('/assign', async (req, res) => {
    try {
        const { issueIds, assigneeId } = req.body;
        if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
            return res.status(400).json({ error: 'issueIds array is required' });
        }
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // Find all issues
        const issues = await issueRepo.find({
            where: { id: (0, typeorm_1.In)(issueIds) }
        });
        if (issues.length === 0) {
            return res.status(404).json({ error: 'No issues found' });
        }
        // Update assignee for all issues
        const updatedIssues = await Promise.all(issues.map(async (issue) => {
            issue.assigneeId = assigneeId;
            return await issueRepo.save(issue);
        }));
        res.json({
            success: true,
            assigned: updatedIssues.length,
            issues: updatedIssues
        });
    }
    catch (error) {
        console.error('Error bulk assigning issues:', error);
        res.status(500).json({ error: 'Failed to bulk assign issues' });
    }
});
// Bulk add labels
router.post('/add-labels', async (req, res) => {
    try {
        const { issueIds, labels } = req.body;
        if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
            return res.status(400).json({ error: 'issueIds array is required' });
        }
        if (!labels || !Array.isArray(labels) || labels.length === 0) {
            return res.status(400).json({ error: 'labels array is required' });
        }
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        // Find all issues
        const issues = await issueRepo.find({
            where: { id: (0, typeorm_1.In)(issueIds) }
        });
        if (issues.length === 0) {
            return res.status(404).json({ error: 'No issues found' });
        }
        // Add labels to all issues
        const updatedIssues = await Promise.all(issues.map(async (issue) => {
            const existingLabels = issue.labels || [];
            const newLabels = [...new Set([...existingLabels, ...labels])];
            issue.labels = newLabels;
            return await issueRepo.save(issue);
        }));
        res.json({
            success: true,
            updated: updatedIssues.length,
            issues: updatedIssues
        });
    }
    catch (error) {
        console.error('Error bulk adding labels:', error);
        res.status(500).json({ error: 'Failed to bulk add labels' });
    }
});
exports.default = router;
