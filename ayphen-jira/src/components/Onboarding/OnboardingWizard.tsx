import React, { useState } from 'react';
import { Modal, Steps, Button, Form, Input, Select, message } from 'antd';
import { UserOutlined, ProjectOutlined, CheckOutlined, RocketOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ENV } from '../../config/env';

const { Step } = Steps;

interface OnboardingWizardProps {
  visible: boolean;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ visible, onComplete }) => {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: 'Welcome',
      icon: <RocketOutlined />,
      content: (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <RocketOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} />
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Welcome to Your Jira Clone!</h2>
          <p style={{ fontSize: 16, color: '#595959', lineHeight: 1.6 }}>
            Let's get you started in just a few simple steps.<br />
            Create your first project and start tracking your work.
          </p>
        </div>
      ),
    },
    {
      title: 'Create Project',
      icon: <ProjectOutlined />,
      content: (
        <Form form={form} layout="vertical" style={{ padding: '20px 0' }}>
          <Form.Item 
            label="Project Name" 
            name="name" 
            rules={[{ required: true, message: 'Please enter a project name' }]}
          >
            <Input 
              placeholder="e.g., My Awesome Project" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item 
            label="Project Key" 
            name="key" 
            rules={[
              { required: true, message: 'Please enter a project key' },
              { max: 10, message: 'Key must be 10 characters or less' },
              { pattern: /^[A-Z]+$/, message: 'Key must be uppercase letters only' }
            ]}
          >
            <Input 
              placeholder="e.g., MAP" 
              maxLength={10} 
              size="large"
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
          
          <Form.Item 
            label="Project Type" 
            name="type" 
            initialValue="scrum"
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Select.Option value="scrum">
                <strong>Scrum</strong> - Sprint-based agile workflow
              </Select.Option>
              <Select.Option value="kanban">
                <strong>Kanban</strong> - Continuous flow workflow
              </Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            label="Category" 
            name="category" 
            initialValue="software"
          >
            <Select size="large">
              <Select.Option value="software">Software Development</Select.Option>
              <Select.Option value="marketing">Marketing</Select.Option>
              <Select.Option value="business">Business</Select.Option>
              <Select.Option value="design">Design</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            label="Description (Optional)" 
            name="description"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Describe your project..."
              size="large"
            />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Complete',
      icon: <CheckOutlined />,
      content: (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckOutlined style={{ fontSize: 72, color: '#52c41a', marginBottom: 24 }} />
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>You're All Set!</h2>
          <p style={{ fontSize: 16, color: '#595959', lineHeight: 1.6, marginBottom: 24 }}>
            Your project has been created successfully.<br />
            Start creating issues and tracking your team's work.
          </p>
          <div style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: 8,
            padding: 16,
            marginTop: 24
          }}>
            <strong>Next Steps:</strong>
            <ul style={{ textAlign: 'left', marginTop: 12, marginBottom: 0 }}>
              <li>Create your first issue</li>
              <li>Invite team members</li>
              <li>Set up your board</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const next = async () => {
    if (current === 1) {
      try {
        await form.validateFields();
        await createProject();
        setCurrent(current + 1);
      } catch (error) {
        // Validation failed or project creation failed
        console.error('Error:', error);
      }
    } else {
      setCurrent(current + 1);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const createProject = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      const userId = localStorage.getItem('userId');
      
      await axios.post(`${ENV.API_URL}/projects`, {
        ...values,
        key: values.key.toUpperCase(),
        leadId: userId,
      });
      
      message.success('Project created successfully!');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to create project');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onComplete();
    setCurrent(0);
    form.resetFields();
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          Getting Started
        </div>
      }
      open={visible}
      onCancel={() => {
        onComplete();
        setCurrent(0);
        form.resetFields();
      }}
      footer={null}
      width={700}
      centered
    >
      <Steps current={current} style={{ marginBottom: 32 }}>
        {steps.map((item) => (
          <Step key={item.title} title={item.title} icon={item.icon} />
        ))}
      </Steps>
      
      <div style={{ minHeight: 300 }}>
        {steps[current].content}
      </div>

      <div style={{ marginTop: 32, textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
        {current > 0 && current < steps.length - 1 && (
          <Button style={{ marginRight: 8 }} onClick={prev}>
            Previous
          </Button>
        )}
        {current < steps.length - 1 && (
          <Button 
            type="primary" 
            onClick={next}
            loading={loading}
          >
            {current === 1 ? 'Create Project' : 'Next'}
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button type="primary" onClick={handleFinish} size="large">
            Get Started
          </Button>
        )}
      </div>
    </Modal>
  );
};
