import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Input, Select, Card, message } from 'antd';
import { Plus, Settings, Edit } from 'lucide-react';
import styled from 'styled-components';
import { dashboardsApi, issuesApi } from '../services/api';
import { DashboardGrid } from '../components/Dashboard/DashboardGrid';

// Styled Components
const PageContainer = styled.div`
  padding: 24px;
  height: 100%;
  overflow-y: auto;
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
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

// Placeholder Components
const AIAssistant = () => <Card size="small" title="AI Assistant">Coming Soon</Card>;
const PredictiveAnalytics = () => <Card size="small" title="Predictive Analytics">Coming Soon</Card>;
const AchievementSystem = () => <Card size="small" title="Achievements">Coming Soon</Card>;
const BlockchainAudit = () => <Card size="small" title="Blockchain Audit">Coming Soon</Card>;
const VirtualWorkspace = () => <Card size="small" title="Virtual Workspace">Coming Soon</Card>;
const LiveCursors = () => null;

const FilterResultsGadget = ({ config }: any) => <div>Filter Results</div>;
const AssignedToMeGadget = ({ config }: any) => <div>Assigned To Me</div>;
const ActivityStreamGadget = ({ config }: any) => <div>Activity Stream</div>;
const PieChartGadget = ({ config }: any) => <div>Pie Chart</div>;
const CreatedVsResolvedGadget = ({ config }: any) => <div>Created vs Resolved</div>;
const SprintBurndownGadget = ({ config }: any) => <div>Sprint Burndown</div>;
const HeatMapGadget = ({ config }: any) => <div>Heat Map</div>;
const VelocityChartGadget = ({ config }: any) => <div>Velocity Chart</div>;

const GADGET_TYPES = [
  { value: 'filter-results', label: 'Filter Results', icon: '🔍' },
  { value: 'assigned-to-me', label: 'Assigned to Me', icon: '👤' },
  { value: 'activity-stream', label: 'Activity Stream', icon: '⚡' },
  { value: 'pie-chart', label: 'Pie Chart', icon: '🥧' },
  { value: 'created-vs-resolved', label: 'Created vs Resolved', icon: '📈' },
  { value: 'sprint-burndown', label: 'Sprint Burndown', icon: '🔥' },
  { value: 'heat-map', label: 'Heat Map', icon: '🗺️' },
  { value: 'velocity', label: 'Velocity Chart', icon: '📊' },
];

export const EnhancedDashboardView: React.FC = () => {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<any>(null);
  const [gadgets, setGadgets] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddGadgetModalVisible, setIsAddGadgetModalVisible] = useState(false);
  const [isCreateDashboardModalVisible, setIsCreateDashboardModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [gadgetForm] = Form.useForm();

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.id) return;
      const response = await dashboardsApi.getAll();
      setDashboards(response.data);
      if (response.data.length > 0) {
        setCurrentDashboard(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching dashboards', error);
    }
  };

  const handleCreateDashboard = async (values: any) => {
    try {
      const response = await dashboardsApi.create(values);
      setDashboards([...dashboards, response.data]);
      setCurrentDashboard(response.data);
      setIsCreateDashboardModalVisible(false);
      form.resetFields();
      message.success('Dashboard created');
    } catch (error) {
      message.error('Failed to create dashboard');
    }
  };

  const handleAddGadget = () => {
    setIsAddGadgetModalVisible(true);
  };

  const handleCreateGadget = (values: any) => {
    // Mock gadget creation
    const newGadget = {
      id: Date.now().toString(),
      ...values,
      position: { x: 0, y: 0, w: 4, h: 4 }
    };
    setGadgets([...gadgets, newGadget]);
    setIsAddGadgetModalVisible(false);
    gadgetForm.resetFields();
  };

  const handleLayoutChange = (layout: any) => {
    // Mock layout change
    console.log('Layout changed', layout);
  };

  const renderGadget = (gadget: any) => {
    switch (gadget.type) {
      case 'filter-results': return <FilterResultsGadget config={gadget.config} />;
      case 'assigned-to-me': return <AssignedToMeGadget config={gadget.config} />;
      case 'activity-stream': return <ActivityStreamGadget config={gadget.config} />;
      case 'pie-chart': return <PieChartGadget config={gadget.config} />;
      case 'created-vs-resolved': return <CreatedVsResolvedGadget config={gadget.config} />;
      case 'sprint-burndown': return <SprintBurndownGadget config={gadget.config} />;
      case 'heat-map': return <HeatMapGadget config={gadget.config} />;
      case 'velocity-chart': return <VelocityChartGadget config={gadget.config} />;
      default: return <div>Unknown Gadget</div>;
    }
  };

  if (!currentDashboard) {
    return (
      <PageContainer>
        <Header>
          <Title>Enhanced Dashboard</Title>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsCreateDashboardModalVisible(true)}>
            Create Dashboard
          </Button>
        </Header>
        <Modal
          title="Create Dashboard"
          open={isCreateDashboardModalVisible}
          onOk={() => form.submit()}
          onCancel={() => setIsCreateDashboardModalVisible(false)}
        >
          <Form form={form} layout="vertical" onFinish={handleCreateDashboard}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input />
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
            onChange={(val) => setCurrentDashboard(dashboards.find(d => d.id === val))}
            options={dashboards.map(d => ({ value: d.id, label: d.name }))}
          />
        </div>
        <Actions>
          <Button icon={<Edit size={16} />} onClick={() => setIsEditMode(!isEditMode)}>
            {isEditMode ? 'Done' : 'Edit'}
          </Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleAddGadget}>
            Add Gadget
          </Button>
        </Actions>
      </Header>

      <DashboardGrid
        dashboardId={currentDashboard.id}
        gadgets={gadgets}
        isEditMode={isEditMode}
        onLayoutChange={handleLayoutChange}
        renderGadget={renderGadget}
        onAddGadget={handleAddGadget}
        onRemoveGadget={(id) => setGadgets(gadgets.filter(g => g.id !== id))}
        onConfigureGadget={() => {}}
      />

      <div style={{ marginTop: 24, padding: 20, background: 'white', borderRadius: 8 }}>
        <h2 style={{ marginBottom: 16, color: '#EC4899' }}>🚀 Advanced Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <AIAssistant />
          <PredictiveAnalytics />
          <AchievementSystem />
          <BlockchainAudit />
          <VirtualWorkspace />
        </div>
      </div>

      <Modal
        title="Add Gadget"
        open={isAddGadgetModalVisible}
        onOk={() => gadgetForm.submit()}
        onCancel={() => setIsAddGadgetModalVisible(false)}
      >
        <Form form={gadgetForm} layout="vertical" onFinish={handleCreateGadget}>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={GADGET_TYPES} />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};
