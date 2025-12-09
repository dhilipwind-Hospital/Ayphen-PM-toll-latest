import React, { useState, useEffect } from 'react';
import { Button, Modal, Select, Input, Form, message } from 'antd';
import { Plus, Edit, Settings } from 'lucide-react';
import styled from 'styled-components';
import type { Layout } from 'react-grid-layout';
import { DashboardGrid } from '../components/Dashboard/DashboardGrid';
import { FilterResultsGadget } from '../components/Dashboard/Gadgets/FilterResultsGadget';
import { PieChartGadget } from '../components/Dashboard/Gadgets/PieChartGadget';
import { CreatedVsResolvedGadget } from '../components/Dashboard/Gadgets/CreatedVsResolvedGadget';
import { SprintBurndownGadget } from '../components/Dashboard/Gadgets/SprintBurndownGadget';
import { ActivityStreamGadget } from '../components/Dashboard/Gadgets/ActivityStreamGadget';
import { AssignedToMeGadget } from '../components/Dashboard/Gadgets/AssignedToMeGadget';
import { HeatMapGadget } from '../components/Dashboard/Gadgets/HeatMapGadget';
import { VelocityChartGadget } from '../components/Dashboard/Gadgets/VelocityChartGadget';
import { AIAssistant, LiveCursors, PredictiveAnalytics, AchievementSystem, BlockchainAudit, VirtualWorkspace } from '../features';
import axios from 'axios';

