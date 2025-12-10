import sgMail from '@sendgrid/mail';

export class SendGridService {
  private initialized: boolean = false;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD;
    
    if (apiKey && apiKey.startsWith('SG.')) {
      sgMail.setApiKey(apiKey);
      this.initialized = true;
      console.log('📧 SendGrid Web API initialized');
      console.log('   API Key:', apiKey.substring(0, 20) + '...');
    } else {
      console.warn('⚠️  SendGrid API key not configured');
      console.warn('   Set SENDGRID_API_KEY or SMTP_PASSWORD environment variable');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('SendGrid not initialized - API key missing');
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || 'dhilipwind@gmail.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Ayphen Project Management';

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject,
      html
    };

    try {
      console.log(`📧 Sending email via SendGrid Web API to: ${to}`);
      const response = await sgMail.send(msg);
      console.log(`✅ Email sent successfully!`);
      console.log(`   Status: ${response[0].statusCode}`);
      console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
    } catch (error: any) {
      console.error('❌ SendGrid error:', error);
      if (error.response) {
        console.error('   Status:', error.response.statusCode);
        console.error('   Body:', error.response.body);
      }
      throw error;
    }
  }
}

export const sendGridService = new SendGridService();
