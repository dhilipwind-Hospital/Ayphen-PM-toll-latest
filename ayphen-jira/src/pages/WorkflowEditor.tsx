import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Input, Select, Modal, Form, message, Tag, Popconfirm, Space, Drawer } from 'antd';
import { Plus, Save, ArrowLeft, Trash2, Settings, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { workflowsApi } from '../services/api';
import { colors } from '../theme/colors';

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${colors.background.default};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid ${colors.border.light};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WorkflowName = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const EditorContainer = styled.div`
  flex: 1;
  position: relative;
`;

const Toolbar = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
`;

const ToolbarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${colors.border.light};
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const ToolbarTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 4px;
`;

const ToolbarButton = styled(Button)`
  width: 100%;
  justify-content: flex-start;
`;

const StatusNode = styled.div<{ category: string; selected?: boolean }>`
  padding: 16px 24px;
  background: white;
  border: 2px solid ${props => 
    props.selected ? colors.primary[500] :
    props.category === 'TODO' ? colors.status.todo :
    props.category === 'IN_PROGRESS' ? colors.status.inProgress :
    colors.status.done
  };
  border-radius: 8px;
  min-width: 180px;
  text-align: center;
  font-weight: 500;
  cursor: move;
  position: relative;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const StatusActions = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${StatusNode}:hover & {
    opacity: 1;
  }
`;

const StatusActionButton = styled.button`
  background: white;
  border: 1px solid ${colors.border.light};
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${colors.background.hover};
    border-color: ${colors.primary[500]};
  }
`;

const StatusCategory = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  color: ${colors.text.secondary};
  margin-top: 4px;
`;

// Custom node component
const CustomNode = ({ data, selected }: any) => {
  return (
    <StatusNode category={data.category} selected={selected}>
      {data.showActions && (
        <StatusActions>
          <StatusActionButton onClick={(e) => {
            e.stopPropagation();
            data.onEdit?.();
          }}>
            <Edit size={12} /> Edit
          </StatusActionButton>
          <StatusActionButton onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.();
          }}>
            <Trash2 size={12} /> Delete
          </StatusActionButton>
        </StatusActions>
      )}
      <div style={{ fontSize: '14px', fontWeight: 600 }}>{data.label}</div>
      <StatusCategory>{data.category.replace('_', ' ')}</StatusCategory>
    </StatusNode>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export const WorkflowEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [addStatusDrawer, setAddStatusDrawer] = useState(false);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(true); // Edit mode by default
  const [form] = Form.useForm();

  useEffect(() => {
    if (id && id !== 'new') {
      loadWorkflow();
    } else {
      // New workflow - set default name
      setWorkflowName('New Workflow');
    }
  }, [id]);

  // Update nodes when edit mode changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          showActions: isEditMode,
        },
      }))
    );
  }, [isEditMode, setNodes]);

  const loadWorkflow = async () => {
    try {
      const response = await workflowsApi.getById(id!);
      const wf = response.data;
      setWorkflow(wf);
      setWorkflowName(wf.name);
      
      // Convert workflow to nodes and edges
      const workflowNodes: Node[] = wf.statuses.map((status: any, index: number) => ({
        id: status.id,
        type: 'custom',
        position: status.position || { 
          x: (index % 3) * 250 + 100, 
          y: Math.floor(index / 3) * 150 + 100 
        }, // Use saved position or generate default
        data: { 
          label: status.name, 
          category: status.category,
          statusId: status.id,
          showActions: true, // Show actions by default in edit mode
          onEdit: () => {
            const node = workflowNodes.find(n => n.id === status.id);
            if (node) handleEditNode(node);
          },
          onDelete: () => handleDeleteNode(status.id),
        },
      }));

      const workflowEdges: Edge[] = wf.transitions.map((transition: any, index: number) => ({
        id: `edge-${index}`,
        source: transition.from,
        target: transition.to,
        label: transition.name,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: '#0052CC',
          strokeWidth: 2,
        },
        labelStyle: {
          fill: '#172B4D',
          fontWeight: 500,
          fontSize: 12,
        },
        labelBgStyle: {
          fill: '#FFFFFF',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#0052CC',
          width: 20,
          height: 20,
        },
      }));

      setNodes(workflowNodes);
      setEdges(workflowEdges);
    } catch (error) {
      message.error('Failed to load workflow');
      console.error(error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const targetNode = nodes.find(n => n.id === params.target);
      
      const newEdge = {
        ...params,
        label: `Move to ${targetNode?.data.label}`,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: '#0052CC',
          strokeWidth: 2,
        },
        labelStyle: {
          fill: '#172B4D',
          fontWeight: 500,
          fontSize: 12,
        },
        labelBgStyle: {
          fill: '#FFFFFF',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#0052CC',
          width: 20,
          height: 20,
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges]
  );

  const handleAddStatus = () => {
    form.resetFields();
    setEditingNode(null);
    setAddStatusDrawer(true);
  };

  const handleEditNode = (node: Node) => {
    setEditingNode(node);
    form.setFieldsValue({
      name: node.data.label,
      category: node.data.category,
    });
    setAddStatusDrawer(true);
  };

  const handleDeleteNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    Modal.confirm({
      title: 'Delete Status',
      content: `Are you sure you want to delete "${node?.data.label}"? This will also remove all transitions connected to this status.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        message.success('Status deleted successfully');
      },
    });
  };

  const handleSaveStatus = (values: any) => {
    if (editingNode) {
      // Update existing node
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: values.name,
                  category: values.category,
                },
              }
            : node
        )
      );
    } else {
      // Add new node
      const newNodeId = `status-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'custom',
        position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
        data: {
          label: values.name,
          category: values.category,
          statusId: values.name.toLowerCase().replace(/\s+/g, '-'),
          showActions: isEditMode,
          onEdit: () => {
            const node = nodes.find(n => n.id === newNodeId);
            if (node) handleEditNode(node);
          },
          onDelete: () => handleDeleteNode(newNodeId),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    }
    
    setAddStatusDrawer(false);
    form.resetFields();
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      message.error('Please enter a workflow name');
      return;
    }

    if (nodes.length === 0) {
      message.error('Please add at least one status');
      return;
    }

    setLoading(true);
    try {
      // Convert nodes and edges back to workflow format
      const statuses = nodes.map((node) => ({
        id: node.data.statusId || node.id,
        name: node.data.label,
        category: node.data.category,
        position: node.position, // Save position
      }));

      const transitions = edges.map((edge) => ({
        from: edge.source,
        to: edge.target,
        name: edge.label || `Move to ${nodes.find(n => n.id === edge.target)?.data.label}`,
      }));

      const workflowData = {
        name: workflowName,
        description: workflow?.description || '',
        statuses,
        transitions,
        isDefault: workflow?.isDefault || false,
      };

      if (id && id !== 'new') {
        await workflowsApi.update(id, workflowData);
        message.success('Workflow updated successfully');
      } else {
        await workflowsApi.create(workflowData);
        message.success('Workflow created successfully');
      }

      navigate('/settings/workflows');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save workflow');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    handleEditNode(node);
  };

  return (
    <Container>
      <Header>
        <Title>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/settings/workflows')}
          >
            Back
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{ width: 300, fontSize: 20, fontWeight: 600 }}
            placeholder="Workflow Name"
          />
        </Title>
        <Actions>
          {isEditMode ? (
            <>
              <Button onClick={handleAddStatus} icon={<Plus size={16} />}>
                Add Status
              </Button>
              <Button onClick={() => setIsEditMode(false)}>
                View Diagram
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditMode(true)}>
              Edit Workflow
            </Button>
          )}
          <Button
            type="primary"
            icon={<Save size={16} />}
            onClick={handleSaveWorkflow}
            loading={loading}
          >
            Save Workflow
          </Button>
        </Actions>
      </Header>

      <EditorContainer>
        <Toolbar>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.text.primary }}>
            {isEditMode ? 'Edit Mode' : 'View Mode'}
          </div>
          <div style={{ fontSize: 11, color: colors.text.secondary, lineHeight: '1.6' }}>
            {isEditMode ? (
              <>
                <div style={{ marginBottom: 6 }}>
                  <strong>• Drag statuses</strong> to reposition them
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>• Drag from status to status</strong> to connect
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>• Hover over status</strong> to Edit/Delete
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>• Double-click status</strong> to quick edit
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>• Click "Add Status"</strong> to add new
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>• Click "Save Workflow"</strong> to save changes
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 6 }}>
                  <strong>• View only mode</strong> - See workflow diagram
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>• All connections</strong> are visible
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>• Transition labels</strong> show action names
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>• Click "Edit Workflow"</strong> to make changes
                </div>
              </>
            )}
          </div>
        </Toolbar>

        <ReactFlow
          nodes={nodes}
          edges={edges} // Always show edges
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect} // Allow connections in both modes
          onNodeDoubleClick={handleNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          nodesDraggable={true} // Always draggable
          nodesConnectable={true} // Always connectable
          elementsSelectable={true}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </EditorContainer>

      <Drawer
        title={editingNode ? 'Edit Status' : 'Add Status'}
        open={addStatusDrawer}
        onClose={() => setAddStatusDrawer(false)}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveStatus}
          initialValues={{ category: 'IN_PROGRESS' }}
        >
          <Form.Item
            label="Status Name"
            name="name"
            rules={[{ required: true, message: 'Please enter status name' }]}
          >
            <Input placeholder="e.g., In Progress" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="TODO">
                <Tag color="default">To Do</Tag>
              </Select.Option>
              <Select.Option value="IN_PROGRESS">
                <Tag color="blue">In Progress</Tag>
              </Select.Option>
              <Select.Option value="DONE">
                <Tag color="green">Done</Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Space>
            <Button onClick={() => setAddStatusDrawer(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editingNode ? 'Update' : 'Add'} Status
            </Button>
          </Space>
        </Form>
      </Drawer>
    </Container>
  );
};
