"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_to_issue_service_1 = require("../services/email-to-issue.service");
const router = (0, express_1.Router)();
/**
 * POST /api/email-to-issue/process
 * Process a single email and create issue
 */
router.post('/process', async (req, res) => {
    try {
        const { email, projectId } = req.body;
        if (!email || !email.from || !email.subject) {
            return res.status(400).json({
                success: false,
                error: 'Email data is required (from, subject, body)'
            });
        }
        console.log(`📧 Processing email from: ${email.from}`);
        const issue = await email_to_issue_service_1.emailToIssueService.processEmail(email, projectId);
        res.json({
            success: true,
            data: {
                issue: {
                    id: issue.id,
                    key: issue.key,
                    summary: issue.summary,
                    type: issue.type,
                    priority: issue.priority,
                    assigneeId: issue.assigneeId,
                    labels: issue.labels
                }
            },
            message: `Issue ${issue.key} created from email`
        });
    }
    catch (error) {
        console.error('❌ Email processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process email'
        });
    }
});
/**
 * POST /api/email-to-issue/bulk-process
 * Process multiple emails
 */
router.post('/bulk-process', async (req, res) => {
    try {
        const { emails, projectId } = req.body;
        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'emails array is required'
            });
        }
        console.log(`📧 Bulk processing ${emails.length} emails`);
        const issues = await email_to_issue_service_1.emailToIssueService.processEmails(emails, projectId);
        res.json({
            success: true,
            data: {
                total: emails.length,
                created: issues.length,
                issues: issues.map(i => ({
                    id: i.id,
                    key: i.key,
                    summary: i.summary
                }))
            },
            message: `Created ${issues.length} issues from ${emails.length} emails`
        });
    }
    catch (error) {
        console.error('❌ Bulk email processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process emails'
        });
    }
});
/**
 * POST /api/email-to-issue/webhook
 * Webhook endpoint for email services
 */
router.post('/webhook', async (req, res) => {
    try {
        // Parse webhook payload (format depends on email provider)
        const emailData = req.body;
        console.log(`📧 Webhook received from email provider`);
        const issue = await email_to_issue_service_1.emailToIssueService.processEmail(emailData);
        res.json({
            success: true,
            data: { issueKey: issue.key },
            message: 'Email processed successfully'
        });
    }
    catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process webhook'
        });
    }
});
exports.default = router;
