import React, { useEffect, useState } from 'react';
import { Card, Progress, Statistic, Row, Col, List, Tag, Spin, Empty } from 'antd';
import { RocketOutlined, AlertOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { isFeatureEnabled } from '../../config/features';
import { useStore } from '../../store/useStore';
import axios from 'axios';
import styled from 'styled-components';

const AlertItem = styled(List.Item)`
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
`;

interface AlertData {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  category: string;
}

export const PredictiveAnalytics: React.FC = () => {
  const { currentProject } = useStore();
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [velocityHealth, setVelocityHealth] = useState(100);

  useEffect(() => {
    if (currentProject) {
      fetchAnalytics();
    }
  }, [currentProject]);

  const fetchAnalytics = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8500/api/predictive-alerts/${currentProject.id}`);
      if (response.data.success) {
        const fetchedAlerts: AlertData[] = response.data.alerts;
        setAlerts(fetchedAlerts);
        calculateMetrics(fetchedAlerts);
      }
    } catch (error) {
      console.error('Failed to fetch predictive analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (currentAlerts: AlertData[]) => {
    // Calculate Risk Score (0-100)
    // Critical = 25, Warning = 10, Info = 2
    let risk = 0;
    currentAlerts.forEach(alert => {
      if (alert.severity === 'critical') risk += 25;
      if (alert.severity === 'warning') risk += 10;
      if (alert.severity === 'info') risk += 2;
    });
    setRiskScore(Math.min(risk, 100));

    // Calculate Velocity Health (100 - penalties)
    // Velocity drops penalize health
    const velocityIssues = currentAlerts.filter(a => a.category === 'velocity');
    let health = 100;
    velocityIssues.forEach(alert => {
      if (alert.severity === 'warning') health -= 20;
      if (alert.severity === 'info') health -= 5;
    });
    setVelocityHealth(Math.max(health, 0));
  };

  if (!isFeatureEnabled('ADVANCED_ANALYTICS')) return null;

  if (!currentProject) {
    return (
      <Card title="🔮 Predictive Analytics" size="small">
        <Empty description="Select a project to view analytics" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card title="🔮 Predictive Analytics" size="small" extra={loading && <Spin size="small" />}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="Project Health"
            value={100 - riskScore}
            suffix="%"
            prefix={<CheckCircleOutlined style={{ color: riskScore > 50 ? '#ff4d4f' : '#52c41a' }} />}
          />
          <Progress
            percent={100 - riskScore}
            status={riskScore > 50 ? 'exception' : 'active'}
            strokeColor={riskScore > 50 ? '#ff4d4f' : '#52c41a'}
            showInfo={false}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Delivery Risk"
            value={riskScore}
            suffix="%"
            prefix={<AlertOutlined style={{ color: riskScore > 20 ? '#faad14' : '#52c41a' }} />}
          />
          <Progress
            percent={riskScore}
            status={riskScore > 50 ? 'exception' : 'normal'}
            strokeColor={riskScore > 50 ? '#ff4d4f' : '#faad14'}
            showInfo={false}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Velocity Health"
            value={velocityHealth}
            suffix="%"
            prefix={<RocketOutlined style={{ color: '#1890ff' }} />}
          />
          <Progress percent={velocityHealth} showInfo={false} />
        </Col>
      </Row>

      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <h4 style={{ margin: '8px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Active Insights</h4>
        {alerts.length === 0 ? (
          <div style={{ color: '#999', textAlign: 'center', padding: '10px' }}>No active alerts. Everything looks good!</div>
        ) : (
          <List
            size="small"
            dataSource={alerts}
            renderItem={item => (
              <AlertItem>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>
                      {item.severity === 'critical' && <AlertOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />}
                      {item.severity === 'warning' && <AlertOutlined style={{ color: '#faad14', marginRight: 4 }} />}
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{item.message}</div>
                  </div>
                  <Tag color={item.category === 'velocity' ? 'blue' : item.category === 'deadline' ? 'red' : 'orange'}>
                    {item.category}
                  </Tag>
                </div>
              </AlertItem>
            )}
          />
        )}
      </div>
    </Card>
  );
};