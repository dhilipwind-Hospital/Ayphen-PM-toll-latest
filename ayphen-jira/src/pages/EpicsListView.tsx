import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Table, Tag, Button, Select, message, Spin, Progress, Tooltip, Space, Badge } from 'antd';
import { Plus, TrendingUp, Eye, FileText, Bug } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CreateIssueModal } from '../components/CreateIssueModal';
import axios from 'axios';

const Container = styled.div`
  padding: 0;
  background: #fff;
  min-height: calc(100vh - 56px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #172B4D;
`;

const TableContainer = styled.div`
  padding: 0;
  background: #fff;
  
  .ant-table {
    font-size: 14px;
  }
  
  .ant-table-thead > tr > th {
    background: #F4F5F7;
    color: #5E6C84;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    border-bottom: 2px solid #DFE1E6;
    padding: 12px 16px;
  }
  
  .ant-table-tbody > tr > td {
    padding: 16px;
    border-bottom: 1px solid #F4F5F7;
  }
  
  .ant-table-tbody > tr:hover > td {
    background: #F4F5F7;
  }
`;

const EpicKey = styled.div`
  font-weight: 600;
  color: #0052CC;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EpicSummary = styled.div`
  color: #172B4D;
  font-size: 14px;
  margin-top: 4px;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #5E6C84;
`;

const API_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

export const EpicsListView: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, issues } = useStore();
  const [loading, setLoading] = useState(false);
  const [epics, setEpics] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [storyCounts, setStoryCounts] = useState<Record<string, {stories: number, bugs: number}>>({});
  
  const projectId = currentProject?.id || 'default-project';
  
  useEffect(() => {
    loadEpics();
  }, [projectId]);
  
  useEffect(() => {
    calculateStoryCounts();
  }, [epics, issues]);
  
  const calculateStoryCounts = () => {
    const counts: Record<string, {stories: number, bugs: number}> = {};
    epics.forEach(epic => {
      const stories = issues.filter(i => 
        i.type === 'story' && (i as any).epicId === epic.id
      ).length;
      const bugs = issues.filter(i => 
        i.type === 'bug' && (i as any).epicId === epic.id
      ).length;
      counts[epic.id] = { stories, bugs };
    });
    setStoryCounts(counts);
  };
  
  const loadEpics = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`${API_URL}/epics?projectId=${projectId}&userId=${userId}`);
      setEpics(response.data);
    } catch (error) {
      console.error('Failed to load epics:', error);
      message.error('Failed to load epics');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredEpics = epics.filter(epic => {
    if (filter === 'active') return epic.progress < 100;
    if (filter === 'completed') return epic.progress === 100;
    return true;
  });
  
  const columns = [
    {
      title: 'Epic',
      dataIndex: 'key',
      key: 'key',
      width: 300,
      render: (key: string, record: any) => (
        <div>
          <EpicKey onClick={() => navigate(`/epic/${record.id}`)}>
            {key}
          </EpicKey>
          <EpicSummary>{record.summary}</EpicSummary>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusColors: Record<string, string> = {
          'backlog': 'purple',
          'todo': 'default',
          'in-progress': 'processing',
          'done': 'success',
        };
        return (
          <Tag color={statusColors[status] || 'default'}>
            {status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 250,
      render: (progress: number, record: any) => (
        <div>
          <StatsRow>
            <span>{record.completedCount || 0} / {record.childCount || 0} issues</span>
          </StatsRow>
          <Progress 
            percent={progress || 0} 
            size="small" 
            strokeColor="#0052CC"
            style={{ marginTop: 4 }}
          />
        </div>
      ),
    },
    {
      title: 'Stories',
      key: 'stories',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const count = storyCounts[record.id]?.stories || 0;
        return count > 0 ? (
          <Badge 
            count={count}
            style={{ backgroundColor: '#52c41a' }}
          >
            <FileText size={18} color="#52c41a" />
          </Badge>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        );
      },
    },
    {
      title: 'Bugs',
      key: 'bugs',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const count = storyCounts[record.id]?.bugs || 0;
        return count > 0 ? (
          <Badge 
            count={count}
            style={{ backgroundColor: '#ff4d4f' }}
          >
            <Bug size={18} color="#ff4d4f" />
          </Badge>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        );
      },
    },
    {
      title: 'Story Points',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      width: 150,
      align: 'center' as const,
      render: (totalPoints: number, record: any) => (
        <div style={{ textAlign: 'center' }}>
          <strong>{record.completedPoints || 0} / {totalPoints || 0}</strong>
        </div>
      ),
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 180,
      render: (record: any) => (
        <div style={{ fontSize: 12, color: '#5E6C84' }}>
          {record.startDate && record.endDate ? (
            <>
              <div>{new Date(record.startDate).toLocaleDateString()}</div>
              <div>→ {new Date(record.endDate).toLocaleDateString()}</div>
            </>
          ) : (
            <span>No dates set</span>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center' as const,
      render: (record: any) => (
        <Button
          type="link"
          icon={<Eye size={16} />}
          onClick={() => navigate(`/epic/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];
  
  return (
    <Container>
      <Header>
        <Title>
          <TrendingUp size={28} color="#1890ff" />
          Epics
        </Title>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 150 }}
            options={[
              { label: 'All Epics', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Completed', value: 'completed' },
            ]}
          />
          <Button 
            type="primary" 
            icon={<Plus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Epic
          </Button>
        </div>
      </Header>
      
      <TableContainer>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="Loading epics..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredEpics}
            rowKey="id"
            pagination={{ 
              pageSize: 20,
              showTotal: (total) => `Total ${total} epics`,
              showSizeChanger: true,
            }}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row style={{ background: '#FAFBFC' }}>
                  <Table.Summary.Cell index={0}>
                    <strong>Total: {filteredEpics.length} epics</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} />
                  <Table.Summary.Cell index={2}>
                    <strong>
                      {filteredEpics.length > 0 ? Math.round(
                        filteredEpics.reduce((sum, e) => sum + (e.progress || 0), 0) / 
                        filteredEpics.length
                      ) : 0}% avg
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <strong>
                      {filteredEpics.reduce((sum, e) => sum + (e.completedPoints || 0), 0)} / 
                      {filteredEpics.reduce((sum, e) => sum + (e.totalPoints || 0), 0)} pts
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} colSpan={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        )}
      </TableContainer>

      <CreateIssueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          loadEpics();
        }}
        defaultType="epic"
      />
    </Container>
  );
};
