"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGridService = exports.SendGridService = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
class SendGridService {
    constructor() {
        this.initialized = false;
        const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD;
        if (apiKey && apiKey.startsWith('SG.')) {
            mail_1.default.setApiKey(apiKey);
            this.initialized = true;
            console.log('📧 SendGrid Web API initialized');
            console.log('   API Key:', apiKey.substring(0, 20) + '...');
        }
        else {
            console.warn('⚠️  SendGrid API key not configured');
            console.warn('   Set SENDGRID_API_KEY or SMTP_PASSWORD environment variable');
        }
    }
    async sendEmail(to, subject, html) {
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
            const response = await mail_1.default.send(msg);
            console.log(`✅ Email sent successfully!`);
            console.log(`   Status: ${response[0].statusCode}`);
            console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
        }
        catch (error) {
            console.error('❌ SendGrid error:', error);
            if (error.response) {
                console.error('   Status:', error.response.statusCode);
                console.error('   Body:', error.response.body);
            }
            throw error;
        }
    }
}
exports.SendGridService = SendGridService;
exports.sendGridService = new SendGridService();
