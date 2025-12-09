import React, { useState } from 'react';
import { Button, Modal, Form, Select, message } from 'antd';
import { FileText } from 'lucide-react';
import { issuesApi } from '../../services/api';
import { useStore } from '../../store/useStore';

interface CreateJiraIssueButtonProps {
  aiStory: any;
  onSuccess?: () => void;
}

export const CreateJiraIssueButton: React.FC<CreateJiraIssueButtonProps> = ({ aiStory, onSuccess }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentProject, currentUser } = useStore();
  const [form] = Form.useForm();

  const handleCreate = async (values: any) => {
    if (!currentProject || !currentUser) {
      message.error('Please select a project first');
      return;
    }

    setLoading(true);
    try {
      const issue = await issuesApi.create({
        summary: aiStory.title,
        description: `${aiStory.description}\n\n**Acceptance Criteria:**\n${aiStory.acceptanceCriteria?.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}`,
        type: 'story',
        status: 'backlog',
        priority: values.priority || 'medium',
        projectId: currentProject.id,
        reporterId: currentUser.id,
        aiStoryId: aiStory.id,
        labels: ['ai-generated', aiStory.type],
      });

      message.success(`Created ${issue.data.key}`);
      setModalVisible(false);
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create issue:', error);
      message.error('Failed to create Jira issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<FileText size={16} />}
        onClick={() => setModalVisible(true)}
        disabled={!currentProject}
      >
        Create Jira Issue
      </Button>

      <Modal
        title="Create Jira Issue from AI Story"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Project">
            <Select value={currentProject?.id} disabled>
              <Select.Option value={currentProject?.id}>
                {currentProject?.key} - {currentProject?.name}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select>
              <Select.Option value="lowest">Lowest</Select.Option>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="highest">Highest</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
