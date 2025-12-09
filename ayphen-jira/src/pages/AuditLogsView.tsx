import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Select, Input, Tag } from 'antd';
import { Search, Filter } from 'lucide-react';
import styled from 'styled-components';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Container = styled.div`
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Filters = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: undefined,
    entityType: undefined,
    userId: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });

  useEffect(() => {
    loadLogs();
  }, [filters, pagination.current]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', pagination.pageSize.toString());
      params.append('offset', ((pagination.current - 1) * pagination.pageSize).toString());

      const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/audit?${params}`);
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => {
        const colors: any = {
          create: 'green',
          update: 'blue',
          delete: 'red',
          view: 'default',
          login: 'cyan',
          logout: 'orange',
          access_denied: 'red',
        };
        return <Tag color={colors[action] || 'default'}>{action}</Tag>;
      },
    },
    {
      title: 'Entity Type',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 120,
    },
    {
      title: 'Entity',
      dataIndex: 'entityName',
      key: 'entityName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: any = {
          success: 'green',
          failure: 'red',
          warning: 'orange',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
  ];

  return (
    <Container>
      <Header>
        <h1>Audit Logs</h1>
      </Header>

      <Filters>
        <Select
          style={{ width: 150 }}
          placeholder="Action"
          allowClear
          onChange={(value) => setFilters({ ...filters, action: value })}
        >
          <Option value="create">Create</Option>
          <Option value="update">Update</Option>
          <Option value="delete">Delete</Option>
          <Option value="view">View</Option>
          <Option value="login">Login</Option>
          <Option value="logout">Logout</Option>
          <Option value="access_denied">Access Denied</Option>
        </Select>

        <Select
          style={{ width: 150 }}
          placeholder="Entity Type"
          allowClear
          onChange={(value) => setFilters({ ...filters, entityType: value })}
        >
          <Option value="issue">Issue</Option>
          <Option value="project">Project</Option>
          <Option value="user">User</Option>
          <Option value="comment">Comment</Option>
          <Option value="sprint">Sprint</Option>
          <Option value="permission">Permission</Option>
        </Select>

        <Input
          style={{ width: 200 }}
          placeholder="User ID"
          prefix={<Search size={16} />}
          onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
        />

        <RangePicker
          onChange={(dates) => {
            if (dates) {
              setFilters({
                ...filters,
                startDate: dates[0]?.toISOString(),
                endDate: dates[1]?.toISOString(),
              });
            } else {
              setFilters({ ...filters, startDate: undefined, endDate: undefined });
            }
          }}
        />
      </Filters>

      <Card>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            onChange: (page) => setPagination({ ...pagination, current: page }),
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </Container>
  );
};
