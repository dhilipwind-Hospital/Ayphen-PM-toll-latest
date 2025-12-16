import React, { useState } from 'react';
import { Card, Form, Input, Select, Switch, Button, Divider, message, Tabs } from 'antd';
import { Settings, Users, Shield, Database, Mail, Globe } from 'lucide-react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
`;

const SectionTitle = styled.h3`
  color: #0EA5E9;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const generalSettings = (
    <Form layout="vertical" onFinish={handleSave}>
      <SectionTitle>
        <Settings size={20} />
        General Configuration
      </SectionTitle>
      
      <Form.Item name="siteName" label="Site Name" initialValue="Ayphen Jira">
        <Input />
      </Form.Item>
      
      <Form.Item name="baseUrl" label="Base URL" initialValue="https://ayphen-pm-toll.vercel.app">
        <Input />
      </Form.Item>
      
      <Form.Item name="timezone" label="Default Timezone" initialValue="UTC">
        <Select>
          <Select.Option value="UTC">UTC</Select.Option>
          <Select.Option value="America/New_York">Eastern Time</Select.Option>
          <Select.Option value="America/Los_Angeles">Pacific Time</Select.Option>
        </Select>
      </Form.Item>
      
      <Form.Item name="language" label="Default Language" initialValue="en">
        <Select>
          <Select.Option value="en">English</Select.Option>
          <Select.Option value="es">Spanish</Select.Option>
          <Select.Option value="fr">French</Select.Option>
        </Select>
      </Form.Item>
      
      <Button type="primary" htmlType="submit" loading={loading}>
        Save General Settings
      </Button>
    </Form>
  );

  const securitySettings = (
    <Form layout="vertical" onFinish={handleSave}>
      <SectionTitle>
        <Shield size={20} />
        Security Configuration
      </SectionTitle>
      
      <Form.Item name="passwordPolicy" label="Password Policy" initialValue="medium">
        <Select>
          <Select.Option value="weak">Weak (6+ characters)</Select.Option>
          <Select.Option value="medium">Medium (8+ characters, mixed case)</Select.Option>
          <Select.Option value="strong">Strong (12+ characters, symbols)</Select.Option>
        </Select>
      </Form.Item>
      
      <Form.Item name="sessionTimeout" label="Session Timeout (minutes)" initialValue={60}>
        <Input type="number" />
      </Form.Item>
      
      <Form.Item name="twoFactorAuth" label="Require Two-Factor Authentication" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item name="loginAttempts" label="Max Login Attempts" initialValue={5}>
        <Input type="number" />
      </Form.Item>
      
      <Button type="primary" htmlType="submit" loading={loading}>
        Save Security Settings
      </Button>
    </Form>
  );

  const emailSettings = (
    <Form layout="vertical" onFinish={handleSave}>
      <SectionTitle>
        <Mail size={20} />
        Email Configuration
      </SectionTitle>
      
      <Form.Item name="smtpHost" label="SMTP Host" initialValue="smtp.gmail.com">
        <Input />
      </Form.Item>
      
      <Form.Item name="smtpPort" label="SMTP Port" initialValue={587}>
        <Input type="number" />
      </Form.Item>
      
      <Form.Item name="smtpUser" label="SMTP Username">
        <Input />
      </Form.Item>
      
      <Form.Item name="smtpPassword" label="SMTP Password">
        <Input.Password />
      </Form.Item>
      
      <Form.Item name="fromEmail" label="From Email" initialValue="noreply@ayphenjira.com">
        <Input />
      </Form.Item>
      
      <Form.Item name="emailNotifications" label="Enable Email Notifications" valuePropName="checked" initialValue={true}>
        <Switch />
      </Form.Item>
      
      <Button type="primary" htmlType="submit" loading={loading}>
        Save Email Settings
      </Button>
    </Form>
  );

  return (
    <Container>
      <h1>System Settings</h1>
      
      <Tabs
        items={[
          { key: 'general', label: 'General', children: generalSettings },
          { key: 'security', label: 'Security', children: securitySettings },
          { key: 'email', label: 'Email', children: emailSettings }
        ]}
      />
    </Container>
  );
};