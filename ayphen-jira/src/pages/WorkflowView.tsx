import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Card, Modal, Form, Input, Tag, message, Space, Popconfirm } from 'antd';
import { Plus, Edit, Trash2, GitBranch, Star } from 'lucide-react';
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { colors } from '../theme/colors';
import { workflowsApi } from '../services/api';

const Container = styled.div`
  padding: 24px;
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

const WorkflowList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const WorkflowCard = styled(Card)`
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${colors.primary[400]};
  }
`;

const WorkflowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const WorkflowName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WorkflowDescription = styled.div`
  font-size: 13px;
  color: ${colors.text.secondary};
  margin-bottom: 12px;
`;

const StatusList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
`;

const DiagramContainer = styled.div`
  height: 600px;
  border: 1px solid ${colors.border.light};
  border-radius: 8px;
  background: #fafafa;
`;

const StatusFormList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
`;

const StatusItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: ${colors.background.sidebar};
  border-radius: 6px;
`;

export const WorkflowView: React.FC = () => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [diagramModalVisible, setDiagramModalVisible] = useState(false);
  const [diagramData, setDiagramData] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await workflowsApi.getAll();
      setWorkflows(response.data);
    } catch (error) {
      message.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (values: any) => {
    try {
      const statuses = values.statuses.split(',').map((s: string, index: number) => ({
        id: s.trim().toLowerCase().replace(/\s+/g, '-'),
        name: s.trim(),
        category: index === 0 ? 'TODO' : index === values.statuses.split(',').length - 1 ? 'DONE' : 'IN_PROGRESS',
      }));

      const transitions: any[] = [];
      for (let i = 0; i < statuses.length - 1; i++) {
        transitions.push({
          from: statuses[i].id,
          to: statuses[i + 1].id,
          name: `Move to ${statuses[i + 1].name}`,
        });
      }

      const workflow = {
        name: values.name,
        description: values.description,
        statuses,
        transitions,
        isDefault: false,
      };

      await workflowsApi.create(workflow);
      message.success('Workflow created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      loadWorkflows();
    } catch (error) {
      message.error('Failed to create workflow');
    }
  };

  const handleEditWorkflow = async (values: any) => {
    if (!selectedWorkflow) return;

    try {
      await workflowsApi.update(selectedWorkflow.id, values);
      message.success('Workflow updated successfully');
      setEditModalVisible(false);
      editForm.resetFields();
      loadWorkflows();
    } catch (error) {
      message.error('Failed to update workflow');
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await workflowsApi.delete(id);
      message.success('Workflow deleted successfully');
      loadWorkflows();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete workflow');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await workflowsApi.setDefault(id);
      message.success('Default workflow updated');
      loadWorkflows();
    } catch (error) {
      message.error('Failed to set default workflow');
    }
  };

  const handleViewDiagram = async (workflow: any) => {
    try {
      const response = await workflowsApi.getDiagram(workflow.id);
      setDiagramData(response.data);
      setSelectedWorkflow(workflow);
      setDiagramModalVisible(true);
    } catch (error) {
      message.error('Failed to load diagram');
    }
  };

  const openEditModal = (workflow: any) => {
    setSelectedWorkflow(workflow);
    editForm.setFieldsValue({
      name: workflow.name,
      description: workflow.description,
    });
    setEditModalVisible(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TODO': return '#d9d9d9';
      case 'IN_PROGRESS': return '#1890ff';
      case 'DONE': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  return (
    <Container>
      <Header>
        <Title>Workflows</Title>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateModalVisible(true)}>
          Create Workflow
        </Button>
      </Header>

      <WorkflowList>
        {workflows.map(workflow => (
          <WorkflowCard key={workflow.id}>
            <WorkflowHeader>
              <WorkflowName>
                <GitBranch size={18} />
                {workflow.name}
                {workflow.isDefault && (
                  <Tag color="gold" icon={<Star size={12} />}>Default</Tag>
                )}
              </WorkflowName>
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<Edit size={14} />}
                  onClick={() => openEditModal(workflow)}
                />
                {!workflow.isDefault && (
                  <Popconfirm
                    title="Delete workflow?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDeleteWorkflow(workflow.id)}
                    okText="Delete"
                    cancelText="Cancel"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                    />
                  </Popconfirm>
                )}
              </Space>
            </WorkflowHeader>

            <WorkflowDescription>{workflow.description}</WorkflowDescription>

            <StatusList>
              {workflow.statuses.map((status: any) => (
                <Tag key={status.id} color={getCategoryColor(status.category)}>
                  {status.name}
                </Tag>
              ))}
            </StatusList>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button
                size="small"
                onClick={() => handleViewDiagram(workflow)}
                icon={<GitBranch size={14} />}
              >
                View Diagram
              </Button>
              {!workflow.isDefault && (
                <Button
                  size="small"
                  onClick={() => handleSetDefault(workflow.id)}
                >
                  Set as Default
                </Button>
              )}
            </div>
          </WorkflowCard>
        ))}
      </WorkflowList>

      {/* Create Workflow Modal */}
      <Modal
        title="Create Workflow"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreateWorkflow} layout="vertical">
          <Form.Item
            label="Workflow Name"
            name="name"
            rules={[{ required: true, message: 'Please enter workflow name' }]}
          >
            <Input placeholder="e.g., Feature Development Workflow" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Describe this workflow..." />
          </Form.Item>

          <Form.Item
            label="Statuses"
            name="statuses"
            rules={[{ required: true, message: 'Please enter statuses' }]}
            extra="Enter statuses separated by commas (e.g., To Do, In Progress, In Review, Done)"
          >
            <Input placeholder="To Do, In Progress, Done" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Workflow
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Workflow Modal */}
      <Modal
        title="Edit Workflow"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={editForm} onFinish={handleEditWorkflow} layout="vertical">
          <Form.Item
            label="Workflow Name"
            name="name"
            rules={[{ required: true, message: 'Please enter workflow name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Workflow Diagram Modal */}
      <Modal
        title={`Workflow Diagram: ${selectedWorkflow?.name}`}
        open={diagramModalVisible}
        onCancel={() => setDiagramModalVisible(false)}
        footer={null}
        width={1000}
      >
        <DiagramContainer>
          <ReactFlow
            nodes={diagramData.nodes}
            edges={diagramData.edges}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </DiagramContainer>
      </Modal>
    </Container>
  );
};
