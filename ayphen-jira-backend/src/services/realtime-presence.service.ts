import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../config/database';
import { UserPresence } from '../entities/UserPresence';

interface PresenceData {
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'online' | 'away' | 'offline';
  currentPage?: string;
  currentIssueId?: string;
  lastSeen: Date;
}

export class RealtimePresenceService {
  private io: Server;
  private presenceRepo = AppDataSource.getRepository(UserPresence);
  private userPresence: Map<string, PresenceData> = new Map();
  private socketToUser: Map<string, string> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
    this.startPresenceCleanup();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('👤 User connected:', socket.id);

      // User comes online
      socket.on('user-online', async (data: { userId: string; userName: string; userAvatar?: string }) => {
        await this.handleUserOnline(socket, data);
      });

      // User navigates to a page
      socket.on('navigate', async (data: { userId: string; page: string; issueId?: string }) => {
        await this.handleNavigate(socket, data);
      });

      // User goes away (idle)
      socket.on('user-away', async (data: { userId: string }) => {
        await this.handleUserAway(socket, data);
      });

      // User comes back from away
      socket.on('user-back', async (data: { userId: string }) => {
        await this.handleUserBack(socket, data);
      });

      // Heartbeat to keep presence alive
      socket.on('heartbeat', async (data: { userId: string }) => {
        await this.handleHeartbeat(socket, data);
      });

      // Disconnect
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  private async handleUserOnline(socket: Socket, data: { userId: string; userName: string; userAvatar?: string }) {
    const { userId, userName, userAvatar } = data;

    // Store socket to user mapping
    this.socketToUser.set(socket.id, userId);

    // Update presence data
    const presence: PresenceData = {
      userId,
      userName,
      userAvatar,
      status: 'online',
      lastSeen: new Date()
    };

    this.userPresence.set(userId, presence);

    // Update database
    await this.updatePresenceInDB(userId, 'online', null);

    // Broadcast to all users
    this.io.emit('presence-update', {
      userId,
      userName,
      userAvatar,
      status: 'online',
      timestamp: new Date()
    });

    // Send current presence list to the user
    const allPresence = Array.from(this.userPresence.values()).map(p => ({
      userId: p.userId,
      userName: p.userName,
      userAvatar: p.userAvatar,
      status: p.status,
      currentPage: p.currentPage,
      currentIssueId: p.currentIssueId,
      lastSeen: p.lastSeen
    }));

    socket.emit('presence-list', allPresence);

    console.log(`✅ User ${userName} is now online`);
  }

  private async handleNavigate(socket: Socket, data: { userId: string; page: string; issueId?: string }) {
    const { userId, page, issueId } = data;

    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.currentPage = page;
      presence.currentIssueId = issueId || undefined;
      presence.lastSeen = new Date();

      // Update database
      await this.updatePresenceInDB(userId, presence.status, issueId || null);

      // Broadcast navigation
      this.io.emit('user-navigated', {
        userId,
        page,
        issueId,
        timestamp: new Date()
      });

      // If viewing an issue, join issue room
      if (issueId) {
        socket.join(`issue-viewers:${issueId}`);
        
        // Notify others viewing the same issue
        socket.to(`issue-viewers:${issueId}`).emit('viewer-joined', {
          userId,
          userName: presence.userName,
          userAvatar: presence.userAvatar,
          timestamp: new Date()
        });

        console.log(`👁️ User ${presence.userName} is viewing issue ${issueId}`);
      }
    }
  }

  private async handleUserAway(socket: Socket, data: { userId: string }) {
    const { userId } = data;

    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.status = 'away';
      presence.lastSeen = new Date();

      // Update database
      await this.updatePresenceInDB(userId, 'away', presence.currentIssueId || null);

      // Broadcast status change
      this.io.emit('presence-update', {
        userId,
        status: 'away',
        timestamp: new Date()
      });

      console.log(`😴 User ${presence.userName} is now away`);
    }
  }

  private async handleUserBack(socket: Socket, data: { userId: string }) {
    const { userId } = data;

    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.status = 'online';
      presence.lastSeen = new Date();

      // Update database
      await this.updatePresenceInDB(userId, 'online', presence.currentIssueId || null);

      // Broadcast status change
      this.io.emit('presence-update', {
        userId,
        status: 'online',
        timestamp: new Date()
      });

      console.log(`✅ User ${presence.userName} is back online`);
    }
  }

  private async handleHeartbeat(socket: Socket, data: { userId: string }) {
    const { userId } = data;

    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.lastSeen = new Date();
    }
  }

  private async handleDisconnect(socket: Socket) {
    const userId = this.socketToUser.get(socket.id);
    
    if (userId) {
      const presence = this.userPresence.get(userId);
      
      if (presence) {
        presence.status = 'offline';
        presence.lastSeen = new Date();
        presence.currentPage = undefined;
        presence.currentIssueId = undefined;

        // Update database
        await this.updatePresenceInDB(userId, 'offline', null);

        // Broadcast offline status
        this.io.emit('presence-update', {
          userId,
          status: 'offline',
          timestamp: new Date()
        });

        console.log(`👋 User ${presence.userName} went offline`);

        // Remove from memory after a delay (in case of reconnection)
        setTimeout(() => {
          this.userPresence.delete(userId);
        }, 60000); // 1 minute
      }

      this.socketToUser.delete(socket.id);
    }
  }

  private async updatePresenceInDB(userId: string, status: string, currentIssueId: string | null) {
    try {
      let presence = await this.presenceRepo.findOne({ where: { userId } });

      if (!presence) {
        presence = this.presenceRepo.create({
          userId,
          status,
          currentIssueId,
          lastSeen: new Date()
        });
      } else {
        presence.status = status;
        presence.currentIssueId = currentIssueId;
        presence.lastSeen = new Date();
      }

      await this.presenceRepo.save(presence);
    } catch (error) {
      console.error('❌ Error updating presence in DB:', error);
    }
  }

  private startPresenceCleanup() {
    // Clean up stale presence every 5 minutes
    setInterval(() => {
      const now = new Date();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      this.userPresence.forEach((presence, userId) => {
        const timeSinceLastSeen = now.getTime() - presence.lastSeen.getTime();
        
        if (timeSinceLastSeen > staleThreshold && presence.status !== 'offline') {
          presence.status = 'offline';
          this.updatePresenceInDB(userId, 'offline', null);
          
          this.io.emit('presence-update', {
            userId,
            status: 'offline',
            timestamp: new Date()
          });
        }
      });
    }, 5 * 60 * 1000);
  }

  // Public methods
  public getOnlineUsers(): PresenceData[] {
    return Array.from(this.userPresence.values()).filter(p => p.status === 'online');
  }

  public getUserPresence(userId: string): PresenceData | undefined {
    return this.userPresence.get(userId);
  }

  public getIssueViewers(issueId: string): PresenceData[] {
    return Array.from(this.userPresence.values()).filter(
      p => p.currentIssueId === issueId && p.status !== 'offline'
    );
  }

  public async getPresenceFromDB(userId: string): Promise<UserPresence | null> {
    return await this.presenceRepo.findOne({ where: { userId } });
  }
}
