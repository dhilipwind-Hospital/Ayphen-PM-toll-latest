import React from 'react';
import styled from 'styled-components';
import { Badge, Dropdown, Button, Empty, Tag } from 'antd';
import { Bell, Check, X, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationButton = styled(Button)`
  border: none;
  background: transparent;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const NotificationList = styled.div`
  width: 380px;
  max-height: 500px;
  overflow-y: auto;
`;

const NotificationHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
`;

const NotificationItem = styled.div<{ unread?: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  background: ${props => props.unread ? '#e6f7ff' : 'white'};
  
  &:hover {
    background: #f5f5f5;
  }
`;

const NotificationTitle = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const NotificationMessage = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
`;

const NotificationTime = styled.div`
  font-size: 12px;
  color: #999;
`;

const ConnectionStatus = styled.div<{ connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${props => props.connected ? '#52c41a' : '#ff4d4f'};
  padding: 4px 8px;
  background: ${props => props.connected ? '#f6ffed' : '#fff2f0'};
  border-radius: 4px;
`;

const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    issue_created: '📝',
    issue_updated: '✏️',
    comment_added: '💬',
    mention: '@',
    assignment_changed: '👤',
    status_changed: '🔄',
    sprint_started: '🏃',
    sprint_completed: '✅',
  };
  return icons[type] || '🔔';
};

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  
  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    if (notification.issueKey) {
      navigate(`/issue/${notification.issueKey}`);
    } else if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };
  
  const menu = (
    <NotificationList>
      <NotificationHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Notifications</span>
          <ConnectionStatus connected={isConnected}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? 'Live' : 'Offline'}
          </ConnectionStatus>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <Button 
              type="text" 
              size="small" 
              icon={<Check size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              Mark all read
            </Button>
          )}
        </div>
      </NotificationHeader>
      
      {notifications.length > 0 ? (
        notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            unread={!notification.read}
            onClick={() => handleNotificationClick(notification)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{getNotificationIcon(notification.type)}</span>
              <div style={{ flex: 1 }}>
                <NotificationTitle>
                  {notification.title}
                  {!notification.read && (
                    <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>NEW</Tag>
                  )}
                </NotificationTitle>
                <NotificationMessage>{notification.message}</NotificationMessage>
                <NotificationTime>{getTimeAgo(notification.createdAt)}</NotificationTime>
              </div>
            </div>
          </NotificationItem>
        ))
      ) : (
        <div style={{ padding: 40 }}>
          <Empty description="No notifications" />
        </div>
      )}
    </NotificationList>
  );
  
  return (
    <Dropdown dropdownRender={() => menu} trigger={['click']} placement="bottomRight">
      <Badge count={unreadCount} offset={[-5, 5]} size="small" style={{ boxShadow: '0 0 0 2px #fff' }}>
        <NotificationButton>
          <Bell size={20} />
        </NotificationButton>
      </Badge>
    </Dropdown>
  );
};
