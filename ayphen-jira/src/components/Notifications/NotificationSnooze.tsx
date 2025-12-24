import React from 'react';
import { Dropdown, Menu, Button, message } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ENV } from '../../config/env';

interface NotificationSnoozeProps {
  notificationId: string;
  onSnooze: () => void;
}

export const NotificationSnooze: React.FC<NotificationSnoozeProps> = ({
  notificationId,
  onSnooze,
}) => {
  const handleSnooze = async (minutes: number) => {
    try {
      await axios.post(`${ENV.API_URL}/notifications/${notificationId}/snooze`, {
        minutes,
      });
      message.success(`Notification snoozed for ${minutes > 60 ? `${minutes / 60} hour(s)` : `${minutes} minutes`}`);
      onSnooze();
    } catch (error) {
      message.error('Failed to snooze notification');
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="15" onClick={() => handleSnooze(15)}>
        15 minutes
      </Menu.Item>
      <Menu.Item key="30" onClick={() => handleSnooze(30)}>
        30 minutes
      </Menu.Item>
      <Menu.Item key="60" onClick={() => handleSnooze(60)}>
        1 hour
      </Menu.Item>
      <Menu.Item key="240" onClick={() => handleSnooze(240)}>
        4 hours
      </Menu.Item>
      <Menu.Item key="1440" onClick={() => handleSnooze(1440)}>
        1 day
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button
        type="text"
        size="small"
        icon={<ClockCircleOutlined />}
      >
        Snooze
      </Button>
    </Dropdown>
  );
};
