import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, List, Button, Checkbox, Select, message, Tag, Spin, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, RobotOutlined, CheckSquareOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ENV } from '../../config/env';

interface RetrospectiveModalProps {
  visible: boolean;
  sprintId: string;
  sprintName: string;
  onClose: () => void;
}

export const RetrospectiveModal: React.FC<RetrospectiveModalProps> = ({
  visible,
  sprintId,
  sprintName,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [wentWell, setWentWell] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [newWentWell, setNewWentWell] = useState('');
  const [newImprovement, setNewImprovement] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [retroId, setRetroId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadRetro();
      loadUsers();
    }
  }, [visible, sprintId]);

  const loadUsers = async () => {
    try {
      const { data } = await axios.get(`${ENV.API_URL}/auth/users`);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const loadRetro = async () => {
    try {
      const { data } = await axios.get(`${ENV.API_URL}/sprint-retrospectives/sprint/${sprintId}`);
      if (data) {
        setRetroId(data.id);
        setWentWell(data.wentWell || []);
        setImprovements(data.improvements || []);
        setActionItems(data.actionItems || []);
        form.setFieldsValue({ notes: data.notes });
      }
    } catch (error) {
      console.error('Failed to load retrospective');
    }
  };

  const createTasksFromActions = async () => {
    if (!retroId || actionItems.length === 0) {
      message.warning('No action items to create tasks from');
      return;
    }

    setCreatingTasks(true);
    try {
      const { data } = await axios.post(
        `${ENV.API_URL}/sprint-retrospectives/${retroId}/create-tasks`,
        { actionItems }
      );

      if (data.success) {
        message.success(`Created ${data.tasks.length} action item tasks`);
        
        // Show created tasks
        Modal.info({
          title: 'Tasks Created Successfully',
          width: 600,
          content: (
            <div>
              <p>The following tasks have been created:</p>
              {data.tasks.map((task: any) => (
                <div key={task.id} style={{ marginBottom: 8 }}>
                  <a href={`/issue/${task.key}`} target="_blank" rel="noopener noreferrer">
                    <strong>{task.key}</strong>: {task.summary}
                  </a>
                </div>
              ))}
            </div>
          )
        });
      }
    } catch (error: any) {
      console.error('Failed to create tasks:', error);
      message.error('Failed to create tasks from action items');
    } finally {
      setCreatingTasks(false);
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await axios.post(`${ENV.API_URL}/sprint-retrospectives`, {
        sprintId,
        wentWell,
        improvements,
        actionItems,
        notes: values.notes,
        createdById: localStorage.getItem('userId'),
      });
      message.success('Retrospective saved');
      onClose();
    } catch (error) {
      message.error('Failed to save retrospective');
    } finally {
      setLoading(false);
    }
  };

  const addWentWell = () => {
    if (newWentWell.trim()) {
      setWentWell([...wentWell, newWentWell]);
      setNewWentWell('');
    }
  };

  const addImprovement = () => {
    if (newImprovement.trim()) {
      setImprovements([...improvements, newImprovement]);
      setNewImprovement('');
    }
  };

  const addActionItem = () => {
    setActionItems([
      ...actionItems,
      { task: '', assigneeId: '', status: 'backlog', completed: false },
    ]);
  };

  const updateActionItem = (index: number, field: string, value: any) => {
    const updated = [...actionItems];
    updated[index][field] = value;
    setActionItems(updated);
  };

  const removeItem = (arr: any[], setArr: Function, index: number) => {
    setArr(arr.filter((_, i) => i !== index));
  };

  const generateAIRetro = async () => {
    setGeneratingAI(true);
    try {
      const { data } = await axios.post(`${ENV.API_URL}/sprint-retrospectives/generate/${sprintId}`);
      
      if (data.success && data.report) {
        setAiReport(data.report);
        
        // Auto-fill the form with AI suggestions
        setWentWell(data.report.wentWell || []);
        setImprovements(data.report.challenges || []);
        
        // Convert recommendations to action items
        const aiActionItems = (data.report.recommendations || []).map((rec: string) => ({
          task: rec,
          assigneeId: '',
          status: 'backlog',
          completed: false
        }));
        setActionItems(aiActionItems);
        
        form.setFieldsValue({ notes: data.report.executiveSummary });
        
        message.success('AI retrospective generated! Review and edit as needed.');
      }
    } catch (error: any) {
      console.error('Failed to generate AI retrospective:', error);
      message.error('Failed to generate AI retrospective. Please try again.');
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <Modal
      title={`Sprint Retrospective - ${sprintName}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      {/* AI Generation Button */}
      <Alert
        message="🤖 AI-Powered Retrospective"
        description="Let AI analyze your sprint data and generate insights automatically!"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        action={
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={generateAIRetro}
            loading={generatingAI}
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', border: 'none' }}
          >
            {generatingAI ? 'Generating...' : 'Generate AI Retrospective'}
          </Button>
        }
      />

      {generatingAI && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="large" tip="AI is analyzing your sprint data..." />
        </div>
      )}

      {aiReport && !generatingAI && (
        <Alert
          message="✅ AI Report Generated"
          description={`Sentiment: ${aiReport.sentiment?.overall || 'neutral'} | Velocity: ${aiReport.metrics?.velocity || 0} points | Completion: ${aiReport.metrics?.completionRate?.toFixed(1) || 0}%`}
          type="success"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} onFinish={handleSave} layout="vertical">
        {/* What Went Well */}
        <div style={{ marginBottom: 24 }}>
          <h4>✅ What Went Well?</h4>
          <List
            size="small"
            dataSource={wentWell}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(wentWell, setWentWell, index)}
                  />,
                ]}
              >
                {item}
              </List.Item>
            )}
          />
          <Input.Search
            placeholder="Add positive feedback..."
            value={newWentWell}
            onChange={e => setNewWentWell(e.target.value)}
            onSearch={addWentWell}
            enterButton={<PlusOutlined />}
          />
        </div>

        {/* Improvements */}
        <div style={{ marginBottom: 24 }}>
          <h4>🔧 What Could Be Improved?</h4>
          <List
            size="small"
            dataSource={improvements}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(improvements, setImprovements, index)}
                  />,
                ]}
              >
                {item}
              </List.Item>
            )}
          />
          <Input.Search
            placeholder="Add improvement suggestion..."
            value={newImprovement}
            onChange={e => setNewImprovement(e.target.value)}
            onSearch={addImprovement}
            enterButton={<PlusOutlined />}
          />
        </div>

        {/* Action Items */}
        <div style={{ marginBottom: 24 }}>
          <h4>📋 Action Items</h4>
          {actionItems.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <Checkbox
                checked={item.completed}
                onChange={e => updateActionItem(index, 'completed', e.target.checked)}
              />
              <Input
                placeholder="Task description"
                value={item.task}
                onChange={e => updateActionItem(index, 'task', e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Assignee"
                value={item.assigneeId}
                onChange={value => updateActionItem(index, 'assigneeId', value)}
                style={{ width: 150 }}
              >
                {users.map(user => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.name}
                  </Select.Option>
                ))}
              </Select>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeItem(actionItems, setActionItems, index)}
              />
            </div>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={addActionItem}
          >
            Add Action Item
          </Button>
        </div>

        {/* Notes */}
        <Form.Item name="notes" label="Additional Notes">
          <Input.TextArea rows={4} placeholder="Any other feedback or notes..." />
        </Form.Item>

        {/* Create Tasks from Action Items */}
        {actionItems.length > 0 && (
          <Alert
            message="📋 Action Item Tracking"
            description="Convert action items into Jira tasks for better tracking and accountability"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button
                type="primary"
                icon={<CheckSquareOutlined />}
                onClick={createTasksFromActions}
                loading={creatingTasks}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                {creatingTasks ? 'Creating...' : 'Create Jira Tasks'}
              </Button>
            }
          />
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Save Retrospective
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
