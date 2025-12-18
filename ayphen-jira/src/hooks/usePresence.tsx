import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface PresenceData {
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'online' | 'away' | 'offline';
  currentPage?: string;
  currentIssueId?: string;
  lastSeen: Date;
}

export const usePresence = (userId: string, userName: string, userAvatar?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const idleTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('https://ayphen-pm-toll-latest.onrender.com', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      
      // Announce user is online
      newSocket.emit('user-online', {
        userId,
        userName,
        userAvatar
      });

      // Start heartbeat
      startHeartbeat(newSocket);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      stopHeartbeat();
    });

    // Handle presence list
    newSocket.on('presence-list', (presenceList: PresenceData[]) => {
      setOnlineUsers(presenceList.filter(p => p.userId !== userId));
    });

    // Handle presence updates
    newSocket.on('presence-update', (data: { userId: string; userName?: string; userAvatar?: string; status: string; timestamp: Date }) => {
      if (data.userId !== userId) {
        setOnlineUsers(prev => {
          const existing = prev.find(u => u.userId === data.userId);
          if (existing) {
            return prev.map(u => 
              u.userId === data.userId 
                ? { ...u, status: data.status as any, lastSeen: data.timestamp }
                : u
            );
          } else if (data.status !== 'offline') {
            return [...prev, {
              userId: data.userId,
              userName: data.userName || 'Unknown',
              userAvatar: data.userAvatar,
              status: data.status as any,
              lastSeen: data.timestamp
            }];
          }
          return prev;
        });
      }
    });

    // Handle user navigation
    newSocket.on('user-navigated', (data: { userId: string; page: string; issueId?: string; timestamp: Date }) => {
      if (data.userId !== userId) {
        setOnlineUsers(prev => 
          prev.map(u => 
            u.userId === data.userId 
              ? { ...u, currentPage: data.page, currentIssueId: data.issueId, lastSeen: data.timestamp }
              : u
          )
        );
      }
    });

    setSocket(newSocket);

    // Setup idle detection
    setupIdleDetection(newSocket);

    return () => {
      stopHeartbeat();
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [userId, userName, userAvatar]);

  const startHeartbeat = (socket: Socket) => {
    heartbeatInterval.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { userId });
      }
    }, 30000); // Every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  const setupIdleDetection = (socket: Socket) => {
    let isIdle = false;

    const resetIdleTimer = () => {
      if (idleTimeout.current) {
        clearTimeout(idleTimeout.current);
      }

      // If user was idle, mark them as back
      if (isIdle && socket.connected) {
        socket.emit('user-back', { userId });
        isIdle = false;
      }

      // Set new idle timeout (5 minutes)
      idleTimeout.current = setTimeout(() => {
        if (socket.connected) {
          socket.emit('user-away', { userId });
          isIdle = true;
        }
      }, 5 * 60 * 1000);
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Initial timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
      if (idleTimeout.current) {
        clearTimeout(idleTimeout.current);
      }
    };
  };

  // Navigate to a page
  const navigate = useCallback((page: string, issueId?: string) => {
    if (socket && isConnected) {
      socket.emit('navigate', {
        userId,
        page,
        issueId
      });
    }
  }, [socket, isConnected, userId]);

  // Get users viewing a specific issue
  const getIssueViewers = useCallback((issueId: string) => {
    return onlineUsers.filter(u => u.currentIssueId === issueId);
  }, [onlineUsers]);

  // Get users on a specific page
  const getPageUsers = useCallback((page: string) => {
    return onlineUsers.filter(u => u.currentPage === page);
  }, [onlineUsers]);

  return {
    isConnected,
    onlineUsers,
    navigate,
    getIssueViewers,
    getPageUsers
  };
};
