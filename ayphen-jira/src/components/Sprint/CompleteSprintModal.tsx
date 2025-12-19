import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Radio, Select, Card, Statistic, Row, Col, List, Tag, message } from 'antd';
import { CheckCircle, XCircle } from 'lucide-react';
import styled from 'styled-components';
import { sprintsApi, workflowsApi } from '../../services/api';
import { colors } from '../../theme/colors';

const StatsCard = styled(Card)`
  margin-bottom: 16px;
  
  .ant-statistic-title {
    font-size: 12px;
    color: ${colors.text.secondary};
  }
`;

const IssueItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-bottom: 8px;
`;

interface CompleteSprintModalProps {
  visible: boolean;
  sprint: any;
  issues: any[];
  sprints: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({
  visible,
  sprint,
  issues,
  sprints,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [incompleteAction, setIncompleteAction] = useState<'backlog' | 'next-sprint' | 'new-sprint'>('backlog');
  const [doneStatuses, setDoneStatuses] = useState<string[]>([]);

  useEffect(() => {
    const fetchWorkflow = async () => {
      if (sprint?.projectId) {
        try {
          const res = await workflowsApi.getAll(sprint.projectId);
          const workflow = res.data[0]; // Assuming first workflow for now
          const doneIds = workflow.statuses
            .filter((s: any) => s.category === 'DONE')
            .map((s: any) => s.id.toLowerCase());
          setDoneStatuses(doneIds);
        } catch (error) {
          console.error('Failed to load workflow:', error);
          setDoneStatuses(['done', 'closed', 'resolved']); // Fallback
        }
      }
    };
    if (visible) fetchWorkflow();
  }, [visible, sprint?.projectId]);

  const sprintIssues = issues.filter(i => i.sprintId === sprint?.id);
  const completedIssues = sprintIssues.filter(i => doneStatuses.includes(i.status.toLowerCase()));
  const incompleteIssues = sprintIssues.filter(i => !doneStatuses.includes(i.status.toLowerCase()));

  const completedPoints = completedIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const incompletePoints = incompleteIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const totalPoints = completedPoints + incompletePoints;

  const futureSprints = sprints.filter(s => s.id !== sprint?.id && s.status !== 'completed');

  const handleCompleteSprint = async (values: any) => {
    if (!sprint) return;

    setLoading(true);
    try {
      // Prepare incomplete issues actions
      const incompleteIssuesData = incompleteIssues.map(issue => ({
        issueId: issue.id,
        action: incompleteAction,
        targetSprintId: incompleteAction === 'next-sprint' ? values.targetSprintId : undefined,
      }));

      await sprintsApi.complete(sprint.id, {
        incompleteIssues: incompleteIssuesData,
        retrospective: values.retrospective,
        createNewSprint: incompleteAction === 'new-sprint',
        newSprintName: incompleteAction === 'new-sprint' ? values.newSprintName : undefined,
      });

      message.success('Sprint completed successfully!');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to complete sprint:', error);
      message.error('Failed to complete sprint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Complete Sprint: ${sprint?.name || 'Sprint'}`}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={700}
      okText="Complete Sprint"
    >
      <StatsCard>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Completed"
              value={completedIssues.length}
              prefix={<CheckCircle size={16} color="#52c41a" />}
              suffix={`/ ${sprintIssues.length}`}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Incomplete"
              value={incompleteIssues.length}
              prefix={<XCircle size={16} color="#ff4d4f" />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Story Points"
              value={completedPoints}
              suffix={`/ ${totalPoints}`}
            />
          </Col>
        </Row>
      </StatsCard>

      {incompleteIssues.length > 0 && (
        <Card title={`Incomplete Issues (${incompleteIssues.length})`} style={{ marginBottom: 16 }}>
          <List
            size="small"
            dataSource={incompleteIssues}
            renderItem={(issue: any) => (
              <IssueItem>
                <Tag color="orange">{issue.key}</Tag>
                <span>{issue.summary}</span>
                {issue.storyPoints && (
                  <Tag color="blue">{issue.storyPoints} pts</Tag>
                )}
              </IssueItem>
            )}
          />

          <Form.Item
            label="What to do with incomplete issues?"
            style={{ marginTop: 16, marginBottom: 0 }}
          >
            <Radio.Group
              value={incompleteAction}
              onChange={(e) => setIncompleteAction(e.target.value)}
            >
              <Radio value="backlog">Move to Backlog</Radio>
              <Radio value="next-sprint" disabled={futureSprints.length === 0}>
                Move to Next Sprint
              </Radio>
              <Radio value="new-sprint">Create New Sprint</Radio>
            </Radio.Group>
          </Form.Item>
        </Card>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleCompleteSprint}
      >
        {incompleteAction === 'next-sprint' && futureSprints.length > 0 && (
          <Form.Item
            label="Target Sprint"
            name="targetSprintId"
            rules={[{ required: true, message: 'Please select target sprint' }]}
          >
            <Select placeholder="Select sprint">
              {futureSprints.map(s => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {incompleteAction === 'new-sprint' && (
          <Form.Item
            label="New Sprint Name"
            name="newSprintName"
            rules={[{ required: true, message: 'Please enter sprint name' }]}
          >
            <Input placeholder="e.g., Sprint 2" />
          </Form.Item>
        )}

        <Form.Item
          label="Sprint Retrospective (Optional)"
          name="retrospective"
          tooltip="What went well? What could be improved?"
        >
          <Input.TextArea
            rows={4}
            placeholder="Share your thoughts about this sprint..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
