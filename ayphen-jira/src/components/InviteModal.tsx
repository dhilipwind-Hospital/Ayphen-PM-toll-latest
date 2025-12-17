import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message, Alert } from 'antd';
import { MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { projectInvitationsApi, projectMembersApi } from '../services/api';

interface InviteModalProps {
  visible: boolean;
  projectId: string;
  projectName: string;
  existingUsers?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  projectId,
  projectName,
  existingUsers = [],
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const currentUserId = localStorage.getItem('userId');

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Check if user already exists in the system
      const existingUser = existingUsers.find(
        u => u.email?.toLowerCase() === values.email.toLowerCase()
      );

      if (existingUser) {
        // Direct addition for existing users
        await projectMembersApi.add({
          projectId,
          userId: existingUser.id,
          role: values.role,
          addedById: currentUserId,
        });
        message.success(`User ${existingUser.name || values.email} added to project!`);
      } else {
        // Standard invitation for new users
        await projectInvitationsApi.create({
          projectId,
          email: values.email,
          role: values.role,
          invitedById: currentUserId || '',
        });
        message.success(`Invitation sent to ${values.email}`);
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Failed to process request';
      // If it failed on invitation specifically with UUID error, clarify
      if (!error.response && error.message.includes('uuid')) {
        message.error('System error: Unable to invite non-registered users at this time.');
      } else {
        message.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MailOutlined />
          <span>Invite Member to {projectName}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Alert
        message="Send an email invitation"
        description="The recipient will receive an email with a link to join this project. They can create an account if they don't have one."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'member' }}
      >
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: 'Please enter email address' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="colleague@example.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select size="large">
            <Select.Option value="admin">
              <div>
                <strong>Admin</strong>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Full access + member management
                </div>
              </div>
            </Select.Option>
            <Select.Option value="member">
              <div>
                <strong>Member</strong>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Can view and edit issues
                </div>
              </div>
            </Select.Option>
            <Select.Option value="viewer">
              <div>
                <strong>Viewer</strong>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Read-only access
                </div>
              </div>
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<UserAddOutlined />}
            >
              Send Invitation
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
