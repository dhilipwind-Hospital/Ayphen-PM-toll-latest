import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, message, Avatar, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  // Check for Epic Context from defaultValues
  // We check for epicId or epicLink which might be passed when creating from Epic View
  const [epicContext, setEpicContext] = useState<{ id: string; key: string; name: string } | null>(null);

  useEffect(() => {
    // If we are creating an issue and defaultValues contains an epic link/context
    if (defaultValues.epicId || defaultValues.epicLink) {
      // We might only have the ID. We need to find the full object or just use ID.
      // If we have access to loaded 'epics', we can find it.
      // Or rely on passing 'epicKey' / 'epicName' in defaultValues if possible.
      // For now let's assume defaultValues might prepopulate form.
    }
  }, [defaultValues]);

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

  // Track creation method for badge
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai' | 'template'>('manual');
  const [usedTemplateId, setUsedTemplateId] = useState<string | undefined>(undefined);

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

      // Detect Epic Context
      if (defaultValues?.epicLink) {
        // If passed as ID
        const foundEpic = epics.find(e => e.id === defaultValues.epicLink || e.key === defaultValues.epicLink);
        if (foundEpic) {
          setEpicContext({ id: foundEpic.id, key: foundEpic.key, name: foundEpic.summary });
          form.setFieldsValue({ epicLink: foundEpic.id });
        }
      } else {
        setEpicContext(null);
      }
    }
  }, [open, currentProject, defaultType, epics]);

  const loadEpics = async () => {
    if (!currentProject?.id || !currentUser?.id) {
      console.warn('Cannot load epics: missing project or user');
      return;
    }
    try {
      const response = await issuesApi.getAll({ projectId: currentProject.id, type: 'epic', userId: currentUser.id });
      setEpics(response.data || []);
    } catch (error) {
      console.error('Failed to load epics', error);
      setEpics([]);
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

      // 1. Client-side Exact Match Check (Optional/Optimization)
      // Check against loaded titles if possible, but backend check is source of truth.

      try {
        const response = await api.post('/ai-description/check-duplicates', {
          summary,
          description: description || '',
          projectId: currentProject.id,
          issueType: selectedType
        });

        if (response.data.success && response.data.hasDuplicates) {
          const dups = response.data.duplicates;
          const maxConfidence = response.data.confidence;

          setDuplicates(dups);
          setDuplicateConfidence(maxConfidence);

          // EXACT MATCH DETECTION
          // If confidence is very high (>= 98%), treat as exact match
          const isExactMatch = maxConfidence >= 98;

          setBlockedDuplicate({
            duplicate: dups[0],
            confidence: maxConfidence,
            isExactMatch // Pass this flag to Gatekeeper
          });

          // Show modal for high confidence
          if (maxConfidence > 80) {
            setShowBlockModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    },
    [currentProject, selectedType]
  );

  // Auto-fill Epic Name from Summary
  useEffect(() => {
    if (selectedType === 'epic' && summaryValue) {
      form.setFieldsValue({ epicName: summaryValue });
    }
  }, [summaryValue, selectedType, form]);

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
      // Determine the correct status based on sprint selection
      // If a sprint is selected (especially active), use 'todo' instead of 'backlog'
      let issueStatus = 'backlog';
      if (values.sprintId) {
        const selectedSprint = sprints.find(s => s.id === values.sprintId);
        if (selectedSprint) {
          // If sprint is active or future, set status to 'todo' so it appears on board
          issueStatus = 'todo';
        }
      }

      const baseData = {
        summary: values.summary,
        description: values.description || '',
        type: values.type,
        status: issueStatus,
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
        overrideDuplicate, // Include override flag
        creationMetadata: {
          method: creationMethod,
          templateId: usedTemplateId
        }
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
      form.resetFields();
      setSelectedType('story');
      setCreationMethod('manual');
      setUsedTemplateId(undefined);
      setDuplicates([]);
      setSummaryValue('');
      setDescriptionValue('');

      onSuccess();
      onClose();

      // Redirect based on issue type
      if (createdKey) {
        if (selectedType === 'epic') {
          // Epics should go to Epic detail page
          navigate(`/epic/${response.data.id}`);
        } else {
          // Other issue types go to issue detail page
          navigate(`/issue/${createdKey}`);
        }
      }
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
              <Input placeholder="Enter epic name" disabled />
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
                extra={epicContext ? "Locked to current epic" : "Don't leave issues orphaned! Link them to an Epic."}
              >
                <Select
                  placeholder="Select Epic"
                  allowClear={!epicContext}
                  showSearch
                  optionFilterProp="children"
                  disabled={!!epicContext}
                >
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
        {epicContext && (
          <div style={{
            marginBottom: 20,
            padding: '10px 16px',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: 6,
            color: '#0369A1',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>📌 Creating issue in <b>{epicContext.key}</b></span>
          </div>
        )}

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
          rules={[
            { required: true, message: 'Please enter summary' },
            { max: 255, message: 'Summary cannot exceed 255 characters' }
          ]}
        >
          <Input
            placeholder="What needs to be done?"
            maxLength={255}
            showCount
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
                  onTemplateSelected={(text, templateId) => {
                    form.setFieldsValue({ description: text });
                    setDescriptionValue(text);
                    setCreationMethod('template');
                    // if template provides ID, we can set it. Currently TemplateButton might just return text.
                    // Ideally we update TemplateButton to return ID too if available.
                  }}
                  size="small"
                  disabled={!summaryValue}
                  hasContent={!!descriptionValue}
                />
                <VoiceDescriptionButton
                  issueType={selectedType as any}
                  issueSummary={summaryValue}
                  projectId={currentProject?.id}
                  onTextGenerated={(text) => {
                    form.setFieldsValue({ description: text });
                    setDescriptionValue(text);
                    setCreationMethod('ai');
                  }}
                />
              </div>
            </div>
          }
        >
          <TextArea
            rows={8}
            placeholder="Add a description..."
            style={{
              minHeight: 180,
              maxHeight: 400,
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'vertical'
            }}
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
