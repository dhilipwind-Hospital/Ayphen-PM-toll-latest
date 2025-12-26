import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Avatar, Tag, Button, Select, Spin } from 'antd';
import { TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { issuesApi, sprintsApi, workflowsApi } from '../services/api';
import { OrphanedIssuesWidget } from '../components/Dashboard/OrphanedIssuesWidget';
import { AIAssistant, LiveCursors, PredictiveAnalytics, AchievementSystem, BlockchainAudit, VirtualWorkspace } from '../features';
import { H1, BodyLarge } from '../components/Typography';
import { StatsSkeleton } from '../components/Loading/SkeletonLoaders';
import { ErrorBoundary } from '../components/ErrorBoundary';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const DashboardContainer = styled.div`
  padding: 32px;
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
  min-height: calc(100vh - 64px);
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const GlassCard = styled(Card)`
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeIn} 0.6s ease-out backwards;
  
  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .ant-card-head {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-weight: 700;
    font-size: 1.125rem;
  }
  
  .ant-card-body {
    padding: 24px;
  }
`;

const StatsCard = styled(GlassCard)`
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || '#0EA5E9'};
    opacity: 0.8;
  }
  
  .ant-statistic-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  
  .ant-statistic-content {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.2;
  }
`;

const QuickStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
`;

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{count}</>;
};

