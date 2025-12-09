import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, List, Button, message, Spin, Empty, Tag } from 'antd';
import { 
  RobotOutlined, 
  CheckCircleOutlined, 
  AlertOutlined, 
  TagsOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { aiFeaturesAPI } from '../../services/ai-features-api';
import type { PMBotActivitySummary } from '../../services/ai-features-api';

interface PMBotDashboardProps {
  projectId: string;
}

export const PMBotDashboard: React.FC<PMBotDashboardProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<PMBotActivitySummary | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadActivity();
    }
  }, [projectId]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const data = await aiFeaturesAPI.pmbot.getActivity(projectId, 7);
      setActivity(data.summary);
    } catch (error: any) {
      console.error('Failed to load PMBot activity:', error);
      message.error('Failed to load PMBot activity');
    } finally {
      setLoading(false);
    }
  };

  const runStaleSweep = async () => {
    try {
      setRunningAction('stale-sweep');
      message.loading('Running stale sweep...', 0);
      
      const result = await aiFeaturesAPI.pmbot.staleSweep(projectId);
      
      message.destroy();
      message.success({
        content: `Found ${result.staleIssues.length} stale issues. ${result.actionsTaken.length} actions taken.`,
        duration: 5
      });
      
      // Refresh activity
      await loadActivity();
    } catch (error: any) {
      message.destroy();
      console.error('Failed to run stale sweep:', error);
      message.error('Failed to run stale sweep');
    } finally {
      setRunningAction(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading PMBot activity..." />
      </div>
    );
  }

  if (!activity) {
    return (
      <Empty
        description="No activity data available"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="pmbot-dashboard">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Auto-Assignments This Week"
              value={activity.autoAssignments || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Stale Issues Detected"
              value={activity.staleIssuesDetected || 0}
              prefix={<AlertOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Issues Triaged"
              value={activity.issuesTriaged || 0}
              prefix={<TagsOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span>
            <RobotOutlined style={{ marginRight: 8 }} />
            PMBot Activity
          </span>
        }
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadActivity}
              disabled={runningAction !== null}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={runningAction === 'stale-sweep'}
              onClick={runStaleSweep}
            >
              Run Stale Sweep
            </Button>
          </div>
        }
      >
        {activity.recentActivity && activity.recentActivity.length > 0 ? (
          <List
            dataSource={activity.recentActivity}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Tag color="blue">{item.action}</Tag>
                  }
                  title={
                    <span>
                      <strong>{item.issueKey}</strong>
                      <span style={{ marginLeft: 8, color: '#666', fontSize: '12px' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </span>
                  }
                  description={item.details}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description="No recent activity"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
};
