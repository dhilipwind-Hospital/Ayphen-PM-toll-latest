import { useState, useEffect } from 'react';
import { Table, Tag, Spin, Card, Statistic, Row, Col, Button, Empty, Progress, Space, Tooltip } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const StatsRow = styled(Row)`
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  border-radius: 8px;
  
  .ant-statistic-title {
    font-size: 13px;
  }
`;

export default function TestRuns() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentProject } = useStore();

  useEffect(() => {
    if (currentProject) {
      loadRuns();
    }
  }, [currentProject?.id]);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.get('/test-runs', {
        params: { userId, projectId: currentProject?.id }
      });
      setRuns(res.data || []);
    } catch (error) {
      console.error('Failed to load test runs:', error);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: runs.length,
    completed: runs.filter(r => r.status === 'Completed').length,
    running: runs.filter(r => r.status === 'Running' || r.status === 'In Progress').length,
    failed: runs.filter(r => r.status === 'Failed').length,
    passed: runs.filter(r => r.passed_count > 0).reduce((sum, r) => sum + (r.passed_count || 0), 0),
    totalTests: runs.reduce((sum, r) => sum + (r.total_count || 0), 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'running':
      case 'in progress':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} spin />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <PlayCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'running':
      case 'in progress': return 'processing';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    { 
      title: 'Test Suite', 
      dataIndex: 'suite_name', 
      key: 'suite_name',
      render: (name: string, record: any) => (
        <Space>
          {getStatusIcon(record.status)}
          <span style={{ fontWeight: 500 }}>{name || 'Unnamed Suite'}</span>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status || 'Pending'}</Tag>
      )
    },
    {
      title: 'Results',
      key: 'results',
      width: 200,
      render: (_: any, record: any) => {
        const total = record.total_count || 0;
        const passed = record.passed_count || 0;
        const failed = record.failed_count || 0;
        const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        if (total === 0) return <span style={{ color: '#999' }}>No tests</span>;
        
        return (
          <Tooltip title={`${passed} passed, ${failed} failed out of ${total}`}>
            <div style={{ width: 150 }}>
              <Progress 
                percent={percent} 
                size="small" 
                status={failed > 0 ? 'exception' : 'success'}
                format={() => `${passed}/${total}`}
              />
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 100,
      render: (_: any, record: any) => {
        if (!record.started_at || !record.completed_at) return '-';
        const start = new Date(record.started_at).getTime();
        const end = new Date(record.completed_at).getTime();
        const duration = Math.round((end - start) / 1000);
        if (duration < 60) return `${duration}s`;
        return `${Math.floor(duration / 60)}m ${duration % 60}s`;
      }
    },
    {
      title: 'Started',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: 'Completed',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    }
  ];

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <h1 style={{ margin: 0 }}>Test Runs</h1>
          <p style={{ color: '#666', margin: '8px 0 0' }}>
            View and manage test execution history
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadRuns}>Refresh</Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate('/test-suites')}>
            Run New Test
          </Button>
        </Space>
      </Header>

      {/* Statistics Cards */}
      <StatsRow gutter={16}>
        <Col xs={12} sm={6}>
          <StatCard>
            <Statistic 
              title="Total Runs" 
              value={stats.total} 
              prefix={<PlayCircleOutlined />}
            />
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard>
            <Statistic 
              title="Completed" 
              value={stats.completed} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard>
            <Statistic 
              title="Running" 
              value={stats.running} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard>
            <Statistic 
              title="Pass Rate" 
              value={stats.totalTests > 0 ? Math.round((stats.passed / stats.totalTests) * 100) : 0}
              suffix="%"
              valueStyle={{ color: stats.passed / stats.totalTests > 0.8 ? '#52c41a' : '#faad14' }}
            />
          </StatCard>
        </Col>
      </StatsRow>

      {runs.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No test runs yet"
          >
            <Button type="primary" onClick={() => navigate('/test-suites')}>
              Create and Run Test Suite
            </Button>
          </Empty>
        </Card>
      ) : (
        <Card>
          <Table
            columns={columns}
            dataSource={runs}
            rowKey="id"
            onRow={(record: any) => ({
              onClick: () => navigate(`/test-runs/${record.id}`),
              style: { cursor: 'pointer' }
            })}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} runs`,
            }}
          />
        </Card>
      )}
    </Container>
  );
}
