import { useState, useEffect } from 'react';
import { Button, Table, Modal, Form, Input, Select, Space, message, Tag, Tooltip, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, BugOutlined, FileTextOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import styled from 'styled-components';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const StyledTable = styled(Table)`
  .ant-table {
    background: white;
    border-radius: 12px;
  }
`;

const IssueLink = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const getIssueTypeIcon = (type: string) => {
  switch (type) {
    case 'bug':
      return <BugOutlined style={{ color: '#EF4444' }} />;
    case 'story':
      return <FileTextOutlined style={{ color: '#10B981' }} />;
    case 'task':
      return <CheckSquareOutlined style={{ color: '#3B82F6' }} />;
    case 'epic':
      return <span style={{ color: '#9333EA', fontWeight: 'bold' }}>⚡</span>;
    default:
      return <FileTextOutlined style={{ color: '#6B7280' }} />;
  }
};

const getIssueTypeColor = (type: string) => {
  switch (type) {
    case 'bug': return 'error';
    case 'story': return 'success';
    case 'task': return 'processing';
    case 'epic': return 'purple';
    default: return 'default';
  }
};

export default function ManualTestCases() {
  const [testCases, setTestCases] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { currentProject } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadTestCases();
    loadIssues();
  }, [currentProject]);

  const loadTestCases = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const res = await api.get('/manual-test-cases', {
        params: { userId, projectId: currentProject?.id }
      });
      setTestCases(res.data || []);
    } catch (error) {
      // Return empty array if API fails
      setTestCases([]);
    } finally {
      setLoading(false);
    }
  };

  const loadIssues = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.get('/issues', {
        params: { userId, projectId: currentProject?.id }
      });
      setIssues(res.data || []);
    } catch (error) {
      setIssues([]);
    }
  };

  const handleSave = async (values: any) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const userId = localStorage.getItem('userId');

      // Find linked issue details
      const linkedIssue = issues.find(i => i.id === values.linkedIssueId);

      const payload = {
        ...values,
        userId,
        projectId: currentProject?.id,
        linkedIssueKey: linkedIssue?.key,
        linkedIssueType: linkedIssue?.type,
        linkedIssueSummary: linkedIssue?.summary
      };

      if (editId) {
        await api.put(`/manual-test-cases/${editId}`, payload);
        message.success('Test case updated successfully');
      } else {
        await api.post('/manual-test-cases', payload);
        message.success('Test case created successfully');
      }
      setOpen(false);
      form.resetFields();
      setEditId(null);
      loadTestCases();
    } catch (error) {
      message.error('Failed to save test case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (tc: any) => {
    form.setFieldsValue({
      ...tc,
      linkedIssueId: tc.linked_issue_id || tc.linkedIssueId
    });
    setEditId(tc.id);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/manual-test-cases/${id}`);
      message.success('Test case deleted successfully');
      loadTestCases();
    } catch (error) {
      message.error('Failed to delete test case');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      render: (title: string, record: any) => (
        <span style={{ fontWeight: 500 }}>{title}</span>
      ),
    },
    {
      title: 'Linked Issue',
      key: 'linkedIssue',
      width: 200,
      render: (_: any, record: any) => {
        const issueKey = record.linked_issue_key || record.linkedIssueKey;
        const issueType = record.linked_issue_type || record.linkedIssueType;
        const issueSummary = record.linked_issue_summary || record.linkedIssueSummary;

        if (!issueKey) return <Tag>No linked issue</Tag>;

        return (
          <IssueLink onClick={() => navigate(`/issue/${issueKey}`)}>
            {getIssueTypeIcon(issueType)}
            <Tag color={getIssueTypeColor(issueType)}>{issueKey}</Tag>
            <Tooltip title={issueSummary}>
              <span style={{ color: '#666', fontSize: 12 }}>
                {issueSummary?.substring(0, 25)}{issueSummary?.length > 25 ? '...' : ''}
              </span>
            </Tooltip>
          </IssueLink>
        );
      }
    },
    {
      title: 'Steps',
      dataIndex: 'steps',
      key: 'steps',
      width: 180,
      ellipsis: true,
      render: (steps: string) => (
        <Tooltip title={steps}>
          <span>{steps?.substring(0, 40)}{steps?.length > 40 ? '...' : ''}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: string) => {
        const colors: Record<string, string> = {
          'High': 'red',
          'Medium': 'orange',
          'Low': 'green'
        };
        return <Tag color={colors[priority] || 'blue'}>{priority}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const colors: Record<string, string> = {
          'Passed': 'success',
          'Failed': 'error',
          'Pending': 'warning',
          'Blocked': 'default'
        };
        return <Tag color={colors[status] || 'default'}>{status || 'Pending'}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Container>
      <Header>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Manual Test Cases</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            Create and manage test cases linked to User Stories, Bugs, and Tasks
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditId(null);
            setOpen(true);
          }}
          style={{ background: 'linear-gradient(to right, #0284C7, #0EA5E9)', borderColor: '#0EA5E9', color: '#FFFFFF' }}
        >
          Create Test Case
        </Button>
      </Header>

      <StyledTable
        columns={columns}
        dataSource={testCases}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'No test cases yet. Create one to get started!' }}
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckSquareOutlined style={{ color: '#0EA5E9' }} />
            {editId ? 'Edit Test Case' : 'Create Test Case'}
          </div>
        }
        open={open}
        confirmLoading={submitting}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setEditId(null);
        }}
        onOk={() => form.submit()}
        width={700}
        okText={editId ? 'Update' : 'Create'}
        okButtonProps={{ style: { background: '#0EA5E9' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ priority: 'Medium', status: 'Pending' }}
        >
          <Form.Item
            name="title"
            label="Test Case Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="e.g., Verify login with valid credentials" />
          </Form.Item>

          {/* Linked Issue Dropdown */}
          <Form.Item
            name="linkedIssueId"
            label={
              <span>
                <LinkOutlined /> Linked Issue (User Story / Bug / Task)
              </span>
            }
          >
            <Select
              placeholder="Select an issue to link"
              showSearch
              allowClear
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as any)?.props?.children?.toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {issues.map(issue => (
                <Select.Option key={issue.id} value={issue.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getIssueTypeIcon(issue.type)}
                    <Tag color={getIssueTypeColor(issue.type)} style={{ marginRight: 0 }}>{issue.key}</Tag>
                    <span style={{ color: '#666' }}>{issue.summary?.substring(0, 40)}</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input.TextArea rows={2} placeholder="Brief description of what this test case covers" />
          </Form.Item>

          <Form.Item
            name="steps"
            label="Test Steps"
            rules={[{ required: true, message: 'Please enter test steps' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="1. Navigate to login page&#10;2. Enter valid username&#10;3. Enter valid password&#10;4. Click Login button"
            />
          </Form.Item>

          <Form.Item
            name="expectedResult"
            label="Expected Result"
          >
            <Input.TextArea rows={2} placeholder="User should be redirected to dashboard" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select>
                <Select.Option value="Low">
                  <Tag color="green">Low</Tag>
                </Select.Option>
                <Select.Option value="Medium">
                  <Tag color="orange">Medium</Tag>
                </Select.Option>
                <Select.Option value="High">
                  <Tag color="red">High</Tag>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              style={{ flex: 1 }}
            >
              <Select placeholder="Select status">
                <Select.Option value="Pending">
                  <Tag color="warning">Pending</Tag>
                </Select.Option>
                <Select.Option value="Passed">
                  <Tag color="success">Passed</Tag>
                </Select.Option>
                <Select.Option value="Failed">
                  <Tag color="error">Failed</Tag>
                </Select.Option>
                <Select.Option value="Blocked">
                  <Tag>Blocked</Tag>
                </Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Container>
  );
}
