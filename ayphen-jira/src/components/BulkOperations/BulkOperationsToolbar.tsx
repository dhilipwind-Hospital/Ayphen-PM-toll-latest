import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Select, Modal, Form, Input, message, Tag } from 'antd';
import { Edit, Trash2, Users, Tag as TagIcon, GitBranch, X } from 'lucide-react';
import axios from 'axios';
import { colors } from '../../theme/colors';

const Toolbar = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
  min-width: 600px;
`;

const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
`;

interface BulkOperationsToolbarProps {
  selectedIssueIds: string[];
  onClearSelection: () => void;
  onOperationComplete: () => void;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedIssueIds,
  onClearSelection,
  onOperationComplete,
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [labelsModalVisible, setLabelsModalVisible] = useState(false);
  const [sprintModalVisible, setSprintModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleBulkEdit = async (values: any) => {
    try {
      await axios.post('http://localhost:8500/api/bulk-operations/update', {
        issueIds: selectedIssueIds,
        updates: values,
      });
      message.success(`${selectedIssueIds.length} issues updated successfully`);
      setEditModalVisible(false);
      form.resetFields();
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error bulk updating:', error);
      message.error('Failed to update issues');
    }
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'Delete Issues',
      content: `Are you sure you want to delete ${selectedIssueIds.length} issue(s)? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.post('http://localhost:8500/api/bulk-operations/delete', {
            issueIds: selectedIssueIds,
          });
          message.success(`${selectedIssueIds.length} issues deleted successfully`);
          onOperationComplete();
          onClearSelection();
        } catch (error) {
          console.error('Error bulk deleting:', error);
          message.error('Failed to delete issues');
        }
      },
    });
  };

  const handleBulkAssign = async (values: any) => {
    try {
      await axios.post('http://localhost:8500/api/bulk-operations/assign', {
        issueIds: selectedIssueIds,
        assigneeId: values.assigneeId,
      });
      message.success(`${selectedIssueIds.length} issues assigned successfully`);
      setAssignModalVisible(false);
      form.resetFields();
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error bulk assigning:', error);
      message.error('Failed to assign issues');
    }
  };

  const handleBulkAddLabels = async (values: any) => {
    try {
      const labels = values.labels.split(',').map((l: string) => l.trim()).filter(Boolean);
      await axios.post('http://localhost:8500/api/bulk-operations/add-labels', {
        issueIds: selectedIssueIds,
        labels,
      });
      message.success(`Labels added to ${selectedIssueIds.length} issues`);
      setLabelsModalVisible(false);
      form.resetFields();
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error bulk adding labels:', error);
      message.error('Failed to add labels');
    }
  };

  const handleBulkMoveToSprint = async (values: any) => {
    try {
      await axios.post('http://localhost:8500/api/bulk-operations/move-to-sprint', {
        issueIds: selectedIssueIds,
        sprintId: values.sprintId,
      });
      message.success(`${selectedIssueIds.length} issues moved to sprint`);
      setSprintModalVisible(false);
      form.resetFields();
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error bulk moving to sprint:', error);
      message.error('Failed to move issues to sprint');
    }
  };

  if (selectedIssueIds.length === 0) {
    return null;
  }

  return (
    <>
      <Toolbar>
        <SelectionInfo>
          <Tag color="blue">{selectedIssueIds.length} selected</Tag>
        </SelectionInfo>

        <Actions>
          <Button icon={<Edit size={16} />} onClick={() => setEditModalVisible(true)}>
            Edit
          </Button>
          <Button icon={<Users size={16} />} onClick={() => setAssignModalVisible(true)}>
            Assign
          </Button>
          <Button icon={<TagIcon size={16} />} onClick={() => setLabelsModalVisible(true)}>
            Add Labels
          </Button>
          <Button icon={<GitBranch size={16} />} onClick={() => setSprintModalVisible(true)}>
            Move to Sprint
          </Button>
          <Button danger icon={<Trash2 size={16} />} onClick={handleBulkDelete}>
            Delete
          </Button>
        </Actions>

        <Button
          type="text"
          icon={<X size={16} />}
          onClick={onClearSelection}
        >
          Clear
        </Button>
      </Toolbar>

      {/* Bulk Edit Modal */}
      <Modal
        title={`Edit ${selectedIssueIds.length} Issue(s)`}
        open={editModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleBulkEdit}>
          <Form.Item name="status" label="Status">
            <Select placeholder="Select status">
              <Select.Option value="todo">To Do</Select.Option>
              <Select.Option value="in-progress">In Progress</Select.Option>
              <Select.Option value="done">Done</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select placeholder="Select priority">
              <Select.Option value="lowest">Lowest</Select.Option>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="highest">Highest</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        title={`Assign ${selectedIssueIds.length} Issue(s)`}
        open={assignModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setAssignModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleBulkAssign}>
          <Form.Item
            name="assigneeId"
            label="Assignee"
            rules={[{ required: true, message: 'Please select an assignee' }]}
          >
            <Input placeholder="Enter user ID" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Add Labels Modal */}
      <Modal
        title={`Add Labels to ${selectedIssueIds.length} Issue(s)`}
        open={labelsModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setLabelsModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleBulkAddLabels}>
          <Form.Item
            name="labels"
            label="Labels"
            rules={[{ required: true, message: 'Please enter labels' }]}
          >
            <Input placeholder="Enter labels separated by commas" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Move to Sprint Modal */}
      <Modal
        title={`Move ${selectedIssueIds.length} Issue(s) to Sprint`}
        open={sprintModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setSprintModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleBulkMoveToSprint}>
          <Form.Item
            name="sprintId"
            label="Sprint"
            rules={[{ required: true, message: 'Please select a sprint' }]}
          >
            <Input placeholder="Enter sprint ID" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
