import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message } from 'antd';
import { issuesApi } from '../../services/api';
import axios from 'axios';

interface IssueLinkModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  sourceIssueId: string;
  projectId: string;
}

export const IssueLinkModal: React.FC<IssueLinkModalProps> = ({
  open,
  onCancel,
  onSuccess,
  sourceIssueId,
  projectId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) {
      loadIssues();
    }
  }, [open, projectId]);

  const loadIssues = async () => {
    setSearching(true);
    try {
      const response = await issuesApi.getAll({ projectId });
      // Filter out self
      const filteredIssues = response.data.filter((i: any) => i.id !== sourceIssueId);
      setIssues(filteredIssues);
    } catch (error) {
      console.error('Failed to load issues', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8500/api/issue-links', {
        sourceIssueId,
        targetIssueId: values.targetIssueId,
        linkType: values.linkType,
        userId: localStorage.getItem('userId')
      });
      
      message.success('Issue linked successfully');
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to link issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Link Issue"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="linkType"
          label="This issue"
          rules={[{ required: true, message: 'Please select relationship type' }]}
        >
          <Select placeholder="Select relationship">
            <Select.Option value="blocks">blocks</Select.Option>
            <Select.Option value="blocked_by">is blocked by</Select.Option>
            <Select.Option value="relates_to">relates to</Select.Option>
            <Select.Option value="duplicates">duplicates</Select.Option>
            <Select.Option value="caused_by">is caused by</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="targetIssueId"
          label="Issue"
          rules={[{ required: true, message: 'Please select an issue' }]}
        >
          <Select
            showSearch
            placeholder="Select issue"
            optionFilterProp="children"
            loading={searching}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={issues.map(issue => ({
              value: issue.id,
              label: `${issue.key} - ${issue.summary}`
            }))}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Link
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
