import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Progress, Spin } from 'antd';
import { TrendingUp, CheckCircle, Clock, Target } from 'lucide-react';
import styled from 'styled-components';
import { analyticsApi } from '../../services/analytics-api';
import { useStore } from '../../store/useStore';

const StyledCard = styled(Card)`
  .ant-card-body {
    padding: 24px;
  }
`;

const StatCard = styled.div`
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(156, 39, 176, 0.2);
  }
`;

export const AnalyticsWidget: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useStore();

  useEffect(() => {
    if (currentProject) {
      loadAnalytics();
    }
  }, [currentProject]);

  const loadAnalytics = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    try {
      const response = await analyticsApi.getProjectAnalytics(currentProject.id);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card><Spin /></Card>;
  }

  if (!analytics) {
    return <Card>No analytics data available</Card>;
  }

  return (
    <StyledCard title="📊 Project Analytics">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <StatCard>
            <Statistic
              title="Total Issues"
              value={analytics.totalIssues}
              prefix={<Target size={20} />}
              valueStyle={{ color: '#9C27B0' }}
            />
          </StatCard>
        </Col>
        <Col span={6}>
          <StatCard>
            <Statistic
              title="Completed"
              value={analytics.byStatus.done}
              prefix={<CheckCircle size={20} />}
              valueStyle={{ color: '#4CAF50' }}
            />
          </StatCard>
        </Col>
        <Col span={6}>
          <StatCard>
            <Statistic
              title="In Progress"
              value={analytics.byStatus.inProgress}
              prefix={<Clock size={20} />}
              valueStyle={{ color: '#FF9800' }}
            />
          </StatCard>
        </Col>
        <Col span={6}>
          <StatCard>
            <Statistic
              title="Completion Rate"
              value={analytics.completionRate}
              suffix="%"
              prefix={<TrendingUp size={20} />}
              valueStyle={{ color: '#2196F3' }}
            />
          </StatCard>
        </Col>
      </Row>
      
      <div style={{ marginTop: 24 }}>
        <h4>Progress by Status</h4>
        <Progress
          percent={parseFloat(analytics.completionRate)}
          strokeColor={{
            '0%': '#9C27B0',
            '100%': '#6A1B9A',
          }}
          status="active"
        />
      </div>
      
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <div>
            <h4>By Type</h4>
            <div>Epic: {analytics.byType.epic}</div>
            <div>Story: {analytics.byType.story}</div>
            <div>Task: {analytics.byType.task}</div>
            <div>Bug: {analytics.byType.bug}</div>
          </div>
        </Col>
        <Col span={12}>
          <div>
            <h4>By Priority</h4>
            <div>🔴 Highest: {analytics.byPriority.highest}</div>
            <div>🟠 High: {analytics.byPriority.high}</div>
            <div>🟡 Medium: {analytics.byPriority.medium}</div>
            <div>🟢 Low: {analytics.byPriority.low}</div>
          </div>
        </Col>
      </Row>
      
      <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
        Avg. Time to Complete: {analytics.avgTimeToComplete}
      </div>
    </StyledCard>
  );
};
