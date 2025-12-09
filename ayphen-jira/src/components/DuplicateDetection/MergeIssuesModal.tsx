import React, { useState } from 'react';
import { Modal, Button, Checkbox, Card, Alert, message, Spin } from 'antd';
import { MergeCellsOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const IssueCard = styled(Card)`
  margin-bottom: 16px;
  border: 2px solid ${props => props.color || '#d9d9d9'};
  
  .issue-key {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.color || '#1890ff'};
    margin-bottom: 8px;
  }
  
  .issue-summary {
    font-size: 14px;
    margin-bottom: 12px;
  }
  
  .issue-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const OptionCheckbox = styled(Checkbox)`
  display: block;
  margin: 12px 0;
  font-size: 14px;
`;

interface Issue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  type: string;
  priority: string;
}

interface MergeIssuesModalProps {
  visible: boolean;
  sourceIssue: Issue;
  targetIssue: Issue;
  onClose: () => void;
  onMerge: () => void;
}

export const MergeIssuesModal: React.FC<MergeIssuesModalProps> = ({
  visible,
  sourceIssue,
  targetIssue,
  onClose,
  onMerge
}) => {
  const [merging, setMerging] = useState(false);
  const [mergeOptions, setMergeOptions] = useState({
    mergeComments: true,
    mergeAttachments: true,
    mergeHistory: true,
    closeSource: true
  });

  const handleMerge = async () => {
    setMerging(true);
    try {
      const response = await axios.post('http://localhost:8500/api/issues/merge', {
        sourceIssueId: sourceIssue.id,
        targetIssueId: targetIssue.id,
        ...mergeOptions
      });

      if (response.data.success) {
        message.success(`Successfully merged ${sourceIssue.key} into ${targetIssue.key}`);
        onMerge();
        onClose();
      } else {
        message.error('Failed to merge issues');
      }
    } catch (error: any) {
      console.error('Merge error:', error);
      message.error(error.response?.data?.error || 'Failed to merge issues');
    } finally {
      setMerging(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'todo': '#d9d9d9',
      'in-progress': '#1890ff',
      'done': '#52c41a',
      'open': '#d9d9d9',
      'closed': '#8c8c8c'
    };
    return colors[status.toLowerCase()] || '#d9d9d9';
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MergeCellsOutlined style={{ fontSize: 20 }} />
          <span>Merge Duplicate Issues</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={merging}>
          Cancel
        </Button>,
        <Button 
          key="merge" 
          type="primary" 
          danger 
          onClick={handleMerge}
          loading={merging}
          icon={<MergeCellsOutlined />}
        >
          {merging ? 'Merging...' : 'Merge Issues'}
        </Button>
      ]}
    >
      {merging ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, fontSize: 16 }}>
            Merging issues...
          </div>
        </div>
      ) : (
        <>
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined />
                <strong>Warning: This action cannot be undone</strong>
              </div>
            }
            description={`${sourceIssue.key} will be merged into ${targetIssue.key}. The source issue will be closed and all selected data will be transferred to the target issue.`}
            type="warning"
            showIcon={false}
            style={{ marginBottom: 24 }}
          />

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, color: '#cf1322' }}>Source Issue (will be closed):</h4>
            <IssueCard size="small" color="#cf1322">
              <div className="issue-key">{sourceIssue.key}</div>
              <div className="issue-summary">{sourceIssue.summary}</div>
              <div className="issue-meta">
                <span style={{ 
                  background: getStatusColor(sourceIssue.status), 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 12 
                }}>
                  {sourceIssue.status}
                </span>
                <span style={{ 
                  background: '#1890ff', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 12 
                }}>
                  {sourceIssue.type}
                </span>
                <span style={{ 
                  background: '#faad14', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 12 
                }}>
                  {sourceIssue.priority}
                </span>
              </div>
            </IssueCard>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, color: '#52c41a' }}>Target Issue (will be kept):</h4>
            <IssueCard size="small" color="#52c41a">
              <div className="issue-key">{targetIssue.key}</div>
              <div className="issue-summary">{targetIssue.summary}</div>
              <div className="issue-meta">
                <span style={{ 
                  background: getStatusColor(targetIssue.status), 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 12 
                }}>
                  {targetIssue.status}
                </span>
                <span style={{ 
                  background: '#1890ff', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 12 
                }}>
                  {targetIssue.type}
                </span>
                <span style={{ 
                  background: '#faad14', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 12 
                }}>
                  {targetIssue.priority}
                </span>
              </div>
            </IssueCard>
          </div>

          <div style={{ 
            background: '#f5f5f5', 
            padding: 16, 
            borderRadius: 8,
            marginBottom: 16
          }}>
            <h4 style={{ marginBottom: 12 }}>Merge Options:</h4>
            
            <OptionCheckbox
              checked={mergeOptions.mergeComments}
              onChange={e => setMergeOptions({...mergeOptions, mergeComments: e.target.checked})}
            >
              <strong>Merge Comments</strong>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                Transfer all comments from source to target issue
              </div>
            </OptionCheckbox>

            <OptionCheckbox
              checked={mergeOptions.mergeAttachments}
              onChange={e => setMergeOptions({...mergeOptions, mergeAttachments: e.target.checked})}
            >
              <strong>Merge Attachments</strong>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                Transfer all attachments from source to target issue
              </div>
            </OptionCheckbox>

            <OptionCheckbox
              checked={mergeOptions.mergeHistory}
              onChange={e => setMergeOptions({...mergeOptions, mergeHistory: e.target.checked})}
            >
              <strong>Merge History</strong>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                Copy all history entries from source to target issue
              </div>
            </OptionCheckbox>

            <OptionCheckbox
              checked={mergeOptions.closeSource}
              onChange={e => setMergeOptions({...mergeOptions, closeSource: e.target.checked})}
            >
              <strong>Close Source Issue</strong>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                Mark the source issue as closed after merging
              </div>
            </OptionCheckbox>
          </div>

          <Alert
            message="💡 What happens during merge:"
            description={
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                <li>Source issue description will be appended to target issue</li>
                <li>Selected data (comments, attachments, history) will be transferred</li>
                <li>Source issue will be marked as "Merged into {targetIssue.key}"</li>
                <li>Target issue will contain all combined information</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </>
      )}
    </Modal>
  );
};
