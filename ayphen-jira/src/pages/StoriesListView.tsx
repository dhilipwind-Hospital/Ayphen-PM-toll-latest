import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Table, Tag, Button, Select, Space, message, Spin, Progress, Badge } from 'antd';
import { Search, Plus, Filter, Download, FileText, TestTube, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { aiTestCasesApi } from '../services/ai-test-automation-api';
import { api } from '../services/api';
import { TableSkeleton } from '../components/Loading/SkeletonLoaders';

const Container = styled.div`
  padding: 0;
  background: #fff;
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;

  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
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

const StoryKey = styled.div`
  font-weight: 600;
  color: #0052CC;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StorySummary = styled.div`
  color: #172B4D;
  font-size: 14px;
  margin-top: 4px;
`;

const FilterBar = styled.div`
  padding: 16px 32px;
  background: #fff;
  border-bottom: 1px solid #F4F5F7;
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

export const StoriesListView: React.FC = () => {
  const navigate = useNavigate();
  const { issues, currentProject } = useStore();
  const [loading, setLoading] = useState(false);
  // const [stories, setStories] = useState<any[]>([]); // REPLACED by useMemo
  // const [filteredStories, setFilteredStories] = useState<any[]>([]); // REPLACED by useMemo
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [testCasesMap, setTestCasesMap] = useState<Record<string, number>>({});
  const [bugsMap, setBugsMap] = useState<Record<string, number>>({});

  // Derive stories from store issues
  const stories = React.useMemo(() => {
    if (!currentProject) return [];
    return issues.filter(
      issue => issue.type === 'story' && issue.projectId === currentProject.id
    );
  }, [issues, currentProject]);

  // Derived filtered stories
  const filteredStories = React.useMemo(() => {
    let filtered = [...stories];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(story => story.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(story => story.priority === priorityFilter);
    }

    return filtered;
  }, [stories, statusFilter, priorityFilter]);

  // Load test cases ONLY when project changes
  useEffect(() => {
    if (Date.now() - (window as any)._lastTestCaseFetch < 5000) return; // Simple throttle
    if (stories.length > 0) {
      loadTestCasesCount(stories);
      (window as any)._lastTestCaseFetch = Date.now();
    }
  }, [currentProject?.id]); // Only re-fetch if project changes

  // Update bugs count when issues change (cheap in-memory operation)
  useEffect(() => {
    if (stories.length > 0) {
      loadBugsCount(stories);
    }
  }, [stories, issues]); // Recalculate if issues change

  // Refresh issues from server
  const refreshIssues = async () => {
    if (!currentProject) return;
    try {
      // Use issuesApi which is likely imported or api directly
      const res = await api.get('/issues', { params: { projectId: currentProject.id } });
      const { setIssues } = useStore.getState();
      setIssues(res.data);
    } catch (e) {
      console.error('Failed to refresh issues', e);
    }
  };

  // Initial load if issues are empty
  useEffect(() => {
    if (currentProject && issues.length === 0) {
      refreshIssues();
    }
  }, [currentProject]); // Run once when project loads

  const loadTestCasesCount = async (userStories: any[]) => {
    try {
      // Load AI stories to map issueId to AI story ID
      const aiStoriesRes = await api.get('/ai-test-automation/stories');
      const aiStories = aiStoriesRes.data || [];

      // Load all test cases
      const testCasesRes = await aiTestCasesApi.getAll();
      const allTestCases = testCasesRes.data;

      // Count test cases per story
      const countsMap: Record<string, number> = {};
      userStories.forEach(story => {
        const aiStory = aiStories.find((s: any) => s.issueId === story.id);
        if (aiStory) {
          const count = allTestCases.filter((tc: any) => tc.storyId === aiStory.id).length;
          countsMap[story.id] = count;
        } else {
          countsMap[story.id] = 0;
        }
      });

      setTestCasesMap(countsMap);
    } catch (error) {
      console.error('Failed to load test cases count:', error);
    }
  };

  const loadBugsCount = (userStories: any[]) => {
    // Count bugs (child issues) for each story
    const countsMap: Record<string, number> = {};
    userStories.forEach(story => {
      const bugsCount = issues.filter(
        issue => issue.type === 'bug' && issue.parentId === story.id
      ).length;
      countsMap[story.id] = bugsCount;
    });
    setBugsMap(countsMap);
  };



  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'todo': 'default',
      'in-progress': 'processing',
      'in-review': 'warning',
      'done': 'success',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'highest': 'red',
      'high': 'orange',
      'medium': 'blue',
      'low': 'green',
      'lowest': 'default',
    };
    return colors[priority] || 'default';
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 120,
      render: (key: string, record: any) => (
        <StoryKey onClick={() => navigate(`/issue/${key}`)}>
          {key}
        </StoryKey>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      width: 400,
      render: (summary: string) => (
        <StorySummary>{summary}</StorySummary>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status?.replace('-', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Story Points',
      dataIndex: 'storyPoints',
      key: 'storyPoints',
      width: 120,
      align: 'center' as const,
      render: (points: number) => (
        <strong>{points || '-'}</strong>
      ),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 150,
      render: (assignee: any) => (
        <span style={{ color: '#5E6C84' }}>
          {assignee?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      title: 'Epic',
      dataIndex: 'epic',
      key: 'epic',
      width: 150,
      render: (epic: any) => epic ? (
        <Tag color="purple" style={{ cursor: 'pointer' }} onClick={() => navigate(`/epic/${epic.id}`)}>
          {epic.name}
        </Tag>
      ) : (
        <span style={{ color: '#999' }}>-</span>
      ),
    },
    {
      title: 'Test Cases',
      key: 'testCases',
      width: 120,
      align: 'center' as const,
      render: (_, record: any) => {
        const count = testCasesMap[record.id] || 0;
        return count > 0 ? (
          <Badge
            count={count}
            style={{ backgroundColor: '#52c41a', cursor: 'pointer' }}
            onClick={() => navigate('/ai-test-automation/test-cases')}
          >
            <TestTube size={18} color="#52c41a" />
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
      render: (_, record: any) => {
        const count = bugsMap[record.id] || 0;
        return count > 0 ? (
          <Badge
            count={count}
            style={{ backgroundColor: '#ff4d4f', cursor: 'pointer' }}
            onClick={() => navigate(`/bugs?parentId=${record.id}`)}
          >
            <Bug size={18} color="#ff4d4f" />
          </Badge>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        );
      },
    },
  ];

  return (
    <Container>
      <Header>
        <Title>
          <FileText size={20} />
          User Stories
        </Title>
        <Space>
          <Button icon={<Download size={16} />}>
            Export
          </Button>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateModalOpen(true)}
            style={{ color: '#FFFFFF' }}
          >
            Create Story
          </Button>
        </Space>
      </Header>

      <FilterBar>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          placeholder="All Status"
        >
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="todo">To Do</Select.Option>
          <Select.Option value="in-progress">In Progress</Select.Option>
          <Select.Option value="in-review">In Review</Select.Option>
          <Select.Option value="done">Done</Select.Option>
        </Select>
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          style={{ width: 150 }}
          placeholder="All Priority"
        >
          <Select.Option value="all">All Priority</Select.Option>
          <Select.Option value="highest">Highest</Select.Option>
          <Select.Option value="high">High</Select.Option>
          <Select.Option value="medium">Medium</Select.Option>
          <Select.Option value="low">Low</Select.Option>
          <Select.Option value="lowest">Lowest</Select.Option>
        </Select>
        <Button
          icon={<Filter size={16} />}
          onClick={() => {
            setStatusFilter('all');
            setPriorityFilter('all');
          }}
        >
          Clear Filters
        </Button>
      </FilterBar>

      <TableContainer>
        {loading ? (
          <div style={{ padding: 24 }}>
            <TableSkeleton columns={6} rows={8} />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredStories}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showTotal: (total) => `Total ${total} stories`,
              showSizeChanger: true,
            }}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row style={{ background: '#FAFBFC' }}>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <strong>Total: {filteredStories.length} stories</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <strong>
                      {filteredStories.filter(s => s.status === 'done').length} completed
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4}>
                    <strong>
                      {filteredStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)} pts
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} colSpan={2} />
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
          refreshIssues();
        }}
        defaultType="story"
      />
    </Container>
  );
};
