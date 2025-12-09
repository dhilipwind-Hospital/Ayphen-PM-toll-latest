import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

const router = Router();
const userRepo = AppDataSource.getRepository(User);

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await userRepo.find();
    res.json(users);
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const user = userRepo.create(req.body);
    const savedUser = await userRepo.save(user);
    res.status(201).json(savedUser);
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
    if (name) user.name = name;
    if (email) user.email = email;
    if (jobTitle) user.jobTitle = jobTitle;
    if (department) user.department = department;
    if (location) user.location = location;
    if (timezone) user.timezone = timezone;
    
    const updatedUser = await userRepo.save(user);
    res.json(updatedUser);
  } catch (error) {
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
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await userRepo.save(user);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
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
  } catch (error) {
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
    if (language) user.language = language;
    if (dateFormat) user.dateFormat = dateFormat;
    if (timeFormat) user.timeFormat = timeFormat;
    if (timezone) user.timezone = timezone;
    if (theme) user.theme = theme;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    
    const updatedUser = await userRepo.save(user);
    res.json({
      language: updatedUser.language,
      dateFormat: updatedUser.dateFormat,
      timeFormat: updatedUser.timeFormat,
      timezone: updatedUser.timezone,
      theme: updatedUser.theme,
      notificationsEnabled: updatedUser.notificationsEnabled,
    });
  } catch (error) {
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
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete old avatar if exists
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    const updatedUser = await userRepo.save(user);
    
    res.json({ avatar: updatedUser.avatar });
  } catch (error) {
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
      const avatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    // Reset to default avatar
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1890ff&color=fff`;
    user.avatar = defaultAvatar;
    await userRepo.save(user);
    
    res.json({ success: true, avatar: defaultAvatar });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
    
    const {
      emailNotifications,
      desktopNotifications,
      pushNotifications,
      notificationFrequency,
      twoFactorEnabled,
      keyboardShortcutsEnabled
    } = req.body;
    
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (desktopNotifications !== undefined) user.desktopNotifications = desktopNotifications;
    if (pushNotifications !== undefined) user.pushNotifications = pushNotifications;
    if (notificationFrequency) user.notificationFrequency = notificationFrequency;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
    if (keyboardShortcutsEnabled !== undefined) user.keyboardShortcutsEnabled = keyboardShortcutsEnabled;
    
    await userRepo.save(user);
    
    res.json({
      emailNotifications: user.emailNotifications,
      desktopNotifications: user.desktopNotifications,
      pushNotifications: user.pushNotifications,
      notificationFrequency: user.notificationFrequency,
      twoFactorEnabled: user.twoFactorEnabled,
      keyboardShortcutsEnabled: user.keyboardShortcutsEnabled,
    });
  } catch (error) {
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
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
