import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, Row, Col, Statistic, Progress, List, Tag, Button, Select, message, Spin, Empty, Switch } from 'antd';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  CheckCircle, Clock, AlertCircle, TrendingUp, Activity, 
  BarChart3, Link as LinkIcon, Users, Filter, Plus, Settings, Move, Lock, Unlock 
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { GlassPanel, GlassCard, GlassHeader } from '../components/common/GlassPanel';
import { AIAssistant, LiveCursors, PredictiveAnalytics, AchievementSystem, BlockchainAudit, VirtualWorkspace } from '../features';
import axios from 'axios';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Container = styled.div`
  padding: 24px;
  min-height: calc(100vh - 56px);
`;

const Header = styled(GlassPanel)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${colors.text.primary};
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
`;

const GadgetContainer = styled(GlassCard)`
  height: 100%;
  
  .ant-list-item {
    border-bottom: 1px solid rgba(0,0,0,0.05) !important;
    padding: 12px 16px !important;
    
    &:hover {
      background: rgba(255,255,255,0.5);
    }
  }
`;

const StatPanel = styled(GlassPanel)`
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
  padding: 24px;
`;

const IconWrapper = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
  box-shadow: 0 4px 12px ${props => props.color}30;
`;

const QuickLink = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  
  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.05);
    border-color: ${colors.primary[400]};
  }
  
  span {
    font-weight: 500;
    color: ${colors.text.primary};
  }
