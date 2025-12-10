import { Router } from 'express';
import { EmailService } from '../services/email.service';

const router = Router();
const emailService = new EmailService();

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

    await emailService.sendEmail(
      testEmail,
      '✅ SendGrid Test - Email Working!',
      emailHtml
    );

    console.log(`✅ Test email sent successfully to: ${testEmail}`);

    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Failed to send test email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
