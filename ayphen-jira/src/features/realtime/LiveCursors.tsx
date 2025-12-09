import React, { useEffect, useState } from 'react';
import { Avatar, Tooltip } from 'antd';
import { isFeatureEnabled } from '../../config/features';

interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

interface Cursor {
  userId: string;
  x: number;
  y: number;
  user: User;
}

export const LiveCursors: React.FC = () => {
  const [cursors, setCursors] = useState<Cursor[]>([]);

  if (!isFeatureEnabled('REAL_TIME_COLLABORATION')) return null;

  useEffect(() => {
    // Simulate live cursors
    const interval = setInterval(() => {
      setCursors([
        {
          userId: '1',
          x: Math.random() * 200,
          y: Math.random() * 200,
          user: { id: '1', name: 'Sarah', color: '#1890ff' }
        },
        {
          userId: '2', 
          x: Math.random() * 200,
          y: Math.random() * 200,
          user: { id: '2', name: 'Mike', color: '#52c41a' }
        }
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {cursors.map(cursor => (
        <div
          key={cursor.userId}
          style={{
            position: 'absolute',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <Tooltip title={`${cursor.user.name} is here`}>
            <Avatar 
              size="small" 
              style={{ backgroundColor: cursor.user.color }}
            >
              {cursor.user.name[0]}
            </Avatar>
          </Tooltip>
        </div>
      ))}
    </>
  );
};