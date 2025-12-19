import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Avatar, Button, Typography, Tag, Empty, Switch, message } from 'antd';
import { Bell, Check, X, Settings, Filter } from 'lucide-react';
import styled from 'styled-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const NotificationButton = styled(Button)`
  border: none;
  background: transparent;
  color: #0EA5E9;
  
  &:hover {
    background: rgba(14, 165, 233, 0.1);
    color: #0284C7;
  }
`;

const NotificationPanel = styled.div`
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(14, 165, 233, 0.15);
  border: 1px solid rgba(14, 165, 233, 0.1);
`;

const NotificationHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid rgba(14, 165, 233, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const HeaderTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-width: 100px;
`;

const HeaderActionSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const NotificationItem = styled.div<{ isRead: boolean }>`
  padding: 12px 20px;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  background: ${props => props.isRead ? 'white' : 'rgba(14, 165, 233, 0.02)'};
  
  &:hover {
    background: rgba(14, 165, 233, 0.05);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const NotificationText = styled.div`
  flex: 1;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'comment' | 'status_change' | 'deadline';
  title: string;
  message: string;
  user: string;
  timestamp: string;
  isRead: boolean;
  issueKey?: string;
  priority?: 'low' | 'medium' | 'high';
}

export const NotificationSystem: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId') || '';

  // Fetch notifications from API with polling
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const response = await api.get('/notifications', {
          params: { userId }
        });
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 20000,
  });

  const [aiFiltered, setAiFiltered] = useState<{
    critical: Notification[];
    important: Notification[];
    batched: Notification[];
  } | null>(null);
  const [isAiFiltering, setIsAiFiltering] = useState(false);
  const [useAiFilter, setUseAiFilter] = useState(false);

  const applyAiFilter = async () => {
    if (!notifications.length) return;

    setIsAiFiltering(true);
    try {
      const response = await fetch('https://ayphen-pm-toll-latest.onrender.com/api/ai-notification-filter/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          notifications: notifications
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiFiltered(data.data);
        message.success(`AI Filtered: ${data.data.critical.length} critical, ${data.data.batched.length} batched`);
      }
    } catch (error) {
      console.error('AI Filter failed:', error);
      message.error('Failed to apply AI filter');
    } finally {
      setIsAiFiltering(false);
    }
  };

  useEffect(() => {
    if (useAiFilter && !aiFiltered && notifications.length > 0) {
      applyAiFilter();
    }
  }, [useAiFilter, notifications]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment': return '👤';
      case 'comment': return '💬';
      case 'mention': return '📢';
      case 'status_change': return '🔄';
      case 'deadline': return '⏰';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, { userId });
      // Optimistically update UI
      queryClient.setQueryData(['notifications', userId], (old: any) =>
        old?.map((n: any) => n.id === id ? { ...n, isRead: true } : n) || []
      );
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      message.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read', { userId });
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      message.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`, { params: { userId } });
      // Optimistically update UI
      queryClient.setQueryData(['notifications', userId], (old: any) =>
        old?.filter((n: any) => n.id !== id) || []
      );
      message.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      message.error('Failed to delete notification');
    }
  };

  const filteredNotifications = useAiFilter && aiFiltered
    ? [...aiFiltered.critical, ...aiFiltered.important, ...aiFiltered.batched]
    : notifications.filter(n => {
      if (filter === 'unread') return !n.isRead;
      return true;
    });

  // DISABLED: Random notification generator was causing unwanted popups
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // ... (removed)
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  const notificationMenu = (
    <NotificationPanel>
      <NotificationHeader>
        <HeaderTitleSection>
          <Typography.Title level={5} style={{ margin: 0, color: '#0EA5E9', fontSize: '15px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            Notifications
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
            {unreadCount} unread
          </Typography.Text>
        </HeaderTitleSection>

        <HeaderActionSection>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4, borderRight: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '11px', color: useAiFilter ? '#0EA5E9' : '#9CA3AF' }}>AI</span>
            <Switch
              size="small"
              checked={useAiFilter}
              onChange={setUseAiFilter}
              loading={isAiFiltering}
            />
          </div>

          <Button
            type="text"
            size="small"
            icon={<Filter size={14} />}
            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            style={{
              color: filter === 'unread' ? '#0EA5E9' : '#6B7280',
              background: filter === 'unread' ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
              fontSize: '11px'
            }}
          >
            {filter === 'unread' ? 'Unread' : 'All'}
          </Button>

          <Button
            type="text"
            size="small"
            onClick={markAllAsRead}
            style={{ color: '#0EA5E9', fontSize: '11px', fontWeight: 500 }}
          >
            Read All
          </Button>
        </HeaderActionSection>
      </NotificationHeader>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: 40 }}>
            <Empty
              description="No notifications"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              isRead={notification.isRead}
              onClick={() => markAsRead(notification.id)}
            >
              <NotificationContent>
                <div style={{ fontSize: '20px' }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <NotificationText>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography.Text strong style={{ fontSize: '13px' }}>
                      {notification.title}
                    </Typography.Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<X size={12} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      style={{ color: '#6B7280' }}
                    />
                  </div>
                  <Typography.Text style={{ fontSize: '12px', color: '#6B7280' }}>
                    {notification.message}
                  </Typography.Text>
                  <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      {notification.timestamp}
                    </Typography.Text>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {notification.issueKey && (
                        <Tag color="cyan">{notification.issueKey}</Tag>
                      )}
                      {notification.priority && (
                        <Tag color={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Tag>
                      )}
                    </div>
                  </div>
                </NotificationText>
              </NotificationContent>
            </NotificationItem>
          ))
        )}
      </div>

      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(14, 165, 233, 0.1)' }}>
        <Button
          type="link"
          size="small"
          icon={<Settings size={14} />}
          style={{ color: '#0EA5E9', padding: 0 }}
          onClick={() => navigate('/settings/notifications')}
        >
          Notification Settings
        </Button>
      </div>
    </NotificationPanel>
  );

  return (
    <Dropdown
      overlay={notificationMenu}
      trigger={['click']}
      placement="bottomRight"
      arrow
    >
      <Badge count={unreadCount} size="small">
        <NotificationButton icon={<Bell size={18} />} />
      </Badge>
    </Dropdown>
  );
};