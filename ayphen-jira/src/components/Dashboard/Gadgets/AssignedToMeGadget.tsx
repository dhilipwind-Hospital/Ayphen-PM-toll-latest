import React, { useEffect, useState } from 'react';
import { List, Tag, Spin, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import { ENV } from '../../../config/env';

const IssueItem = styled(List.Item)`
  cursor: pointer;
  &:hover {
    background: #f5f5f5;
  }
`;

interface AssignedToMeGadgetProps {
  gadgetId: string;
  config: any;
}

export const AssignedToMeGadget: React.FC<AssignedToMeGadgetProps> = ({ gadgetId, config }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const response = await axios.get(`${ENV.API_URL}/gadgets/${gadgetId}/data/assigned-to-me`, {
          params: { userId: currentUser.id },
        });
        setIssues(response.data);
      } catch (error) {
        console.error('Error fetching assigned issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, (config.refreshInterval || 15) * 60 * 1000);
    return () => clearInterval(interval);
  }, [gadgetId, config.refreshInterval]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;
  }

  if (issues.length === 0) {
    return <Empty description="No issues assigned to you" />;
  }

  return (
    <List
      dataSource={issues}
      renderItem={(issue: any) => (
        <IssueItem onClick={() => navigate(`/issue/${issue.key}`)}>
          <List.Item.Meta
            title={<span><strong>{issue.key}</strong> {issue.summary}</span>}
            description={
              <div>
                <Tag color={issue.priority === 'high' ? 'red' : 'blue'}>{issue.priority}</Tag>
                <Tag>{issue.status}</Tag>
                {issue.storyPoints && <Tag color="purple">{issue.storyPoints} pts</Tag>}
              </div>
            }
          />
        </IssueItem>
      )}
    />
  );
};
