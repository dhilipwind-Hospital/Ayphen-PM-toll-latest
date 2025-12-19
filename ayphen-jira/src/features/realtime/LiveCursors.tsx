import React, { useEffect, useState } from 'react';
import { Avatar, Tooltip } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
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
    // Simulate live cursors with a longer interval to reduce "popping"
    const interval = setInterval(() => {
      setCursors([
        {
          userId: '1',
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 100),
          user: { id: '1', name: 'Sarah', color: '#1890ff' }
        },
        {
          userId: '2',
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 100),
          user: { id: '2', name: 'Mike', color: '#52c41a' }
        }
      ]);
    }, 5000); // Increased to 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      <AnimatePresence>
        {cursors.map(cursor => (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              left: cursor.x,
              top: cursor.y
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              duration: 2, // Smooth movement over 2 seconds
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              pointerEvents: 'none'
            }}
          >
            <Tooltip title={`${cursor.user.name} is working...`} open={true}>
              <Avatar
                size="small"
                style={{
                  backgroundColor: cursor.user.color,
                  boxShadow: `0 0 0 2px white, 0 4px 12px ${cursor.user.color}40`,
                  border: `2px solid ${cursor.user.color}`
                }}
              >
                {cursor.user.name[0]}
              </Avatar>
            </Tooltip>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};