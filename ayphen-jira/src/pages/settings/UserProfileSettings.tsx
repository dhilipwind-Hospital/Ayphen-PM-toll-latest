import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, Select, message, Card, Avatar, Divider, Modal } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../services/api';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
`;

const AvatarWrapper = styled.div`
  position: relative;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  margin-top: 32px;
`;

const PasswordSection = styled.div`
  margin-top: 32px;
`;

const DangerZone = styled.div`
  margin-top: 48px;
  padding: 24px;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
  background: #fff1f0;
`;

export const UserProfileSettings: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        name: currentUser.name,
        email: currentUser.email,
        jobTitle: currentUser.jobTitle || '',
        department: currentUser.department || '',
        location: currentUser.location || '',
        timezone: currentUser.timezone || 'UTC',
        language: currentUser.language || 'en',
        dateFormat: currentUser.dateFormat || 'MM/DD/YYYY',
        timeFormat: currentUser.timeFormat || '12h',
      });
      setAvatarUrl(currentUser.avatar || '');
    }
  }, [currentUser, form]);

  const handleSubmit = async (values: any) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const updatedUser = await usersApi.update(currentUser.id, values);
      setCurrentUser(updatedUser.data);
      message.success('Profile updated successfully');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    if (!currentUser) return;

    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await usersApi.changePassword(currentUser.id, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (file: any) => {
    if (!currentUser) return false;

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const response = await usersApi.uploadAvatar(currentUser.id, formData);
      setAvatarUrl(response.data.avatar);
      setCurrentUser({ ...currentUser, avatar: response.data.avatar });
      message.success('Avatar updated successfully');
    } catch (error) {
      message.error('Failed to upload avatar');
    } finally {
      setLoading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: 'Delete Account',
      content: 'Are you sure you want to delete your account? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        if (!currentUser) return;
        try {
          await usersApi.delete(currentUser.id);
          message.success('Account deleted successfully');
          // Logout user
          window.location.href = '/login';
        } catch (error) {
          message.error('Failed to delete account');
        }
      },
    });
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <h1>Profile Settings</h1>
      
      <Card>
        <ProfileHeader>
          <AvatarWrapper>
            <Avatar size={80} src={avatarUrl} icon={<UserOutlined />} />
          </AvatarWrapper>
          <div>
            <h2>{currentUser.name}</h2>
            <p style={{ color: '#666' }}>{currentUser.email}</p>
            <Upload beforeUpload={handleAvatarUpload} showUploadList={false}>
              <Button icon={<UploadOutlined />} size="small">
                Change Avatar
              </Button>
            </Upload>
          </div>
        </ProfileHeader>

        <Divider />

        <SectionTitle>Personal Information</SectionTitle>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item name="email" label="Email Address">
            <Input disabled />
          </Form.Item>

          <Form.Item name="jobTitle" label="Job Title">
            <Input placeholder="Software Engineer" />
          </Form.Item>

          <Form.Item name="department" label="Department">
            <Input placeholder="Engineering" />
          </Form.Item>

          <Form.Item name="location" label="Location">
            <Input placeholder="San Francisco, CA" />
          </Form.Item>

          <SectionTitle>Preferences</SectionTitle>

          <Form.Item name="timezone" label="Timezone">
            <Select>
              <Select.Option value="UTC">UTC</Select.Option>
              <Select.Option value="America/New_York">Eastern Time (ET)</Select.Option>
              <Select.Option value="America/Chicago">Central Time (CT)</Select.Option>
              <Select.Option value="America/Denver">Mountain Time (MT)</Select.Option>
              <Select.Option value="America/Los_Angeles">Pacific Time (PT)</Select.Option>
              <Select.Option value="Europe/London">London (GMT)</Select.Option>
              <Select.Option value="Asia/Kolkata">India (IST)</Select.Option>
              <Select.Option value="Asia/Tokyo">Tokyo (JST)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="language" label="Language">
            <Select>
              <Select.Option value="en">English</Select.Option>
              <Select.Option value="es">Spanish</Select.Option>
              <Select.Option value="fr">French</Select.Option>
              <Select.Option value="de">German</Select.Option>
              <Select.Option value="ja">Japanese</Select.Option>
              <Select.Option value="zh">Chinese</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="dateFormat" label="Date Format">
            <Select>
              <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
              <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
              <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="timeFormat" label="Time Format">
            <Select>
              <Select.Option value="12h">12 Hour</Select.Option>
              <Select.Option value="24h">24 Hour</Select.Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading}>
            Save Changes
          </Button>
        </Form>

        <PasswordSection>
          <Divider />
          <SectionTitle>Change Password</SectionTitle>
          <Form form={passwordForm} onFinish={handlePasswordChange} layout="vertical">
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Current password" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter a new password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              rules={[{ required: true, message: 'Please confirm your new password' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={passwordLoading}>
              Change Password
            </Button>
          </Form>
        </PasswordSection>

        <DangerZone>
          <SectionTitle style={{ color: '#ff4d4f' }}>Danger Zone</SectionTitle>
          <p>Once you delete your account, there is no going back. Please be certain.</p>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteAccount}
            style={{ marginTop: 16 }}
          >
            Delete Account
          </Button>
        </DangerZone>
      </Card>
    </Container>
  );
};
