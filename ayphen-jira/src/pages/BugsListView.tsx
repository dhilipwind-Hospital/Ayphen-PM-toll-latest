import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Table, Tag, Button, Select, Space, message, Spin, Empty, Tooltip } from 'antd';
import { Plus, Download, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { api } from '../services/api';

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

const BugKey = styled.div`
  font-weight: 600;
  color: #0052CC;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const BugSummary = styled.div`
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

const SeverityTag = styled(Tag) <{ severity: string }>`
  font-weight: 600;
`;

export const BugsListView: React.FC = () => {
  const navigate = useNavigate();
  const { issues, currentProject, isInitialized } = useStore();
  const [loading, setLoading] = useState(false);
  // const [bugs, setBugs] = useState<any[]>([]); // REPLACED by useMemo
  // const [filteredBugs, setFilteredBugs] = useState<any[]>([]); // REPLACED by useMemo
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);

  // Derive bugs from store issues
  const bugs = React.useMemo(() => {
    if (!currentProject) return [];
    return issues.filter(
      issue => issue.type === 'bug' && issue.projectId === currentProject.id
    );
  }, [issues, currentProject]);

  // Derived filtered bugs
  const filteredBugs = React.useMemo(() => {
    let filtered = [...bugs];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bug => bug.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(bug => bug.severity === severityFilter);
    }

    return filtered;
  }, [bugs, statusFilter, severityFilter]);

  // Refresh issues from server
  const refreshIssues = async () => {
    if (!currentProject) return;
    try {
      const res = await api.get('/issues', { params: { projectId: currentProject.id } });
      const { setIssues } = useStore.getState();
      setIssues(res.data);
    } catch (e) {
      console.error('Failed to refresh issues', e);
    }
  };

  // Load workflow statuses
  const loadWorkflow = async () => {
    if (!currentProject) return;
    try {
      const wfId = currentProject.workflowId || 'workflow-1';
      const res = await api.get(`/workflows/${wfId}`);
      setWorkflowStatuses(res.data.statuses || []);
    } catch (e) {
      console.error('Failed to load workflow', e);
    }
  };

  // Initial load
  useEffect(() => {
    if (currentProject) {
      if (issues.length === 0) refreshIssues();
      loadWorkflow();
    }
  }, [currentProject]);

  const getStatusColor = (status: string) => {
    const matched = workflowStatuses.find(s => s.id === status);
    if (!matched) {
      if (status === 'done' || status === 'resolved') return 'success';
      if (status === 'in-progress') return 'processing';
      return 'default';
    }

    if (matched.category === 'DONE') return 'success';
    if (matched.category === 'IN_PROGRESS') return 'processing';
    return 'default';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'critical': 'red',
      'high': 'orange',
      'medium': 'gold',
      'low': 'blue',
    };
    return colors[severity] || 'default';
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
      render: (key: string) => (
        <BugKey onClick={() => navigate(`/issue/${key}`)}>
          {key}
        </BugKey>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      width: 400,
      render: (summary: string) => (
        <BugSummary>{summary}</BugSummary>
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
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <SeverityTag severity={severity} color={getSeverityColor(severity)}>
          {severity?.toUpperCase()}
        </SeverityTag>
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
  ];

  return (
    <Container>
      <Header>
        <Title>
          <Bug size={20} color="#E5493A" />
          Bugs
        </Title>
        <Space>
          <Button icon={<Download size={16} />}>
            Export
          </Button>
          <Tooltip title="Report a new bug">
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setCreateModalOpen(true)}
            >
              Report Bug
            </Button>
          </Tooltip>
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
          {workflowStatuses.map(s => (
            <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
          ))}
        </Select>
        <Select
          value={severityFilter}
          onChange={setSeverityFilter}
          style={{ width: 150 }}
          placeholder="All Severity"
        >
          <Select.Option value="all">All Severity</Select.Option>
          <Select.Option value="critical">Critical</Select.Option>
          <Select.Option value="high">High</Select.Option>
          <Select.Option value="medium">Medium</Select.Option>
          <Select.Option value="low">Low</Select.Option>
        </Select>
        <Button
          onClick={() => {
            setStatusFilter('all');
            setSeverityFilter('all');
          }}
        >
          Clear Filters
        </Button>
      </FilterBar>

      <TableContainer>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="Loading bugs..." />
          </div>
        ) : (
          <Table
            dataSource={filteredBugs}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 20 }}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => navigate(`/issue/${record.key}`),
              style: { cursor: 'pointer' }
            })}
            locale={{
              emptyText: <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No Bugs reported"
              >
                <Button type="primary" onClick={() => setCreateModalOpen(true)}>Report Bug</Button>
              </Empty>
            }}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <strong>Total: {filteredBugs.length} bugs</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <strong>
                      {filteredBugs.filter(b => {
                        const ws = workflowStatuses.find(ws => ws.id === b.status);
                        return ws ? ws.category === 'DONE' : (b.status === 'done' || b.status === 'resolved');
                      }).length} resolved
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <strong style={{ color: '#E5493A' }}>
                      {filteredBugs.filter(b => b.severity === 'critical').length} critical
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} colSpan={3} />
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
        defaultType="bug"
      />
    </Container>
  );
};
