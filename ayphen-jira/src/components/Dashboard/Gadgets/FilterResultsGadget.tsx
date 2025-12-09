import React, { useEffect, useState } from 'react';
import { List, Tag, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const IssueItem = styled(List.Item)`
  cursor: pointer;
  &:hover {
    background: #f5f5f5;
  }
`;

interface FilterResultsGadgetProps {
  gadgetId: string;
  config: any;
}

export const FilterResultsGadget: React.FC<FilterResultsGadgetProps> = ({ gadgetId, config }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/gadgets/${gadgetId}/data/filter-results`);
        setIssues(response.data);
      } catch (error) {
        console.error('Error fetching filter results:', error);
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
              </div>
            }
          />
        </IssueItem>
      )}
    />
  );
};