export const EnhancedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, issues, sprints, currentUser, isInitialized, setIssues, setSprints } = useStore();
  const [timeRange, setTimeRange] = useState('week');
  const [projectFilter, setProjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: 'Total Issues', value: 0, icon: <TrendingUp size={28} />, color: '#0EA5E9' },
    { title: 'In Progress', value: 0, icon: <Clock size={28} />, color: '#38BDF8' },
    { title: 'Completed', value: 0, icon: <CheckCircle size={28} />, color: '#10B981' },
    { title: 'Overdue', value: 0, icon: <AlertTriangle size={28} />, color: '#EF4444' },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [sprintProgress, setSprintProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const [workflowStatusList, setWorkflowStatusList] = useState<any[]>([]);

  const projectIssues = useMemo(() => {
    return currentProject
      ? issues.filter((i: any) => i.projectId === currentProject.id)
      : issues;
  }, [currentProject, issues]);

  // Fetch data if store is empty (e.g. on page refresh)
  useEffect(() => {
    const fetchData = async () => {
      if (!currentProject) return;

      try {
        // Fetch workflow for categories
        const wfId = currentProject.workflowId || 'workflow-1';
        const wfRes = await workflowsApi.getById(wfId);
        setWorkflowStatusList(wfRes.data.statuses || []);

        // Fetch issues if missing
        if (issues.length === 0) {
          const res = await issuesApi.getByProject(currentProject.id);
          setIssues(res.data || []);
        }

        // Fetch sprints if missing (for progress widget)
        if (sprints.length === 0) {
          const res = await sprintsApi.getAll(currentProject.id);
          const sprintData = Array.isArray(res.data) ? res.data : (res.data.sprints || []);
          setSprints(sprintData);
        }
      } catch (error) {
        console.error('Failed to initialize dashboard data:', error);
      }
    };

    fetchData();
  }, [currentProject]);

  const loadDashboardData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const doneStatuses = workflowStatusList.filter(s => s.category === 'DONE').map(s => s.id.toLowerCase());
      const inProgressStatuses = workflowStatusList.filter(s => s.category === 'IN_PROGRESS').map(s => s.id.toLowerCase());
      const todoStatuses = workflowStatusList.filter(s => s.category === 'TODO').map(s => s.id.toLowerCase());

      const totalIssues = projectIssues.length;
      const inProgress = projectIssues.filter((i: any) => inProgressStatuses.includes(i.status.toLowerCase())).length;
      const completed = projectIssues.filter((i: any) => doneStatuses.includes(i.status.toLowerCase())).length;
      const overdue = projectIssues.filter((i: any) => {
        if (!i.dueDate) return false;
        return new Date(i.dueDate) < new Date() && !doneStatuses.includes(i.status.toLowerCase());
      }).length;

      setStats([
        { title: 'Total Issues', value: totalIssues, icon: <TrendingUp size={28} />, color: '#0EA5E9' },
        { title: 'In Progress', value: inProgress, icon: <Clock size={28} />, color: '#38BDF8' },
        { title: 'Completed', value: completed, icon: <CheckCircle size={28} />, color: '#10B981' },
        { title: 'Overdue', value: overdue, icon: <AlertTriangle size={28} />, color: '#EF4444' },
      ]);

      const recentIssues = projectIssues
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map((issue: any) => ({
          user: issue.assignee?.name || 'Unassigned',
          action: doneStatuses.includes(issue.status.toLowerCase()) ? 'completed' : 'updated',
          issue: issue.key,
          time: getTimeAgo(issue.updatedAt),
        }));
      setRecentActivity(recentIssues);

      const deadlines = projectIssues
        .filter((i: any) => i.dueDate && !doneStatuses.includes(i.status.toLowerCase()))
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5)
        .map((issue: any) => ({
          title: issue.title,
          date: new Date(issue.dueDate).toLocaleDateString(),
          priority: issue.priority || 'medium',
        }));
      setUpcomingDeadlines(deadlines);

      const activeSprint = sprints.find((s: any) => s.status === 'active');
      if (activeSprint) {
        const sprintIssues = projectIssues.filter((i: any) => i.sprintId === activeSprint.id);
        const completedCount = sprintIssues.filter((i: any) => doneStatuses.includes(i.status.toLowerCase())).length;
        setSprintProgress({
          completed: completedCount,
          total: sprintIssues.length,
          percent: sprintIssues.length > 0 ? Math.round((completedCount / sprintIssues.length) * 100) : 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentProject, issues, sprints, workflowStatusList]);

  // No project selected state
  if (!currentProject) {
    return (
      <DashboardContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <h2>No project selected</h2>
        </div>
      </DashboardContainer>
    );
  }

  if (loading) {
    return (
      <DashboardContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <PageHeader>
        <H1 style={{
          background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Dashboard
        </H1>
        <BodyLarge style={{ marginTop: '8px' }}>
          Track your team's progress and performance at a glance
        </BodyLarge>
      </PageHeader>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Select value={timeRange} onChange={setTimeRange} style={{ minWidth: '140px' }}>
            <Select.Option value="week">This Week</Select.Option>
            <Select.Option value="month">This Month</Select.Option>
            <Select.Option value="quarter">This Quarter</Select.Option>
          </Select>
          <Select value={projectFilter} onChange={setProjectFilter} style={{ minWidth: '140px' }}>
            <Select.Option value="all">All Projects</Select.Option>
            <Select.Option value="active">Active Projects</Select.Option>
          </Select>
        </Col>
      </Row>

      <QuickStats>
        {stats.map((stat, index) => (
          <StatsCard key={index} color={stat.color} style={{ animationDelay: `${index * 0.1}s` }}>
            <div style={{ padding: '20px' }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                {stat.title}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <IconWrapper style={{ color: stat.color, backgroundColor: `${stat.color}20` }}>
                  {stat.icon}
                </IconWrapper>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: stat.color
                }}>
                  <AnimatedCounter value={stat.value} duration={1200 + index * 100} />
                </div>
              </div>
            </div>
          </StatsCard>
        ))}
      </QuickStats>

      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} md={12}>
          <ErrorBoundary title="Orphaned Issues">
            <OrphanedIssuesWidget />
          </ErrorBoundary>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GlassCard title="Recent Activity" extra={<Button type="link" onClick={() => navigate('/reports')}>View All</Button>}>
            <List
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#0EA5E9' }}>{item.user[0]}</Avatar>}
                    title={`${item.user} ${item.action} ${item.issue}`}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </GlassCard>
        </Col>

        <Col xs={24} lg={12}>
          <GlassCard title="Upcoming Deadlines">
            <List
              dataSource={upcomingDeadlines}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={item.date}
                  />
                  <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'green'}>
                    {item.priority}
                  </Tag>
                </List.Item>
              )}
            />
          </GlassCard>
        </Col>

        <Col xs={24} lg={12}>
          <GlassCard title="Sprint Progress">
            {sprintProgress.total > 0 ? (
              <div>
                <h4>Current Sprint</h4>
                <Progress percent={sprintProgress.percent} strokeColor="#0EA5E9" />
                <p>{sprintProgress.completed} of {sprintProgress.total} issues completed</p>
              </div>
            ) : (
              <p>No active sprint</p>
            )}
          </GlassCard>
        </Col>

        <Col xs={24} lg={12}>
          <GlassCard title="Issue Distribution">
            <List
              dataSource={[
                { name: 'To Do', count: projectIssues.filter((i: any) => workflowStatusList.find(s => s.id === i.status && s.category === 'TODO')).length },
                { name: 'In Progress', count: projectIssues.filter((i: any) => workflowStatusList.find(s => s.id === i.status && s.category === 'IN_PROGRESS')).length },
                { name: 'Done', count: projectIssues.filter((i: any) => workflowStatusList.find(s => s.id === i.status && s.category === 'DONE')).length },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item.name} />
                  <Tag color="#0EA5E9">{item.count}</Tag>
                </List.Item>
              )}
            />
          </GlassCard>
        </Col>
      </Row>

      {/* Advanced Features Section */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <h2 style={{ color: '#0EA5E9', marginBottom: 16 }}>🚀 Advanced Features</h2>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <ErrorBoundary title="AI Assistant">
            <AIAssistant />
          </ErrorBoundary>
        </Col>
        <Col xs={24} md={8}>
          <ErrorBoundary title="Analytics">
            <PredictiveAnalytics />
          </ErrorBoundary>
        </Col>
        <Col xs={24} md={8}>
          <ErrorBoundary title="Achievements">
            <AchievementSystem />
          </ErrorBoundary>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <ErrorBoundary title="Blockchain Audit">
            <BlockchainAudit />
          </ErrorBoundary>
        </Col>
        <Col xs={24} md={8}>
          <ErrorBoundary title="Virtual Workspace">
            <VirtualWorkspace />
          </ErrorBoundary>
        </Col>
        <Col xs={24} md={8}>
          {/* Future feature slot */}
        </Col>
      </Row>

      {/* Live Cursors Overlay */}
      <LiveCursors />
    </DashboardContainer>
  );
};