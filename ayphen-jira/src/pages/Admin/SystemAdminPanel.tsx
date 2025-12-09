import React, { useState, useEffect } from 'react';
import { Tabs, Card, Statistic, Row, Col, Table, Button, message, Popconfirm, Tag, Space } from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  FileTextOutlined,
  BarChartOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  SwapOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const { TabPane } = Tabs;

const Container = styled.div`
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
`;

const StatsRow = styled(Row)`
  margin-bottom: 24px;
`;

const StyledCard = styled(Card)`
  .ant-card-body {
    padding: 20px;
  }
`;

export const SystemAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const adminId = localStorage.getItem('userId');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/admin/stats?adminId=${adminId}`);
      setStats(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/admin/users?adminId=${adminId}`);
      setUsers(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/admin/analytics/usage?adminId=${adminId}`);
      setAnalytics(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/admin/audit-logs?adminId=${adminId}&limit=100`);
      setAuditLogs(response.data.logs);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await axios.put(`https://ayphen-pm-toll-latest.onrender.com/api/admin/users/${userId}/deactivate`, {
        adminId,
      });
      message.success('User deactivated successfully');
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await axios.put(`https://ayphen-pm-toll-latest.onrender.com/api/admin/users/${userId}/activate`, {
        adminId,
      });
      message.success('User activated successfully');
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await axios.delete(`https://ayphen-pm-toll-latest.onrender.com/api/admin/users/${userId}?adminId=${adminId}`);
      message.success('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await axios.put(`https://ayphen-pm-toll-latest.onrender.com/api/admin/users/${userId}/make-admin`, {
        adminId,
      });
      message.success('User promoted to system admin');
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to promote user');
    }
  };

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Admin',
      dataIndex: 'isSystemAdmin',
      key: 'isSystemAdmin',
      render: (isAdmin: boolean) => (
        isAdmin ? <CrownOutlined style={{ color: '#faad14' }} /> : '-'
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.isActive ? (
            <Popconfirm
              title="Deactivate this user?"
              onConfirm={() => handleDeactivateUser(record.id)}
            >
              <Button size="small" icon={<StopOutlined />}>Deactivate</Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivateUser(record.id)}
            >
              Activate
            </Button>
          )}
          {!record.isSystemAdmin && (
            <Button
              size="small"
              icon={<CrownOutlined />}
              onClick={() => handleMakeAdmin(record.id)}
            >
              Make Admin
            </Button>
          )}
          <Popconfirm
            title="Delete this user? This action cannot be undone."
            onConfirm={() => handleDeleteUser(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const auditColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'User',
      dataIndex: ['user', 'name'],
      key: 'user',
      render: (name: string) => name || 'System',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag>{action}</Tag>,
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (name: string) => name || '-',
    },
  ];

  return (
    <Container>
      <h1 style={{ marginBottom: 24 }}>System Administration</h1>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Dashboard" key="dashboard">
          <StatsRow gutter={16}>
            <Col span={6}>
              <StyledCard>
                <Statistic
                  title="Total Users"
                  value={stats.totalUsers || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </StyledCard>
            </Col>
            <Col span={6}>
              <StyledCard>
                <Statistic
                  title="Active Users"
                  value={stats.activeUsers || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </StyledCard>
            </Col>
            <Col span={6}>
              <StyledCard>
                <Statistic
                  title="Total Projects"
                  value={stats.totalProjects || 0}
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </StyledCard>
            </Col>
            <Col span={6}>
              <StyledCard>
                <Statistic
                  title="Total Issues"
                  value={stats.totalIssues || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </StyledCard>
            </Col>
          </StatsRow>

          <Card title="Recent Activity" loading={loading}>
            <Table
              dataSource={stats.recentActivity || []}
              columns={auditColumns.slice(0, 4)}
              pagination={{ pageSize: 10 }}
              rowKey="id"
            />
          </Card>
        </TabPane>

        <TabPane tab="User Management" key="users">
          <Card title="All Users" extra={<Tag color="blue">{users.length} users</Tag>}>
            <Table
              dataSource={users}
              columns={userColumns}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Analytics" key="analytics">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Projects by Type" loading={loading}>
                <Table
                  dataSource={analytics.projects?.byType || []}
                  columns={[
                    { title: 'Type', dataIndex: 'type', key: 'type' },
                    { title: 'Count', dataIndex: 'count', key: 'count' },
                  ]}
                  pagination={false}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Issues by Status" loading={loading}>
                <Table
                  dataSource={analytics.issues?.byStatus || []}
                  columns={[
                    { title: 'Status', dataIndex: 'status', key: 'status' },
                    { title: 'Count', dataIndex: 'count', key: 'count' },
                  ]}
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Audit Logs" key="audit">
          <Card title="System Audit Logs">
            <Table
              dataSource={auditLogs}
              columns={auditColumns}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 50 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </Container>
  );
};
