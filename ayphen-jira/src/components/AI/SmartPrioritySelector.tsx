import React, { useState } from 'react';
import { Button, Tooltip, Modal, Tag, Space, Progress, message } from 'antd';
import { ThunderboltOutlined, RobotOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const API_URL = 'http://localhost:8500/api';

interface SmartPrioritySelectorProps {
  issueId: string;
  currentPriority?: string;
  onPriorityChanged?: (priority: string) => void;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'text' | 'link';
  showText?: boolean;
}

interface PriorityAnalysis {
  suggestedPriority: string;
  confidence: number;
  reasons: string[];
  urgencyScore: number;
  impactScore: number;
  businessValue: number;
  riskLevel: string;
}

const ModalContent = styled.div`
  .priority-card {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    margin-bottom: 20px;
  }

  .score-section {
    margin-top: 20px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .score-item {
    margin-bottom: 12px;
  }

  .reason-list {
    margin-top: 12px;
  }

  .reason-item {
    padding: 8px 12px;
    background: white;
    border-left: 3px solid #667eea;
    margin-bottom: 8px;
    border-radius: 4px;
  }

  .risk-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
  }
`;

const priorityColors: Record<string, string> = {
  highest: '#ff4d4f',
  high: '#ff7a45',
  medium: '#ffa940',
  low: '#52c41a',
  lowest: '#1890ff'
};

const priorityEmojis: Record<string, string> = {
  highest: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  lowest: '🔵'
};

const riskColors: Record<string, string> = {
  critical: '#ff4d4f',
  high: '#ff7a45',
  medium: '#ffa940',
  low: '#52c41a'
};

export const SmartPrioritySelector: React.FC<SmartPrioritySelectorProps> = ({
  issueId,
  currentPriority,
  onPriorityChanged,
  size = 'middle',
  type = 'default',
  showText = true
}) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [analysis, setAnalysis] = useState<PriorityAnalysis | null>(null);
  const [applying, setApplying] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai-smart-prioritization/analyze/${issueId}`);
      
      if (response.data.success) {
        setAnalysis(response.data.data);
        setModalVisible(true);
        message.success('AI priority analysis complete!');
      } else {
        message.error(response.data.error || 'Failed to analyze priority');
      }
    } catch (error: any) {
      console.error('Priority analysis error:', error);
      message.error(error.response?.data?.error || 'Failed to analyze priority');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPriority = async () => {
    if (!analysis) return;

    setApplying(true);
    try {
      const response = await axios.post(`${API_URL}/ai-smart-prioritization/apply/${issueId}`, {
        autoApply: true
      });

      if (response.data.success) {
        message.success(`Priority updated to ${analysis.suggestedPriority}!`);
        setModalVisible(false);
        
        if (onPriorityChanged) {
          onPriorityChanged(analysis.suggestedPriority);
        }
      } else {
        message.error(response.data.error || 'Failed to apply priority');
      }
    } catch (error: any) {
      console.error('Apply priority error:', error);
      message.error(error.response?.data?.error || 'Failed to update priority');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Tooltip title="Get AI-powered priority recommendation">
        <Button
          icon={<ThunderboltOutlined />}
          onClick={handleAnalyze}
          loading={loading}
          size={size}
          type={type}
        >
          {showText && 'AI Priority'}
        </Button>
      </Tooltip>

      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#667eea' }} />
            <span>Smart Priority Analysis</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {analysis && (
          <ModalContent>
            {/* Recommended Priority */}
            <div className="priority-card">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, color: 'white' }}>
                    {priorityEmojis[analysis.suggestedPriority]} {analysis.suggestedPriority.toUpperCase()}
                  </h2>
                  <Tag color="white" style={{ color: '#667eea', fontWeight: 600 }}>
                    {analysis.confidence}% Confidence
                  </Tag>
                </div>

                {currentPriority && currentPriority !== analysis.suggestedPriority && (
                  <div style={{ fontSize: 14, opacity: 0.9 }}>
                    Current: {priorityEmojis[currentPriority]} {currentPriority} → Suggested: {priorityEmojis[analysis.suggestedPriority]} {analysis.suggestedPriority}
                  </div>
                )}

                <div style={{ marginTop: 8 }}>
                  <span className="risk-badge" style={{ background: riskColors[analysis.riskLevel] }}>
                    {analysis.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
              </Space>
            </div>

            {/* Reasons */}
            <div className="reason-list">
              <h4>Why this priority?</h4>
              {analysis.reasons.map((reason, idx) => (
                <div key={idx} className="reason-item">
                  • {reason}
                </div>
              ))}
            </div>

            {/* Scores */}
            <div className="score-section">
              <h4 style={{ marginTop: 0 }}>Detailed Analysis</h4>
              
              <div className="score-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><strong>Urgency Score</strong></span>
                  <span>{analysis.urgencyScore}/100</span>
                </div>
                <Progress 
                  percent={analysis.urgencyScore} 
                  strokeColor="#ff4d4f"
                  showInfo={false}
                />
              </div>

              <div className="score-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><strong>Impact Score</strong></span>
                  <span>{analysis.impactScore}/100</span>
                </div>
                <Progress 
                  percent={analysis.impactScore} 
                  strokeColor="#ff7a45"
                  showInfo={false}
                />
              </div>

              <div className="score-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><strong>Business Value</strong></span>
                  <span>{analysis.businessValue}/100</span>
                </div>
                <Progress 
                  percent={analysis.businessValue} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </div>
            </div>

            {/* Apply Button */}
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApplyPriority}
              loading={applying}
              block
              size="large"
              style={{ 
                marginTop: 20,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              Apply {analysis.suggestedPriority.toUpperCase()} Priority
            </Button>
          </ModalContent>
        )}
      </Modal>
    </>
  );
};
