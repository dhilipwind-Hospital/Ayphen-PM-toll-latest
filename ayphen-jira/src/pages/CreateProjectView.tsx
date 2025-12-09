import React, { useState } from 'react';
import styled from 'styled-components';
import { Form, Input, Select, Button, Card, Steps, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';

const { TextArea } = Input;

const Container = styled.div`
  padding: 40px;
  max-width: 900px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const BackButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: ${colors.text.primary};
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const TemplateCard = styled.div<{ selected: boolean }>`
  padding: 24px;
  border: 2px solid ${props => props.selected ? '#EC4899' : 'rgba(244, 114, 182, 0.2)'};
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  background: ${props => props.selected ? 'rgba(244, 114, 182, 0.1)' : 'white'};
  box-shadow: 0 2px 8px rgba(244, 114, 182, 0.1);

  &:hover {
    border-color: #EC4899;
    background: rgba(244, 114, 182, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(244, 114, 182, 0.15);
  }
`;

const TemplateIcon = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
`;

const TemplateName = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  color: ${colors.text.primary};
`;

const TemplateDesc = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
`;

export const CreateProjectView: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('scrum');
  const [loading, setLoading] = useState(false);
  const { currentUser, addProject } = useStore();

  const templates = [
    { key: 'scrum', name: 'Scrum', icon: '🏃', desc: 'Sprint-based development' },
    { key: 'kanban', name: 'Kanban', icon: '📋', desc: 'Continuous flow' },
  ];

  const handleSubmit = async (values: any) => {
    if (!currentUser) {
      message.error('User not found');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        key: values.key.toUpperCase(),
        name: values.name,
        description: values.description || '',
        type: selectedTemplate,
        leadId: currentUser.id,
        category: values.category || 'Software Development',
        isStarred: false,
      };

      const response = await projectsApi.create(projectData);
      addProject(response.data);

      message.success(`Project ${values.key} created successfully!`);
      navigate('/projects');
    } catch (error: any) {
      console.error('Failed to create project:', error);
      message.error(error.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Choose Template' },
    { title: 'Project Details' },
  ];

  return (
    <Container>
      <Header>
        <BackButton icon={<ArrowLeft size={20} />} onClick={() => navigate('/projects')}>
          Back
        </BackButton>
        <Title>Create New Project</Title>
      </Header>

      <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

      {currentStep === 0 && (
        <StyledCard title="Select Project Template">
          <TemplateGrid>
            {templates.map(template => (
              <TemplateCard
                key={template.key}
                selected={selectedTemplate === template.key}
                onClick={() => setSelectedTemplate(template.key)}
              >
                <TemplateIcon>{template.icon}</TemplateIcon>
                <TemplateName>{template.name}</TemplateName>
                <TemplateDesc>{template.desc}</TemplateDesc>
              </TemplateCard>
            ))}
          </TemplateGrid>
          <Button 
            type="primary" 
            onClick={() => setCurrentStep(1)} 
            block 
            size="large"
            style={{ 
              background: 'linear-gradient(135deg, #EC4899, #F472B6)', 
              border: 'none',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Next
          </Button>
        </StyledCard>
      )}

      {currentStep === 1 && (
        <StyledCard title="Project Details">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ type: selectedTemplate }}
          >
            <Form.Item
              name="name"
              label="Project Name"
              rules={[{ required: true, message: 'Please enter project name' }]}
            >
              <Input placeholder="e.g., My Awesome Project" size="large" />
            </Form.Item>

            <Form.Item
              name="key"
              label="Project Key"
              rules={[
                { required: true, message: 'Please enter project key' },
                { pattern: /^[A-Z]{2,10}$/, message: 'Key must be 2-10 uppercase letters' }
              ]}
            >
              <Input 
                placeholder="e.g., MAP" 
                size="large"
                maxLength={10}
                onChange={(e) => {
                  form.setFieldsValue({ key: e.target.value.toUpperCase() });
                }}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={4} placeholder="Describe your project..." />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              initialValue="Software Development"
            >
              <Select size="large">
                <Select.Option value="Software Development">Software Development</Select.Option>
                <Select.Option value="Marketing">Marketing</Select.Option>
                <Select.Option value="Design">Design</Select.Option>
                <Select.Option value="HR">Human Resources</Select.Option>
                <Select.Option value="Operations">Operations</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="lead"
              label="Project Lead"
              initialValue={currentUser?.name}
            >
              <Input disabled size="large" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button onClick={() => setCurrentStep(0)} size="large">
                Back
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                size="large" 
                block
                style={{ 
                  background: 'linear-gradient(135deg, #EC4899, #F472B6)', 
                  border: 'none',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Create Project
              </Button>
            </div>
          </Form>
        </StyledCard>
      )}
    </Container>
  );
};
