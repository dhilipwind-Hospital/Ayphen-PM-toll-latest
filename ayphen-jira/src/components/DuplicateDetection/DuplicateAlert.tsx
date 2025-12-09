import React, { useState } from 'react';
import { Alert, Card, Tag, Button, Tooltip } from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined, LinkOutlined, EyeOutlined, CloseOutlined, MergeCellsOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import axios from 'axios';
import { MergeIssuesModal } from './MergeIssuesModal';

const AlertContainer = styled.div`
  margin-bottom: 16px;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DuplicateCard = styled(Card)`
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid ${props => props.color || '#1890ff'};

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateX(4px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const DuplicateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const IssueKey = styled.span`
  font-weight: 600;
  color: #1890ff;
  font-size: 14px;
`;

const ConfidenceBadge = styled(Tag)<{ $confidence: number }>`
  font-weight: 600;
  ${props => {
    if (props.$confidence >= 90) return 'background: #ff4d4f; color: white;';
    if (props.$confidence >= 70) return 'background: #faad14; color: white;';
    return 'background: #1890ff; color: white;';
  }}
`;

const IssueSummary = styled.div`
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
  line-height: 1.5;
`;

const IssueMetadata = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Reason = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  font-style: italic;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

interface DuplicateCandidate {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  type: string;
  priority: string;
  similarity: number;
  confidence: number;
  reason: string;
}

interface DuplicateAlertProps {
  duplicates: DuplicateCandidate[];
  confidence: number;
  suggestion: string;
  onDismiss: () => void;
  onViewIssue: (issueKey: string) => void;
  onLinkAsDuplicate?: (issueId: string) => void;
}

export const DuplicateAlert: React.FC<DuplicateAlertProps> = ({
  duplicates,
  confidence,
  suggestion,
  onDismiss,
  onViewIssue,
  onLinkAsDuplicate
}) => {
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateCandidate | null>(null);
  const [currentIssue, setCurrentIssue] = useState<any>(null);

  if (duplicates.length === 0) {
    return null;
  }

  const recordFeedback = async (action: 'dismissed' | 'linked' | 'merged' | 'blocked', duplicateId: string) => {
    try {
      await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/duplicate-feedback', {
        issueId: 'current-issue-id', // Would be actual issue ID
        suggestedDuplicateId: duplicateId,
        aiConfidence: confidence,
        userAction: action,
        userId: 'current-user-id' // Would be actual user ID
      });
      console.log(`📊 Feedback recorded: ${action}`);
    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  };

  const handleMergeClick = (duplicate: DuplicateCandidate) => {
    setSelectedDuplicate(duplicate);
    // In a real scenario, we'd get the current issue being created
    // For now, we'll create a placeholder
    setCurrentIssue({
      id: 'new-issue',
      key: 'NEW',
      summary: 'New Issue',
      status: 'todo',
      type: 'story',
      priority: 'medium'
    });
    setMergeModalVisible(true);
    recordFeedback('merged', duplicate.id);
  };

  const handleDismiss = () => {
    if (duplicates.length > 0) {
      recordFeedback('dismissed', duplicates[0].id);
    }
    onDismiss();
  };

  const getAlertType = () => {
    if (confidence >= 90) return 'error';
    if (confidence >= 70) return 'warning';
    return 'info';
  };

  const getAlertIcon = () => {
    if (confidence >= 90) return <ExclamationCircleOutlined />;
    if (confidence >= 70) return <ExclamationCircleOutlined />;
    return <InfoCircleOutlined />;
  };

  const getCardColor = (conf: number) => {
    if (conf >= 90) return '#ff4d4f';
    if (conf >= 70) return '#faad14';
    return '#1890ff';
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'todo': 'default',
      'in-progress': 'processing',
      'done': 'success',
      'open': 'default',
      'closed': 'default',
      'resolved': 'success'
    };
    return statusColors[status.toLowerCase()] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: Record<string, string> = {
      'highest': 'red',
      'high': 'orange',
      'medium': 'gold',
      'low': 'green',
      'lowest': 'blue'
    };
    return priorityColors[priority.toLowerCase()] || 'default';
  };

  return (
    <AlertContainer>
      {confidence >= 95 && (
        <Alert
          message="🤖 Auto-Linking Enabled"
          description={`This issue will be automatically linked as a duplicate when created (${confidence}% confidence). The issue will be marked as closed and linked to ${duplicates[0].key}.`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 12 }}
        />
      )}
      
      <Alert
        message={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>
              {confidence >= 90 ? '⚠️ High Probability of Duplicate!' : 
               confidence >= 70 ? '⚠️ Similar Issues Found' : 
               'ℹ️ Possibly Related Issues'}
            </span>
            <Button 
              type="text" 
              size="small" 
              icon={<CloseOutlined />} 
              onClick={handleDismiss}
            />
          </div>
        }
        description={
          <div>
            <div style={{ marginBottom: 12, fontSize: 13 }}>
              {suggestion}
            </div>
            
            {duplicates.map((duplicate) => (
              <DuplicateCard
                key={duplicate.id}
                size="small"
                color={getCardColor(duplicate.confidence)}
              >
                <DuplicateHeader>
                  <IssueKey>{duplicate.key}</IssueKey>
                  <ConfidenceBadge $confidence={duplicate.confidence}>
                    {duplicate.confidence}% Match
                  </ConfidenceBadge>
                </DuplicateHeader>

                <IssueSummary>{duplicate.summary}</IssueSummary>

                <IssueMetadata>
                  <Tag color={getStatusColor(duplicate.status)}>
                    {duplicate.status}
                  </Tag>
                  <Tag>{duplicate.type}</Tag>
                  <Tag color={getPriorityColor(duplicate.priority)}>
                    {duplicate.priority}
                  </Tag>
                </IssueMetadata>

                <Reason>
                  💡 {duplicate.reason}
                </Reason>

                <ActionButtons>
                  <Tooltip title="Open issue in new tab">
                    <Button
                      type="primary"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => onViewIssue(duplicate.key)}
                    >
                      View Issue
                    </Button>
                  </Tooltip>
                  
                  {onLinkAsDuplicate && (
                    <Tooltip title="Link this as a duplicate (coming soon)">
                      <Button
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => onLinkAsDuplicate(duplicate.id)}
                        disabled
                      >
                        Link as Duplicate
                      </Button>
                    </Tooltip>
                  )}
                  
                  <Tooltip title="Merge this issue with the duplicate">
                    <Button
                      size="small"
                      icon={<MergeCellsOutlined />}
                      onClick={() => handleMergeClick(duplicate)}
                    >
                      Merge
                    </Button>
                  </Tooltip>
                </ActionButtons>
              </DuplicateCard>
            ))}

            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
              💡 Tip: Review these issues before creating a new one to avoid duplicates.
            </div>
          </div>
        }
        type={getAlertType()}
        icon={getAlertIcon()}
        showIcon
        closable={false}
        style={{ marginBottom: 0 }}
      />

      {/* Merge Issues Modal */}
      {selectedDuplicate && currentIssue && (
        <MergeIssuesModal
          visible={mergeModalVisible}
          sourceIssue={currentIssue}
          targetIssue={selectedDuplicate}
          onClose={() => setMergeModalVisible(false)}
          onMerge={() => {
            // Refresh or update UI after merge
            onDismiss();
          }}
        />
      )}
    </AlertContainer>
  );
};
