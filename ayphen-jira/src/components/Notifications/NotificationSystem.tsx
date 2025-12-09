import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Avatar, Button, Typography, Tag, Empty, Switch, message } from 'antd';
import { Bell, Check, X, Settings, Filter } from 'lucide-react';
import styled from 'styled-components';

const NotificationButton = styled(Button)`
  border: none;
  background: transparent;
  color: #EC4899;
  
  &:hover {
    background: rgba(244, 114, 182, 0.1);
    color: #DB2777;
  }
`;

const NotificationPanel = styled.div`
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(244, 114, 182, 0.15);
  border: 1px solid rgba(244, 114, 182, 0.1);
`;

const NotificationHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid rgba(244, 114, 182, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationItem = styled.div<{ isRead: boolean }>`
  padding: 12px 20px;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  background: ${props => props.isRead ? 'white' : 'rgba(244, 114, 182, 0.02)'};
  
  &:hover {
    background: rgba(244, 114, 182, 0.05);
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [aiFiltered, setAiFiltered] = useState<{
    critical: Notification[];
    important: Notification[];
    batched: Notification[];
  } | null>(null);
  const [isAiFiltering, setIsAiFiltering] = useState(false);
  const [useAiFilter, setUseAiFilter] = useState(false);

  // Initial mock data
  const initialNotifications: Notification[] = [
    {
      id: '1',
      type: 'assignment',
      title: 'New Issue Assigned',
      message: 'You have been assigned to PROJ-123: Implement user dashboard',
      user: 'John Doe',
      timestamp: '5 minutes ago',
      isRead: false,
      issueKey: 'PROJ-123',
      priority: 'high'
    },
    {
      id: '2',
      type: 'comment',
      title: 'New Comment',
      message: 'Jane Smith commented on PROJ-122: "Great work on the implementation!"',
      user: 'Jane Smith',
      timestamp: '15 minutes ago',
      isRead: false,
      issueKey: 'PROJ-122'
    },
    {
      id: '3',
      type: 'mention',
      title: 'You were mentioned',
      message: 'Mike Johnson mentioned you in PROJ-121: "Can you review this @you?"',
      user: 'Mike Johnson',
      timestamp: '1 hour ago',
      isRead: true,
      issueKey: 'PROJ-121'
    },
    {
      id: '4',
      type: 'status_change',
      title: 'Status Updated',
      message: 'PROJ-120 status changed from "In Progress" to "Done"',
      user: 'Sarah Wilson',
      timestamp: '2 hours ago',
      isRead: true,
      issueKey: 'PROJ-120'
    },
    {
      id: '5',
      type: 'deadline',
      title: 'Deadline Approaching',
      message: 'PROJ-119 is due in 2 days',
      user: 'System',
      timestamp: '3 hours ago',
      isRead: false,
      issueKey: 'PROJ-119',
      priority: 'medium'
    }
  ];

  useEffect(() => {
    setNotifications(initialNotifications);
  }, []);

  const applyAiFilter = async () => {
    if (!notifications.length) return;

    setIsAiFiltering(true);
    try {
      const response = await fetch('http://localhost:8500/api/ai-notification-filter/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user', // TODO: Get actual user ID
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
    if (useAiFilter && !aiFiltered) {
      applyAiFilter();
    }
  }, [useAiFilter]);

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

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = useAiFilter && aiFiltered
    ? [...aiFiltered.critical, ...aiFiltered.important, ...aiFiltered.batched]
    : notifications.filter(n => {
      if (filter === 'unread') return !n.isRead;
      return true;
    });

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'comment',
        title: 'New Activity',
        message: 'New activity in your projects',
        user: 'System',
        timestamp: 'Just now',
        isRead: false
      };

      // Randomly add notifications (10% chance every 30 seconds)
      if (Math.random() < 0.1) {
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const notificationMenu = (
    <NotificationPanel>
      <NotificationHeader>
        <div>
          <Typography.Title level={5} style={{ margin: 0, color: '#EC4899' }}>
            Notifications
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            {unreadCount} unread
          </Typography.Text>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: useAiFilter ? '#EC4899' : '#9CA3AF' }}>AI Filter</span>
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
            style={{ color: '#EC4899' }}
          >
            {filter === 'all' ? 'Unread' : 'All'}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<Check size={14} />}
            onClick={markAllAsRead}
            style={{ color: '#EC4899' }}
          >
            Mark All Read
          </Button>
        </div>
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
                        <Tag color="pink">{notification.issueKey}</Tag>
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

      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(244, 114, 182, 0.1)' }}>
        <Button
          type="link"
          size="small"
          icon={<Settings size={14} />}
          style={{ color: '#EC4899', padding: 0 }}
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