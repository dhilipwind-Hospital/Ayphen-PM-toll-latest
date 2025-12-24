"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const ChatChannel_1 = require("../entities/ChatChannel");
const ChatMessage_1 = require("../entities/ChatMessage");
const ChannelMember_1 = require("../entities/ChannelMember");
const User_1 = require("../entities/User");
const Issue_1 = require("../entities/Issue");
const Project_1 = require("../entities/Project");
const typeorm_1 = require("typeorm");
const websocket_service_1 = require("../services/websocket.service");
const router = (0, express_1.Router)();
const channelRepo = database_1.AppDataSource.getRepository(ChatChannel_1.ChatChannel);
const messageRepo = database_1.AppDataSource.getRepository(ChatMessage_1.ChatMessage);
const memberRepo = database_1.AppDataSource.getRepository(ChannelMember_1.ChannelMember);
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
// GET all channels for user
router.get('/channels', async (req, res) => {
    try {
        const userId = req.query.userId || '1c9d344e-14db-44ec-9dee-3ad8661a0ca0';
        // Get channels where user is a member
        const memberChannels = await memberRepo.find({
            where: { userId },
            relations: ['channel', 'channel.project']
        });
        const channels = await Promise.all(memberChannels.map(async (member) => {
            const channel = member.channel;
            // Get last message
            const lastMessage = await messageRepo.findOne({
                where: { channelId: channel.id },
                order: { createdAt: 'DESC' },
                relations: ['user']
            });
            // Get unread count
            const unreadCount = await messageRepo.count({
                where: {
                    channelId: channel.id,
                    createdAt: member.lastReadAt ? (0, typeorm_1.MoreThan)(member.lastReadAt) : undefined
                }
            });
            // Get member count
            const memberCount = await memberRepo.count({
                where: { channelId: channel.id }
            });
            return {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                projectId: channel.projectId,
                projectName: channel.project?.name,
                description: channel.description,
                isPrivate: channel.isPrivate,
                lastMessage: lastMessage ? {
                    content: lastMessage.content.substring(0, 50),
                    userName: lastMessage.user?.name,
                    timestamp: lastMessage.createdAt
                } : null,
                unreadCount,
                memberCount,
                createdAt: channel.createdAt
            };
        }));
        res.json(channels);
    }
    catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET messages for a channel
router.get('/channels/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const messages = await messageRepo.find({
            where: {
                channelId,
                deletedAt: null
            },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset
        });
        const formattedMessages = messages.reverse().map(msg => ({
            id: msg.id,
            channelId: msg.channelId,
            userId: msg.userId,
            userName: msg.user?.name || 'Unknown',
            userAvatar: msg.user?.avatar,
            content: msg.content,
            messageType: msg.messageType,
            mentions: msg.mentions || [],
            issueLinks: msg.issueLinks || [],
            attachments: msg.attachments || [],
            replyToId: msg.replyToId,
            reactions: msg.reactions || {},
            editedAt: msg.editedAt,
            createdAt: msg.createdAt,
            timestamp: msg.createdAt
        }));
        res.json(formattedMessages);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST send message to channel
router.post('/channels/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { content, userId, mentions, issueLinks, replyToId } = req.body;
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check if user is member of channel
        const membership = await memberRepo.findOne({
            where: { channelId, userId }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this channel' });
        }
        const message = messageRepo.create({
            channelId,
            userId,
            content,
            messageType: 'text',
            mentions: mentions || [],
            issueLinks: issueLinks || [],
            replyToId: replyToId || null
        });
        await messageRepo.save(message);
        // Update last read for sender
        membership.lastReadAt = new Date();
        await memberRepo.save(membership);
        const savedMessage = await messageRepo.findOne({
            where: { id: message.id },
            relations: ['user']
        });
        const messageData = {
            id: savedMessage.id,
            channelId: savedMessage.channelId,
            userId: savedMessage.userId,
            userName: savedMessage.user?.name,
            userAvatar: savedMessage.user?.avatar,
            content: savedMessage.content,
            mentions: savedMessage.mentions || [],
            issueLinks: savedMessage.issueLinks || [],
            timestamp: savedMessage.createdAt
        };
        // Emit real-time event to channel
        if (websocket_service_1.websocketService) {
            websocket_service_1.websocketService.emitToChannel(channelId, 'new_message', messageData);
        }
        res.json(messageData);
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST create new channel
router.post('/channels', async (req, res) => {
    try {
        const { name, type, projectId, description, isPrivate, createdBy, memberIds } = req.body;
        const channel = channelRepo.create({
            name,
            type: type || 'group',
            projectId: projectId || null,
            description: description || null,
            isPrivate: isPrivate || false,
            createdBy
        });
        await channelRepo.save(channel);
        // Add creator as owner
        const ownerMember = memberRepo.create({
            channelId: channel.id,
            userId: createdBy,
            role: 'owner'
        });
        await memberRepo.save(ownerMember);
        // Add other members
        if (memberIds && memberIds.length > 0) {
            const members = memberIds.map((userId) => memberRepo.create({
                channelId: channel.id,
                userId,
                role: 'member'
            }));
            await memberRepo.save(members);
        }
        res.json(channel);
    }
    catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET member suggestions for @ mentions
router.get('/members/suggestions', async (req, res) => {
    try {
        const query = req.query.q || '';
        const projectId = req.query.projectId;
        const channelId = req.query.channelId;
        let users = [];
        if (channelId) {
            // Get members of this channel
            const members = await memberRepo.find({
                where: { channelId },
                relations: ['user']
            });
            users = members.map(m => m.user).filter(u => u);
        }
        else if (projectId) {
            // Get project members
            const project = await projectRepo.findOne({
                where: { id: projectId },
                relations: ['members', 'members.user']
            });
            users = project?.members?.map(m => m.user).filter(u => u) || [];
        }
        else {
            // Get all users
            users = await userRepo.find({ take: 20 });
        }
        // Filter by query
        if (query) {
            users = users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) ||
                u.email.toLowerCase().includes(query.toLowerCase()));
        }
        const suggestions = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            display: u.name
        }));
        res.json(suggestions);
    }
    catch (error) {
        console.error('Error fetching member suggestions:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET issue suggestions for # linking
router.get('/issues/suggestions', async (req, res) => {
    try {
        const query = req.query.q || '';
        const projectId = req.query.projectId;
        let issues = [];
        if (projectId) {
            issues = await issueRepo.find({
                where: { projectId },
                relations: ['project'],
                take: 10,
                order: { createdAt: 'DESC' }
            });
        }
        else {
            issues = await issueRepo.find({
                relations: ['project'],
                take: 10,
                order: { createdAt: 'DESC' }
            });
        }
        // Filter by query
        if (query) {
            issues = issues.filter(i => i.key?.toLowerCase().includes(query.toLowerCase()) ||
                i.summary.toLowerCase().includes(query.toLowerCase()));
        }
        const suggestions = issues.map(i => ({
            id: i.id,
            key: i.key,
            title: i.summary,
            type: i.type,
            status: i.status,
            priority: i.priority,
            projectName: i.project?.name,
            display: `${i.key}: ${i.summary}`
        }));
        res.json(suggestions);
    }
    catch (error) {
        console.error('Error fetching issue suggestions:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST mark messages as read
router.post('/channels/:channelId/read', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req.body;
        const membership = await memberRepo.findOne({
            where: { channelId, userId }
        });
        if (membership) {
            membership.lastReadAt = new Date();
            await memberRepo.save(membership);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET channel members
router.get('/channels/:channelId/members', async (req, res) => {
    try {
        const { channelId } = req.params;
        const members = await memberRepo.find({
            where: { channelId },
            relations: ['user']
        });
        const formattedMembers = members.map(m => ({
            id: m.id,
            userId: m.user?.id,
            userName: m.user?.name,
            userEmail: m.user?.email,
            userAvatar: m.user?.avatar,
            role: m.role,
            joinedAt: m.joinedAt
        }));
        res.json(formattedMembers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST Initialize default channels for a user
router.post('/initialize', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        // Check if user already has channels
        const existingChannels = await memberRepo.count({
            where: { userId }
        });
        if (existingChannels > 0) {
            return res.json({ message: 'Channels already initialized' });
        }
        // Get user's projects
        const user = await userRepo.findOne({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Create General channel
        const generalChannel = channelRepo.create({
            name: 'General',
            type: 'group',
            description: 'General team discussions',
            isPrivate: false,
            createdBy: userId
        });
        await channelRepo.save(generalChannel);
        // Add user to General channel
        const generalMember = memberRepo.create({
            channelId: generalChannel.id,
            userId,
            role: 'owner'
        });
        await memberRepo.save(generalMember);
        // Create Random channel
        const randomChannel = channelRepo.create({
            name: 'Random',
            type: 'group',
            description: 'Off-topic conversations',
            isPrivate: false,
            createdBy: userId
        });
        await channelRepo.save(randomChannel);
        const randomMember = memberRepo.create({
            channelId: randomChannel.id,
            userId,
            role: 'member'
        });
        await memberRepo.save(randomMember);
        // Get all projects and create project channels
        const projects = await projectRepo.find();
        for (const project of projects) {
            const projectChannel = channelRepo.create({
                name: `${project.name}`,
                type: 'project',
                projectId: project.id,
                description: `Discussions for ${project.name}`,
                isPrivate: false,
                createdBy: userId
            });
            await channelRepo.save(projectChannel);
            const projectMember = memberRepo.create({
                channelId: projectChannel.id,
                userId,
                role: 'member'
            });
            await memberRepo.save(projectMember);
        }
        res.json({
            message: 'Channels initialized successfully',
            channelCount: 2 + projects.length
        });
    }
    catch (error) {
        console.error('Error initializing channels:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
