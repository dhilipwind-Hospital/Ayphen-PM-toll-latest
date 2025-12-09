import React, { useState } from 'react';
import { Card, Table, Tag } from 'antd';
import styled from 'styled-components';
import { JQLEditor } from '../components/Search/JQLEditor';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const ResultsCard = styled(Card)`
  margin-top: 24px;
`;

export const SearchPage: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => (
        <a onClick={() => navigate(`/issue/${key}`)}>{key}</a>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'Done' ? 'green' : status === 'In Progress' ? 'orange' : 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const color = priority === 'High' ? 'red' : priority === 'Medium' ? 'orange' : 'default';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'assigneeId',
      key: 'assigneeId',
    },
  ];

  const handleSearch = (jql: string, issues: any[]) => {
    setSearchQuery(jql);
    setResults(issues);
  };

  return (
    <Container>
      <h1>Advanced Search</h1>
      <JQLEditor onSearch={handleSearch} />
      
      {results.length > 0 && (
        <ResultsCard title={`Search Results (${results.length} issues)`}>
          <Table
            dataSource={results}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        </ResultsCard>
      )}
    </Container>
  );
};
