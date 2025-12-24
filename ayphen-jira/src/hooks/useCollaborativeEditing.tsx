import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENV } from '../config/env';

interface ActiveUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  color: string;
  joinedAt: Date;
}

interface CursorPosition {
  userId: string;
  userName: string;
  field: string;
  position: number;
  color: string;
}

interface TypingIndicator {
  userId: string;
  userName: string;
  field: string;
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

export const useCollaborativeEditing = (issueId: string, userId: string, userName: string, userAvatar?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(ENV.WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      
      // Join editing session
      newSocket.emit('join-edit-session', {
        issueId,
        userId,
        userName,
        userAvatar
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle active users list
    newSocket.on('active-users', (data: { issueId: string; users: ActiveUser[] }) => {
      setActiveUsers(data.users.filter(u => u.userId !== userId));
    });

    // Handle user joined
    newSocket.on('user-joined', (user: ActiveUser) => {
      if (user.userId !== userId) {
        setActiveUsers(prev => [...prev, user]);
      }
    });

    // Handle user left
    newSocket.on('user-left', (data: { userId: string }) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== data.userId));
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(data.userId);
        return newCursors;
      });
      setTypingUsers(prev => {
        const newTyping = new Map(prev);
        newTyping.delete(data.userId);
        return newTyping;
      });
    });

    // Handle cursor updates
    newSocket.on('cursor-update', (cursor: CursorPosition) => {
      if (cursor.userId !== userId) {
        setCursors(prev => new Map(prev).set(cursor.userId, cursor));
      }
    });

    // Handle edit operations
    newSocket.on('edit-operation', (operation: EditOperation) => {
      // This will be handled by the component using this hook
    });

    // Handle typing indicators
    newSocket.on('typing-start', (data: TypingIndicator) => {
      if (data.userId !== userId) {
        setTypingUsers(prev => new Map(prev).set(`${data.userId}-${data.field}`, data));
      }
    });

    newSocket.on('typing-stop', (data: { userId: string; field: string }) => {
      if (data.userId !== userId) {
        setTypingUsers(prev => {
          const newTyping = new Map(prev);
          newTyping.delete(`${data.userId}-${data.field}`);
          return newTyping;
        });
      }
    });

    // Handle issue updates
    newSocket.on('issue-updated', (update: any) => {
      // This will trigger a refresh in the component
    });

    // Handle conflicts
    newSocket.on('edit-conflict', (conflict: any) => {
      // Show conflict resolution UI
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave-edit-session', { issueId, userId });
        newSocket.close();
      }
    };
  }, [issueId, userId, userName, userAvatar]);

  // Update cursor position
  const updateCursor = useCallback((field: string, position: number) => {
    if (socket && isConnected) {
      socket.emit('cursor-update', {
        issueId,
        userId,
        userName,
        field,
        position
      });
    }
  }, [socket, isConnected, issueId, userId, userName]);

  // Send edit operation
  const sendEditOperation = useCallback((operation: Omit<EditOperation, 'userId' | 'issueId' | 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('edit-operation', {
        ...operation,
        userId,
        issueId,
        timestamp: new Date()
      });
    }
  }, [socket, isConnected, userId, issueId]);

  // Start typing
  const startTyping = useCallback((field: string) => {
    if (socket && isConnected) {
      socket.emit('typing-start', {
        issueId,
        userId,
        userName,
        field
      });
    }
  }, [socket, isConnected, issueId, userId, userName]);

  // Stop typing
  const stopTyping = useCallback((field: string) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', {
        issueId,
        userId,
        field
      });
    }
  }, [socket, isConnected, issueId, userId]);

  return {
    isConnected,
    activeUsers,
    cursors: Array.from(cursors.values()),
    typingUsers: Array.from(typingUsers.values()),
    updateCursor,
    sendEditOperation,
    startTyping,
    stopTyping
  };
};
