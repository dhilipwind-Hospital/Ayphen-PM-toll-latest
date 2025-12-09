import React, { useState, useEffect } from 'react';
import { Drawer, List, Badge, Button, Input, Select, message, Tag } from 'antd';
import { Bell, Send, Users, Megaphone } from 'lucide-react';
import styled from 'styled-components';
import { teamNotificationsApi } from '../../services/team-notifications-api';
import { useStore } from '../../store/useStore';

const NotificationItem = styled(List.Item)`
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #f5f5f5; }
`;

const PriorityTag = styled(Tag)<{ priority: string }>`
  ${props => props.priority === 'high' ? 'background: #ff4d4f; color: white;' : 
    props.priority === 'medium' ? 'background: #faad14; color: white;' : 'background: #52c41a; color: white;'}
`;

interface TeamNotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const TeamNotificationPanel: React.FC<TeamNotificationPanelProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendMode, setSendMode] = useState(false);
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const { currentUser, projects } = useStore();

  useEffect(() => {
    if (visible && currentUser) loadNotifications();
  }, [visible, currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await teamNotificationsApi.getTeamNotifications('all', currentUser.id);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !messageText) {
      message.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (selectedTeam) {
        await teamNotificationsApi.notifyTeam(selectedTeam, { title, message: messageText, priority, type: 'team' });
        message.success('Notification sent to team!');
      } else {
        await teamNotificationsApi.broadcast({ title, message: messageText, priority });
        message.success('Broadcast sent to all users!');
      }
      setTitle('');
      setMessageText('');
      setSendMode(false);
      loadNotifications();
    } catch (error) {
      message.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bell size={20} /><span>Team Notifications</span>
        <Badge count={notifications.filter(n => !n.isRead).length} />
      </div>}
      placement="right"
      onClose={onClose}
      open={visible}
      width={450}
      extra={<Button type={sendMode ? 'default' : 'primary'} icon={sendMode ? <Users size={16} /> : <Send size={16} />} 
        onClick={() => setSendMode(!sendMode)}>{sendMode ? 'View' : 'Send'}</Button>}
    >
      {sendMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input placeholder="Notification Title" value={title} onChange={(e) => setTitle(e.target.value)} prefix={<Megaphone size={16} />} />
          <Input.TextArea placeholder="Message" value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} />
          <Select placeholder="Select Team (or broadcast to all)" value={selectedTeam} onChange={setSelectedTeam} allowClear style={{ width: '100%' }}>
            <Select.Option value="">📢 Broadcast to All</Select.Option>
            {projects.map(p => <Select.Option key={p.id} value={p.id}>👥 {p.name} Team</Select.Option>)}
          </Select>
          <Select value={priority} onChange={setPriority} style={{ width: '100%' }}>
            <Select.Option value="low">🟢 Low Priority</Select.Option>
            <Select.Option value="medium">🟡 Medium Priority</Select.Option>
            <Select.Option value="high">🔴 High Priority</Select.Option>
          </Select>
          <Button type="primary" block loading={loading} onClick={handleSendNotification} icon={<Send size={16} />}>Send Notification</Button>
        </div>
      ) : (
        <List loading={loading} dataSource={notifications} renderItem={(item: any) => (
          <NotificationItem>
            <List.Item.Meta
              title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item.title}</span><PriorityTag priority={item.priority}>{item.priority}</PriorityTag>
              </div>}
              description={<div><div>{item.message}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{new Date(item.createdAt).toLocaleString()}</div>
              </div>}
            />
          </NotificationItem>
        )} />
      )}
    </Drawer>
  );
};
