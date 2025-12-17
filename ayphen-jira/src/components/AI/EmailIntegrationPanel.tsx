import React, { useState } from 'react';
import { Modal, Button, Input, Select, message, Card, Tag, Spin } from 'antd';
import { MailOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

interface EmailIntegrationPanelProps {
  projectId?: string;
  onIssueCreated?: (issueKey: string) => void;
}

interface EmailData {
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

interface ProcessedIssue {
  id: string;
  key: string;
  summary: string;
  type: string;
  priority: string;
  assigneeId?: string;
  labels: string[];
}

export const EmailIntegrationPanel: React.FC<EmailIntegrationPanelProps> = ({
  projectId,
  onIssueCreated
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState<EmailData>({
    from: '',
    subject: '',
    body: '',
    receivedAt: new Date()
  });
  const [processedIssue, setProcessedIssue] = useState<ProcessedIssue | null>(null);

  const handleProcessEmail = async () => {
    if (!emailData.from || !emailData.subject || !emailData.body) {
      message.error('Please fill in all email fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/email-to-issue/process', {
        email: emailData,
        projectId
      });

      if (response.data.success) {
        const issue = response.data.data.issue;
        setProcessedIssue(issue);
        message.success(`Issue ${issue.key} created successfully!`);

        if (onIssueCreated) {
          onIssueCreated(issue.key);
        }
      }
    } catch (error: any) {
      console.error('Email processing error:', error);
      message.error(error.response?.data?.error || 'Failed to process email');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmailData({
      from: '',
      subject: '',
      body: '',
      receivedAt: new Date()
    });
    setProcessedIssue(null);
  };

  const showModal = () => {
    setIsModalVisible(true);
    handleReset();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    handleReset();
  };

  return (
    <>
      <Button
        type="primary"
        icon={<MailOutlined />}
        onClick={showModal}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }}
      >
        Email to Issue
      </Button>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MailOutlined style={{ color: '#667eea', fontSize: 20 }} />
            <span>Email to Issue Automation</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={700}
        footer={null}
      >
        {!processedIssue ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
                From Email
              </label>
              <Input
                placeholder="customer@example.com"
                value={emailData.from}
                onChange={(e) => setEmailData({ ...emailData, from: e.target.value })}
                prefix={<MailOutlined />}
              />
            </div>

            <div>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
                Subject
              </label>
              <Input
                placeholder="Bug: Login page not working"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
                Email Body
              </label>
              <TextArea
                placeholder="When I try to log in on mobile, the app crashes..."
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                rows={8}
              />
            </div>

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
                <li>Parse email content</li>
                <li>Detect issue type (bug, story, task)</li>
                <li>Set appropriate priority</li>
                <li>Create issue in project</li>
                <li>Auto-assign to best team member</li>
                <li>Add relevant tags</li>
                <li>Send confirmation email</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleProcessEmail}
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Process Email
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#f6ffed',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #b7eb8f',
              textAlign: 'center'
            }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 8 }} />
              <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                Issue Created Successfully!
              </div>
            </div>

            <Card title="Created Issue" size="small">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontWeight: 500 }}>Issue Key: </span>
                  <Tag color="blue" style={{ fontSize: 14 }}>{processedIssue.key}</Tag>
                </div>

                <div>
                  <span style={{ fontWeight: 500 }}>Summary: </span>
                  <span>{processedIssue.summary}</span>
                </div>

                <div>
                  <span style={{ fontWeight: 500 }}>Type: </span>
                  <Tag color={
                    processedIssue.type === 'bug' ? 'red' :
                      processedIssue.type === 'story' ? 'blue' :
                        'default'
                  }>
                    {processedIssue.type.toUpperCase()}
                  </Tag>
                </div>

                <div>
                  <span style={{ fontWeight: 500 }}>Priority: </span>
                  <Tag color={
                    processedIssue.priority === 'highest' ? 'red' :
                      processedIssue.priority === 'high' ? 'orange' :
                        processedIssue.priority === 'medium' ? 'gold' :
                          'default'
                  }>
                    {processedIssue.priority.toUpperCase()}
                  </Tag>
                </div>

                {processedIssue.labels && processedIssue.labels.length > 0 && (
                  <div>
                    <span style={{ fontWeight: 500 }}>Tags: </span>
                    {processedIssue.labels.map(label => (
                      <Tag key={label} color="purple">{label}</Tag>
                    ))}
                  </div>
                )}

                {processedIssue.assigneeId && (
                  <div>
                    <span style={{ fontWeight: 500 }}>Assigned: </span>
                    <Tag color="green">✓ Auto-assigned</Tag>
                  </div>
                )}
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={handleReset}>
                Process Another Email
              </Button>
              <Button type="primary" onClick={handleCancel}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
