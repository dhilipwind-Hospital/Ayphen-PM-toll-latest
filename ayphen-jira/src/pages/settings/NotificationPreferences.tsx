import React, { useState, useEffect } from 'react';
import { Switch, Select, TimePicker, message, Card, Divider, Space } from 'antd';
import { BellOutlined, MailOutlined, DesktopOutlined, MobileOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  margin-top: 24px;
`;

const PreferenceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const PreferenceLabel = styled.div`
  flex: 1;
`;

const PreferenceTitle = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const PreferenceDescription = styled.div`
  font-size: 13px;
  color: #666;
`;

const QuietHoursRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 12px;
`;

interface NotificationPreferences {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  pushNotifications: boolean;
  doNotDisturb: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  onAssignment: boolean;
  onMention: boolean;
  onComment: boolean;
  onStatusChange: boolean;
  onIssueUpdate: boolean;
  onSprintStart: boolean;
  onSprintComplete: boolean;
}

export const NotificationPreferences: React.FC = () => {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    desktopNotifications: true,
    pushNotifications: false,
    doNotDisturb: false,
    notificationFrequency: 'instant',
    onAssignment: true,
    onMention: true,
    onComment: true,
    onStatusChange: true,
    onIssueUpdate: true,
    onSprintStart: true,
    onSprintComplete: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
    requestNotificationPermission();
  }, []);

  const loadPreferences = async () => {
    if (!currentUser) return;

    try {
      const response = await axios.get(
        `http://localhost:8500/api/notification-preferences/${currentUser.id}`
      );
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: any) => {
    if (!currentUser) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    setLoading(true);
    try {
      await axios.post('http://localhost:8500/api/notification-preferences', {
        userId: currentUser.id,
        ...newPreferences,
      });
      message.success('Preferences updated');
    } catch (error) {
      message.error('Failed to update preferences');
      // Revert on error
      setPreferences(preferences);
    } finally {
      setLoading(false);
    }
  };

  const handleQuietHoursChange = async (type: 'start' | 'end', time: any) => {
    if (!currentUser || !time) return;

    const key = type === 'start' ? 'quietHoursStart' : 'quietHoursEnd';
    const value = time.format('HH:mm');

    await handleToggle(key as any, value);
  };

  return (
    <Container>
      <h1>Notification Preferences</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Manage how you receive notifications about issues, comments, and updates.
      </p>

      <Card>
        <SectionTitle>
          <MailOutlined /> Email Notifications
        </SectionTitle>
        
        <PreferenceRow>
          <PreferenceLabel>
            <PreferenceTitle>Enable Email Notifications</PreferenceTitle>
            <PreferenceDescription>
              Receive email notifications for important updates
            </PreferenceDescription>
          </PreferenceLabel>
          <Switch
            checked={preferences.emailNotifications}
            onChange={(v) => handleToggle('emailNotifications', v)}
            loading={loading}
          />
        </PreferenceRow>

        {preferences.emailNotifications && (
          <>
            <PreferenceRow>
              <PreferenceLabel>
                <PreferenceTitle>Notification Frequency</PreferenceTitle>
                <PreferenceDescription>
                  How often should we send email notifications?
                </PreferenceDescription>
              </PreferenceLabel>
              <Select
                value={preferences.notificationFrequency}
                onChange={(v) => handleToggle('notificationFrequency', v)}
                style={{ width: 150 }}
              >
                <Select.Option value="instant">Instant</Select.Option>
                <Select.Option value="daily">Daily Digest</Select.Option>
                <Select.Option value="weekly">Weekly Digest</Select.Option>
              </Select>
            </PreferenceRow>

            <Divider />
            <SectionTitle>Email me when:</SectionTitle>

            <PreferenceRow>
              <PreferenceLabel>
                <PreferenceTitle>Issue assigned to me</PreferenceTitle>
              </PreferenceLabel>
              <Switch
                checked={preferences.onAssignment}
                onChange={(v) => handleToggle('onAssignment', v)}
              />
            </PreferenceRow>

            <PreferenceRow>
              <PreferenceLabel>
                <PreferenceTitle>I'm mentioned in a comment</PreferenceTitle>
              </PreferenceLabel>
              <Switch
                checked={preferences.onMention}
                onChange={(v) => handleToggle('onMention', v)}
              />
            </PreferenceRow>

            <PreferenceRow>
              <PreferenceLabel>
                <PreferenceTitle>Someone comments on an issue I'm watching</PreferenceTitle>
              </PreferenceLabel>
              <Switch
                checked={preferences.onComment}
                onChange={(v) => handleToggle('onComment', v)}
              />
            </PreferenceRow>

            <PreferenceRow>
              <PreferenceLabel>
                <PreferenceTitle>Issue status changes</PreferenceTitle>
              </PreferenceLabel>
              <Switch
                checked={preferences.onStatusChange}
                onChange={(v) => handleToggle('onStatusChange', v)}
              />
            </PreferenceRow>

            <PreferenceRow>
              <PreferenceLabel>
                <PreferenceTitle>Issue is updated</PreferenceTitle>
              </PreferenceLabel>
              <Switch
                checked={preferences.onIssueUpdate}
                onChange={(v) => handleToggle('onIssueUpdate', v)}
              />
            </PreferenceRow>

            <PreferenceRow>
              <PreferenceLabel>
                <PreferenceTitle>Sprint starts</PreferenceTitle>
              </PreferenceLabel>
              <Switch
                checked={preferences.onSprintStart}
                onChange={(v) => handleToggle('onSprintStart', v)}
              />
            </PreferenceRow>

            <PreferenceRow>
              <PreferenceLabel>
                <PreferenceTitle>Sprint completes</PreferenceTitle>
              </PreferenceLabel>
              <Switch
                checked={preferences.onSprintComplete}
                onChange={(v) => handleToggle('onSprintComplete', v)}
              />
            </PreferenceRow>
          </>
        )}

        <Divider />

        <SectionTitle>
          <DesktopOutlined /> Desktop Notifications
        </SectionTitle>

        <PreferenceRow>
          <PreferenceLabel>
            <PreferenceTitle>Enable Desktop Notifications</PreferenceTitle>
            <PreferenceDescription>
              Show desktop notifications for real-time updates
            </PreferenceDescription>
          </PreferenceLabel>
          <Switch
            checked={preferences.desktopNotifications}
            onChange={(v) => handleToggle('desktopNotifications', v)}
          />
        </PreferenceRow>

        <Divider />

        <SectionTitle>
          <MobileOutlined /> Push Notifications
        </SectionTitle>

        <PreferenceRow>
          <PreferenceLabel>
            <PreferenceTitle>Enable Push Notifications</PreferenceTitle>
            <PreferenceDescription>
              Receive push notifications on your mobile device
            </PreferenceDescription>
          </PreferenceLabel>
          <Switch
            checked={preferences.pushNotifications}
            onChange={(v) => handleToggle('pushNotifications', v)}
          />
        </PreferenceRow>

        <Divider />

        <SectionTitle>
          <BellOutlined /> Quiet Hours
        </SectionTitle>

        <PreferenceRow>
          <PreferenceLabel>
            <PreferenceTitle>Do Not Disturb</PreferenceTitle>
            <PreferenceDescription>
              Pause all notifications temporarily
            </PreferenceDescription>
          </PreferenceLabel>
          <Switch
            checked={preferences.doNotDisturb}
            onChange={(v) => handleToggle('doNotDisturb', v)}
          />
        </PreferenceRow>

        {!preferences.doNotDisturb && (
          <QuietHoursRow>
            <div style={{ flex: 1 }}>
              <PreferenceDescription>
                Set quiet hours to pause notifications during specific times
              </PreferenceDescription>
            </div>
            <Space>
              <TimePicker
                format="HH:mm"
                value={preferences.quietHoursStart ? dayjs(preferences.quietHoursStart, 'HH:mm') : null}
                onChange={(time) => handleQuietHoursChange('start', time)}
                placeholder="Start time"
              />
              <span>to</span>
              <TimePicker
                format="HH:mm"
                value={preferences.quietHoursEnd ? dayjs(preferences.quietHoursEnd, 'HH:mm') : null}
                onChange={(time) => handleQuietHoursChange('end', time)}
                placeholder="End time"
              />
            </Space>
          </QuietHoursRow>
        )}
      </Card>
    </Container>
  );
};
