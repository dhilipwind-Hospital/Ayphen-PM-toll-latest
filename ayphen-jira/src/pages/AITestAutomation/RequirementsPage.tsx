import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Modal, Form, Input, message, Space, Tag, Alert, Upload } from 'antd';
import { Plus, Zap, Edit, Trash2, FileText } from 'lucide-react';
import { aiRequirementsApi, aiGenerationApi } from '../../services/ai-test-automation-api';
import { colors } from '../../theme/colors';
import { useStore } from '../../store/useStore';

const { TextArea } = Input;

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const RequirementCard = styled(Card)`
  margin-bottom: 16px;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ButtonWrapper = styled.div`
  position: relative;
  z-index: 10;
  
  button {
    cursor: pointer !important;
    pointer-events: auto !important;
  }
`;

export const RequirementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);
  const [form] = Form.useForm();
  const { currentProject } = useStore();

  useEffect(() => {
    loadRequirements();
  }, [currentProject]);

  const loadRequirements = async () => {
    try {
      // VALIDATE project exists
      if (!currentProject) {
        setRequirements([]);
        return;
      }
      
      const res = await aiRequirementsApi.getAll();
      // FILTER by current project only
      const filtered = res.data.filter((req: any) => req.projectId === currentProject.id);
      setRequirements(filtered);
    } catch (error) {
      message.error('Failed to load requirements');
    }
  };

  const handleCreate = async (values: any) => {
    try {
      // Ensure projectId is set from currentProject
      values.projectId = currentProject?.id;
      
      if (editingRequirement) {
        // Update existing requirement
        await aiRequirementsApi.update(editingRequirement.id, values);
        message.success('Requirement updated successfully');
      } else {
        // Create new requirement
        await aiRequirementsApi.create({
          ...values,
          status: 'draft',
        });
        message.success('Requirement created successfully');
      }
      setModalVisible(false);
      setEditingRequirement(null);
      form.resetFields();
      loadRequirements();
    } catch (error) {
      message.error(editingRequirement ? 'Failed to update requirement' : 'Failed to create requirement');
    }
  };

  const handleEdit = (requirement: any) => {
    setEditingRequirement(requirement);
    form.setFieldsValue({
      title: requirement.title,
      content: requirement.content,
    });
    setModalVisible(true);
  };

  const handleDelete = async (requirementId: string, title: string) => {
    console.log('🗑️ Delete button clicked for:', requirementId, title);
    
    // Use window.confirm as a fallback
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`);
    
    if (!confirmed) {
      console.log('❌ Delete cancelled by user');
      return;
    }
    
    try {
      console.log('🗑️ Deleting requirement:', requirementId);
      await aiRequirementsApi.delete(requirementId);
      console.log('✅ Delete successful');
      message.success('Requirement deleted successfully');
      loadRequirements();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      message.error(error.response?.data?.error || 'Failed to delete requirement');
    }
  };

  const handleGenerate = async (requirementId: string) => {
    const hide = message.loading('🚀 Generating everything (Stories + Test Cases + Suites)...', 0);
    
    try {
      console.log('🚀 Starting complete generation for requirement:', requirementId);
      
      // Update status to 'processing' immediately
      await aiRequirementsApi.update(requirementId, { status: 'processing' });
      await loadRequirements(); // Reload to show PROCESSING status
      
      const res = await aiGenerationApi.generateComplete(requirementId);
      hide();
      console.log('✅ Complete generation response:', res.data);
      
      const summary = res.data.summary;
      
      // Reload requirements to show COMPLETED status
      await loadRequirements();
      
      message.success(
        `✅ Generated ${summary.totalStories} stories, ${summary.totalTestCases} test cases, and ${summary.totalSuites} test suites! (${summary.totalStoryPoints} story points total)`,
        5
      );
      
      // Give user time to see the COMPLETED status before navigating
      setTimeout(() => {
        navigate('/ai-test-automation/stories');
      }, 2000);
    } catch (error: any) {
      hide();
      console.error('❌ Generation error:', error);
      
      // Revert status back to 'draft' on error
      await aiRequirementsApi.update(requirementId, { status: 'draft' });
      await loadRequirements();
      
      // Check error type
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || error.message || 'Failed to generate';
      
      if (errorData?.error === 'AI Service Not Configured') {
        message.error({
          content: (
            <div>
              <strong>AI Service Not Configured</strong>
              <br />
              {errorData.message}
              <br />
              <small>Get a FREE API key from: cerebras.ai, aistudio.google.com, or console.groq.com</small>
            </div>
          ),
          duration: 15,
        });
      } else if (errorMessage.includes('Rate limit') || errorMessage.includes('rate_limit')) {
        message.error(
          'API rate limit reached. Please wait a few minutes or try again later.',
          10
        );
      } else {
        message.error(errorMessage, 8);
      }
    }
  };

  return (
    <Container>
      <Header>
        <Title>🤖 AI Test Automation - Epic Requirements</Title>
        <Button 
          type="primary" 
          icon={<Plus size={16} />}
          onClick={() => setModalVisible(true)}
          disabled={!currentProject}
        >
          New Requirement
        </Button>
      </Header>
      
      {!currentProject && (
        <Alert
          message="No Project Selected"
          description="Please select a project from the top navigation to view requirements."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {requirements.map((req) => (
        <RequirementCard key={req.id}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {req.epicKey && (
                  <Tag color="blue" style={{ marginRight: 8 }}>
                    {req.epicKey}
                  </Tag>
                )}
                <h3 style={{ margin: 0, display: 'inline' }}>{req.title}</h3>
              </div>
              <Tag 
                color={
                  req.status === 'draft' ? 'orange' : 
                  req.status === 'processing' ? 'blue' : 
                  'green'
                }
              >
                {req.status.toUpperCase()}
              </Tag>
            </div>
            
            <p style={{ color: colors.text.secondary }}>
              {req.content.substring(0, 200)}...
            </p>
            
            <ButtonWrapper>
              <Space>
                <Button 
                  type="primary"
                  icon={<Zap size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('🔘 Button clicked for requirement:', req.id);
                    handleGenerate(req.id);
                  }}
                >
                  Generate
                </Button>
                <Button 
                  icon={<Edit size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleEdit(req);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  danger
                  icon={<Trash2 size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('🔘 Delete button clicked!');
                    handleDelete(req.id, req.title);
                  }}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  Delete
                </Button>
              </Space>
            </ButtonWrapper>
          </Space>
        </RequirementCard>
      ))}

      <Modal
        title={editingRequirement ? 'Edit Epic Requirement' : 'Create Epic Requirement'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRequirement(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item 
            name="projectId" 
            label="Project"
            initialValue={currentProject?.id}
            hidden
          >
            <Input />
          </Form.Item>
          
          <Alert
            message={`Creating requirement for: ${currentProject?.name || 'Unknown Project'}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item 
            name="title" 
            label="Epic Title"
            rules={[{ required: true, message: 'Please enter the epic title' }]}
          >
            <Input placeholder="e.g., User Sign Up & Account Creation" />
          </Form.Item>
          
          <Form.Item 
            name="content" 
            label="Epic Requirement"
            rules={[
              {
                validator: async (_, value) => {
                  const fileUrl = form.getFieldValue('fileUrl');
                  if (!value && !fileUrl) {
                    return Promise.reject('Please enter the requirement or upload a document');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <TextArea 
              rows={10} 
              placeholder="Enter detailed epic requirement... The AI will generate user stories and test cases from this."
            />
          </Form.Item>
          
          <Form.Item name="fileUrl" label="Or Upload Document">
            <Upload
              beforeUpload={(file) => {
                // Store file info in form
                form.setFieldsValue({ fileUrl: file.name });
                // Trigger validation for content field
                form.validateFields(['content']);
                return false; // Prevent auto upload
              }}
              onRemove={() => {
                form.setFieldsValue({ fileUrl: null });
                // Trigger validation for content field
                form.validateFields(['content']);
              }}
            >
              <Button icon={<FileText size={16} />}>Upload File</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRequirement ? 'Update Requirement' : 'Create Requirement'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingRequirement(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};
