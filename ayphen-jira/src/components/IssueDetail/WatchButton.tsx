import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { watchersApi } from '../../services/api';

interface WatchButtonProps {
  issueId: string;
  userId?: string;
}

export const WatchButton: React.FC<WatchButtonProps> = ({ issueId, userId }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUserId = userId || localStorage.getItem('userId');

  useEffect(() => {
    if (currentUserId) {
      checkWatchStatus();
    }
  }, [issueId, currentUserId]);

  const checkWatchStatus = async () => {
    if (!currentUserId) return;
    try {
      const response = await watchersApi.isWatching(issueId, currentUserId);
      setIsWatching(response.data.isWatching);
    } catch (error) {
      console.error('Failed to check watch status:', error);
    }
  };

  const toggleWatch = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      if (isWatching) {
        await watchersApi.unwatch(issueId, currentUserId);
        message.success('Stopped watching issue');
      } else {
        await watchersApi.watch(issueId, currentUserId);
        message.success('Now watching issue');
      }
      setIsWatching(!isWatching);
    } catch (error) {
      message.error('Failed to update watch status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={isWatching ? 'Stop watching' : 'Watch this issue'}>
      <Button
        icon={isWatching ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        onClick={toggleWatch}
        loading={loading}
        type={isWatching ? 'primary' : 'default'}
        size="small"
      >
        {isWatching ? 'Watching' : 'Watch'}
      </Button>
    </Tooltip>
  );
};
