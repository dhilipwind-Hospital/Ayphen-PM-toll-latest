import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { UserPresence } from '../entities/UserPresence';
import { User } from '../entities/User';

export class WebSocketService {
  private io: Server;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          const allowedOrigins = [
            'http://localhost:1600',
            'http://127.0.0.1:1600',
            'http://localhost:1500',
            'http://127.0.0.1:1500',
            process.env.CORS_ORIGIN
          ].filter(Boolean);

          if (
            !origin ||
            allowedOrigins.includes(origin) ||
            origin.includes('127.0.0.1') ||
            origin.includes('localhost') ||
            origin.endsWith('.vercel.app')
          ) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Authentication
      socket.on('authenticate', async (userId: string) => {
        await this.handleAuthentication(socket, userId);
      });

      // Join project room
      socket.on('join_project', (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`👥 User joined project room: ${projectId}`);
      });

      // Leave project room
      socket.on('leave_project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
        console.log(`👋 User left project room: ${projectId}`);
      });

      // Join issue room (for real-time collaboration)
      socket.on('join_issue', async (data: { issueId: string; userId: string }) => {
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
      socket.on('leave_issue', async (data: { issueId: string; userId: string }) => {
        socket.leave(`issue:${data.issueId}`);
        await this.updateUserPresence(data.userId, null, 'online');

        socket.to(`issue:${data.issueId}`).emit('user_left_issue', {
          userId: data.userId,
          issueId: data.issueId,
        });
      });

      // Typing indicator
      socket.on('typing_start', (data: { issueId: string; userId: string; userName: string }) => {
        socket.to(`issue:${data.issueId}`).emit('user_typing', {
          userId: data.userId,
          userName: data.userName,
          issueId: data.issueId,
        });
      });

      socket.on('typing_stop', (data: { issueId: string; userId: string }) => {
        socket.to(`issue:${data.issueId}`).emit('user_stopped_typing', {
          userId: data.userId,
          issueId: data.issueId,
        });
      });

      // Mark notification as read
      socket.on('mark_notification_read', async (notificationId: string) => {
        await this.markNotificationAsRead(notificationId);
      });

      // Mark all notifications as read
      socket.on('mark_all_notifications_read', async (userId: string) => {
        await this.markAllNotificationsAsRead(userId);
      });

      // Presence updates
      socket.on('update_presence', async (data: { userId: string; status: string }) => {
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

          await AppDataSource.query(`
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
        } catch (error) {
          console.error('❌ WebSocket: Error saving chat message:', error);
        }
      });

      socket.on('leave-chat', ({ projectId, userId, userName }) => {
        socket.leave(`chat:${projectId}`);
        socket.to(`chat:${projectId}`).emit('user-left-chat', { userId, userName });
      });

      // Team Chat Channel events
      socket.on('join_channel', (channelId: string) => {
        socket.join(`channel:${channelId}`);
        console.log(`💬 User joined channel: ${channelId}`);
      });

      socket.on('leave_channel', (channelId: string) => {
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

  private async handleAuthentication(socket: Socket, userId: string) {
    try {
      // Store socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(socket.id);
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
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authentication_error', { message: 'Authentication failed' });
    }
  }

  private async handleDisconnection(socket: Socket, userId: string) {
    // Remove socket from mappings
    const userSocketIds = this.userSockets.get(userId) || [];
    const filteredSockets = userSocketIds.filter(id => id !== socket.id);

    if (filteredSockets.length === 0) {
      this.userSockets.delete(userId);
      // User has no more active connections
      await this.updateUserPresence(userId, null, 'offline');
      this.broadcastPresenceUpdate(userId, 'offline');
    } else {
      this.userSockets.set(userId, filteredSockets);
    }

    this.socketUsers.delete(socket.id);
  }

  private async updateUserPresence(
    userId: string,
    currentIssueId: string | null,
    status: string,
    socketId?: string
  ) {
    try {
      const presenceRepo = AppDataSource.getRepository(UserPresence);

      let presence = await presenceRepo.findOne({ where: { userId } });

      if (!presence) {
        presence = presenceRepo.create({
          userId,
          status,
          currentIssueId,
          socketId,
          lastSeen: new Date(),
        });
      } else {
        presence.status = status;
        presence.currentIssueId = currentIssueId;
        presence.lastSeen = new Date();
        if (socketId) {
          presence.socketId = socketId;
        }
      }

      await presenceRepo.save(presence);
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  private async getIssueViewers(issueId: string) {
    try {
      const presenceRepo = AppDataSource.getRepository(UserPresence);
      const userRepo = AppDataSource.getRepository(User);

      const presences = await presenceRepo.find({
        where: { currentIssueId: issueId, status: 'online' },
      });

      const viewers = await Promise.all(
        presences.map(async (p) => {
          const user = await userRepo.findOne({ where: { id: p.userId } });
          return {
            userId: p.userId,
            userName: user?.name || 'Unknown',
            avatar: user?.avatar,
          };
        })
      );

      return viewers;
    } catch (error) {
      console.error('Error getting issue viewers:', error);
      return [];
    }
  }

  private broadcastPresenceUpdate(userId: string, status: string) {
    this.io.emit('presence_update', { userId, status, timestamp: new Date() });
  }

  private async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      return await notificationRepo.count({ where: { userId, read: false } });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  private async getRecentNotifications(userId: string, limit: number = 20) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      return await notificationRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      return [];
    }
  }

  private async markNotificationAsRead(notificationId: string) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      await notificationRepo.update(notificationId, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  private async markAllNotificationsAsRead(userId: string) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      await notificationRepo.update({ userId, read: false }, { read: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Public methods for emitting events

  public async emitNotification(userId: string, notification: any) {
    // Save to database
    const notificationRepo = AppDataSource.getRepository(Notification);
    const savedNotification = await notificationRepo.save(notification);

    // Emit to user's room
    this.io.to(`user:${userId}`).emit('new_notification', savedNotification);

    // Update unread count
    const unreadCount = await this.getUnreadNotificationsCount(userId);
    this.io.to(`user:${userId}`).emit('unread_notifications_count', unreadCount);

    return savedNotification;
  }

  public emitToProject(projectId: string, event: string, data: any) {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  public emitToIssue(issueId: string, event: string, data: any) {
    this.io.to(`issue:${issueId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public async notifyIssueCreated(issue: any, creatorId: string) {
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

  public async notifyIssueUpdated(issue: any, updaterId: string, changes: any) {
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

  public async notifyCommentAdded(comment: any, issue: any, commenterId: string) {
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

  public async notifyMention(mentionedUserId: string, issue: any, mentionerId: string, context: string) {
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

  public async notifyAssignmentChanged(issue: any, newAssigneeId: string, changerId: string) {
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

  public async notifyStatusChanged(issue: any, oldStatus: string, newStatus: string, changerId: string) {
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

  public async notifyIssueDeleted(issueId: string, projectId: string, deleterId: string) {
    this.emitToProject(projectId, 'issue_deleted', { issueId, deleterId });
  }

  public async notifySprintStarted(sprint: any, projectId: string) {
    this.emitToProject(projectId, 'sprint_started', sprint);
  }

  public async notifySprintCompleted(sprint: any, projectId: string) {
    this.emitToProject(projectId, 'sprint_completed', sprint);
  }

  public emitToChannel(channelId: string, event: string, data: any) {
    this.io.to(`channel:${channelId}`).emit(event, data);
  }

  public getIO(): Server {
    return this.io;
  }
}

export let websocketService: WebSocketService;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketService {
  websocketService = new WebSocketService(httpServer);
  return websocketService;
}
