import React, { useState } from 'react';
import { Modal, Button, InputNumber, Select, message, Card, Progress, Tag, Divider } from 'antd';
import { ThunderboltOutlined, EyeOutlined, CheckOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

interface SprintAutoPopulateButtonProps {
  sprintId: string;
  sprintName?: string;
  onPopulated?: () => void;
}

interface PopulationResult {
  selectedIssues: Array<{
    issueKey: string;
    summary: string;
    storyPoints: number;
    priority: string;
    assignedTo?: string;
    reason: string;
  }>;
  totalPoints: number;
  capacityUtilization: number;
  teamBalance: {
    [userId: string]: {
      userName: string;
      assignedPoints: number;
      assignedIssues: number;
    };
  };
  recommendations: string[];
  warnings: string[];
}

export const SprintAutoPopulateButton: React.FC<SprintAutoPopulateButtonProps> = ({
  sprintId,
  sprintName = 'Sprint',
  onPopulated
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [teamCapacity, setTeamCapacity] = useState<number>(50);
  const [sprintDuration, setSprintDuration] = useState<number>(14);
  const [prioritizeBy, setPrioritizeBy] = useState<string>('balanced');
  const [result, setResult] = useState<PopulationResult | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:8500/api/ai-sprint-auto-populate/preview/${sprintId}`,
        {
          teamCapacity,
          sprintDuration,
          prioritizeBy
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
        setPreviewMode(true);
        message.success('Preview generated successfully!');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      message.error(error.response?.data?.error || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePopulate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:8500/api/ai-sprint-auto-populate/populate/${sprintId}`,
        {
          teamCapacity,
          sprintDuration,
          prioritizeBy
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
        setPreviewMode(false);
        message.success(`Sprint populated with ${response.data.data.selectedIssues.length} issues!`);
        
        if (onPopulated) {
          onPopulated();
        }
      }
    } catch (error: any) {
      console.error('Population error:', error);
      message.error(error.response?.data?.error || 'Failed to populate sprint');
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
    setResult(null);
    setPreviewMode(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setResult(null);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      highest: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'blue',
      lowest: 'default'
    };
    return colors[priority] || 'default';
  };

  return (
    <>
      <Button
        type="primary"
        icon={<ThunderboltOutlined />}
        onClick={showModal}
        style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          border: 'none'
        }}
      >
        Auto-Populate Sprint
      </Button>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#f5576c', fontSize: 20 }} />
            <span>Sprint Auto-Population: {sprintName}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={900}
        footer={null}
      >
        {!result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Configuration" size="small">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
                    Team Capacity (Story Points)
                  </label>
                  <InputNumber
                    min={10}
                    max={200}
                    value={teamCapacity}
                    onChange={(value) => setTeamCapacity(value || 50)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
                    Sprint Duration (Days)
                  </label>
                  <InputNumber
                    min={7}
                    max={30}
                    value={sprintDuration}
                    onChange={(value) => setSprintDuration(value || 14)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
                    Prioritize By
                  </label>
                  <Select
                    value={prioritizeBy}
                    onChange={setPrioritizeBy}
                    style={{ width: '100%' }}
                  >
                    <Option value="balanced">Balanced (Recommended)</Option>
                    <Option value="priority">Priority First</Option>
                    <Option value="business-value">Business Value</Option>
                    <Option value="dependencies">Dependencies</Option>
                  </Select>
                </div>
              </div>
            </Card>

            <div style={{
              background: '#f0f7ff',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #bae0ff'
            }}>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>
                🤖 AI Will Automatically:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
                <li>Analyze backlog issues</li>
                <li>Calculate historical velocity</li>
                <li>Select optimal issues for capacity</li>
                <li>Balance workload across team</li>
                <li>Consider dependencies and priorities</li>
                <li>Assign issues to team members</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={handlePreview}
                loading={loading}
              >
                Preview
              </Button>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handlePopulate}
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none'
                }}
              >
                Populate Now
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Sprint Summary</span>
                  {!previewMode && (
                    <Tag color="success" icon={<CheckOutlined />}>Applied</Tag>
                  )}
                  {previewMode && (
                    <Tag color="processing">Preview Mode</Tag>
                  )}
                </div>
              }
              size="small"
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Issues Selected</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                    {result.selectedIssues.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Total Points</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                    {result.totalPoints}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Capacity</div>
                  <Progress
                    percent={result.capacityUtilization}
                    status={result.capacityUtilization > 95 ? 'exception' : 'active'}
                    strokeColor={
                      result.capacityUtilization > 95 ? '#ff4d4f' :
                      result.capacityUtilization > 80 ? '#52c41a' :
                      '#faad14'
                    }
                  />
                </div>
              </div>
            </Card>

            {result.warnings.length > 0 && (
              <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                <div style={{ fontWeight: 500, color: '#fa8c16', marginBottom: 8 }}>
                  ⚠️ Warnings:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {result.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title="Selected Issues" size="small" style={{ maxHeight: 300, overflow: 'auto' }}>
              {result.selectedIssues.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 8,
                    background: idx % 2 === 0 ? '#fafafa' : 'white',
                    borderRadius: 4,
                    marginBottom: 4
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <Tag color="blue">{issue.issueKey}</Tag>
                      <span>{issue.summary}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Tag color={getPriorityColor(issue.priority)}>
                        {issue.priority.toUpperCase()}
                      </Tag>
                      <Tag color="purple">{issue.storyPoints} pts</Tag>
                    </div>
                  </div>
                </div>
              ))}
            </Card>

            <Card title="Team Balance" size="small">
              {Object.entries(result.teamBalance).map(([userId, data]) => (
                <div key={userId} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>
                      <UserOutlined /> {data.userName}
                    </span>
                    <span>
                      {data.assignedPoints} pts • {data.assignedIssues} issues
                    </span>
                  </div>
                  <Progress
                    percent={Math.round((data.assignedPoints / teamCapacity) * 100)}
                    size="small"
                    strokeColor="#722ed1"
                  />
                </div>
              ))}
            </Card>

            {result.recommendations.length > 0 && (
              <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <div style={{ fontWeight: 500, color: '#52c41a', marginBottom: 8 }}>
                  💡 Recommendations:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </Card>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {previewMode ? (
                <>
                  <Button onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handlePopulate}
                    loading={loading}
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      border: 'none'
                    }}
                  >
                    Apply to Sprint
                  </Button>
                </>
              ) : (
                <Button type="primary" onClick={handleCancel}>
                  Done
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
