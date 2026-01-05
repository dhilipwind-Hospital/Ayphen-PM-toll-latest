import { useState, useEffect } from 'react';
import { Card, Button, Switch, Space, Modal, Form, Input, Select, message, Empty, Tag, Popconfirm, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api, settingsApi } from '../services/api';
import { useStore } from '../store/useStore';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const RuleCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const TriggerBadge = styled(Tag)`
  margin-top: 8px;
`;

const ActionBadge = styled(Tag)`
  margin-top: 8px;
  margin-left: 8px;
`;

// Pre-defined triggers and actions
const TRIGGERS = [
  { value: 'issue_created', label: 'When issue is created' },
  { value: 'issue_updated', label: 'When issue is updated' },
  { value: 'status_changed', label: 'When status changes' },
  { value: 'assignee_changed', label: 'When assignee changes' },
  { value: 'sprint_started', label: 'When sprint starts' },
  { value: 'sprint_completed', label: 'When sprint completes' },
  { value: 'comment_added', label: 'When comment is added' },
  { value: 'due_date_approaching', label: 'When due date is approaching (1 day)' },
];

const ACTIONS = [
  { value: 'send_notification', label: 'Send notification' },
  { value: 'add_comment', label: 'Add comment' },
  { value: 'change_status', label: 'Change status' },
  { value: 'assign_user', label: 'Assign to user' },
  { value: 'add_label', label: 'Add label' },
  { value: 'send_email', label: 'Send email' },
  { value: 'create_subtask', label: 'Create subtask' },
  { value: 'move_to_sprint', label: 'Move to active sprint' },
];

export default function AutomationRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { currentProject } = useStore();

  useEffect(() => {
    if (currentProject) {
      loadRules();
    }
  }, [currentProject?.id]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getAutomationRules();
      // Filter by project
      const projectRules = (res.data || []).filter((r: any) => 
        r.projectId === currentProject?.id || r.isGlobal
      );
      setRules(projectRules);
    } catch (error) {
      console.error('Failed to load rules:', error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    try {
      await settingsApi.updateAutomationRule(id, { enabled: !enabled });
      message.success(`Rule ${!enabled ? 'enabled' : 'disabled'}`);
      loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      message.error('Failed to update rule');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await settingsApi.deleteAutomationRule(id);
      message.success('Rule deleted');
      loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      message.error('Failed to delete rule');
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (rule: any) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      description: rule.description,
      trigger: rule.trigger,
      action: rule.action,
      isGlobal: rule.isGlobal || false,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        projectId: values.isGlobal ? null : currentProject?.id,
        enabled: editingRule ? editingRule.enabled : true,
      };

      if (editingRule) {
        await settingsApi.updateAutomationRule(editingRule.id, payload);
        message.success('Rule updated');
      } else {
        await settingsApi.createAutomationRule(payload);
        message.success('Rule created');
      }

      setModalVisible(false);
      form.resetFields();
      loadRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
      message.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const getTriggerLabel = (value: string) => {
    return TRIGGERS.find(t => t.value === value)?.label || value;
  };

  const getActionLabel = (value: string) => {
    return ACTIONS.find(a => a.value === value)?.label || value;
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <h1 style={{ margin: 0 }}>Automation Rules</h1>
          <p style={{ color: '#666', margin: '8px 0 0' }}>
            Automate repetitive tasks with trigger-based rules
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Create Rule
        </Button>
      </Header>

      {rules.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No automation rules yet"
        >
          <Button type="primary" onClick={openCreateModal}>Create Your First Rule</Button>
        </Empty>
      ) : (
        rules.map((rule: any) => (
          <RuleCard key={rule.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ThunderboltOutlined style={{ color: rule.enabled ? '#52c41a' : '#d9d9d9' }} />
                  <h3 style={{ margin: 0 }}>{rule.name}</h3>
                  {rule.isGlobal && <Tag color="blue">Global</Tag>}
                </div>
                {rule.description && (
                  <p style={{ color: '#666', margin: '8px 0 0' }}>{rule.description}</p>
                )}
                <div>
                  <TriggerBadge color="purple">
                    Trigger: {getTriggerLabel(rule.trigger)}
                  </TriggerBadge>
                  <ActionBadge color="cyan">
                    Action: {getActionLabel(rule.action)}
                  </ActionBadge>
                </div>
              </div>
              <Space>
                <Switch 
                  checked={rule.enabled} 
                  onChange={() => toggleRule(rule.id, rule.enabled)}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
                <Button icon={<EditOutlined />} onClick={() => openEditModal(rule)} />
                <Popconfirm
                  title="Delete this rule?"
                  onConfirm={() => deleteRule(rule.id)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button icon={<DeleteOutlined />} danger />
                </Popconfirm>
              </Space>
            </div>
          </RuleCard>
        ))
      )}

      <Modal
        title={editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Rule Name"
            rules={[{ required: true, message: 'Please enter a rule name' }]}
          >
            <Input placeholder="e.g., Auto-assign bugs to QA team" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={2} 
              placeholder="Describe what this rule does..."
            />
          </Form.Item>

          <Form.Item
            name="trigger"
            label="When (Trigger)"
            rules={[{ required: true, message: 'Please select a trigger' }]}
          >
            <Select placeholder="Select trigger event">
              {TRIGGERS.map(t => (
                <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="action"
            label="Then (Action)"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Select placeholder="Select action to perform">
              {ACTIONS.map(a => (
                <Select.Option key={a.value} value={a.value}>{a.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isGlobal"
            label="Scope"
            initialValue={false}
          >
            <Select>
              <Select.Option value={false}>This project only</Select.Option>
              <Select.Option value={true}>All projects (Global)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}
