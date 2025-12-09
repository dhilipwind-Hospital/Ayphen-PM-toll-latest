"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const router = (0, express_1.Router)();
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
// In-memory storage (replace with database in production)
const channels = new Map();
const messages = new Map();
// Initialize default channels
const initChannels = () => {
    if (channels.size === 0) {
        channels.set('general', {
            id: 'general',
            name: 'General',
            type: 'project',
            members: [],
            lastMessage: '',
            unreadCount: 0,
        });
        messages.set('general', []);
    }
};
// GET all channels
router.get('/channels', async (req, res) => {
    try {
        initChannels();
        const channelList = Array.from(channels.values());
        res.json(channelList);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET messages for a channel
router.get('/channels/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;
        initChannels();
        const channelMessages = messages.get(channelId) || [];
        res.json(channelMessages);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST send message to channel
router.post('/channels/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { content } = req.body;
        // Get user from localStorage (passed in request body)
        const userId = req.body.userId || '1c9d344e-14db-44ec-9dee-3ad8661a0ca0';
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        initChannels();
        const message = {
            id: `msg_${Date.now()}_${Math.random()}`,
            channelId,
            userId: user.id,
            userName: user.name,
            content,
            timestamp: new Date(),
        };
        const channelMessages = messages.get(channelId) || [];
        channelMessages.push(message);
        messages.set(channelId, channelMessages);
        // Update channel last message
        const channel = channels.get(channelId);
        if (channel) {
            channel.lastMessage = content.substring(0, 50);
            channels.set(channelId, channel);
        }
        res.json(message);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST create new channel
router.post('/channels', async (req, res) => {
    try {
        const { name, type, members } = req.body;
        const channelId = `channel_${Date.now()}`;
        const channel = {
            id: channelId,
            name,
            type: type || 'group',
            members: members || [],
            lastMessage: '',
            unreadCount: 0,
        };
        channels.set(channelId, channel);
        messages.set(channelId, []);
        res.json(channel);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
