import { Server, Socket } from 'socket.io';

interface EditorSession {
  issueId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: Date;
  lastActivity: Date;
}

interface CursorPosition {
  userId: string;
  userName: string;
  field: string; // which field they're editing
  position: number;
  color: string;
}

interface EditOperation {
  userId: string;
  issueId: string;
  field: string;
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  timestamp: Date;
}

export class CollaborativeEditingService {
  private io: Server;
  private activeSessions: Map<string, Set<EditorSession>> = new Map();
  private cursors: Map<string, Map<string, CursorPosition>> = new Map();
  private userColors: Map<string, string> = new Map();
  
  private readonly COLORS = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
  ];

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('🔌 Client connected:', socket.id);

      // Join editing session
      socket.on('join-edit-session', (data: { issueId: string; userId: string; userName: string; userAvatar?: string }) => {
        this.handleJoinSession(socket, data);
      });

      // Leave editing session
      socket.on('leave-edit-session', (data: { issueId: string; userId: string }) => {
        this.handleLeaveSession(socket, data);
      });

      // Cursor update
      socket.on('cursor-update', (data: { issueId: string; userId: string; userName: string; field: string; position: number }) => {
        this.handleCursorUpdate(socket, data);
      });

      // Edit operation
      socket.on('edit-operation', (data: EditOperation) => {
        this.handleEditOperation(socket, data);
      });

      // Typing indicator
      socket.on('typing-start', (data: { issueId: string; userId: string; userName: string; field: string }) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing-stop', (data: { issueId: string; userId: string; field: string }) => {
        this.handleTypingStop(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinSession(socket: Socket, data: { issueId: string; userId: string; userName: string; userAvatar?: string }) {
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

    const session: EditorSession = {
      issueId,
      userId,
      userName,
      userAvatar,
      joinedAt: new Date(),
      lastActivity: new Date()
    };

    this.activeSessions.get(issueId)!.add(session);

    // Join socket room
    socket.join(`issue:${issueId}`);

    // Get all active users
    const activeUsers = Array.from(this.activeSessions.get(issueId)!).map(s => ({
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

  private handleLeaveSession(socket: Socket, data: { issueId: string; userId: string }) {
    const { issueId, userId } = data;

    if (this.activeSessions.has(issueId)) {
      const sessions = this.activeSessions.get(issueId)!;
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

  private handleCursorUpdate(socket: Socket, data: { issueId: string; userId: string; userName: string; field: string; position: number }) {
    const { issueId, userId, userName, field, position } = data;

    // Initialize cursors map if not exists
    if (!this.cursors.has(issueId)) {
      this.cursors.set(issueId, new Map());
    }

    const cursorPosition: CursorPosition = {
      userId,
      userName,
      field,
      position,
      color: this.userColors.get(userId) || '#1890ff'
    };

    this.cursors.get(issueId)!.set(userId, cursorPosition);

    // Broadcast cursor position to others
    socket.to(`issue:${issueId}`).emit('cursor-update', cursorPosition);
  }

  private handleEditOperation(socket: Socket, data: EditOperation) {
    const { issueId } = data;

    // Broadcast edit operation to others
    socket.to(`issue:${issueId}`).emit('edit-operation', data);

    console.log(`✏️ Edit operation on issue ${issueId} by user ${data.userId}`);
  }

  private handleTypingStart(socket: Socket, data: { issueId: string; userId: string; userName: string; field: string }) {
    const { issueId, userId, userName, field } = data;

    // Broadcast typing indicator to others
    socket.to(`issue:${issueId}`).emit('typing-start', {
      userId,
      userName,
      field,
      color: this.userColors.get(userId)
    });
  }

  private handleTypingStop(socket: Socket, data: { issueId: string; userId: string; field: string }) {
    const { issueId, userId, field } = data;

    // Broadcast typing stop to others
    socket.to(`issue:${issueId}`).emit('typing-stop', {
      userId,
      field
    });
  }

  private handleDisconnect(socket: Socket) {
    // Clean up all sessions for this socket
    this.activeSessions.forEach((sessions, issueId) => {
      sessions.forEach(session => {
        socket.to(`issue:${issueId}`).emit('user-left', { userId: session.userId });
      });
    });

    console.log('🔌 Client disconnected:', socket.id);
  }

  // Public methods for external use
  public getActiveSessions(issueId: string): EditorSession[] {
    if (!this.activeSessions.has(issueId)) {
      return [];
    }
    return Array.from(this.activeSessions.get(issueId)!);
  }

  public getCursors(issueId: string): CursorPosition[] {
    if (!this.cursors.has(issueId)) {
      return [];
    }
    return Array.from(this.cursors.get(issueId)!.values());
  }

  public broadcastIssueUpdate(issueId: string, update: any) {
    this.io.to(`issue:${issueId}`).emit('issue-updated', update);
  }

  public broadcastConflict(issueId: string, conflict: any) {
    this.io.to(`issue:${issueId}`).emit('edit-conflict', conflict);
  }
}
