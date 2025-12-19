"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
// Configure multer for avatar uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/avatars';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});
// GET all users (with optional project filtering)
router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (projectId) {
            // Enterprise-grade: Only fetch users belonging to the specific project
            const users = await userRepo.createQueryBuilder('user')
                .innerJoin('project_members', 'pm', 'pm.userId = user.id')
                .where('pm.projectId = :projectId', { projectId })
                .select(['user.id', 'user.name', 'user.email', 'user.avatar', 'user.role', 'user.isActive']) // Select only necessary fields for privacy
                .getMany();
            return res.json(users);
        }
        // Fallback: Return all users (Note: In a strict enterprise system, this should likely be restricted to Admins only)
        const users = await userRepo.find({
            select: ['id', 'name', 'email', 'avatar', 'role', 'isActive'] // Restrict fields
        });
        res.json(users);
    }
    catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// GET user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// POST create user
router.post('/', async (req, res) => {
    try {
        const user = userRepo.create(req.body);
        const savedUser = await userRepo.save(user);
        res.status(201).json(savedUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// PATCH update user
router.patch('/:id', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Update user fields
        Object.assign(user, req.body);
        const updatedUser = await userRepo.save(user);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Failed to update user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// PUT update user (alternative)
router.put('/:id', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        Object.assign(user, req.body);
        const updatedUser = await userRepo.save(user);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Failed to update user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// PATCH update profile
router.patch('/:id/profile', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { name, email, jobTitle, department, location, timezone } = req.body;
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (jobTitle)
            user.jobTitle = jobTitle;
        if (department)
            user.department = department;
        if (location)
            user.location = location;
        if (timezone)
            user.timezone = timezone;
        const updatedUser = await userRepo.save(user);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Failed to update profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
// POST change password
router.post('/:id/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password required' });
        }
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify current password
        const isValid = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        // Hash new password
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await userRepo.save(user);
        res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Failed to change password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});
// GET user preferences
router.get('/:id/preferences', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            language: user.language || 'en',
            dateFormat: user.dateFormat || 'MM/DD/YYYY',
            timeFormat: user.timeFormat || '12h',
            timezone: user.timezone || 'UTC',
            theme: user.theme || 'light',
            notificationsEnabled: user.notificationsEnabled !== false,
        });
    }
    catch (error) {
        console.error('Failed to fetch preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});
// PUT update preferences
router.put('/:id/preferences', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { language, dateFormat, timeFormat, timezone, theme, notificationsEnabled } = req.body;
        if (language)
            user.language = language;
        if (dateFormat)
            user.dateFormat = dateFormat;
        if (timeFormat)
            user.timeFormat = timeFormat;
        if (timezone)
            user.timezone = timezone;
        if (theme)
            user.theme = theme;
        if (notificationsEnabled !== undefined)
            user.notificationsEnabled = notificationsEnabled;
        const updatedUser = await userRepo.save(user);
        res.json({
            language: updatedUser.language,
            dateFormat: updatedUser.dateFormat,
            timeFormat: updatedUser.timeFormat,
            timezone: updatedUser.timezone,
            theme: updatedUser.theme,
            notificationsEnabled: updatedUser.notificationsEnabled,
        });
    }
    catch (error) {
        console.error('Failed to update preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});
// POST upload avatar
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            // Clean up uploaded file
            fs_1.default.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'User not found' });
        }
        // Delete old avatar if exists
        if (user.avatar && user.avatar.startsWith('/uploads/')) {
            const oldAvatarPath = path_1.default.join(process.cwd(), user.avatar);
            if (fs_1.default.existsSync(oldAvatarPath)) {
                fs_1.default.unlinkSync(oldAvatarPath);
            }
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        user.avatar = avatarUrl;
        const updatedUser = await userRepo.save(user);
        res.json({ avatar: updatedUser.avatar });
    }
    catch (error) {
        console.error('Failed to upload avatar:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});
// DELETE avatar
router.delete('/:id/avatar', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Delete avatar file if exists
        if (user.avatar && user.avatar.startsWith('/uploads/')) {
            const avatarPath = path_1.default.join(process.cwd(), user.avatar);
            if (fs_1.default.existsSync(avatarPath)) {
                fs_1.default.unlinkSync(avatarPath);
            }
        }
        // Reset to default avatar
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1890ff&color=fff`;
        user.avatar = defaultAvatar;
        await userRepo.save(user);
        res.json({ success: true, avatar: defaultAvatar });
    }
    catch (error) {
        console.error('Failed to delete avatar:', error);
        res.status(500).json({ error: 'Failed to delete avatar' });
    }
});
// POST deactivate user
router.post('/:id/deactivate', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isActive = false;
        await userRepo.save(user);
        res.json({ success: true, message: 'User deactivated successfully' });
    }
    catch (error) {
        console.error('Failed to deactivate user:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});
// POST activate user
router.post('/:id/activate', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isActive = true;
        await userRepo.save(user);
        res.json({ success: true, message: 'User activated successfully' });
    }
    catch (error) {
        console.error('Failed to activate user:', error);
        res.status(500).json({ error: 'Failed to activate user' });
    }
});
// GET user settings
router.get('/:id/settings', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            emailNotifications: user.emailNotifications !== false,
            desktopNotifications: user.desktopNotifications !== false,
            pushNotifications: user.pushNotifications !== false,
            notificationFrequency: user.notificationFrequency || 'instant',
            twoFactorEnabled: user.twoFactorEnabled || false,
            keyboardShortcutsEnabled: user.keyboardShortcutsEnabled !== false,
        });
    }
    catch (error) {
        console.error('Failed to fetch settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});
// PUT update settings
router.put('/:id/settings', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { emailNotifications, desktopNotifications, pushNotifications, notificationFrequency, twoFactorEnabled, keyboardShortcutsEnabled } = req.body;
        if (emailNotifications !== undefined)
            user.emailNotifications = emailNotifications;
        if (desktopNotifications !== undefined)
            user.desktopNotifications = desktopNotifications;
        if (pushNotifications !== undefined)
            user.pushNotifications = pushNotifications;
        if (notificationFrequency)
            user.notificationFrequency = notificationFrequency;
        if (twoFactorEnabled !== undefined)
            user.twoFactorEnabled = twoFactorEnabled;
        if (keyboardShortcutsEnabled !== undefined)
            user.keyboardShortcutsEnabled = keyboardShortcutsEnabled;
        await userRepo.save(user);
        res.json({
            emailNotifications: user.emailNotifications,
            desktopNotifications: user.desktopNotifications,
            pushNotifications: user.pushNotifications,
            notificationFrequency: user.notificationFrequency,
            twoFactorEnabled: user.twoFactorEnabled,
            keyboardShortcutsEnabled: user.keyboardShortcutsEnabled,
        });
    }
    catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await userRepo.remove(user);
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
