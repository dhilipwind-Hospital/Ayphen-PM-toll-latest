"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = exports.WebSocketService = void 0;
exports.initializeWebSocket = initializeWebSocket;
const socket_io_1 = require("socket.io");
const database_1 = require("../config/database");
const Notification_1 = require("../entities/Notification");
const UserPresence_1 = require("../entities/UserPresence");
const User_1 = require("../entities/User");
class WebSocketService {
    constructor(httpServer) {
        this.userSockets = new Map(); // userId -> socketIds[]
        this.socketUsers = new Map(); // socketId -> userId
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || 'http://localhost:1500',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            // Authentication
            socket.on('authenticate', async (userId) => {
                await this.handleAuthentication(socket, userId);
            });
            // Join project room
            socket.on('join_project', (projectId) => {
                socket.join(`project:${projectId}`);
                console.log(`👥 User joined project room: ${projectId}`);
            });
            // Leave project room
            socket.on('leave_project', (projectId) => {
                socket.leave(`project:${projectId}`);
                console.log(`👋 User left project room: ${projectId}`);
            });
            // Join issue room (for real-time collaboration)
            socket.on('join_issue', async (data) => {
                socket.join(`issue:${data.issueId}`);
                await this.updateUserPresence(data.userId, data.issueId, 'online');
                // Notify others in the room
                socket.to(`issue:${data.issueId}`).emit('user_joined_issue', {
                    userId: data.userId,
                    issueId: data.issueId,
                });
                // Send current viewers to the new user
                const viewers = await this.getIssueViewers(data.issueId);
                socket.emit('issue_viewers', { issueId: data.issueId, viewers });
            });
            // Leave issue room
            socket.on('leave_issue', async (data) => {
                socket.leave(`issue:${data.issueId}`);
                await this.updateUserPresence(data.userId, null, 'online');
                socket.to(`issue:${data.issueId}`).emit('user_left_issue', {
                    userId: data.userId,
                    issueId: data.issueId,
                });
            });
            // Typing indicator
            socket.on('typing_start', (data) => {
                socket.to(`issue:${data.issueId}`).emit('user_typing', {
                    userId: data.userId,
                    userName: data.userName,
                    issueId: data.issueId,
                });
            });
            socket.on('typing_stop', (data) => {
                socket.to(`issue:${data.issueId}`).emit('user_stopped_typing', {
                    userId: data.userId,
                    issueId: data.issueId,
                });
            });
            // Mark notification as read
            socket.on('mark_notification_read', async (notificationId) => {
                await this.markNotificationAsRead(notificationId);
            });
            // Mark all notifications as read
            socket.on('mark_all_notifications_read', async (userId) => {
                await this.markAllNotificationsAsRead(userId);
            });
            // Presence updates
            socket.on('update_presence', async (data) => {
                await this.updateUserPresence(data.userId, null, data.status);
                this.broadcastPresenceUpdate(data.userId, data.status);
            });
            // Chat functionality
            socket.on('join-chat', ({ projectId, userId, userName }) => {
                socket.join(`chat:${projectId}`);
                console.log(`💬 User ${userName} joined chat for project ${projectId}`);
                // Notify others in chat room
                socket.to(`chat:${projectId}`).emit('user-joined-chat', { userId, userName });
            });
            socket.on('send-message', async (messageData) => {
                const { projectId, userId, userName, content } = messageData;
                // Save message to database
                try {
                    const messageId = Date.now().toString();
                    const timestamp = new Date().toISOString();
                    await database_1.AppDataSource.query(`
            INSERT INTO chat_messages (id, projectId, userId, userName, content, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [messageId, projectId, userId, userName, content, timestamp]);
                    const message = {
                        id: messageId,
                        projectId,
                        userId,
                        userName,
                        content,
                        timestamp
                    };
                    console.log(`💬 WebSocket: Message saved to DB - ${userName}: ${content}`);
                    // Broadcast to all users in chat room
                    this.io.to(`chat:${projectId}`).emit('new-message', message);
                }
                catch (error) {
                    console.error('❌ WebSocket: Error saving chat message:', error);
                }
            });
            socket.on('leave-chat', ({ projectId, userId, userName }) => {
                socket.leave(`chat:${projectId}`);
                socket.to(`chat:${projectId}`).emit('user-left-chat', { userId, userName });
            });
            // Team Chat Channel events
            socket.on('join_channel', (channelId) => {
                socket.join(`channel:${channelId}`);
                console.log(`💬 User joined channel: ${channelId}`);
            });
            socket.on('leave_channel', (channelId) => {
                socket.leave(`channel:${channelId}`);
                console.log(`👋 User left channel: ${channelId}`);
            });
            // Disconnect
            socket.on('disconnect', async () => {
                const userId = this.socketUsers.get(socket.id);
                if (userId) {
                    await this.handleDisconnection(socket, userId);
                }
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });
    }
    async handleAuthentication(socket, userId) {
        try {
            // Store socket mapping
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId).push(socket.id);
            this.socketUsers.set(socket.id, userId);
            // Join user's personal room
            socket.join(`user:${userId}`);
            // Update presence
            await this.updateUserPresence(userId, null, 'online', socket.id);
            // Send unread notifications count
            const unreadCount = await this.getUnreadNotificationsCount(userId);
            socket.emit('unread_notifications_count', unreadCount);
            // Send recent notifications
            const notifications = await this.getRecentNotifications(userId, 20);
            socket.emit('recent_notifications', notifications);
            console.log(`✅ User authenticated: ${userId}`);
            socket.emit('authenticated', { userId, socketId: socket.id });
        }
        catch (error) {
            console.error('Authentication error:', error);
            socket.emit('authentication_error', { message: 'Authentication failed' });
        }
    }
    async handleDisconnection(socket, userId) {
        // Remove socket from mappings
        const userSocketIds = this.userSockets.get(userId) || [];
        const filteredSockets = userSocketIds.filter(id => id !== socket.id);
        if (filteredSockets.length === 0) {
            this.userSockets.delete(userId);
            // User has no more active connections
            await this.updateUserPresence(userId, null, 'offline');
            this.broadcastPresenceUpdate(userId, 'offline');
        }
        else {
            this.userSockets.set(userId, filteredSockets);
        }
        this.socketUsers.delete(socket.id);
    }
    async updateUserPresence(userId, currentIssueId, status, socketId) {
        try {
            const presenceRepo = database_1.AppDataSource.getRepository(UserPresence_1.UserPresence);
            let presence = await presenceRepo.findOne({ where: { userId } });
            if (!presence) {
                presence = presenceRepo.create({
                    userId,
                    status,
                    currentIssueId,
                    socketId,
                    lastSeen: new Date(),
                });
            }
            else {
                presence.status = status;
                presence.currentIssueId = currentIssueId;
                presence.lastSeen = new Date();
                if (socketId) {
                    presence.socketId = socketId;
                }
            }
            await presenceRepo.save(presence);
        }
        catch (error) {
            console.error('Error updating user presence:', error);
        }
    }
    async getIssueViewers(issueId) {
        try {
            const presenceRepo = database_1.AppDataSource.getRepository(UserPresence_1.UserPresence);
            const userRepo = database_1.AppDataSource.getRepository(User_1.User);
            const presences = await presenceRepo.find({
                where: { currentIssueId: issueId, status: 'online' },
            });
            const viewers = await Promise.all(presences.map(async (p) => {
                const user = await userRepo.findOne({ where: { id: p.userId } });
                return {
                    userId: p.userId,
                    userName: user?.name || 'Unknown',
                    avatar: user?.avatar,
                };
            }));
            return viewers;
        }
        catch (error) {
            console.error('Error getting issue viewers:', error);
            return [];
        }
    }
    broadcastPresenceUpdate(userId, status) {
        this.io.emit('presence_update', { userId, status, timestamp: new Date() });
    }
    async getUnreadNotificationsCount(userId) {
        try {
            const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
            return await notificationRepo.count({ where: { userId, read: false } });
        }
        catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
    async getRecentNotifications(userId, limit = 20) {
        try {
            const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
            return await notificationRepo.find({
                where: { userId },
                order: { createdAt: 'DESC' },
                take: limit,
            });
        }
        catch (error) {
            console.error('Error getting recent notifications:', error);
            return [];
        }
    }
    async markNotificationAsRead(notificationId) {
        try {
            const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
            await notificationRepo.update(notificationId, { read: true });
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
    async markAllNotificationsAsRead(userId) {
        try {
            const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
            await notificationRepo.update({ userId, read: false }, { read: true });
        }
        catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }
    // Public methods for emitting events
    async emitNotification(userId, notification) {
        // Save to database
        const notificationRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const savedNotification = await notificationRepo.save(notification);
        // Emit to user's room
        this.io.to(`user:${userId}`).emit('new_notification', savedNotification);
        // Update unread count
        const unreadCount = await this.getUnreadNotificationsCount(userId);
        this.io.to(`user:${userId}`).emit('unread_notifications_count', unreadCount);
        return savedNotification;
    }
    emitToProject(projectId, event, data) {
        this.io.to(`project:${projectId}`).emit(event, data);
    }
    emitToIssue(issueId, event, data) {
        this.io.to(`issue:${issueId}`).emit(event, data);
    }
    emitToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }
    async notifyIssueCreated(issue, creatorId) {
        const notification = {
            userId: issue.assigneeId,
            type: 'issue_created',
            title: 'New Issue Assigned',
            message: `${issue.key}: ${issue.summary}`,
            issueId: issue.id,
            issueKey: issue.key,
            projectId: issue.projectId,
            actorId: creatorId,
            read: false,
        };
        if (issue.assigneeId && issue.assigneeId !== creatorId) {
            await this.emitNotification(issue.assigneeId, notification);
        }
        // Broadcast to project
        this.emitToProject(issue.projectId, 'issue_created', issue);
    }
    async notifyIssueUpdated(issue, updaterId, changes) {
        // Notify assignee
        if (issue.assigneeId && issue.assigneeId !== updaterId) {
            await this.emitNotification(issue.assigneeId, {
                userId: issue.assigneeId,
                type: 'issue_updated',
                title: 'Issue Updated',
                message: `${issue.key} was updated`,
                issueId: issue.id,
                issueKey: issue.key,
                projectId: issue.projectId,
                actorId: updaterId,
                read: false,
            });
        }
        // Broadcast to issue room
        this.emitToIssue(issue.id, 'issue_updated', { issue, changes, updaterId });
    }
    async notifyCommentAdded(comment, issue, commenterId) {
        // Notify assignee and reporter
        const recipients = new Set([issue.assigneeId, issue.reporterId]);
        recipients.delete(commenterId); // Don't notify the commenter
        for (const userId of recipients) {
            if (userId) {
                await this.emitNotification(userId, {
                    userId,
                    type: 'comment_added',
                    title: 'New Comment',
                    message: `New comment on ${issue.key}`,
                    issueId: issue.id,
                    issueKey: issue.key,
                    projectId: issue.projectId,
                    actorId: commenterId,
                    read: false,
                });
            }
        }
        // Broadcast to issue room
        this.emitToIssue(issue.id, 'comment_added', { comment, commenterId });
    }
    async notifyMention(mentionedUserId, issue, mentionerId, context) {
        await this.emitNotification(mentionedUserId, {
            userId: mentionedUserId,
            type: 'mention',
            title: 'You were mentioned',
            message: `You were mentioned in ${issue.key}`,
            issueId: issue.id,
            issueKey: issue.key,
            projectId: issue.projectId,
            actorId: mentionerId,
            read: false,
        });
    }
    async notifyAssignmentChanged(issue, newAssigneeId, changerId) {
        if (newAssigneeId && newAssigneeId !== changerId) {
            await this.emitNotification(newAssigneeId, {
                userId: newAssigneeId,
                type: 'assignment_changed',
                title: 'Issue Assigned to You',
                message: `${issue.key} was assigned to you`,
                issueId: issue.id,
                issueKey: issue.key,
                projectId: issue.projectId,
                actorId: changerId,
                read: false,
            });
        }
    }
    async notifyStatusChanged(issue, oldStatus, newStatus, changerId) {
        const recipients = new Set([issue.assigneeId, issue.reporterId]);
        recipients.delete(changerId);
        for (const userId of recipients) {
            if (userId) {
                await this.emitNotification(userId, {
                    userId,
                    type: 'status_changed',
                    title: 'Status Changed',
                    message: `${issue.key} moved from ${oldStatus} to ${newStatus}`,
                    issueId: issue.id,
                    issueKey: issue.key,
                    projectId: issue.projectId,
                    actorId: changerId,
                    read: false,
                });
            }
        }
        // Broadcast to project
        this.emitToProject(issue.projectId, 'status_changed', { issue, oldStatus, newStatus });
    }
    async notifySprintStarted(sprint, projectId) {
        this.emitToProject(projectId, 'sprint_started', sprint);
    }
    async notifySprintCompleted(sprint, projectId) {
        this.emitToProject(projectId, 'sprint_completed', sprint);
    }
    emitToChannel(channelId, event, data) {
        this.io.to(`channel:${channelId}`).emit(event, data);
    }
    getIO() {
        return this.io;
    }
}
exports.WebSocketService = WebSocketService;
function initializeWebSocket(httpServer) {
    exports.websocketService = new WebSocketService(httpServer);
    return exports.websocketService;
}
