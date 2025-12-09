import React, { useState } from 'react';
import { Button, Tooltip, Modal, Tag, Space, message } from 'antd';
import { UserAddOutlined, RobotOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const API_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

interface AutoAssignButtonProps {
  issueId: string;
  onAssigned?: (userId: string, userName: string) => void;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'text' | 'link';
  showText?: boolean;
}

interface AssignmentResult {
  recommendedAssignee: {
    userId: string;
    userName: string;
    email: string;
    confidence: number;
    reasons: string[];
  };
  alternativeAssignees: Array<{
    userId: string;
    userName: string;
    score: number;
    reasons: string[];
  }>;
  analysis: {
    issueComplexity: 'low' | 'medium' | 'high';
    requiredSkills: string[];
    estimatedHours: number;
  };
}

const ModalContent = styled.div`
  .assignee-card {
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .confidence-bar {
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 8px;
  }

  .confidence-fill {
    height: 100%;
    background: linear-gradient(90deg, #52c41a, #73d13d);
    transition: width 0.3s;
  }

  .reason-list {
    margin-top: 12px;
    padding-left: 20px;
  }

  .reason-item {
    color: #666;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .alternative-assignee {
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f0f0f0;
      transform: translateX(4px);
    }
  }

  .analysis-section {
    margin-top: 20px;
    padding: 16px;
    background: #e6f7ff;
    border-radius: 8px;
    border: 1px solid #91d5ff;
  }
`;

export const AutoAssignButton: React.FC<AutoAssignButtonProps> = ({
  issueId,
  onAssigned,
  size = 'middle',
  type = 'default',
  showText = true
}) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [result, setResult] = useState<AssignmentResult | null>(null);
  const [applying, setApplying] = useState(false);

  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai-auto-assignment/suggest/${issueId}`);
      
      if (response.data.success) {
        setResult(response.data.data);
        setModalVisible(true);
        message.success('AI recommendation generated!');
      } else {
        message.error(response.data.error || 'Failed to get recommendation');
      }
    } catch (error: any) {
      console.error('Auto-assign error:', error);
      message.error(error.response?.data?.error || 'Failed to get AI recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAssignment = async (userId: string, userName: string) => {
    setApplying(true);
    try {
      const response = await axios.post(`${API_URL}/ai-auto-assignment/assign/${issueId}`, {
        autoApply: true
      });

      if (response.data.success) {
        message.success(`Issue assigned to ${userName}!`);
        setModalVisible(false);
        
        if (onAssigned) {
          onAssigned(userId, userName);
        }
      } else {
        message.error(response.data.error || 'Failed to apply assignment');
      }
    } catch (error: any) {
      console.error('Apply assignment error:', error);
      message.error(error.response?.data?.error || 'Failed to assign issue');
    } finally {
      setApplying(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'default';
    }
  };

  return (
    <>
      <Tooltip title="Get AI-powered assignee recommendation">
        <Button
          icon={<RobotOutlined />}
          onClick={handleAutoAssign}
          loading={loading}
          size={size}
          type={type}
        >
          {showText && 'AI Auto-Assign'}
        </Button>
      </Tooltip>

      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI Assignment Recommendation</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {result && (
          <ModalContent>
            {/* Recommended Assignee */}
            <div className="assignee-card">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>
                    <UserAddOutlined /> {result.recommendedAssignee.userName}
                  </h3>
                  <Tag color="blue">{Math.round(result.recommendedAssignee.confidence)}% Match</Tag>
                </div>
                
                <div style={{ fontSize: 12, color: '#666' }}>
                  {result.recommendedAssignee.email}
                </div>

                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${result.recommendedAssignee.confidence}%` }}
                  />
                </div>

                <div className="reason-list">
                  <strong>Why this person?</strong>
                  {result.recommendedAssignee.reasons.map((reason, idx) => (
                    <div key={idx} className="reason-item">
                      • {reason}
                    </div>
                  ))}
                </div>

                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApplyAssignment(
                    result.recommendedAssignee.userId,
                    result.recommendedAssignee.userName
                  )}
                  loading={applying}
                  block
                  size="large"
                  style={{ marginTop: 12 }}
                >
                  Assign to {result.recommendedAssignee.userName}
                </Button>
              </Space>
            </div>

            {/* Alternative Assignees */}
            {result.alternativeAssignees.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>Alternative Options:</h4>
                {result.alternativeAssignees.map((alt, idx) => (
                  <div
                    key={idx}
                    className="alternative-assignee"
                    onClick={() => handleApplyAssignment(alt.userId, alt.userName)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{alt.userName}</strong>
                      <Tag>{Math.round(alt.score)}% Match</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      {alt.reasons.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Issue Analysis */}
            <div className="analysis-section">
              <h4 style={{ marginTop: 0 }}>Issue Analysis</h4>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Complexity:</strong>{' '}
                  <Tag color={getComplexityColor(result.analysis.issueComplexity)}>
                    {result.analysis.issueComplexity.toUpperCase()}
                  </Tag>
                </div>
                
                <div>
                  <strong>Estimated Time:</strong> {result.analysis.estimatedHours} hours
                </div>

                {result.analysis.requiredSkills.length > 0 && (
                  <div>
                    <strong>Required Skills:</strong>
                    <div style={{ marginTop: 4 }}>
                      {result.analysis.requiredSkills.map((skill, idx) => (
                        <Tag key={idx} color="purple">{skill}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </Space>
            </div>
          </ModalContent>
        )}
      </Modal>
    </>
  );
};
