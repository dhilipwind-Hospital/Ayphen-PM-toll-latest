import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';
import { message } from 'antd';

const SOCKET_URL = 'https://ayphen-pm-toll-latest.onrender.com'; // Should be env var in prod

class SocketService {
  private socket: Socket | null = null;
  private currentProjectId: string | null = null;

  public connect(userId: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.socket?.emit('authenticate', userId);
    });

    this.socket.on('authenticated', () => {
      console.log('✅ Socket authenticated');
      // Re-join project if we were in one
      if (this.currentProjectId) {
        this.joinProject(this.currentProjectId);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
    });

    this.setupEventListeners();
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public joinProject(projectId: string) {
    if (!this.socket || !projectId) return;

    if (this.currentProjectId && this.currentProjectId !== projectId) {
      this.leaveProject(this.currentProjectId);
    }

    this.socket.emit('join_project', projectId);
    this.currentProjectId = projectId;
    console.log(`Joined project room: ${projectId}`);
  }

  public leaveProject(projectId: string) {
    if (!this.socket) return;
    this.socket.emit('leave_project', projectId);
    this.currentProjectId = null;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Issue Created
    this.socket.on('issue_created', (issue: any) => {
      console.log('🔔 Socket: issue_created', issue);
      const { addIssue, currentProject } = useStore.getState();

      // Only add if it belongs to current project (double check)
      if (currentProject && issue.projectId === currentProject.id) {
        addIssue(issue);
        message.info(`New issue created: ${issue.key}`);
      }
    });

    // Issue Updated (General)
    this.socket.on('issue_updated', (data: { issue: any, changes: any, updaterId: string }) => {
      console.log('🔔 Socket: issue_updated', data);
      const { updateIssue, currentProject } = useStore.getState();

      if (currentProject && data.issue.projectId === currentProject.id) {
        updateIssue(data.issue.id, data.issue);
        // Optional: Show toaster if not the updater? 
        // But we don't have easy access to current user ID here without store.
        // Rely on UI updates.
      }
    });

    // Status Changed
    this.socket.on('status_changed', (data: { issue: any, oldStatus: string, newStatus: string }) => {
      console.log('🔔 Socket: status_changed', data);
      const { updateIssue, currentProject } = useStore.getState();

      if (currentProject && data.issue.projectId === currentProject.id) {
        updateIssue(data.issue.id, { status: data.newStatus as any });
        // Removed toast to prevent spam
      }
    });

    // Assignment Changed (handled via notifications usually, but good for board update)
    // The 'issue_updated' event usually carries the new assignee, so this might be redundant for state update,
    // but useful for specific UI alerts if needed.
  }
}

export const socketService = new SocketService();
