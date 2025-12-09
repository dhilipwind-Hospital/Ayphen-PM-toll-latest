"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborativeEditingService = void 0;
class CollaborativeEditingService {
    constructor(io) {
        this.activeSessions = new Map();
        this.cursors = new Map();
        this.userColors = new Map();
        this.COLORS = [
            '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
            '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
        ];
        this.io = io;
        this.setupSocketHandlers();
    }
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('🔌 Client connected:', socket.id);
            // Join editing session
            socket.on('join-edit-session', (data) => {
                this.handleJoinSession(socket, data);
            });
            // Leave editing session
            socket.on('leave-edit-session', (data) => {
                this.handleLeaveSession(socket, data);
            });
            // Cursor update
            socket.on('cursor-update', (data) => {
                this.handleCursorUpdate(socket, data);
            });
            // Edit operation
            socket.on('edit-operation', (data) => {
                this.handleEditOperation(socket, data);
            });
            // Typing indicator
            socket.on('typing-start', (data) => {
                this.handleTypingStart(socket, data);
            });
            socket.on('typing-stop', (data) => {
                this.handleTypingStop(socket, data);
            });
            // Disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }
    handleJoinSession(socket, data) {
        const { issueId, userId, userName, userAvatar } = data;
        // Initialize session set if not exists
        if (!this.activeSessions.has(issueId)) {
            this.activeSessions.set(issueId, new Set());
        }
        // Assign color to user if not assigned
        if (!this.userColors.has(userId)) {
            const colorIndex = this.userColors.size % this.COLORS.length;
            this.userColors.set(userId, this.COLORS[colorIndex]);
        }
        const session = {
            issueId,
            userId,
            userName,
            userAvatar,
            joinedAt: new Date(),
            lastActivity: new Date()
        };
        this.activeSessions.get(issueId).add(session);
        // Join socket room
        socket.join(`issue:${issueId}`);
        // Get all active users
        const activeUsers = Array.from(this.activeSessions.get(issueId)).map(s => ({
            userId: s.userId,
            userName: s.userName,
            userAvatar: s.userAvatar,
            color: this.userColors.get(s.userId),
            joinedAt: s.joinedAt
        }));
        // Notify user of existing active users
        socket.emit('active-users', { issueId, users: activeUsers });
        // Notify others that user joined
        socket.to(`issue:${issueId}`).emit('user-joined', {
            userId,
            userName,
            userAvatar,
            color: this.userColors.get(userId),
            joinedAt: session.joinedAt
        });
        console.log(`✅ User ${userName} joined editing session for issue ${issueId}`);
    }
    handleLeaveSession(socket, data) {
        const { issueId, userId } = data;
        if (this.activeSessions.has(issueId)) {
            const sessions = this.activeSessions.get(issueId);
            const session = Array.from(sessions).find(s => s.userId === userId);
            if (session) {
                sessions.delete(session);
                if (sessions.size === 0) {
                    this.activeSessions.delete(issueId);
                    this.cursors.delete(issueId);
                }
            }
        }
        // Leave socket room
        socket.leave(`issue:${issueId}`);
        // Notify others that user left
        socket.to(`issue:${issueId}`).emit('user-left', { userId });
        console.log(`👋 User ${userId} left editing session for issue ${issueId}`);
    }
    handleCursorUpdate(socket, data) {
        const { issueId, userId, userName, field, position } = data;
        // Initialize cursors map if not exists
        if (!this.cursors.has(issueId)) {
            this.cursors.set(issueId, new Map());
        }
        const cursorPosition = {
            userId,
            userName,
            field,
            position,
            color: this.userColors.get(userId) || '#1890ff'
        };
        this.cursors.get(issueId).set(userId, cursorPosition);
        // Broadcast cursor position to others
        socket.to(`issue:${issueId}`).emit('cursor-update', cursorPosition);
    }
    handleEditOperation(socket, data) {
        const { issueId } = data;
        // Broadcast edit operation to others
        socket.to(`issue:${issueId}`).emit('edit-operation', data);
        console.log(`✏️ Edit operation on issue ${issueId} by user ${data.userId}`);
    }
    handleTypingStart(socket, data) {
        const { issueId, userId, userName, field } = data;
        // Broadcast typing indicator to others
        socket.to(`issue:${issueId}`).emit('typing-start', {
            userId,
            userName,
            field,
            color: this.userColors.get(userId)
        });
    }
    handleTypingStop(socket, data) {
        const { issueId, userId, field } = data;
        // Broadcast typing stop to others
        socket.to(`issue:${issueId}`).emit('typing-stop', {
            userId,
            field
        });
    }
    handleDisconnect(socket) {
        // Clean up all sessions for this socket
        this.activeSessions.forEach((sessions, issueId) => {
            sessions.forEach(session => {
                socket.to(`issue:${issueId}`).emit('user-left', { userId: session.userId });
            });
        });
        console.log('🔌 Client disconnected:', socket.id);
    }
    // Public methods for external use
    getActiveSessions(issueId) {
        if (!this.activeSessions.has(issueId)) {
            return [];
        }
        return Array.from(this.activeSessions.get(issueId));
    }
    getCursors(issueId) {
        if (!this.cursors.has(issueId)) {
            return [];
        }
        return Array.from(this.cursors.get(issueId).values());
    }
    broadcastIssueUpdate(issueId, update) {
        this.io.to(`issue:${issueId}`).emit('issue-updated', update);
    }
    broadcastConflict(issueId, conflict) {
        this.io.to(`issue:${issueId}`).emit('edit-conflict', conflict);
    }
}
exports.CollaborativeEditingService = CollaborativeEditingService;
