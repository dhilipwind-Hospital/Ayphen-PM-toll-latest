import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { message as antdMessage } from 'antd';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  issueId?: string;
  issueKey?: string;
  projectId?: string;
  read: boolean;
  actionUrl?: string;
  actorId?: string;
  actorName?: string;
  createdAt: Date;
}

interface UserPresence {
  userId: string;
  userName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
}

interface NotificationContextType {
  socket: Socket | null;
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  issueViewers: Record<string, UserPresence[]>;
  typingUsers: Record<string, string[]>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  joinIssue: (issueId: string) => void;
  leaveIssue: (issueId: string) => void;
  startTyping: (issueId: string) => void;
  stopTyping: (issueId: string) => void;
  updatePresence: (status: 'online' | 'offline' | 'away' | 'busy') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [issueViewers, setIssueViewers] = useState<Record<string, UserPresence[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
      setCurrentUserName(user.name);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Connect to WebSocket server
    const newSocket = io('https://ayphen-pm-toll-latest.onrender.com', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setIsConnected(true);
      
      // Authenticate
      newSocket.emit('authenticate', currentUserId);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Authenticated:', data);
    });

    newSocket.on('authentication_error', (error) => {
      console.error('❌ Authentication error:', error);
    });

    // Notification events
    newSocket.on('new_notification', (notification: Notification) => {
      console.log('🔔 New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      
      // Show toast notification
      antdMessage.info({
        content: notification.message,
        duration: 3,
        onClick: () => {
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          } else if (notification.issueKey) {
            window.location.href = `/issue/${notification.issueKey}`;
          }
        },
      });
    });

    newSocket.on('unread_notifications_count', (count: number) => {
      setUnreadCount(count);
    });

    newSocket.on('recent_notifications', (recentNotifications: Notification[]) => {
      setNotifications(recentNotifications);
    });

    // Issue collaboration events
    newSocket.on('user_joined_issue', (data: { userId: string; issueId: string }) => {
      console.log('👤 User joined issue:', data);
    });

    newSocket.on('user_left_issue', (data: { userId: string; issueId: string }) => {
      console.log('👋 User left issue:', data);
      setIssueViewers((prev) => {
        const viewers = prev[data.issueId] || [];
        return {
          ...prev,
          [data.issueId]: viewers.filter((v) => v.userId !== data.userId),
        };
      });
    });

    newSocket.on('issue_viewers', (data: { issueId: string; viewers: UserPresence[] }) => {
      setIssueViewers((prev) => ({
        ...prev,
        [data.issueId]: data.viewers,
      }));
    });

    newSocket.on('user_typing', (data: { userId: string; userName: string; issueId: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const users = prev[data.issueId] || [];
          if (!users.includes(data.userName)) {
            return {
              ...prev,
              [data.issueId]: [...users, data.userName],
            };
          }
          return prev;
        });
      }
    });

    newSocket.on('user_stopped_typing', (data: { userId: string; issueId: string }) => {
      setTypingUsers((prev) => {
        const users = prev[data.issueId] || [];
        return {
          ...prev,
          [data.issueId]: users.filter((u) => u !== data.userId),
        };
      });
    });

    // Real-time updates
    newSocket.on('issue_created', (issue: any) => {
      console.log('📝 Issue created:', issue);
    });

    newSocket.on('issue_updated', (data: { issue: any; changes: any; updaterId: string }) => {
      console.log('📝 Issue updated:', data);
    });

    newSocket.on('comment_added', (data: { comment: any; commenterId: string }) => {
      console.log('💬 Comment added:', data);
    });

    newSocket.on('status_changed', (data: { issue: any; oldStatus: string; newStatus: string }) => {
      console.log('🔄 Status changed:', data);
    });

    newSocket.on('sprint_started', (sprint: any) => {
      console.log('🏃 Sprint started:', sprint);
      antdMessage.success(`Sprint "${sprint.name}" has started!`);
    });

    newSocket.on('sprint_completed', (sprint: any) => {
      console.log('✅ Sprint completed:', sprint);
      antdMessage.success(`Sprint "${sprint.name}" has been completed!`);
    });

    newSocket.on('presence_update', (data: { userId: string; status: string; timestamp: Date }) => {
      console.log('👤 Presence update:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUserId]);

  const markAsRead = useCallback((notificationId: string) => {
    if (socket) {
      socket.emit('mark_notification_read', notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  }, [socket]);

  const markAllAsRead = useCallback(() => {
    if (socket && currentUserId) {
      socket.emit('mark_all_notifications_read', currentUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, [socket, currentUserId]);

  const joinProject = useCallback((projectId: string) => {
    if (socket) {
      socket.emit('join_project', projectId);
    }
  }, [socket]);

  const leaveProject = useCallback((projectId: string) => {
    if (socket) {
      socket.emit('leave_project', projectId);
    }
  }, [socket]);

  const joinIssue = useCallback((issueId: string) => {
    if (socket && currentUserId) {
      socket.emit('join_issue', { issueId, userId: currentUserId });
    }
  }, [socket, currentUserId]);

  const leaveIssue = useCallback((issueId: string) => {
    if (socket && currentUserId) {
      socket.emit('leave_issue', { issueId, userId: currentUserId });
    }
  }, [socket, currentUserId]);

  const startTyping = useCallback((issueId: string) => {
    if (socket && currentUserId && currentUserName) {
      socket.emit('typing_start', { issueId, userId: currentUserId, userName: currentUserName });
    }
  }, [socket, currentUserId, currentUserName]);

  const stopTyping = useCallback((issueId: string) => {
    if (socket && currentUserId) {
      socket.emit('typing_stop', { issueId, userId: currentUserId });
    }
  }, [socket, currentUserId]);

  const updatePresence = useCallback((status: 'online' | 'offline' | 'away' | 'busy') => {
    if (socket && currentUserId) {
      socket.emit('update_presence', { userId: currentUserId, status });
    }
  }, [socket, currentUserId]);

  const value: NotificationContextType = {
    socket,
    notifications,
    unreadCount,
    isConnected,
    issueViewers,
    typingUsers,
    markAsRead,
    markAllAsRead,
    joinProject,
    leaveProject,
    joinIssue,
    leaveIssue,
    startTyping,
    stopTyping,
    updatePresence,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
