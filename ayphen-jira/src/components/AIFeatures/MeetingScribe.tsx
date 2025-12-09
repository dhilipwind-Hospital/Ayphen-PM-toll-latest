import React, { useState } from 'react';
import { Card, Input, Button, message, List, Tag, Space, Empty } from 'antd';
import { 
  FileTextOutlined, 
  RocketOutlined, 
  ThunderboltOutlined,
  CheckCircleOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { aiFeaturesAPI } from '../../services/ai-features-api';
import type { MeetingScribeResult } from '../../services/ai-features-api';

const { TextArea } = Input;

interface MeetingScribeProps {
  projectId: string;
}

export const MeetingScribe: React.FC<MeetingScribeProps> = ({ projectId }) => {
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<MeetingScribeResult | null>(null);

  const processTranscript = async () => {
    if (!transcript.trim()) {
      message.warning('Please enter meeting transcript');
      return;
    }

    if (!projectId) {
      message.error('No project selected');
      return;
    }

    try {
      setProcessing(true);
      message.loading('Processing transcript with AI...', 0);
      
      const result = await aiFeaturesAPI.meetingScribe.processTranscript({
        transcript,
        projectId,
        meetingTitle: meetingTitle || undefined
      });
      
      message.destroy();
      setResults(result);
      
      if (result.issuesCreated && result.issuesCreated.length > 0) {
        message.success({
          content: `Successfully created ${result.issuesCreated.length} issues from meeting notes!`,
          duration: 5
        });
      } else {
        message.info('No issues were created from the transcript');
      }
    } catch (error: any) {
      message.destroy();
      console.error('Failed to process transcript:', error);
      message.error('Failed to process transcript. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const quickProcess = async () => {
    if (!transcript.trim()) {
      message.warning('Please enter notes');
      return;
    }

    if (!projectId) {
      message.error('No project selected');
      return;
    }

    try {
      setProcessing(true);
      message.loading('Quick processing notes...', 0);
      
      const result = await aiFeaturesAPI.meetingScribe.quickProcess(
        transcript,
        projectId
      );
      
      message.destroy();
      setResults(result);
      message.success('Notes processed successfully!');
    } catch (error: any) {
      message.destroy();
      console.error('Failed to process notes:', error);
      message.error('Failed to process notes. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const clearForm = () => {
    setTranscript('');
    setMeetingTitle('');
    setResults(null);
  };

  return (
    <div className="meeting-scribe">
      <Card 
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            Meeting Scribe
          </span>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Meeting Title (optional)
            </label>
            <Input
              placeholder="e.g., Sprint Planning Meeting"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              size="large"
              disabled={processing}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Meeting Transcript or Notes
            </label>
            <TextArea
              placeholder="Paste your meeting transcript or notes here...

Example:
- John mentioned we need to fix the login bug urgently
- Sarah will work on the new dashboard feature
- We decided to move the release date to next Friday
- Mike is blocked on the API integration"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={12}
              disabled={processing}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              loading={processing}
              onClick={processTranscript}
              size="large"
            >
              Process Full Transcript
            </Button>
            <Button
              icon={<ThunderboltOutlined />}
              loading={processing}
              onClick={quickProcess}
              size="large"
            >
              Quick Process
            </Button>
            <Button
              onClick={clearForm}
              disabled={processing}
            >
              Clear
            </Button>
          </div>
        </Space>
      </Card>

      {results && (
        <>
          {/* Issues Created */}
          {results.issuesCreated && results.issuesCreated.length > 0 && (
            <Card
              title={
                <span>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  Issues Created ({results.issuesCreated.length})
                </span>
              }
              style={{ marginTop: 16 }}
            >
              <List
                dataSource={results.issuesCreated}
                renderItem={(issue) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color="blue">{issue.key}</Tag>
                          <span>{issue.summary}</span>
                        </Space>
                      }
                      description={
                        <div>
                          <Tag color="purple">{issue.type}</Tag>
                          <div style={{ marginTop: 8, color: '#666' }}>
                            {issue.description}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Action Items */}
          {results.actionItems && results.actionItems.length > 0 && (
            <Card
              title={
                <span>
                  <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
                  Action Items ({results.actionItems.length})
                </span>
              }
              style={{ marginTop: 16 }}
            >
              <List
                dataSource={results.actionItems}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.text}
                      description={
                        <Space>
                          {item.assignee && <Tag>Assignee: {item.assignee}</Tag>}
                          {item.dueDate && <Tag color="red">Due: {item.dueDate}</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Decisions */}
          {results.decisions && results.decisions.length > 0 && (
            <Card
              title="Key Decisions"
              style={{ marginTop: 16 }}
            >
              <List
                dataSource={results.decisions}
                renderItem={(decision) => (
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    {decision}
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Summary */}
          {results.summary && (
            <Card
              title="Meeting Summary"
              style={{ marginTop: 16 }}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{results.summary}</p>
            </Card>
          )}

          {/* No Results */}
          {(!results.issuesCreated || results.issuesCreated.length === 0) &&
           (!results.actionItems || results.actionItems.length === 0) &&
           (!results.decisions || results.decisions.length === 0) &&
           !results.summary && (
            <Card style={{ marginTop: 16 }}>
              <Empty description="No items extracted from the transcript" />
            </Card>
          )}
        </>
      )}
    </div>
  );
};
