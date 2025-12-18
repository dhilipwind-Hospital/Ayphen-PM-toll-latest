import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { message } from 'antd';

interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'issue_updated' | 'comment_added' | 'status_changed';
  user: string;
  data: any;
  timestamp: string;
}

export const useRealTimeCollaboration = (issueId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [events, setEvents] = useState<CollaborationEvent[]>([]);

  useEffect(() => {
    const newSocket = io('https://ayphen-pm-toll-latest.onrender.com', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('sessionId'),
      },
    });

    newSocket.on('connect', () => {
      if (issueId) {
        newSocket.emit('join_issue', issueId);
      }
    });

    newSocket.on('user_joined', (data) => {
      setActiveUsers((prev) => [...prev, data.user]);
      message.info(`${data.user} joined`);
    });

    newSocket.on('user_left', (data) => {
      setActiveUsers((prev) => prev.filter((u) => u !== data.user));
    });

    newSocket.on('issue_updated', (data) => {
      setEvents((prev) => [...prev, { type: 'issue_updated', ...data }]);
      message.info(`${data.user} updated the issue`);
    });

    newSocket.on('comment_added', (data) => {
      setEvents((prev) => [...prev, { type: 'comment_added', ...data }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [issueId]);

  const broadcastUpdate = (type: string, data: any) => {
    if (socket) {
      socket.emit('broadcast_update', { type, data, issueId });
    }
  };

  return { socket, activeUsers, events, broadcastUpdate };
};
