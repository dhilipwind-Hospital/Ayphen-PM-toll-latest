import React, { useEffect, useState } from 'react';
import { List, Avatar, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import { ENV } from '../../../config/env';

const ActivityItem = styled(List.Item)`
  cursor: pointer;
  &:hover {
    background: #f5f5f5;
  }
`;

interface ActivityStreamGadgetProps {
  gadgetId: string;
  config: any;
}

export const ActivityStreamGadget: React.FC<ActivityStreamGadgetProps> = ({ gadgetId, config }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${ENV.API_URL}/gadgets/${gadgetId}/data/activity-stream`, {
          params: { projectId: config.projectId },
        });
        setActivities(response.data);
      } catch (error) {
        console.error('Error fetching activity stream:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, (config.refreshInterval || 5) * 60 * 1000);
    return () => clearInterval(interval);
  }, [gadgetId, config.projectId, config.refreshInterval]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      issue_created: '📝',
      issue_updated: '✏️',
      comment_added: '💬',
      status_changed: '🔄',
    };
    return icons[type] || '📋';
  };

  return (
    <List
      dataSource={activities}
      renderItem={(activity: any) => (
        <ActivityItem onClick={() => activity.issueKey && navigate(`/issue/${activity.issueKey}`)}>
          <List.Item.Meta
            avatar={<Avatar>{getActivityIcon(activity.type)}</Avatar>}
            title={activity.message}
            description={new Date(activity.timestamp).toLocaleString()}
          />
        </ActivityItem>
      )}
    />
  );
};
