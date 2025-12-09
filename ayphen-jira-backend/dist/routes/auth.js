"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const redis_service_1 = require("../services/redis.service");
const email_service_1 = require("../services/email.service");
const router = (0, express_1.Router)();
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
const emailService = new email_service_1.EmailService();
const SALT_ROUNDS = 10;
const SESSION_TTL = 86400; // 24 hours
// In-memory session store (fallback when Redis unavailable)
const sessions = new Map();
const resetTokens = new Map();
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
        const hashedPassword = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        // Create user
        const user = userRepo.create({
            email,
            password: hashedPassword,
            name,
            role: 'user',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1890ff&color=fff`,
        });
        await userRepo.save(user);
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
        const saved = await redis_service_1.redisService.setSession(sessionId, sessionData, SESSION_TTL);
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
    }
    catch (error) {
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
        // Check password with bcrypt
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
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
        const saved = await redis_service_1.redisService.setSession(sessionId, sessionData, SESSION_TTL);
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
    }
    catch (error) {
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
            const deleted = await redis_service_1.redisService.deleteSession(sessionId);
            if (!deleted) {
                sessions.delete(sessionId);
            }
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
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
        let session = await redis_service_1.redisService.getSession(sessionId);
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenHash = await bcrypt_1.default.hash(resetToken, 10);
        // Store token (Redis first, fallback to memory)
        const saved = await redis_service_1.redisService.setPasswordResetToken(email, resetTokenHash, 3600); // 1 hour
        if (!saved) {
            resetTokens.set(email, resetTokenHash);
            // Auto-expire from memory after 1 hour
            setTimeout(() => resetTokens.delete(email), 3600000);
        }
        // Send email
        const resetLink = `http://localhost:1500/reset-password?token=${resetToken}&email=${email}`;
        await emailService.sendEmail(email, 'Password Reset Request', `Click here to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`);
        res.json({ message: 'If an account exists, a reset link has been sent' });
    }
    catch (error) {
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
        let storedToken = await redis_service_1.redisService.getPasswordResetToken(email);
        if (!storedToken) {
            storedToken = resetTokens.get(email) || null;
        }
        if (!storedToken) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        // Verify token
        const isValid = await bcrypt_1.default.compare(token, storedToken);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid reset token' });
        }
        // Update password
        const user = await userRepo.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.password = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        await userRepo.save(user);
        // Delete reset token
        await redis_service_1.redisService.deletePasswordResetToken(email);
        resetTokens.delete(email);
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});
exports.default = router;