`;

const API_URL = 'http://localhost:8500/api';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'];

export const DashboardView: React.FC = () => {
  const { issues, currentUser, currentProject, sprints } = useStore();
  const [loading, setLoading] = useState(false);
  const [gadgetData, setGadgetData] = useState<Record<string, any>>({});
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<any>(() => {
    const saved = localStorage.getItem('dashboardLayout');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      lg: [
        { i: 'stats', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
        { i: 'assigned', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'activity', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'pie-chart', x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'created-vs-resolved', x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'sprint-burndown', x: 0, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'quick-links', x: 6, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'in-progress', x: 0, y: 14, w: 12, h: 4, minW: 6, minH: 3 },
      ]
    };
  });
  
  const projectId = currentProject?.id || 'default-project';
  
  const handleLayoutChange = (layout: Layout[], layouts: any) => {
    setLayouts(layouts);
    localStorage.setItem('dashboardLayout', JSON.stringify(layouts));
  };
  
  const resetLayout = () => {
    const defaultLayout = {
      lg: [
        { i: 'stats', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
        { i: 'assigned', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'activity', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'pie-chart', x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'created-vs-resolved', x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'sprint-burndown', x: 0, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'quick-links', x: 6, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
        { i: 'in-progress', x: 0, y: 14, w: 12, h: 4, minW: 6, minH: 3 },
      ]
    };
    setLayouts(defaultLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(defaultLayout));
    message.success('Layout reset to default');
  };
  
  // Filter issues by current project
  const projectIssues = issues.filter(i => 
    currentProject ? i.projectId === currentProject.id : false
  );
  
  useEffect(() => {
    if (currentProject) {
      loadAllGadgets();
    }
  }, [projectId, currentProject]);
  
  const loadAllGadgets = async () => {
    setLoading(true);
    try {
      const gadgetTypes = [
        'assigned-to-me',
        'activity-stream',
        'pie-chart',
        'created-vs-resolved',
        'sprint-burndown',
        'quick-links',
        'stats',
        'in-progress',
      ];
      
      const promises = gadgetTypes.map(type =>
        axios.get(`${API_URL}/dashboards/dashboard-1/gadgets/${type}/data?projectId=${projectId}`)
          .then(res => ({ type, data: res.data }))
          .catch(err => ({ type, data: null, error: err }))
      );
      
      const results = await Promise.all(promises);
      const dataMap = results.reduce((acc, { type, data }) => {
        acc[type] = data;
        return acc;
      }, {} as Record<string, any>);
      
      setGadgetData(dataMap);
    } catch (error) {
      console.error('Failed to load gadgets:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate stats from projectIssues
  const stats = {
    total: projectIssues.length,
    open: projectIssues.filter(i => i.status === 'todo' || i.status === 'backlog').length,
    inProgress: projectIssues.filter(i => i.status === 'in-progress').length,
    done: projectIssues.filter(i => i.status === 'done').length,
  };
  
  const pieData = gadgetData['pie-chart']?.data || [];
  const createdVsResolved = gadgetData['created-vs-resolved'] || { created: 0, resolved: 0 };
  const sprintBurndown = gadgetData['sprint-burndown'] || {};
  const quickLinks = gadgetData['quick-links']?.links || [];
  const assignedIssues = gadgetData['assigned-to-me']?.issues || [];
  const activities = gadgetData['activity-stream']?.activities || [];
  const inProgressIssues = gadgetData['in-progress']?.issues || [];
  
  if (loading) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" tip="Loading dashboard..." />
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <Title>
          <BarChart3 size={28} color="#1890ff" />
          Dashboard
        </Title>
        <Controls>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Switch
              checked={editMode}
              onChange={setEditMode}
              checkedChildren={<><Unlock size={12} /> Edit</>}
              unCheckedChildren={<><Lock size={12} /> Locked</>}
            />
            {editMode && (
              <Button 
                icon={<Move size={16} />} 
                onClick={resetLayout}
                size="small"
              >
                Reset Layout
              </Button>
            )}
          </div>
          <Button icon={<Plus size={16} />}>Add Gadget</Button>
          <Button icon={<Settings size={16} />}>Configure</Button>
        </Controls>
      </Header>
      
      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatPanel>
            <IconWrapper color="#1890ff">
              <BarChart3 size={24} />
            </IconWrapper>
            <Statistic
              title="Total Issues"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </StatPanel>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatPanel>
            <IconWrapper color="#faad14">
              <Clock size={24} />
            </IconWrapper>
            <Statistic
              title="Open Issues"
              value={stats.open}
              valueStyle={{ color: '#faad14' }}
            />
          </StatPanel>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatPanel>
            <IconWrapper color="#1890ff">
              <Activity size={24} />
            </IconWrapper>
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              valueStyle={{ color: '#1890ff' }}
            />
          </StatPanel>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatPanel>
            <IconWrapper color="#52c41a">
              <CheckCircle size={24} />
            </IconWrapper>
            <Statistic
              title="Done"
              value={stats.done}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatPanel>
        </Col>
      </Row>
      
      {/* Main Content Row */}
      <Row gutter={[16, 16]}>
        {/* Left Column */}
        <Col xs={24} lg={12}>
          {/* Assigned to Me */}
          <GadgetContainer title="Assigned to Me" style={{ marginBottom: 16, minHeight: 300 }}>
            {assignedIssues.length > 0 ? (
              <List
                dataSource={assignedIssues.slice(0, 5)}
                renderItem={(item: any) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/issue/${item.key}`}>
                    <List.Item.Meta
                      title={<a href={`/issue/${item.key}`}>{item.key} - {item.summary}</a>}
                      description={
                        <div>
                          <Tag>{item.type}</Tag>
                          <Tag color={item.status === 'done' ? 'green' : 'blue'}>{item.status}</Tag>
                          <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'default'}>
                            {item.priority}
                          </Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Empty 
                  description={
                    <div>
                      <p style={{ marginBottom: 12 }}>No issues assigned to you</p>
                      <Button type="primary" onClick={() => window.location.href = '/board'}>
                        View All Issues
                      </Button>
                    </div>
                  } 
                />
              </div>
            )}
          </GadgetContainer>
          
          {/* Activity Stream */}
          <GadgetContainer title="Activity Stream" style={{ minHeight: 300 }}>
            {activities.length > 0 ? (
              <List
                dataSource={activities.slice(0, 5)}
                renderItem={(item: any) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/issue/${item.issue.key}`}>
                    <List.Item.Meta
                      avatar={<Activity size={16} color="#1890ff" />}
                      title={<a href={`/issue/${item.issue.key}`}>{item.issue.key} was updated</a>}
                      description={item.issue.summary}
                    />
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Empty description="No recent activity" />
              </div>
            )}
          </GadgetContainer>
        </Col>
        
        {/* Right Column */}
        <Col xs={24} lg={12}>
          {/* Issues by Status Pie Chart */}
          <GadgetContainer title="Issues by Status" style={{ marginBottom: 16, minHeight: 300 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Empty description="No data available" />
              </div>
            )}
          </GadgetContainer>
          
          {/* Created vs Resolved */}
          <GadgetContainer title="Created vs Resolved (Last 30 Days)" style={{ minHeight: 300 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Created"
                  value={createdVsResolved.created || 0}
                  prefix={<TrendingUp size={16} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Resolved"
                  value={createdVsResolved.resolved || 0}
                  prefix={<CheckCircle size={16} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
              <div style={{ fontSize: 12, color: '#666' }}>
                Trend: <strong style={{ color: createdVsResolved.trend === 'increasing' ? '#ff4d4f' : '#52c41a' }}>
                  {createdVsResolved.trend === 'increasing' ? '📈 Backlog Growing' : '📉 Backlog Shrinking'}
                </strong>
              </div>
            </div>
          </GadgetContainer>
        </Col>
      </Row>
      
      {/* Bottom Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* Sprint Burndown */}
        <Col xs={24} md={12}>
          <GadgetContainer title="Sprint Burndown">
            {sprintBurndown.sprint ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: 0, marginBottom: 8 }}>{sprintBurndown.sprint}</h4>
                  <Progress
                    percent={sprintBurndown.progress}
                    status="active"
                    strokeColor="#52c41a"
                  />
                </div>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Total"
                      value={sprintBurndown.totalPoints}
                      suffix="pts"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Completed"
                      value={sprintBurndown.completedPoints}
                      suffix="pts"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Remaining"
                      value={sprintBurndown.remainingPoints}
                      suffix="pts"
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                </Row>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Empty 
                  description={
                    <div>
                      <p style={{ marginBottom: 12 }}>No active sprint</p>
                      <Button type="primary" onClick={() => window.location.href = '/backlog'}>
                        Start a Sprint
                      </Button>
                    </div>
                  } 
                />
              </div>
            )}
          </GadgetContainer>
        </Col>
        
        {/* Quick Links */}
        <Col xs={24} md={12}>
          <GadgetContainer title="Quick Links">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <QuickLink onClick={() => window.location.href = '/board'}>
                <BarChart3 size={16} />
                <span>View Board</span>
              </QuickLink>
              <QuickLink onClick={() => window.location.href = '/backlog'}>
                <Activity size={16} />
                <span>Backlog</span>
              </QuickLink>
              <QuickLink onClick={() => window.location.href = '/roadmap'}>
                <TrendingUp size={16} />
                <span>Roadmap</span>
              </QuickLink>
              <QuickLink onClick={() => window.location.href = '/reports'}>
                <BarChart3 size={16} />
                <span>Reports</span>
              </QuickLink>
            </div>
          </GadgetContainer>
        </Col>
      </Row>
      
      {/* In Progress Issues */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <GadgetContainer title="In Progress Issues">
            {inProgressIssues.length > 0 ? (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
                dataSource={inProgressIssues}
                renderItem={(item: any) => (
                  <List.Item>
                    <Card size="small">
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="blue">{item.key}</Tag>
                        <Tag>{item.type}</Tag>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.summary}</div>
                      {item.assignee && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                          👤 {item.assignee.name}
                        </div>
                      )}
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No issues in progress" />
            )}
          </GadgetContainer>
        </Col>
      </Row>
      
      {/* Advanced Features Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <AIAssistant />
        </Col>
        <Col xs={24} md={8}>
          <PredictiveAnalytics />
        </Col>
        <Col xs={24} md={8}>
          <AchievementSystem />
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <BlockchainAudit />
        </Col>
        <Col xs={24} md={8}>
          <VirtualWorkspace />
        </Col>
        <Col xs={24} md={8}>
          {/* Future feature slot */}
        </Col>
      </Row>
      
      {/* Live Cursors Overlay */}
      <LiveCursors />
    </Container>
  );
};
