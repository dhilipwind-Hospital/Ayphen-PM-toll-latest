import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Form, Input, Select, Button, Switch, Divider, List, Avatar, Tag, Modal, message, Popconfirm, Space } from 'antd';
import { Settings, Users, Workflow, FileText, Shield, Zap, Plus, Edit, Trash2, GitBranch } from 'lucide-react';
import { useStore } from '../store/useStore';
import { settingsApi, projectsApi, workflowsApi } from '../services/api';
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { colors } from '../theme/colors';
import { ProjectMembersTab } from './ProjectSettings/ProjectMembersTab';
import { EmailIntegrationPanel } from '../components/AI/EmailIntegrationPanel';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  color: ${colors.text.secondary};
  margin: 0;
`;

const Section = styled(Card)`
  margin-bottom: 16px;
`;

export const ProjectSettingsView: React.FC = () => {
  const { settingType } = useParams<{ settingType: string }>();
  const { currentProject, setCurrentProject } = useStore();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // State for different settings
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [issueTypes, setIssueTypes] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [permissionRoles, setPermissionRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editPermissionModal, setEditPermissionModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [addMemberForm] = Form.useForm();
  const [diagramModalVisible, setDiagramModalVisible] = useState(false);
  const [diagramData, setDiagramData] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  // Load data based on setting type
  useEffect(() => {
    loadData();
  }, [settingType, currentProject]);

  const loadData = async () => {
    if (!settingType) return;

    setLoading(true);
    try {
      switch (settingType) {
        case 'workflows':
          // Use the new workflows API instead of settings API
          const workflowsRes = await workflowsApi.getAll();
          setWorkflows(workflowsRes.data);
          break;
        case 'issue-types':
          const typesRes = await settingsApi.getIssueTypes();
          setIssueTypes(typesRes.data);
          break;
        case 'fields':
          const fieldsRes = await settingsApi.getCustomFields();
          setCustomFields(fieldsRes.data);
          break;
        case 'automation':
          const rulesRes = await settingsApi.getAutomationRules();
          setAutomationRules(rulesRes.data);
          break;
        case 'people':
          if (currentProject) {
            const membersRes = await settingsApi.getProjectMembers(currentProject.id);
            setTeamMembers(membersRes.data);
          }
          break;
        case 'permissions':
          const permissionsRes = await settingsApi.getPermissions();
          setPermissionRoles(permissionsRes.data);
          break;
        default:
          // For other settings, just clear loading
          break;
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      message.error(`Failed to load ${settingType}: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers for Project Details
  const handleSaveProjectDetails = async (values: any) => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const response = await projectsApi.update(currentProject.id, values);
      setCurrentProject(response.data);
      message.success('Project details updated successfully');
    } catch (error) {
      message.error('Failed to update project details');
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers for Workflows
  const handleCreateWorkflow = async (values: any) => {
    console.log('Creating workflow with values:', values);
    setLoading(true);
    try {
      // Convert comma-separated statuses to proper format
      const statusNames = typeof values.statuses === 'string'
        ? values.statuses.split(',').map((s: string) => s.trim())
        : values.statuses;

      console.log('Status names:', statusNames);

      const statuses = statusNames.map((name: string, index: number) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        category: index === 0 ? 'TODO' : index === statusNames.length - 1 ? 'DONE' : 'IN_PROGRESS',
      }));

      const transitions: any[] = [];
      for (let i = 0; i < statuses.length - 1; i++) {
        transitions.push({
          from: statuses[i].id,
          to: statuses[i + 1].id,
          name: `Move to ${statuses[i + 1].name}`,
        });
      }

      const workflowData = {
        name: values.name,
        description: values.description || '',
        statuses,
        transitions,
        isDefault: false,
      };

      console.log('Sending workflow data:', workflowData);

      const response = await workflowsApi.create(workflowData);
      console.log('Workflow created:', response.data);

      setWorkflows([...workflows, response.data]);
      message.success('Workflow created successfully');
      setModalVisible(false);
      form.resetFields();
      loadData(); // Reload to get fresh data
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create workflow';
      message.error(errorMsg);
      console.error('Workflow creation error:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkflow = async (id: string, values: any) => {
    setLoading(true);
    try {
      // Convert comma-separated statuses to proper format
      const statusNames = typeof values.statuses === 'string'
        ? values.statuses.split(',').map((s: string) => s.trim())
        : values.statuses;

      const statuses = statusNames.map((name: string, index: number) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        category: index === 0 ? 'TODO' : index === statusNames.length - 1 ? 'DONE' : 'IN_PROGRESS',
      }));

      const transitions: any[] = [];
      for (let i = 0; i < statuses.length - 1; i++) {
        transitions.push({
          from: statuses[i].id,
          to: statuses[i + 1].id,
          name: `Move to ${statuses[i + 1].name}`,
        });
      }

      const workflowData = {
        name: values.name,
        description: values.description || '',
        statuses,
        transitions,
      };

      const response = await workflowsApi.update(id, workflowData);
      setWorkflows(workflows.map(w => w.id === id ? response.data : w));
      message.success('Workflow updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      form.resetFields();
      loadData(); // Reload to get fresh data
    } catch (error) {
      message.error('Failed to update workflow');
      console.error('Workflow update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    setLoading(true);
    try {
      await workflowsApi.delete(id);
      setWorkflows(workflows.filter(w => w.id !== id));
      message.success('Workflow deleted successfully');
      loadData(); // Reload to get fresh data
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete workflow');
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers for Issue Types
  const handleCreateIssueType = async (values: any) => {
    setLoading(true);
    try {
      const response = await settingsApi.createIssueType(values);
      setIssueTypes([...issueTypes, response.data]);
      message.success('Issue type created successfully');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to create issue type');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIssueType = async (id: string) => {
    setLoading(true);
    try {
      await settingsApi.deleteIssueType(id);
      setIssueTypes(issueTypes.filter(t => t.id !== id));
      message.success('Issue type deleted successfully');
    } catch (error) {
      message.error('Failed to delete issue type');
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers for Custom Fields
  const handleCreateCustomField = async (values: any) => {
    setLoading(true);
    try {
      const response = await settingsApi.createCustomField(values);
      setCustomFields([...customFields, response.data]);
      message.success('Custom field created successfully');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to create custom field');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomField = async (id: string) => {
    setLoading(true);
    try {
      await settingsApi.deleteCustomField(id);
      setCustomFields(customFields.filter(f => f.id !== id));
      message.success('Custom field deleted successfully');
    } catch (error) {
      message.error('Failed to delete custom field');
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers for Automation Rules
  const handleToggleAutomationRule = async (id: string, enabled: boolean) => {
    setLoading(true);
    try {
      const response = await settingsApi.updateAutomationRule(id, { enabled });
      setAutomationRules(automationRules.map(r => r.id === id ? response.data : r));
      message.success(`Automation rule ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      message.error('Failed to update automation rule');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutomationRule = async (values: any) => {
    setLoading(true);
    try {
      const response = await settingsApi.createAutomationRule(values);
      setAutomationRules([...automationRules, response.data]);
      message.success('Automation rule created successfully');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to create automation rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAutomationRule = async (id: string) => {
    setLoading(true);
    try {
      await settingsApi.deleteAutomationRule(id);
      setAutomationRules(automationRules.filter(r => r.id !== id));
      message.success('Automation rule deleted successfully');
    } catch (error) {
      message.error('Failed to delete automation rule');
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers for Team Members
  const handleUpdateMemberRole = async (userId: string, role: string) => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const response = await settingsApi.updateMemberRole(currentProject.id, userId, { role });
      setTeamMembers(teamMembers.map(m => m.id === userId ? { ...m, role } : m));
      message.success('Member role updated successfully');
    } catch (error) {
      message.error('Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentProject) return;

    setLoading(true);
    try {
      await settingsApi.removeMember(currentProject.id, userId);
      setTeamMembers(teamMembers.filter(m => m.id !== userId));
      message.success('Member removed successfully');
    } catch (error) {
      message.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  if (!currentProject) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Settings size={48} color={colors.text.secondary} style={{ marginBottom: 16 }} />
            <h2>No Project Selected</h2>
            <p style={{ color: colors.text.secondary }}>
              Please select a project to view settings
            </p>
          </div>
        </Card>
      </Container>
    );
  }

  if (!settingType) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Settings size={48} color={colors.text.secondary} style={{ marginBottom: 16 }} />
            <h2>Select a Setting</h2>
            <p style={{ color: colors.text.secondary }}>
              Choose a setting from the sidebar
            </p>
          </div>
        </Card>
      </Container>
    );
  }

  const renderContent = () => {
    switch (settingType) {
      case 'details':
        return (
          <Section title="Project Details">
            <Form
              layout="vertical"
              initialValues={{
                name: currentProject.name,
                key: currentProject.key,
                description: currentProject.description,
                type: currentProject.type,
                category: currentProject.category,
              }}
              onFinish={handleSaveProjectDetails}
            >
              <Form.Item label="Project Name" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Project Key" name="key">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item label="Project Type" name="type">
                <Select>
                  <Select.Option value="scrum">Scrum</Select.Option>
                  <Select.Option value="kanban">Kanban</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Category" name="category">
                <Select>
                  <Select.Option value="software">Software</Select.Option>
                  <Select.Option value="business">Business</Select.Option>
                  <Select.Option value="marketing">Marketing</Select.Option>
                </Select>
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save Changes
              </Button>
            </Form>

            {/* Danger Zone */}
            <Divider />
            <div style={{
              marginTop: 32,
              padding: 24,
              border: '2px solid #ff4d4f',
              borderRadius: 8,
              background: '#fff1f0'
            }}>
              <h3 style={{ color: '#cf1322', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={20} />
                Danger Zone
              </h3>
              <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
                Once you delete a project, there is no going back. All issues, sprints, board configurations, and historical data will be permanently lost.
              </p>
              <Popconfirm
                title="Delete Project Forever?"
                description={
                  <div>
                    <p>This will permanently delete:</p>
                    <ul style={{ marginLeft: 20, marginTop: 8 }}>
                      <li>All issues and subtasks</li>
                      <li>All sprints and backlog items</li>
                      <li>All comments and attachments</li>
                      <li>Team members and permissions</li>
                    </ul>
                    <p style={{ marginTop: 12, fontWeight: 600 }}>This action cannot be undone!</p>
                  </div>
                }
                onConfirm={async () => {
                  try {
                    setLoading(true);
                    await projectsApi.delete(currentProject.id);
                    message.success('Project deleted successfully');
                    setCurrentProject(null);
                    navigate('/projects');
                  } catch (error: any) {
                    console.error('Failed to delete project:', error);
                    message.error(error.response?.data?.error || 'Failed to delete project');
                  } finally {
                    setLoading(false);
                  }
                }}
                okText="Yes, Delete Forever"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<Trash2 size={14} />} loading={loading}>
                  Delete This Project
                </Button>
              </Popconfirm>
            </div>
          </Section>
        );

      case 'email-integration':
        return (
          <Section title="Email Integration">
            <EmailIntegrationPanel
              onIssueCreated={(key) => message.success(`Issue ${key} created from email!`)}
            />
          </Section>
        );

      case 'people':
        return currentProject ? (
          <ProjectMembersTab projectId={currentProject.id} />
        ) : (
          <div>No project selected</div>
        );

      case 'issue-types':
        return (
          <>
            <Section
              title="Issue Types"
              extra={
                <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalVisible(true)}>
                  Add Issue Type
                </Button>
              }
            >
              <List
                loading={loading}
                dataSource={issueTypes}
                renderItem={(type: any) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        title="Delete issue type?"
                        onConfirm={() => handleDeleteIssueType(type.id)}
                      >
                        <Button danger size="small" icon={<Trash2 size={14} />} />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<span style={{ fontSize: 24 }}>{type.icon}</span>}
                      title={type.name}
                      description={type.description}
                    />
                    <Tag color={type.color}>{type.name}</Tag>
                  </List.Item>
                )}
              />
            </Section>

            <Modal
              title="Create Issue Type"
              open={modalVisible}
              onCancel={() => setModalVisible(false)}
              footer={null}
            >
              <Form form={form} layout="vertical" onFinish={handleCreateIssueType}>
                <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Icon" name="icon" rules={[{ required: true }]}>
                  <Input placeholder="e.g., 🐛" />
                </Form.Item>
                <Form.Item label="Color" name="color" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="red">Red</Select.Option>
                    <Select.Option value="orange">Orange</Select.Option>
                    <Select.Option value="green">Green</Select.Option>
                    <Select.Option value="blue">Blue</Select.Option>
                    <Select.Option value="purple">Purple</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Description" name="description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Space>
                  <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Create
                  </Button>
                </Space>
              </Form>
            </Modal>
          </>
        );

      case 'workflows':
        return (
          <>
            <Section
              title="Workflows"
              extra={
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => window.location.href = '/workflow-editor/new'}
                >
                  Create Workflow
                </Button>
              }
            >
              <List
                loading={loading}
                dataSource={workflows}
                renderItem={(workflow: any) => (
                  <List.Item
                    actions={[
                      <Button
                        size="small"
                        icon={<GitBranch size={14} />}
                        onClick={async () => {
                          try {
                            const response = await workflowsApi.getDiagram(workflow.id);
                            setDiagramData(response.data);
                            setSelectedWorkflow(workflow);
                            setDiagramModalVisible(true);
                          } catch (error) {
                            console.error('Diagram error:', error);
                            message.error('Failed to load diagram');
                          }
                        }}
                      >
                        View Diagram
                      </Button>,
                      <Button
                        size="small"
                        type={currentProject?.workflowId === workflow.id ? 'primary' : 'default'}
                        onClick={async () => {
                          try {
                            if (currentProject?.id) {
                              await projectsApi.updateWorkflow(currentProject.id, workflow.id);
                              message.success(`Workflow "${workflow.name}" is now used for this project`);
                              loadData();
                            }
                          } catch (error) {
                            message.error('Failed to update project workflow');
                          }
                        }}
                      >
                        {currentProject?.workflowId === workflow.id ? 'Active for Project' : 'Use for Project'}
                      </Button>,
                      !workflow.isDefault && (
                        <Button
                          size="small"
                          onClick={async () => {
                            try {
                              await workflowsApi.setDefault(workflow.id);
                              message.success('Default workflow updated');
                              loadData();
                            } catch (error) {
                              message.error('Failed to set default');
                            }
                          }}
                        >
                          Set as Default
                        </Button>
                      ),
                      <Button
                        size="small"
                        icon={<Edit size={14} />}
                        onClick={() => {
                          // Navigate to workflow editor
                          window.location.href = `/workflow-editor/${workflow.id}`;
                        }}
                      >
                        Edit Workflow
                      </Button>,
                      <Popconfirm
                        title="Delete workflow?"
                        onConfirm={() => handleDeleteWorkflow(workflow.id)}
                      >
                        <Button danger size="small" icon={<Trash2 size={14} />} />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Workflow size={24} color={colors.primary[500]} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {workflow.name}
                          {workflow.isDefault && <Tag color="gold">Default</Tag>}
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>
                          {workflow.statuses?.map((status: any, idx: number) => (
                            <Tag key={idx} color="blue">
                              {typeof status === 'string' ? status : status.name}
                            </Tag>
                          ))}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Section>

            <Modal
              title={editingItem ? 'Edit Workflow' : 'Create Workflow'}
              open={modalVisible}
              onCancel={() => {
                setModalVisible(false);
                setEditingItem(null);
                form.resetFields();
              }}
              footer={null}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={(values) => {
                  if (editingItem) {
                    handleUpdateWorkflow(editingItem.id, values);
                  } else {
                    handleCreateWorkflow(values);
                  }
                }}
                initialValues={editingItem ? {
                  name: editingItem.name,
                  description: editingItem.description,
                  statuses: Array.isArray(editingItem.statuses)
                    ? editingItem.statuses.map((s: any) => typeof s === 'string' ? s : s.name).join(', ')
                    : editingItem.statuses,
                } : undefined}
              >
                <Form.Item label="Workflow Name" name="name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Statuses (comma-separated)" name="statuses" rules={[{ required: true }]}>
                  <Input placeholder="To Do, In Progress, Done" />
                </Form.Item>
                <Space>
                  <Button onClick={() => {
                    setModalVisible(false);
                    setEditingItem(null);
                    form.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    {editingItem ? 'Update' : 'Create'}
                  </Button>
                </Space>
              </Form>
            </Modal>

            {/* Workflow Diagram Modal */}
            <Modal
              title={`Workflow Diagram: ${selectedWorkflow?.name || ''}`}
              open={diagramModalVisible}
              onCancel={() => setDiagramModalVisible(false)}
              footer={null}
              width={1000}
            >
              <div style={{ height: '600px', border: `1px solid ${colors.border.light}`, borderRadius: '8px' }}>
                <ReactFlow
                  nodes={diagramData.nodes}
                  edges={diagramData.edges}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>
            </Modal>
          </>
        );

      case 'fields':
        return (
          <>
            <Section
              title="Custom Fields"
              extra={
                <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalVisible(true)}>
                  Add Custom Field
                </Button>
              }
            >
              <List
                loading={loading}
                dataSource={customFields}
                renderItem={(field: any) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        title="Delete custom field?"
                        onConfirm={() => handleDeleteCustomField(field.id)}
                      >
                        <Button danger size="small" icon={<Trash2 size={14} />} />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileText size={24} color={colors.primary[500]} />}
                      title={field.name}
                      description={field.type}
                    />
                    <Tag>{field.type}</Tag>
                  </List.Item>
                )}
              />
            </Section>

            <Modal
              title="Create Custom Field"
              open={modalVisible}
              onCancel={() => setModalVisible(false)}
              footer={null}
            >
              <Form form={form} layout="vertical" onFinish={handleCreateCustomField}>
                <Form.Item label="Field Name" name="name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Field Type" name="type" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="Text">Text</Select.Option>
                    <Select.Option value="Number">Number</Select.Option>
                    <Select.Option value="Date">Date</Select.Option>
                    <Select.Option value="Select">Select</Select.Option>
                    <Select.Option value="Multi-Select">Multi-Select</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Required" name="required" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Space>
                  <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Create
                  </Button>
                </Space>
              </Form>
            </Modal>
          </>
        );

      case 'automation':
        return (
          <>
            <Section
              title="Automation Rules"
              extra={
                <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalVisible(true)}>
                  Create Rule
                </Button>
              }
            >
              <List
                loading={loading}
                dataSource={automationRules}
                renderItem={(rule: any) => (
                  <List.Item
                    actions={[
                      <Switch
                        checked={rule.enabled}
                        onChange={(checked) => handleToggleAutomationRule(rule.id, checked)}
                      />,
                      <Popconfirm
                        title="Delete automation rule?"
                        onConfirm={() => handleDeleteAutomationRule(rule.id)}
                      >
                        <Button danger size="small" icon={<Trash2 size={14} />} />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Zap size={24} color={colors.primary[500]} />}
                      title={rule.name}
                      description={`Trigger: ${rule.trigger} → Action: ${rule.action}`}
                    />
                  </List.Item>
                )}
              />
            </Section>

            <Modal
              title="Create Automation Rule"
              open={modalVisible}
              onCancel={() => setModalVisible(false)}
              footer={null}
            >
              <Form form={form} layout="vertical" onFinish={handleCreateAutomationRule}>
                <Form.Item label="Rule Name" name="name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Trigger" name="trigger" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="Issue Created">Issue Created</Select.Option>
                    <Select.Option value="Issue Updated">Issue Updated</Select.Option>
                    <Select.Option value="Status Changed">Status Changed</Select.Option>
                    <Select.Option value="Priority Changed">Priority Changed</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Action" name="action" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="Send notification">Send notification</Select.Option>
                    <Select.Option value="Assign to user">Assign to user</Select.Option>
                    <Select.Option value="Add comment">Add comment</Select.Option>
                    <Select.Option value="Update field">Update field</Select.Option>
                  </Select>
                </Form.Item>
                <Space>
                  <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Create
                  </Button>
                </Space>
              </Form>
            </Modal>
          </>
        );

      case 'permissions':
        return (
          <>
            <Section title="Permissions">
              <p style={{ marginBottom: 16, color: colors.text.secondary }}>
                Configure project permissions and roles
              </p>
              <List
                loading={loading}
                dataSource={permissionRoles}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button
                        icon={<Edit size={14} />}
                        onClick={() => {
                          setEditingPermission(item);
                          setEditPermissionModal(true);
                        }}
                      >
                        Edit
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Shield size={24} color={colors.primary[500]} />}
                      title={<strong>{item.role}</strong>}
                      description={
                        <div>
                          <p style={{ marginBottom: 8, color: colors.text.secondary }}>
                            {item.description}
                          </p>
                          <div>
                            {item.permissions?.map((perm: string, idx: number) => (
                              <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                                {perm}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Section>

            <Modal
              title={`Edit ${editingPermission?.role} Permissions`}
              open={editPermissionModal}
              onCancel={() => {
                setEditPermissionModal(false);
                setEditingPermission(null);
              }}
              footer={null}
              width={600}
            >
              <Form
                layout="vertical"
                initialValues={{
                  description: editingPermission?.description,
                  permissions: editingPermission?.permissions || [],
                }}
                onFinish={async (values) => {
                  if (!editingPermission) return;

                  setLoading(true);
                  try {
                    const response = await settingsApi.updatePermission(editingPermission.id, values);
                    setPermissionRoles(permissionRoles.map(p =>
                      p.id === editingPermission.id ? response.data : p
                    ));
                    message.success('Permissions updated successfully');
                    setEditPermissionModal(false);
                    setEditingPermission(null);
                  } catch (error) {
                    message.error('Failed to update permissions');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Form.Item label="Description" name="description">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item label="Permissions" name="permissions">
                  <Select mode="multiple" placeholder="Select permissions">
                    <Select.Option value="Administer">Administer Project</Select.Option>
                    <Select.Option value="Browse">Browse Project</Select.Option>
                    <Select.Option value="Create">Create Issues</Select.Option>
                    <Select.Option value="Edit">Edit Issues</Select.Option>
                    <Select.Option value="Delete">Delete Issues</Select.Option>
                    <Select.Option value="Assign">Assign Issues</Select.Option>
                    <Select.Option value="Resolve">Resolve Issues</Select.Option>
                    <Select.Option value="Close">Close Issues</Select.Option>
                    <Select.Option value="Transition">Transition Issues</Select.Option>
                    <Select.Option value="Comment">Add Comments</Select.Option>
                    <Select.Option value="Attach">Add Attachments</Select.Option>
                    <Select.Option value="Link">Link Issues</Select.Option>
                    <Select.Option value="Watch">Watch Issues</Select.Option>
                    <Select.Option value="Vote">Vote on Issues</Select.Option>
                  </Select>
                </Form.Item>
                <Space>
                  <Button onClick={() => {
                    setEditPermissionModal(false);
                    setEditingPermission(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Save
                  </Button>
                </Space>
              </Form>
            </Modal>
          </>
        );

      case 'features':
        return (
          <Section title="Features">
            <Form layout="vertical">
              <Form.Item>
                <Switch defaultChecked /> Enable Roadmap
              </Form.Item>
              <Form.Item>
                <Switch defaultChecked /> Enable Backlog
              </Form.Item>
              <Form.Item>
                <Switch defaultChecked /> Enable Reports
              </Form.Item>
              <Form.Item>
                <Switch defaultChecked /> Enable Sprints
              </Form.Item>
              <Form.Item>
                <Switch /> Enable Code Integration
              </Form.Item>
              <Button type="primary">Save Features</Button>
            </Form>
          </Section>
        );

      default:
        return (
          <Section>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Settings size={48} color={colors.text.secondary} style={{ marginBottom: 16 }} />
              <h2>{settingType?.replace('-', ' ').toUpperCase()}</h2>
              <p style={{ color: colors.text.secondary }}>
                Settings for {settingType} will appear here
              </p>
            </div>
          </Section>
        );
    }
  };

  return (
    <Container>
      <Header>
        <Title>Project Settings</Title>
        <Subtitle>{currentProject.name} • {settingType?.replace('-', ' ')}</Subtitle>
      </Header>
      {renderContent()}
    </Container>
  );
};
