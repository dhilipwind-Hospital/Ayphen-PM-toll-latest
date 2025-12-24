import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message } from 'antd';
import axios from 'axios';
import { ENV } from '../config/env';

interface BulkEditModalProps {
  visible: boolean;
  selectedIssues: any[];
  onClose: (updated?: boolean) => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  visible,
  selectedIssues,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  const loadUsers = async () => {
    try {
      const { data } = await axios.get(`${ENV.API_URL}/auth/users`);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    // Remove null/undefined values
    const updates = Object.entries(values)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    if (Object.keys(updates).length === 0) {
      message.warning('No changes to apply');
      return;
    }

    setLoading(true);
    try {
      await axios.patch(`${ENV.API_URL}/issues/bulk/update`, {
        issueIds: selectedIssues.map(i => i.id),
        updates,
      });

      message.success(`${selectedIssues.length} issues updated successfully`);
      form.resetFields();
      onClose(true);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update issues');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Bulk Edit (${selectedIssues.length} issues)`}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose(false);
      }}
      footer={null}
      width={600}
    >
      <p style={{ marginBottom: 24, color: '#8c8c8c' }}>
        Only filled fields will be updated. Empty fields will remain unchanged.
      </p>

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item name="status" label="Status">
          <Select allowClear placeholder="Keep current">
            <Select.Option value="todo">To Do</Select.Option>
            <Select.Option value="inprogress">In Progress</Select.Option>
            <Select.Option value="inreview">In Review</Select.Option>
            <Select.Option value="done">Done</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="Priority">
          <Select allowClear placeholder="Keep current">
            <Select.Option value="lowest">Lowest</Select.Option>
            <Select.Option value="low">Low</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="highest">Highest</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="assigneeId" label="Assignee">
          <Select 
            allowClear 
            placeholder="Keep current"
            showSearch
            filterOption={(input, option) =>
              (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {users.map(user => (
              <Select.Option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="labels" label="Labels">
          <Select 
            mode="tags" 
            allowClear 
            placeholder="Keep current"
            tokenSeparators={[',']}
          />
        </Form.Item>

        <Form.Item name="storyPoints" label="Story Points">
          <Select allowClear placeholder="Keep current">
            <Select.Option value={1}>1</Select.Option>
            <Select.Option value={2}>2</Select.Option>
            <Select.Option value={3}>3</Select.Option>
            <Select.Option value={5}>5</Select.Option>
            <Select.Option value={8}>8</Select.Option>
            <Select.Option value={13}>13</Select.Option>
            <Select.Option value={21}>21</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            Update {selectedIssues.length} Issues
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