const PageContainer = styled.div`
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 56px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const GADGET_TYPES = [
  { value: 'filter-results', label: 'Filter Results', icon: '📋' },
  { value: 'assigned-to-me', label: 'Assigned to Me', icon: '👤' },
  { value: 'activity-stream', label: 'Activity Stream', icon: '📊' },
  { value: 'pie-chart', label: 'Pie Chart', icon: '🥧' },
  { value: 'created-vs-resolved', label: 'Created vs Resolved', icon: '📈' },
  { value: 'sprint-burndown', label: 'Sprint Burndown', icon: '🔥' },
  { value: 'velocity-chart', label: 'Velocity Chart', icon: '⚡' },
  { value: 'heat-map', label: 'Heat Map', icon: '🗺️' },
  { value: 'bubble-chart', label: 'Bubble Chart', icon: '⭕' },
  { value: 'roadmap', label: 'Road Map', icon: '🛣️' },
  { value: 'quick-links', label: 'Quick Links', icon: '🔗' },
  { value: 'labels-cloud', label: 'Labels Cloud', icon: '🏷️' },
  { value: 'calendar', label: 'Calendar', icon: '📅' },
  { value: 'sprint-health', label: 'Sprint Health', icon: '💚' },
  { value: 'wallboard', label: 'Wallboard', icon: '📺' },
];

export const EnhancedDashboardView: React.FC = () => {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<any>(null);
  const [gadgets, setGadgets] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddGadgetModalVisible, setIsAddGadgetModalVisible] = useState(false);
  const [isCreateDashboardModalVisible, setIsCreateDashboardModalVisible] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [gadgetForm] = Form.useForm();

  useEffect(() => {
    fetchDashboards();
    fetchIssues();
  }, []);

  useEffect(() => {
    if (currentDashboard) {
      fetchGadgets(currentDashboard.id);
    }
  }, [currentDashboard]);

  const fetchDashboards = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      console.log('Fetching dashboards for user:', currentUser.id);
      
      if (!currentUser.id) {
        console.error('No user ID found, cannot fetch dashboards');
        return;
      }
      
      const response = await axios.get('http://localhost:8500/api/dashboards-v2', {
        params: { userId: currentUser.id },
      });
      
      console.log('Dashboards fetched:', response.data);
      setDashboards(response.data);
      
      if (response.data.length > 0) {
        const defaultDashboard = response.data.find((d: any) => d.isDefault) || response.data[0];
        setCurrentDashboard(defaultDashboard);
      } else {
        console.log('No dashboards found, creating default...');
        createDefaultDashboard();
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      // Create a default dashboard if none exist
      console.log('Creating default dashboard due to error...');
      createDefaultDashboard();
    }
  };

  const fetchIssues = async () => {
    try {
      const projectId = localStorage.getItem('currentProjectId');
      const userId = localStorage.getItem('userId');
      const response = await axios.get('http://localhost:8500/api/issues', {
        params: { projectId, userId },
      });
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
    }
  };

  const createDefaultDashboard = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      console.log('Creating default dashboard for user:', currentUser);
      
      const dashboardData = {
        name: 'My Dashboard',
        description: 'Default dashboard',
        ownerId: currentUser.id || 'default-user',
        isDefault: true,
        columns: 2,
      };
      
      console.log('Sending dashboard data:', dashboardData);
      const response = await axios.post('http://localhost:8500/api/dashboards-v2', dashboardData);
      console.log('Dashboard created:', response.data);
      
      setCurrentDashboard(response.data);
      setDashboards([response.data]);
      
      // Create default gadgets
      console.log('Creating default gadgets...');
      await createDefaultGadgets(response.data.id);
      
      message.success('Dashboard created successfully!');
    } catch (error: any) {
      console.error('Error creating default dashboard:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Failed to create dashboard';
      message.error(errorMsg);
    }
  };

  const createDefaultGadgets = async (dashboardId: string) => {
    try {
      const defaultGadgets = [
        { type: 'assigned-to-me', title: 'Assigned to Me', position: { x: 0, y: 0, w: 6, h: 4 } },
        { type: 'activity-stream', title: 'Activity Stream', position: { x: 6, y: 0, w: 6, h: 4 } },
        { type: 'pie-chart', title: 'Issues by Status', position: { x: 0, y: 4, w: 6, h: 4 } },
        { type: 'created-vs-resolved', title: 'Created vs Resolved', position: { x: 6, y: 4, w: 6, h: 4 } },
      ];

      const promises = defaultGadgets.map(gadget =>
        axios.post('http://localhost:8500/api/gadgets', {
          dashboardId,
          ...gadget,
          config: {},
        })
      );

      await Promise.all(promises);
      fetchGadgets(dashboardId);
    } catch (error) {
      console.error('Error creating default gadgets:', error);
    }
  };

  const fetchGadgets = async (dashboardId: string) => {
    try {
      const response = await axios.get(`http://localhost:8500/api/gadgets/dashboard/${dashboardId}`);
      setGadgets(response.data);
    } catch (error) {
      console.error('Error fetching gadgets:', error);
      setGadgets([]);
    }
  };

  const handleLayoutChange = async (layout: Layout[]) => {
    if (!isEditMode || !currentDashboard) return;

    try {
      // Update gadget positions
      const updates = layout.map(l => {
        const gadget = gadgets.find(g => g.id === l.i);
        if (gadget) {
          return axios.put(`http://localhost:8500/api/gadgets/${gadget.id}`, {
            position: { x: l.x, y: l.y, w: l.w, h: l.h },
          });
        }
        return null;
      }).filter(Boolean);

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating layout:', error);
    }
  };

  const handleAddGadget = () => {
    console.log('Add Gadget clicked');
    if (!currentDashboard) {
      message.error('Please create a dashboard first');
      return;
    }
    setIsAddGadgetModalVisible(true);
  };

  const handleResetLayout = async () => {
    if (!currentDashboard) return;
    try {
      // Reset all gadgets to default positions
      const resetPromises = gadgets.map((gadget, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        return axios.put(`http://localhost:8500/api/gadgets/${gadget.id}`, {
          position: { x: col * 6, y: row * 4, w: 6, h: 4 },
        });
      });
      await Promise.all(resetPromises);
      fetchGadgets(currentDashboard.id);
      message.success('Layout reset successfully');
    } catch (error) {
      console.error('Error resetting layout:', error);
      message.error('Failed to reset layout');
    }
  };

  const handleConfigure = () => {
    message.info('Configure dashboard settings');
  };

  const handleCreateGadget = async (values: any) => {
    try {
      const newGadget = {
        dashboardId: currentDashboard.id,
        type: values.type,
        title: values.title,
        config: values.config || {},
        position: { x: 0, y: 0, w: 4, h: 4 },
        refreshInterval: values.refreshInterval || 15,
        order: gadgets.length,
      };

      const response = await axios.post('http://localhost:8500/api/gadgets', newGadget);
      setGadgets([...gadgets, response.data]);
      setIsAddGadgetModalVisible(false);
      gadgetForm.resetFields();
      message.success('Gadget added successfully');
    } catch (error) {
      console.error('Error creating gadget:', error);
      message.error('Failed to add gadget');
    }
  };

  const handleRemoveGadget = async (gadgetId: string) => {
    try {
      await axios.delete(`http://localhost:8500/api/gadgets/${gadgetId}`);
      setGadgets(gadgets.filter(g => g.id !== gadgetId));
      message.success('Gadget removed');
    } catch (error) {
      console.error('Error removing gadget:', error);
      message.error('Failed to remove gadget');
    }
  };

  const handleCreateDashboard = async (values: any) => {
    try {
      console.log('Form values:', values);
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      console.log('Current user:', currentUser);
      
      const dashboardData = {
        name: values.name,
        description: values.description || '',
        ownerId: currentUser.id || 'default-user',
        columns: values.columns || 2,
        isDefault: values.isDefault || false,
      };
      
      console.log('Sending dashboard data:', dashboardData);
      
      const response = await axios.post('http://localhost:8500/api/dashboards-v2', dashboardData);
      
      console.log('Dashboard created:', response.data);
      setDashboards([...dashboards, response.data]);
      setCurrentDashboard(response.data);
      setIsCreateDashboardModalVisible(false);
      form.resetFields();
      
      // Create default gadgets for new dashboard
      await createDefaultGadgets(response.data.id);
      
      message.success('Dashboard created successfully with default gadgets!');
    } catch (error: any) {
      console.error('Error creating dashboard:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to create dashboard';
      message.error(errorMessage);
    }
  };

  const handleCloneDashboard = async () => {
    if (!currentDashboard) return;

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const response = await axios.post(`http://localhost:8500/api/dashboards-v2/${currentDashboard.id}/clone`, {
        name: `${currentDashboard.name} (Copy)`,
        ownerId: currentUser.id,
      });
      setDashboards([...dashboards, response.data]);
      message.success('Dashboard cloned successfully');
    } catch (error) {
      console.error('Error cloning dashboard:', error);
      message.error('Failed to clone dashboard');
    }
  };

  const handleToggleStar = async () => {
    if (!currentDashboard) return;

    try {
      const response = await axios.post(`http://localhost:8500/api/dashboards-v2/${currentDashboard.id}/star`);
      setCurrentDashboard(response.data);
      setDashboards(dashboards.map(d => d.id === response.data.id ? response.data : d));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const renderGadget = (gadget: any) => {
    switch (gadget.type) {
      case 'filter-results':
        return <FilterResultsGadget gadgetId={gadget.id} config={gadget.config} />;
      case 'assigned-to-me':
        return <AssignedToMeGadget gadgetId={gadget.id} config={gadget.config} />;
      case 'activity-stream':
        return <ActivityStreamGadget gadgetId={gadget.id} config={gadget.config} />;
      case 'pie-chart':
        return <PieChartGadget gadgetId={gadget.id} config={gadget.config} />;
      case 'created-vs-resolved':
        return <CreatedVsResolvedGadget gadgetId={gadget.id} config={gadget.config} />;
      case 'sprint-burndown':
        return <SprintBurndownGadget gadgetId={gadget.id} config={gadget.config} />;
      case 'heat-map':
        return <HeatMapGadget gadgetId={gadget.id} config={gadget.config} />;
      case 'velocity-chart':
        return <VelocityChartGadget gadgetId={gadget.id} config={gadget.config} />;
      default:
        return <div>Gadget type not implemented: {gadget.type}</div>;
    }
  };

  if (!currentDashboard) {
    return (
      <PageContainer>
        <Header>
          <Title>No Dashboard</Title>
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Create Dashboard button clicked!');
              console.log('Current modal state:', isCreateDashboardModalVisible);
              setIsCreateDashboardModalVisible(true);
              console.log('Modal state set to true');
            }}
          >
            Create Dashboard
          </Button>
        </Header>
        
        {/* Create Dashboard Modal - Must be rendered even when no dashboard */}
        <Modal
          title="Create Dashboard"
          open={isCreateDashboardModalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setIsCreateDashboardModalVisible(false);
            form.resetFields();
          }}
        >
          <Form form={form} layout="vertical" onFinish={handleCreateDashboard}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input placeholder="Enter dashboard name" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea placeholder="Enter description" rows={3} />
            </Form.Item>
            <Form.Item name="columns" label="Columns" initialValue={2}>
              <Select>
                <Select.Option value={1}>1 Column</Select.Option>
                <Select.Option value={2}>2 Columns</Select.Option>
                <Select.Option value={3}>3 Columns</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="isDefault" label="Set as default" valuePropName="checked" initialValue={true}>
              <Input type="checkbox" />
            </Form.Item>
          </Form>
        </Modal>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title>{currentDashboard.name}</Title>
          <Select
            style={{ width: 200 }}
            value={currentDashboard.id}
            onChange={(value) => {
              const dashboard = dashboards.find(d => d.id === value);
              setCurrentDashboard(dashboard);
            }}
            options={dashboards.map(d => ({
              value: d.id,
              label: d.name,
            }))}
          />
        </div>
        <Actions>
          <Button
            type={isEditMode ? 'primary' : 'default'}
            icon={<Edit size={16} />}
            onClick={() => {
              console.log('Edit mode toggled:', !isEditMode);
              setIsEditMode(!isEditMode);
            }}
          >
            {isEditMode ? 'Done' : 'Edit'}
          </Button>
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => {
              console.log('Reset Layout clicked');
              handleResetLayout();
            }}
          >
            Reset Layout
          </Button>
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => {
              console.log('Add Gadget button clicked');
              handleAddGadget();
            }}
            type="primary"
          >
            Add Gadget
          </Button>
          <Button 
            icon={<Settings size={16} />} 
            onClick={() => {
              console.log('Configure clicked');
              handleConfigure();
            }}
          >
            Configure
          </Button>
        </Actions>
      </Header>

      <DashboardGrid
        dashboardId={currentDashboard.id}
        gadgets={gadgets}
        isEditMode={isEditMode}
        onLayoutChange={handleLayoutChange}
        onAddGadget={handleAddGadget}
        onRemoveGadget={handleRemoveGadget}
        onConfigureGadget={(id) => console.log('Configure gadget:', id)}
        renderGadget={renderGadget}
      />
      
      {/* Advanced Features Section */}
      <div style={{ marginTop: 24, padding: 20, background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ marginBottom: 16, color: '#EC4899' }}>🚀 Advanced Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <AIAssistant />
          <PredictiveAnalytics />
          <AchievementSystem />
          <BlockchainAudit />
          <VirtualWorkspace />
        </div>
      </div>
      
      {/* Live Cursors Overlay */}
      <LiveCursors />

      {/* Add Gadget Modal */}
      <Modal
        title="Add Gadget"
        open={isAddGadgetModalVisible}
        onOk={() => gadgetForm.submit()}
        onCancel={() => {
          setIsAddGadgetModalVisible(false);
          gadgetForm.resetFields();
        }}
      >
        <Form form={gadgetForm} layout="vertical" onFinish={handleCreateGadget}>
          <Form.Item name="type" label="Gadget Type" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select a gadget type"
              options={GADGET_TYPES.map(t => ({
                value: t.value,
                label: `${t.icon} ${t.label}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Enter gadget title" />
          </Form.Item>
          <Form.Item name="refreshInterval" label="Refresh Interval (minutes)" initialValue={15}>
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Dashboard Modal */}
      <Modal
        title="Create Dashboard"
        open={isCreateDashboardModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsCreateDashboardModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateDashboard}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Enter dashboard name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter description" rows={3} />
          </Form.Item>
          <Form.Item name="columns" label="Columns" initialValue={2}>
            <Select>
              <Select.Option value={1}>1 Column</Select.Option>
              <Select.Option value={2}>2 Columns</Select.Option>
              <Select.Option value={3}>3 Columns</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};
