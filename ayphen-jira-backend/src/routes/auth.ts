import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { redisService } from '../services/redis.service';
import { EmailService } from '../services/email.service';
import { sendGridService } from '../services/sendgrid.service';

const router = Router();
const userRepo = AppDataSource.getRepository(User);
const emailService = new EmailService();

const SALT_ROUNDS = 10;
const SESSION_TTL = 86400; // 24 hours

// In-memory session store (fallback when Redis unavailable)
const sessions = new Map<string, any>();
const resetTokens = new Map<string, string>();

// GET /api/auth/env-check - Check if environment variables are set
router.get('/env-check', (req, res) => {
  const envStatus = {
    FRONTEND_URL: process.env.FRONTEND_URL ? '✅ Set' : '❌ Not set',
    SMTP_HOST: process.env.SMTP_HOST ? '✅ Set' : '❌ Not set',
    SMTP_USER: process.env.SMTP_USER ? '✅ Set' : '❌ Not set',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set',
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL ? '✅ Set' : '❌ Not set',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
    values: {
      FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'NOT SET',
    }
  };
  res.json(envStatus);
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create user
    const user = userRepo.create({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1890ff&color=fff`,
      isVerified: false, // Explicitly set to false for new users
      verificationToken,
    });
    
    await userRepo.save(user);
    console.log(`✅ User registered: ${email} (unverified)`);

    // Send verification email in background (non-blocking)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:1600';
    const verifyLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0052CC;">Welcome to Ayphen Project Management! 🎉</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for signing up! Please verify your email address to get started.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verifyLink}" 
             style="background: #0052CC; color: white; padding: 14px 32px; 
                    text-decoration: none; border-radius: 4px; display: inline-block; 
                    font-weight: 600; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verifyLink}" style="color: #0052CC; word-break: break-all;">${verifyLink}</a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `;
    
    // Send email asynchronously without blocking the response using SendGrid Web API
    sendGridService.sendEmail(
      email,
      'Verify your email address - Ayphen Project Management',
      emailHtml
    ).then(() => {
      console.log(`📧 Verification email sent to: ${email}`);
    }).catch((emailError) => {
      console.error('Failed to send verification email:', emailError);
      // Fallback to SMTP if SendGrid fails
      emailService.sendEmail(email, 'Verify your email address - Ayphen Project Management', emailHtml)
        .catch(e => console.error('SMTP fallback also failed:', e));
    });
    
    // Respond immediately without waiting for email
    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      email: user.email,
      requiresVerification: true,
    });
  } catch (error: any) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check verification status
    // Hard-enforced: Unverified users cannot login
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Email not verified', 
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email 
      });
    }
    
    // Check password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    const sessionId = `session_${Date.now()}_${Math.random()}`;
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: new Date(),
    };
    
    // Try Redis first, fallback to memory
    const saved = await redisService.setSession(sessionId, sessionData, SESSION_TTL);
    if (!saved) {
      sessions.set(sessionId, sessionData);
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      sessionId,
    });
  } catch (error: any) {
    console.error('Login failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (sessionId) {
      // Try Redis first, fallback to memory
      const deleted = await redisService.deleteSession(sessionId);
      if (!deleted) {
        sessions.delete(sessionId);
      }
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Try Redis first, fallback to memory
    let session = await redisService.getSession(sessionId);
    if (!session) {
      session = sessions.get(sessionId);
    }
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const user = await userRepo.findOne({ where: { id: session.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/users (for demo)
router.get('/users', async (req, res) => {
  try {
    const users = await userRepo.find();
    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists, a reset link has been sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    
    // Store token (Redis first, fallback to memory)
    const saved = await redisService.setPasswordResetToken(email, resetTokenHash, 3600); // 1 hour
    if (!saved) {
      resetTokens.set(email, resetTokenHash);
      // Auto-expire from memory after 1 hour
      setTimeout(() => resetTokens.delete(email), 3600000);
    }
    
    // Send email
    const resetLink = `http://localhost:1500/reset-password?token=${resetToken}&email=${email}`;
    await emailService.sendEmail(
      email,
      'Password Reset Request',
      `Click here to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`
    );
    
    res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required' });
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Get stored token
    let storedToken = await redisService.getPasswordResetToken(email);
    if (!storedToken) {
      storedToken = resetTokens.get(email) || null;
    }
    
    if (!storedToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Verify token
    const isValid = await bcrypt.compare(token, storedToken);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }
    
    // Update password
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepo.save(user);
    
    // Delete reset token
    await redisService.deletePasswordResetToken(email);
    resetTokens.delete(email);
    
    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with this token
    // Note: verificationToken is select: false by default, so we need to explicitly select it if we query by it
    // But typeorm query builder is better here
    const user = await userRepo.createQueryBuilder('user')
      .addSelect('user.verificationToken')
      .where('user.verificationToken = :token', { token })
      .getOne();

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = null as any; // Clear token
    await userRepo.save(user);

    res.json({ message: 'Email verified successfully', user });
  } catch (error: any) {
    console.error('Verification failed:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await userRepo.save(user);

    // Send email with proper HTML template
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:1600';
    const verifyLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0052CC;">Verify Your Email Address</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Please verify your email address to access Ayphen Project Management.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verifyLink}" 
             style="background: #0052CC; color: white; padding: 14px 32px; 
                    text-decoration: none; border-radius: 4px; display: inline-block; 
                    font-weight: 600; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verifyLink}" style="color: #0052CC; word-break: break-all;">${verifyLink}</a>
        </p>
      </div>
    `;
    
    // Use SendGrid Web API with SMTP fallback
    try {
      await sendGridService.sendEmail(
        email,
        'Verify your email address - Ayphen Project Management',
        emailHtml
      );
      console.log(`📧 Verification email resent to: ${email} (SendGrid)`);
    } catch (sendGridError) {
      console.error('SendGrid failed, trying SMTP fallback:', sendGridError);
      await emailService.sendEmail(
        email,
        'Verify your email address - Ayphen Project Management',
        emailHtml
      );
      console.log(`📧 Verification email resent to: ${email} (SMTP)`);
    }

    res.json({ message: 'Verification email sent' });
  } catch (error: any) {
    console.error('Resend verification failed:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

