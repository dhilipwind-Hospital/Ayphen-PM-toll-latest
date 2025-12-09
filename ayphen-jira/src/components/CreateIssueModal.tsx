import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, message, Avatar, DatePicker } from 'antd';
import { issuesApi, projectMembersApi, sprintsApi, api } from '../services/api';
import { useStore } from '../store/useStore';
import { VoiceDescriptionButton } from './VoiceDescription/VoiceDescriptionButton';
import { TemplateButton } from './Templates';
import { GatekeeperBot } from './AI/GatekeeperBot';

const { TextArea } = Input;

interface CreateIssueModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: string;
  defaultValues?: Partial<any>;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  open,
  onClose,
  onSuccess,
  defaultType = 'story',
  defaultValues = {}
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(defaultType);
  const { currentProject, currentUser } = useStore();

  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [duplicateConfidence, setDuplicateConfidence] = useState(0);

  const [summaryValue, setSummaryValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);
  const [blockedDuplicate, setBlockedDuplicate] = useState<any>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [epics, setEpics] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);

  useEffect(() => {
    if (open && currentProject) {
      loadEpics();
      loadStories();
      loadMembers();
      loadSprints();
    }
    
    if (open) {
      form.setFieldsValue({
        type: defaultType,
        ...defaultValues
      });
      if (defaultValues?.type) {
        setSelectedType(defaultValues.type);
      } else if (defaultType) {
        setSelectedType(defaultType);
      }
    }
  }, [open, currentProject, defaultType]);

  const loadEpics = async () => {
    try {
      const response = await issuesApi.getAll({ projectId: currentProject?.id, type: 'epic', userId: currentUser?.id });
      setEpics(response.data || []);
    } catch (error) {
      console.error('Failed to load epics', error);
    }
  };

  const loadStories = async () => {
    try {
      // Fetch both stories and tasks as they can be parents
      const storyRes = await issuesApi.getAll({ projectId: currentProject?.id, type: 'story', userId: currentUser?.id });
      const taskRes = await issuesApi.getAll({ projectId: currentProject?.id, type: 'task', userId: currentUser?.id });
      
      const allParents = [...(storyRes.data || []), ...(taskRes.data || [])];
      setStories(allParents);
    } catch (error) {
      console.error('Failed to load parent issues', error);
    }
  };

  const loadMembers = async () => {
    if (!currentProject || !currentUser) return;
    try {
      const response = await projectMembersApi.getByProject(currentProject.id, currentUser.id);
      setMembers(response.data || []);
    } catch (error) {
      console.error('Failed to load members', error);
    }
  };

  const loadSprints = async () => {
    if (!currentProject || !currentUser) return;
    try {
      const response = await sprintsApi.getAll(currentProject.id, currentUser.id);
      // Filter out completed sprints
      const activeSprints = (response.data || []).filter((s: any) => s.status !== 'completed');
      setSprints(activeSprints);
    } catch (error) {
      console.error('Failed to load sprints', error);
    }
  };

  // Debounced duplicate checking
  const checkForDuplicates = useCallback(
    async (summary: string, description: string) => {
      if (!summary || summary.length < 3 || !currentProject) {
        return;
      }

      try {
        const response = await api.post('/ai-description/check-duplicates', {
          summary,
          description: description || '',
          projectId: currentProject.id,
          issueType: selectedType
        });

        if (response.data.success && response.data.hasDuplicates) {
          setDuplicates(response.data.duplicates);
          setDuplicateConfidence(response.data.confidence);
          setBlockedDuplicate({
            duplicate: response.data.duplicates[0],
            confidence: response.data.confidence
          });
          // Only show modal if confidence is high (>80%)
          if (response.data.confidence > 80) {
            setShowBlockModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    },
    [currentProject, selectedType]
  );

  // Debounce timer for duplicate checking
  useEffect(() => {
    if (!summaryValue) {
      return;
    }

    const timer = setTimeout(() => {
      checkForDuplicates(summaryValue, descriptionValue);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [summaryValue, descriptionValue, checkForDuplicates]);

  const handleSubmit = async (values: any) => {
    if (!currentProject || !currentUser) {
      message.error('Project or user not found');
      return;
    }

    setLoading(true);
    try {
      const baseData = {
        summary: values.summary,
        description: values.description || '',
        type: values.type,
        status: 'todo',
        priority: values.priority,
        projectId: currentProject.id,
        reporterId: currentUser.id,
        assigneeId: values.assigneeId || null,
        sprintId: values.sprintId || null,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        labels: values.labels || [],
        components: [],
        fixVersions: [],
      };

      const issueData: any = {
        ...baseData,
        overrideDuplicate // Include override flag
      };

      if (values.type === 'story' || values.type === 'task') {
        issueData.storyPoints = values.storyPoints || null;
      }

      if (values.type === 'bug') {
        issueData.environment = values.environment || null;
      }

      if (values.type === 'epic') {
        issueData.epicName = values.epicName || values.summary;
      }

      if (values.type === 'subtask' && values.parentIssue) {
        issueData.parentId = values.parentIssue;
      }

      if (values.epicLink) {
        const selectedEpic = epics.find(e => e.id === values.epicLink);
        if (selectedEpic) {
          issueData.epicId = selectedEpic.id;
          issueData.epicKey = selectedEpic.key;
          issueData.epicLink = selectedEpic.key;
        }
      }

      if (values.userStoryLink) {
        // For bugs, we might want to link them to a story via parentId or a specific link type
        // Since backend might not have a specific 'userStoryLink' field, let's use parentId which is standard for sub-items
        // or we can use issue links if supported. For now, let's assume we treat it similar to a parent relationship
        issueData.parentId = values.userStoryLink;
      }

      const response = await issuesApi.create(issueData);

      const createdKey = response.data?.key || 'Issue';
      const createdId = response.data?.id;

      // Auto-link if high confidence duplicate found (95%+)
      if (createdId && duplicates.length > 0 && duplicateConfidence >= 95) {
        try {
          const linkResponse = await api.post('/ai-description/auto-link-duplicate', {
            newIssueId: createdId,
            duplicateIssueId: duplicates[0].id,
            confidence: duplicateConfidence
          });

          if (linkResponse.data.success) {
            message.success(`${createdKey} created and automatically linked to ${duplicates[0].key} as duplicate`);
          } else {
            message.success(`${createdKey} created successfully!`);
          }
        } catch (linkError) {
          console.error('Auto-link failed:', linkError);
          message.success(`${createdKey} created successfully!`);
        }
      } else {
        message.success(`${createdKey} created successfully!`);
      }

      // Reset form and state
      form.resetFields();
      setSelectedType('story');
      setSelectedType('story');
      setDuplicates([]);
      setSummaryValue('');
      setDescriptionValue('');

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create issue:', error);

      // Handle duplicate block error
      if (error.response?.data?.code === 'DUPLICATE_ISSUE') {
        setBlockedDuplicate(error.response.data);
        setShowBlockModal(true);
        setLoading(false);
        return;
      }

      message.error(error.response?.data?.error || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case 'epic':
        return (
          <>
            <Form.Item
              name="epicName"
              label="Epic Name"
              rules={[{ required: true, message: 'Please enter epic name' }]}
            >
              <Input placeholder="Enter epic name" />
            </Form.Item>
            <Form.Item
              name="epicColor"
              label="Epic Color"
            >
              <Select placeholder="Select color">
                <Select.Option value="blue">Blue</Select.Option>
                <Select.Option value="green">Green</Select.Option>
                <Select.Option value="purple">Purple</Select.Option>
                <Select.Option value="red">Red</Select.Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'story':
      case 'task':
      case 'bug':
        return (
          <>
            {selectedType === 'bug' ? (
              <Form.Item
                name="userStoryLink"
                label="User Story Link"
                extra="Link this bug to a User Story."
              >
                <Select placeholder="Select User Story" allowClear showSearch optionFilterProp="children">
                  {stories.filter((s: any) => s.type === 'story').map((story: any) => (
                    <Select.Option key={story.id} value={story.id}>
                      {story.key} - {story.summary}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <Form.Item
                name="epicLink"
                label="Epic Link"
                extra="Don't leave issues orphaned! Link them to an Epic."
              >
                <Select placeholder="Select Epic" allowClear showSearch optionFilterProp="children">
                  {epics.map(epic => (
                    <Select.Option key={epic.id} value={epic.id}>
                      {epic.key} - {epic.summary}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            {selectedType === 'bug' && (
              <>
                <Form.Item
                  name="environment"
                  label="Environment"
                >
                  <Input placeholder="e.g., Production, Staging" />
                </Form.Item>
                <Form.Item
                  name="severity"
                  label="Severity"
                >
                  <Select placeholder="Select severity">
                    <Select.Option value="critical">Critical</Select.Option>
                    <Select.Option value="major">Major</Select.Option>
                    <Select.Option value="minor">Minor</Select.Option>
                    <Select.Option value="trivial">Trivial</Select.Option>
                  </Select>
                </Form.Item>
              </>
            )}
            {selectedType !== 'bug' && (
              <Form.Item
                name="storyPoints"
                label="Story Points"
              >
                <InputNumber min={1} max={100} placeholder="Estimate" style={{ width: '100%' }} />
              </Form.Item>
            )}
          </>
        );

      case 'subtask':
        return (
          <Form.Item
            name="parentIssue"
            label="Parent Issue"
            rules={[{ required: true, message: 'Please select parent issue' }]}
            extra="Select the parent Story or Task"
          >
            <Select placeholder="Select parent issue" showSearch optionFilterProp="children">
              {stories.map(s => (
                <Select.Option key={s.id} value={s.id}>
                  {s.key} - {s.summary}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );

      default:
        return null;
    }
  };



  return (
    <Modal
      title={`Create Issue - ${currentProject?.name || 'Project'}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ type: 'story', priority: 'medium' }}
        onValuesChange={(changedValues) => {
          if (changedValues.summary !== undefined) {
            setSummaryValue(changedValues.summary);
          }
          if (changedValues.description !== undefined) {
            setDescriptionValue(changedValues.description);
          }
          if (changedValues.type !== undefined) {
            setSelectedType(changedValues.type);
          }
        }}
      >
        <Form.Item
          name="type"
          label="Issue Type"
          rules={[{ required: true, message: 'Please select issue type' }]}
        >
          <Select>
            <Select.Option value="epic">🎯 Epic</Select.Option>
            <Select.Option value="story">📖 Story</Select.Option>
            <Select.Option value="task">✅ Task</Select.Option>
            <Select.Option value="bug">🐛 Bug</Select.Option>
            <Select.Option value="subtask">📝 Subtask</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="summary"
          label="Summary"
          rules={[{ required: true, message: 'Please enter summary' }]}
        >
          <Input
            placeholder="What needs to be done?"
          />
        </Form.Item>



        <Form.Item
          name="description"
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Description</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <TemplateButton
                  issueType={selectedType}
                  issueSummary={summaryValue}
                  projectId={currentProject?.id}
                  onTemplateSelected={(text) => {
                    form.setFieldsValue({ description: text });
                    setDescriptionValue(text);
                  }}
                  size="small"
                  disabled={!summaryValue}
                />
                <VoiceDescriptionButton
                  issueType={selectedType as any}
                  issueSummary={summaryValue}
                  projectId={currentProject?.id}
                  onTextGenerated={(text) => {
                    form.setFieldsValue({ description: text });
                    setDescriptionValue(text);
                  }}
                />
              </div>
            </div>
          }
        >
          <TextArea
            rows={4}
            placeholder="Add a description..."
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true, message: 'Please select priority' }]}
        >
          <Select>
            <Select.Option value="highest">🔴 Highest</Select.Option>
            <Select.Option value="high">🟠 High</Select.Option>
            <Select.Option value="medium">🟡 Medium</Select.Option>
            <Select.Option value="low">🟢 Low</Select.Option>
            <Select.Option value="lowest">🔵 Lowest</Select.Option>
          </Select>
        </Form.Item>

        {renderTypeSpecificFields()}

        <Form.Item
          name="assigneeId"
          label="Assignee"
        >
          <Select 
            placeholder="Unassigned" 
            allowClear 
            showSearch
            optionFilterProp="children"
          >
            {members.map((member: any) => (
              <Select.Option key={member.user.id} value={member.user.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar size="small" src={member.user.avatar}>
                    {member.user.name?.[0]}
                  </Avatar>
                  {member.user.name}
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="sprintId"
            label="Sprint"
            style={{ flex: 1 }}
          >
            <Select placeholder="Select Sprint" allowClear>
              {sprints.map((sprint: any) => (
                <Select.Option key={sprint.id} value={sprint.id}>
                  {sprint.name} ({sprint.status})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item
          name="labels"
          label="Labels"
        >
          <Select mode="tags" placeholder="Add labels">
            <Select.Option value="frontend">frontend</Select.Option>
            <Select.Option value="backend">backend</Select.Option>
            <Select.Option value="bug">bug</Select.Option>
            <Select.Option value="feature">feature</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Create Issue
          </Button>
        </Form.Item>
      </Form>

      {/* Gatekeeper Bot Modal */}
      <GatekeeperBot
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onOverride={() => {
          setOverrideDuplicate(true);
          setShowBlockModal(false);
          setTimeout(() => form.submit(), 100);
        }}
        duplicateIssue={{
          key: blockedDuplicate?.duplicate?.key || '',
          summary: blockedDuplicate?.duplicate?.summary || '',
          status: blockedDuplicate?.duplicate?.status || '',
          similarity: blockedDuplicate?.confidence || 0
        }}
      />
    </Modal>
  );
};
