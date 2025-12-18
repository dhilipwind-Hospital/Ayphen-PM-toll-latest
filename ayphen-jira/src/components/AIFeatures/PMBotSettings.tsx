import React, { useState } from 'react';
import { Card, Form, Slider, Switch, Button, message, Divider, Space, Alert } from 'antd';
import { SettingOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface PMBotSettingsProps {
  projectId?: string;
}

export const PMBotSettings: React.FC<PMBotSettingsProps> = ({ projectId }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const saveSettings = async (values: any) => {
    try {
      setSaving(true);
      
      // TODO: Implement settings API endpoint
      // For now, just save to localStorage
      localStorage.setItem('pmbot-settings', JSON.stringify(values));
      
      message.success({
        content: 'Settings saved successfully!',
        duration: 3
      });
      
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('pmbot-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        form.setFieldsValue(settings);
      } catch (error) {
        console.error('Failed to load saved settings:', error);
      }
    }
  }, [form]);

  return (
    <Card 
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8 }} />
          PMBot Settings
        </span>
      }
    >
      <Alert
        message="Configure PMBot Behavior"
        description="Customize how PMBot automatically manages your project. These settings affect auto-assignment, stale issue detection, and triage behavior."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        initialValues={{
          staleThreshold: 7,
          escalationThreshold: 14,
          maxWorkload: 25,
          autoAssignEnabled: true,
          staleDetectionEnabled: true,
          autoTriageEnabled: true,
          notificationsEnabled: true
        }}
      >
        <Divider orientation="left">Issue Detection</Divider>

        <Form.Item
          label={
            <span>
              Stale Issue Threshold
              <span style={{ marginLeft: 8, color: '#666', fontWeight: 'normal' }}>
                (Issues with no activity for this many days)
              </span>
            </span>
          }
          name="staleThreshold"
          tooltip="Issues with no updates for this many days will be flagged as stale"
        >
          <Slider 
            min={1} 
            max={30} 
            marks={{ 
              1: '1 day', 
              7: '7 days', 
              14: '2 weeks', 
              30: '1 month' 
            }} 
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Escalation Threshold
              <span style={{ marginLeft: 8, color: '#666', fontWeight: 'normal' }}>
                (Auto-escalate after this many days)
              </span>
            </span>
          }
          name="escalationThreshold"
          tooltip="Stale issues will be escalated after this many days"
        >
          <Slider 
            min={7} 
            max={60} 
            marks={{ 
              7: '1 week', 
              14: '2 weeks', 
              30: '1 month', 
              60: '2 months' 
            }} 
          />
        </Form.Item>

        <Divider orientation="left">Workload Management</Divider>

        <Form.Item
          label={
            <span>
              Max Workload Per Person
              <span style={{ marginLeft: 8, color: '#666', fontWeight: 'normal' }}>
                (Story points)
              </span>
            </span>
          }
          name="maxWorkload"
          tooltip="Maximum story points a team member can be assigned at once"
        >
          <Slider 
            min={10} 
            max={50} 
            marks={{ 
              10: '10', 
              25: '25', 
              40: '40', 
              50: '50' 
            }} 
          />
        </Form.Item>

        <Divider orientation="left">Automation Features</Divider>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Form.Item
            label="Auto-Assignment"
            name="autoAssignEnabled"
            valuePropName="checked"
            tooltip="Automatically assign new issues to the best team member"
          >
            <Switch 
              checkedChildren="Enabled" 
              unCheckedChildren="Disabled"
            />
          </Form.Item>

          <Form.Item
            label="Stale Issue Detection"
            name="staleDetectionEnabled"
            valuePropName="checked"
            tooltip="Automatically detect and flag stale issues"
          >
            <Switch 
              checkedChildren="Enabled" 
              unCheckedChildren="Disabled"
            />
          </Form.Item>

          <Form.Item
            label="Auto-Triage"
            name="autoTriageEnabled"
            valuePropName="checked"
            tooltip="Automatically suggest labels, priority, and epic for new issues"
          >
            <Switch 
              checkedChildren="Enabled" 
              unCheckedChildren="Disabled"
            />
          </Form.Item>

          <Form.Item
            label="Notifications"
            name="notificationsEnabled"
            valuePropName="checked"
            tooltip="Receive notifications for PMBot actions"
          >
            <Switch 
              checkedChildren="Enabled" 
              unCheckedChildren="Disabled"
            />
          </Form.Item>
        </Space>

        <Divider />

        <Form.Item style={{ marginBottom: 0 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={saving}
            icon={<SaveOutlined />}
            size="large"
          >
            Save Settings
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
