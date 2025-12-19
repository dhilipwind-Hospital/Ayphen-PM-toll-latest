"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sendgrid_service_1 = require("../services/sendgrid.service");
const router = (0, express_1.Router)();
// Test endpoint to send email
router.post('/send-test-email', async (req, res) => {
    try {
        const { email } = req.body;
        const testEmail = email || 'dhilipwind@gmail.com';
        console.log(`📧 Sending test email to: ${testEmail}`);
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0052CC;">🎉 SendGrid Test Email</h2>
        <p>Hi there,</p>
        <p>This is a test email from your Ayphen Project Management application.</p>
        <p>If you're seeing this, <strong>SendGrid is working correctly!</strong> ✅</p>
        <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px;">
          <p style="margin: 0; color: #0052CC; font-weight: 600;">
            ✅ SMTP Configuration: Working<br>
            ✅ SendGrid API Key: Valid<br>
            ✅ Sender Verification: Complete<br>
            ✅ Email Delivery: Success
          </p>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Sent from: Ayphen Project Management<br>
          Time: ${new Date().toLocaleString()}
        </p>
      </div>
    `;
        await sendgrid_service_1.sendGridService.sendEmail(testEmail, '✅ SendGrid Test - Email Working!', emailHtml);
        console.log(`✅ Test email sent successfully to: ${testEmail}`);
        res.json({
            success: true,
            message: `Test email sent to ${testEmail}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Failed to send test email:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
