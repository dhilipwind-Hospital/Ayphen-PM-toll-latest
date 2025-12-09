import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Tag, Avatar, Button, Tabs, Progress, Checkbox, Input, Select, Modal, Form, Upload, message, DatePicker, Timeline } from 'antd';
import { ArrowLeft, Edit, Link as LinkIcon, Paperclip, Plus, Trash2, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { issuesApi, commentsApi, issueLinksApi, subtasksApi, historyApi, projectsApi, workflowsApi, attachmentsApi, projectMembersApi } from '../services/api';
import { IssueDetailPanel } from '../components/IssueDetail/IssueDetailPanel';
import { VoiceAssistant } from '../components/VoiceAssistant/VoiceAssistant';
import { aiTestCasesApi } from '../services/ai-test-automation-api';
import { MoreActionsMenu } from '../components/MoreActionsMenu';
import { TestCaseGeneratorButton } from '../components/AI/TestCaseGeneratorButton';

import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  `;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  `;

const BackButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
  `;

const IssueKey = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
  `;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
  `;

const MainContent = styled.div``;

const Sidebar = styled.div``;

const Section = styled(Card)`
  margin-bottom: 16px;
  `;

const Field = styled.div`
  margin-bottom: 16px;
  `;

const FieldLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text.secondary};
  margin-bottom: 4px;
  text-transform: uppercase;
  `;

const IssueHeader = styled.div`
  margin-bottom: 24px;
  `;

const IssueSummary = styled.h2`
  font-size: 20px;
  font-weight: 500;
  color: ${colors.text.primary};
  margin: 8px 0 0 0;
  `;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  `;

export const IssueDetailView: React.FC = () => {
  const { issueKey } = useParams();
  const navigate = useNavigate();
  const { issues, updateIssue, currentProject, currentUser, sprints } = useStore();
  const [issue, setIssue] = useState(issues.find(i => i.key === issueKey));

  // If we have the issue key, render the new detailed panel
  if (issueKey) {
    return (
      <IssueDetailPanel
        issueKey={issueKey}
        onClose={() => navigate('/board')}
      />
    );
  }
  const [comments, setComments] = useState<any[]>([]);
  const [linkedIssues, setLinkedIssues] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [subtaskModalVisible, setSubtaskModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [testCaseLinkModal, setTestCaseLinkModal] = useState(false);
  const [bugLinkModal, setBugLinkModal] = useState(false);
  const [createBugModal, setCreateBugModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [linkedTestCases, setLinkedTestCases] = useState<any[]>([]);
  const [linkedBugs, setLinkedBugs] = useState<any[]>([]);
  const [availableTestCases, setAvailableTestCases] = useState<any[]>([]);
  const [availableBugs, setAvailableBugs] = useState<any[]>([]);
  const [testCaseForm] = Form.useForm();
  const [bugForm] = Form.useForm();
  const [createBugForm] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    if (issue) {
      loadIssueData();
      loadWorkflowStatuses();
    }
  }, [issue?.id]);

  // Fetch project members on mount
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!currentProject?.id) return;

      try {
        const response = await projectMembersApi.getByProject(currentProject.id);
        // Extract user objects from project members
        const projectUsers = response.data.map((member: any) => member.user).filter((u: any) => u);
        setUsers(projectUsers);
      } catch (error) {
        console.error('Failed to load project members:', error);
      }
    };
    fetchProjectMembers();
  }, [currentProject?.id]);

  const API_URL = 'http://localhost:8500/api';

  const loadIssueData = async () => {
    if (!issue) return;

    try {
      // Load comments
      const commentsRes = await commentsApi.getByIssue(issue.id);
      setComments(commentsRes.data);

      // Load linked issues
      const linksRes = await issueLinksApi.getByIssue(issue.id);
      setLinkedIssues(linksRes.data);

      // Load subtasks (both Subtask entities and child Issues like bugs)
      const subtasksRes = await subtasksApi.getByParent(issue.id);

      // Also load child issues (bugs created from test failures)
      const allIssuesRes = await issuesApi.getAll({ projectId: issue.projectId });
      const childIssues = allIssuesRes.data?.filter((i: any) => i.parentId === issue.id) || [];

      // Combine subtasks and child issues
      setSubtasks([...subtasksRes.data, ...childIssues]);

      // Load history
      const historyRes = await historyApi.getByIssue(issue.id);
      setHistory(historyRes.data);

      // Load attachments
      try {
        console.log('🔍 Loading attachments for issue:', issue.id);
        const attachmentsRes = await axios.get(`http://localhost:8500/api/attachments-v2/issue/${issue.id}`);
        console.log('📎 Loaded attachments:', attachmentsRes.data);

        // Deduplicate attachments by ID
        const uniqueAttachments = Array.from(
          new Map((attachmentsRes.data || []).map((att: any) => [att.id, att])).values()
        );

        console.log('📊 Total attachments:', attachmentsRes.data?.length || 0);
        console.log('📊 Unique attachments:', uniqueAttachments.length);

        if (attachmentsRes.data?.length !== uniqueAttachments.length) {
          console.warn('⚠️ Duplicate attachments detected and removed!');
        }

        setAttachments(uniqueAttachments);
      } catch (error) {
        console.error('❌ Failed to load attachments:', error);
        setAttachments([]);
      }

      // Load test cases (if this is a story)
      if (issue.type === 'story') {
        try {
          // First, find the AI Story that links to this Jira issue
          const storiesRes = await fetch('http://localhost:8500/api/ai-test-automation/stories');
          const storiesData = await storiesRes.json();
          const aiStory = storiesData.find((s: any) => s.issueId === issue.id);

          if (aiStory) {
            // Then find test cases linked to this AI Story
            const testCasesRes = await aiTestCasesApi.getAll();
            const linkedTestCases = testCasesRes.data.filter((tc: any) => tc.storyId === aiStory.id);
            setTestCases(linkedTestCases);
          }
        } catch (error) {
          console.error('Failed to load test cases:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load issue data:', error);
    }
  };

  const loadWorkflowStatuses = async () => {
    try {
      if (currentProject?.id) {
        // Get project's workflow
        const projectWorkflowRes = await projectsApi.getWorkflow(currentProject.id);
        const workflowId = projectWorkflowRes.data.workflowId;

        if (workflowId) {
          const workflowRes = await workflowsApi.getById(workflowId);
          setWorkflowStatuses(workflowRes.data.statuses || []);
          return;
        }
      }

      // Fallback to default workflow
      const workflowsRes = await workflowsApi.getAll();
      const defaultWorkflow = workflowsRes.data.find((w: any) => w.isDefault);
      if (defaultWorkflow) {
        setWorkflowStatuses(defaultWorkflow.statuses || []);
      }
    } catch (error) {
      console.error('Failed to load workflow statuses:', error);
      // Fallback to hardcoded statuses
      setWorkflowStatuses([
        { id: 'todo', name: 'To Do' },
        { id: 'in-progress', name: 'In Progress' },
        { id: 'in-review', name: 'In Review' },
        { id: 'done', name: 'Done' },
      ]);
    }
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    if (!issue) return;

    try {
      const updateData = {
        [field]: value,
        updatedBy: currentUser?.id || 'current-user'
      };
      const response = await issuesApi.update(issue.id, updateData);

      // Reload full issue with relations to get updated assignee object
      const fullIssue = await issuesApi.getByKey(issue.key);
      setIssue(fullIssue.data);
      updateIssue(issue.id, fullIssue.data);

      message.success('Updated successfully');
      setEditMode({ ...editMode, [field]: false });

      // Create history entry
      await historyApi.create({
        issueId: issue.id,
        userId: currentUser?.id || 'current-user',
        field,
        oldValue: (issue as any)[field],
        newValue: value,
        changeType: 'field_change',
        projectId: issue.projectId,
      });

      // Reload history to show the change
      const historyRes = await historyApi.getByIssue(issue.id);
      setHistory(historyRes.data);
    } catch (error) {
      message.error('Failed to update');
    }
  };

  const handleAddComment = async () => {
    if (!issue || !newComment.trim()) return;

    try {
      const response = await commentsApi.create({
        issueId: issue.id,
        content: newComment,
        authorId: currentUser?.id || 'current-user',
        author: currentUser?.name || 'Unknown',
      });
      setComments([...comments, response.data]);
      setNewComment('');
      message.success('Comment added');

      // Create history entry for comment
      await historyApi.create({
        issueId: issue.id,
        userId: currentUser?.id || 'current-user',
        field: 'comment',
        oldValue: '',
        newValue: newComment.substring(0, 100) + (newComment.length > 100 ? '...' : ''),
        changeType: 'comment_added',
        projectId: issue.projectId,
      });

      // Reload history
      const historyRes = await historyApi.getByIssue(issue.id);
      setHistory(historyRes.data);
    } catch (error) {
      message.error('Failed to add comment');
    }
  };

  const handleCreateSubtask = async (values: any) => {
    if (!issue || !currentProject || !currentUser) {
      message.error('Project, issue, or user not found');
      return;
    }

    try {
      // Generate unique key for subtask
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const projectKey = currentProject.key || 'PROJ';
      const subtaskKey = `${projectKey}-${timestamp}-${random}`;

      const subtaskData = {
        key: subtaskKey,
        summary: values.summary,
        description: values.description || '',
        parentId: issue.id,
        projectId: issue.projectId,
        type: 'subtask',
        status: 'todo',
        priority: 'medium',
        assigneeId: values.assigneeId || null,
        reporterId: currentUser.id,
      };

      console.log('📝 Creating subtask with key:', subtaskKey);
      const response = await issuesApi.create(subtaskData);
      console.log('✅ Subtask created:', response.data);
      setSubtasks([...subtasks, response.data]);
      setSubtaskModalVisible(false);
      message.success('Subtask created successfully');
    } catch (error: any) {
      console.error('❌ Failed to create subtask:', error);
      message.error(`Failed to create subtask: ${error.response?.data?.details || error.message}`);
    }
  };

  const handleLinkIssue = async (values: any) => {
    if (!issue) return;

    try {
      const response = await issueLinksApi.create({
        sourceIssueId: issue.id,
        targetIssueId: values.targetIssueId,
        linkType: values.linkType,
      });
      setLinkedIssues([...linkedIssues, response.data]);
      setLinkModalVisible(false);
      message.success('Issue linked');
    } catch (error) {
      message.error('Failed to link issue');
    }
  };

  const handleConvertType = async (newType: string) => {
    console.log('🔄 Convert Type clicked:', newType);
    if (!issue) {
      console.error('❌ No issue found');
      return;
    }

    try {
      const response = await axios.patch(`${API_URL}/issues/${issue.id}/convert-type`, {
        newType
      });

      message.success(`Successfully converted from ${issue.type} to ${newType}`);

      // Create history entry
      await historyApi.create({
        issueId: issue.id,
        userId: currentUser?.id || 'current-user',
        field: 'type',
        oldValue: issue.type,
        newValue: newType,
        changeType: 'type_conversion',
        projectId: issue.projectId,
      });

      // Reload page to show updated type
      window.location.reload();
    } catch (error) {
      console.error('Failed to convert type:', error);
      message.error('Failed to convert issue type');
    }
  };

  const handleDeleteIssue = async () => {
    console.log('🗑️ Delete Issue clicked');
    if (!issue) {
      console.error('❌ No issue found');
      return;
    }

    try {
      await issuesApi.delete(issue.id);
      message.success('Issue deleted successfully');
      navigate('/board');
    } catch (error) {
      message.error('Failed to delete issue');
    }
  };

  const handleCreateBug = async () => {
    console.log('🐛 Create Bug clicked');
    if (!issue || !currentUser) {
      console.error('❌ No issue or user found');
      return;
    }

    // Pre-fill form with context from current issue
    createBugForm.setFieldsValue({
      summary: `Bug in ${issue.summary}`,
      description: `Found while testing: ${issue.key}\n\nSteps to reproduce:\n1. \n\nExpected result:\n\nActual result:\n`,
      priority: 'high',
      projectId: issue.projectId,
    });

    setCreateBugModal(true);
  };

  const handleCreateBugSubmit = async (values: any) => {
    if (!issue || !currentUser) return;

    try {
      console.log('📝 Creating bug with values:', values);

      // Create bug
      const bugData = {
        ...values,
        type: 'bug',
        projectId: issue.projectId,
        reporterId: currentUser.id,
        status: 'todo',
      };

      const response = await issuesApi.create(bugData);
      console.log('✅ Bug created:', response.data);

      // Link bug to current issue
      await issueLinksApi.create({
        sourceIssueId: issue.id,
        targetIssueId: response.data.id,
        linkType: 'causes',
      });

      message.success('Bug created and linked successfully');
      setCreateBugModal(false);
      createBugForm.resetFields();

      // Reload data to show new link
      await loadIssueData();
    } catch (error) {
      console.error('❌ Failed to create bug:', error);
      message.error('Failed to create bug');
    }
  };

  const handleLinkTestCase = async (values: any) => {
    if (!issue) return;

    try {
      await axios.post(`${API_URL}/issue-links/test-case`, {
        issueId: issue.id,
        testCaseId: values.testCaseId,
        linkType: values.linkType || 'tests',
        projectId: issue.projectId,
      });

      message.success('Test case linked successfully');
      setTestCaseLinkModal(false);
      testCaseForm.resetFields();
      loadLinkedTestCases();
    } catch (error) {
      message.error('Failed to link test case');
    }
  };

  const handleLinkBug = async (values: any) => {
    if (!issue) return;

    try {
      await axios.post(`${API_URL}/issue-links/bug`, {
        issueId: issue.id,
        bugId: values.bugId,
        linkType: values.linkType || 'causes',
        projectId: issue.projectId,
      });

      message.success('Bug linked successfully');
      setBugLinkModal(false);
      bugForm.resetFields();
      loadLinkedBugs();
    } catch (error) {
      message.error('Failed to link bug');
    }
  };

  const loadLinkedTestCases = async () => {
    if (!issue) return;

    try {
      const response = await axios.get(`${API_URL}/issue-links/${issue.id}/test-cases`);
      setLinkedTestCases(response.data);
    } catch (error) {
      console.error('Failed to load test cases:', error);
    }
  };

  const loadLinkedBugs = async () => {
    if (!issue) return;

    try {
      const response = await axios.get(`${API_URL}/issue-links/${issue.id}/bugs`);
      setLinkedBugs(response.data);
    } catch (error) {
      console.error('Failed to load bugs:', error);
    }
  };

  const loadAvailableTestCases = async () => {
    try {
      const response = await aiTestCasesApi.getAll();
      const projectTestCases = response.data.filter((tc: any) => tc.projectId === currentProject?.id);
      setAvailableTestCases(projectTestCases);
    } catch (error) {
      console.error('Failed to load test cases:', error);
    }
  };

  const loadAvailableBugs = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await issuesApi.getAll(userId ? { userId } : {});
      const bugs = response.data.filter((i: any) => i.type === 'bug' && i.projectId === currentProject?.id);
      setAvailableBugs(bugs);
    } catch (error) {
      console.error('Failed to load bugs:', error);
    }
  };

  const handleFileUpload = (info: any) => {
    // Since beforeUpload returns false, we just update the fileList
    setFileList(info.fileList);
  };

  const handleAddLabel = async () => {
    console.log('🏷️ Add Label clicked');
    if (!issue) {
      console.error('❌ No issue found');
      return;
    }

    Modal.confirm({
      title: 'Add Label',
      content: (
        <Input
          id="label-input"
          placeholder="Enter label name"
          onPressEnter={(e) => {
            const label = (e.target as HTMLInputElement).value;
            if (label) {
              const newLabels = [...(issue.labels || []), label];
              handleFieldUpdate('labels', newLabels);
              message.success('Label added');
            }
          }}
        />
      ),
      onOk: async () => {
        const input = document.getElementById('label-input') as HTMLInputElement;
        if (input && input.value) {
          const newLabels = [...(issue.labels || []), input.value];
          await handleFieldUpdate('labels', newLabels);
        }
      },
    });
  };

  const handleAssignToMe = async () => {
    console.log('👤 Assign to Me clicked');
    if (!issue || !currentUser) {
      console.error('❌ No issue or user found');
      return;
    }

    try {
      await handleFieldUpdate('assigneeId', currentUser.id);
      message.success('Assigned to you');
    } catch (error) {
      message.error('Failed to assign');
    }
  };

  const handleMoveToSprint = async () => {
    console.log('🏃 Move to Sprint clicked');
    if (!issue) {
      console.error('❌ No issue found');
      return;
    }

    Modal.confirm({
      title: 'Move to Sprint',
      content: (
        <Select
          id="sprint-select"
          style={{ width: '100%' }}
          placeholder="Select sprint"
        >
          {sprints.filter(s => s.status === 'active').map(sprint => (
            <Select.Option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </Select.Option>
          ))}
        </Select>
      ),
      onOk: async () => {
        const select = document.getElementById('sprint-select') as any;
        if (select && select.value) {
          await handleFieldUpdate('sprintId', select.value);
          message.success('Moved to sprint');
        }
      },
    });
  };

  const handleExport = (format: string) => {
    console.log('📤 Export clicked:', format);
    if (!issue) {
      console.error('❌ No issue found');
      return;
    }

    const data = {
      key: issue.key,
      summary: issue.summary,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      priority: issue.priority,
      assignee: issue.assignee?.name || 'Unassigned',
      reporter: issue.reporter?.name || 'Unknown',
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${issue.key}.json`;
      a.click();
      message.success('Exported as JSON');
    } else if (format === 'csv') {
      const csv = Object.entries(data).map(([key, value]) => `${key},${value}`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${issue.key}.csv`;
      a.click();
      message.success('Exported as CSV');
    } else if (format === 'pdf' || format === 'word') {
      // For PDF and Word, create a formatted text document
      const content = `
    Issue: ${data.key}
    Summary: ${data.summary}
    Type: ${data.type}
    Status: ${data.status}
    Priority: ${data.priority}
    Assignee: ${data.assignee}
    Reporter: ${data.reporter}
    Created: ${data.createdAt}
    Updated: ${data.updatedAt}

    Description:
    ${data.description || 'No description'}
    `.trim();

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${issue.key}.txt`;
      a.click();
      message.success(`Exported as ${format.toUpperCase()} (text format)`);
    }
  };

  const handleLinkedIssueClick = (linkedIssue: any) => {
    navigate(`/issue/${linkedIssue.targetIssue?.key || linkedIssue.key}`);
  };

  if (!issue) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Issue not found</h2>
            <p style={{ color: colors.text.secondary }}>The issue {issueKey} does not exist.</p>
            <Button type="primary" onClick={() => navigate('/board')}>Go to Board</Button>
          </div>
        </Card>
      </Container>
    );
  }

  const completedSubtasks = subtasks.filter(s => s.status === 'done').length;
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <Container>
      <Header>
        <BackButton icon={<ArrowLeft size={16} />} onClick={() => navigate('/board')}>
          Back to Board
        </BackButton>
        <ActionButtons>
          <VoiceAssistant issueId={issue.id} onUpdate={loadIssueData} />
          {issue.type === 'story' && (
            <TestCaseGeneratorButton
              issueId={issue.id}
              issueKey={issue.key}
              onGenerated={() => {
                message.success('Test cases generated');
                loadIssueData();
              }}
            />
          )}
          <Button icon={<Paperclip size={16} />} onClick={() => setUploadModalVisible(true)}>Attach</Button>
          <Button icon={<LinkIcon size={16} />} onClick={() => setLinkModalVisible(true)}>Link</Button>
          <Button icon={<Plus size={16} />} onClick={() => setSubtaskModalVisible(true)}>Create Subtask</Button>
          <MoreActionsMenu
            issue={issue}
            onLinkIssue={() => setLinkModalVisible(true)}
            onLinkTestCase={() => {
              loadAvailableTestCases();
              setTestCaseLinkModal(true);
            }}
            onLinkBug={() => {
              loadAvailableBugs();
              setBugLinkModal(true);
            }}
            onCreateBug={handleCreateBug}
            onAttachFile={() => setUploadModalVisible(true)}
            onAddLabel={handleAddLabel}
            onAssignToMe={handleAssignToMe}
            onMoveToSprint={handleMoveToSprint}
            onChangeType={handleConvertType}
            onExport={handleExport}
            onDelete={handleDeleteIssue}
          />
        </ActionButtons>
      </Header>

      <IssueHeader>
        <IssueKey>{issue.key}</IssueKey>
        {editMode.summary ? (
          <Input
            defaultValue={issue.summary}
            onBlur={(e) => handleFieldUpdate('summary', e.target.value)}
            onPressEnter={(e) => handleFieldUpdate('summary', e.currentTarget.value)}
            autoFocus
          />
        ) : (
          <IssueSummary onClick={() => setEditMode({ ...editMode, summary: true })}>
            {issue.summary} <Edit size={14} style={{ marginLeft: 8, cursor: 'pointer' }} />
          </IssueSummary>
        )}
      </IssueHeader>

      <ContentGrid>
        <MainContent>
          <Section title="Description">
            {editMode.description ? (
              <Input.TextArea
                rows={6}
                defaultValue={issue.description}
                onBlur={(e) => handleFieldUpdate('description', e.target.value)}
                autoFocus
              />
            ) : (
              <div onClick={() => setEditMode({ ...editMode, description: true })}>
                <p>{issue.description || 'No description provided'}</p>
                <Button size="small" icon={<Edit size={14} />}>Edit</Button>
              </div>
            )}
          </Section>

          {subtasks.length > 0 && (
            <Section title={`Subtasks & Bugs (${completedSubtasks}/${subtasks.length})`}>
              <Progress percent={Math.round(subtaskProgress)} />
              <div style={{ marginTop: 16 }}>
                {subtasks.map(subtask => (
                  <div
                    key={subtask.id}
                    style={{
                      marginBottom: 12,
                      padding: '8px',
                      background: subtask.type === 'bug' ? '#fff1f0' : '#f5f5f5',
                      borderRadius: '4px',
                      border: subtask.type === 'bug' ? '1px solid #ffccc7' : '1px solid #d9d9d9',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => navigate(`/issue/${subtask.key || subtask.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Checkbox
                        checked={subtask.status === 'done'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={async (e) => {
                          if (subtask.key) {
                            // It's a child issue (bug)
                            await issuesApi.update(subtask.id, {
                              status: e.target.checked ? 'done' : 'todo'
                            });
                          } else {
                            // It's a subtask
                            await subtasksApi.update(subtask.id, {
                              status: e.target.checked ? 'done' : 'todo'
                            });
                          }
                          loadIssueData();
                        }}
                      />
                      {subtask.type && (
                        <Tag color={subtask.type === 'bug' ? 'red' : 'blue'}>
                          {subtask.type.toUpperCase()}
                        </Tag>
                      )}
                      {subtask.key && (
                        <a
                          href={`/issue/${subtask.key}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/issue/${subtask.key}`);
                          }}
                          style={{ textDecoration: 'none' }}
                        >
                          <Tag color="cyan" style={{ cursor: 'pointer' }}>{subtask.key}</Tag>
                        </a>
                      )}
                      <span style={{ flex: 1 }}>{subtask.summary}</span>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          console.log('🗑️ Delete subtask clicked:', subtask);
                          Modal.confirm({
                            title: 'Delete Subtask?',
                            content: 'Are you sure you want to delete this subtask?',
                            okText: 'Delete',
                            okType: 'danger',
                            onOk: async () => {
                              try {
                                console.log('🗑️ Deleting subtask:', subtask.id, 'Type:', subtask.key ? 'issue' : 'subtask');
                                if (subtask.key) {
                                  await issuesApi.delete(subtask.id);
                                } else {
                                  await subtasksApi.delete(subtask.id);
                                }
                                console.log('✅ Subtask deleted successfully');
                                message.success('Subtask deleted');
                                await loadIssueData();
                              } catch (error: any) {
                                console.error('❌ Failed to delete subtask:', error);
                                console.error('❌ Error response:', error.response?.data);
                                message.error('Failed to delete subtask');
                              }
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {linkedIssues.length > 0 && (
            <Section title={`Linked Issues (${linkedIssues.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {linkedIssues.map(link => {
                  const linkedIssue = issues.find(i => i.id === link.targetIssueId);
                  const linkTypeMap: Record<string, string> = {
                    'blocks': '🚫 Blocks',
                    'blocked_by': '⛔ Blocked by',
                    'relates_to': '🔗 Relates to',
                    'duplicates': '📋 Duplicates',
                    'clones': '👯 Clones',
                    'causes': '⚠️ Causes',
                    'caused_by': '💥 Caused by',
                  };
                  const linkTypeDisplay = linkTypeMap[link.linkType] || link.linkType;

                  return (
                    <div
                      key={link.id}
                      style={{
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                          {linkTypeDisplay}
                        </div>
                        {linkedIssue ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/issue/${linkedIssue.key}`)}
                          >
                            <a
                              href={`/issue/${linkedIssue.key}`}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/issue/${linkedIssue.key}`);
                              }}
                              style={{ textDecoration: 'none' }}
                            >
                              <Tag color="blue" style={{ cursor: 'pointer' }}>{linkedIssue.key}</Tag>
                            </a>
                            <span style={{ fontSize: 13, color: colors.primary[500], cursor: 'pointer' }}>
                              {linkedIssue.summary}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: colors.text.secondary }}>
                            Issue not found
                          </span>
                        )}
                      </div>
                      <Button
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={async () => {
                          await issueLinksApi.delete(link.id);
                          loadIssueData();
                          message.success('Link removed');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {testCases.length > 0 && (
            <Section title={`Test Cases (${testCases.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {testCases.map((testCase: any) => (
                  <div
                    key={testCase.id}
                    style={{
                      padding: '12px',
                      background: '#f0f9ff',
                      borderRadius: '6px',
                      border: '1px solid #bae6fd',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/ai-test-automation/test-cases`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <a
                        href={`/ai-test-automation/test-cases`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          navigate(`/ai-test-automation/test-cases`);
                        }}
                        style={{ textDecoration: 'none' }}
                      >
                        <Tag color="cyan" style={{ cursor: 'pointer' }}>{testCase.testCaseKey}</Tag>
                      </a>
                      <Tag color={testCase.type === 'ui' ? 'green' : testCase.type === 'api' ? 'purple' : 'blue'}>
                        {testCase.type}
                      </Tag>
                      {testCase.categories?.map((cat: string) => (
                        <Tag key={cat} color="orange">{cat}</Tag>
                      ))}
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                      {testCase.title}
                    </div>
                    <div style={{ fontSize: 12, color: colors.text.secondary }}>
                      {testCase.steps?.length || 0} steps • Status: {testCase.status || 'active'}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="dashed"
                icon={<Plus size={16} />}
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => navigate('/ai-test-automation/test-cases')}
              >
                View All Test Cases
              </Button>
            </Section>
          )}

          <Section title={`Attachments (${attachments.length})`}>
            <AttachmentList
              attachments={attachments}
              onRefresh={loadIssueData}
            />
            <Button
              icon={<Paperclip size={16} />}
              onClick={() => setUploadModalVisible(true)}
              style={{ marginTop: 16 }}
            >
              Attach Files
            </Button>
          </Section>

          <Section title="Activity">
            <Tabs
              items={[
                {
                  key: 'comments',
                  label: `Comments (${comments.length})`,
                  children: (
                    <div>
                      <Input.TextArea
                        rows={3}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button
                        type="primary"
                        style={{ marginTop: 8 }}
                        onClick={handleAddComment}
                      >
                        Save
                      </Button>
                      <div style={{ marginTop: 16 }}>
                        {comments.map(comment => {
                          const authorName = comment.author?.name || comment.user?.name || comment.authorName || 'Anonymous';
                          const authorInitial = authorName[0].toUpperCase();

                          console.log('💬 Comment:', { id: comment.id, authorName, comment });

                          return (
                            <Card key={comment.id} size="small" style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <Avatar size="small">{authorInitial}</Avatar>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600 }}>{authorName}</div>
                                  <div>{comment.content || comment.text}</div>
                                  <div style={{ fontSize: 12, color: colors.text.secondary, marginTop: 4 }}>
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'history',
                  label: `History (${history.length})`,
                  children: (
                    <div>
                      {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: colors.text.secondary }}>
                          No history yet
                        </div>
                      ) : (
                        <Timeline>
                          {history.map(entry => {
                            const userName = entry.user?.name || entry.userName || currentUser?.name || 'System';
                            const userInitial = userName[0].toUpperCase();

                            console.log('📜 History:', { id: entry.id, userName, entry });

                            return (
                              <Timeline.Item key={entry.id}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <Avatar size="small">{userInitial}</Avatar>
                                  <div style={{ flex: 1 }}>
                                    <div>
                                      <strong>{userName}</strong>{' '}
                                      {entry.description || `changed ${entry.field}`}
                                    </div>
                                    {entry.changeType === 'field_change' && (
                                      <div style={{
                                        marginTop: 4,
                                        padding: '4px 8px',
                                        background: '#f5f5f5',
                                        borderRadius: 4,
                                        fontSize: 12
                                      }}>
                                        <span style={{ color: '#ff4d4f', textDecoration: 'line-through' }}>
                                          {entry.oldValue || '(empty)'}
                                        </span>
                                        {' → '}
                                        <span style={{ color: '#52c41a', fontWeight: 600 }}>
                                          {entry.newValue}
                                        </span>
                                      </div>
                                    )}
                                    <div style={{ fontSize: 11, color: colors.text.secondary, marginTop: 4 }}>
                                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                                    </div>
                                  </div>
                                </div>
                              </Timeline.Item>
                            );
                          })}
                        </Timeline>
                      )}
                    </div>
                  )
                },
              ]}
            />
          </Section>
        </MainContent>

        <Sidebar>
          <Section title="Details" size="small">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="blue">{issue.type}</Tag>
              </div>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              {editMode.status ? (
                <Select
                  defaultValue={issue.status}
                  style={{ width: '100%' }}
                  onBlur={() => setEditMode({ ...editMode, status: false })}
                  onChange={(value) => handleFieldUpdate('status', value)}
                >
                  {workflowStatuses.map((status: any) => (
                    <Select.Option key={status.id} value={status.id}>
                      {status.name}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <Tag color="blue" onClick={() => setEditMode({ ...editMode, status: true })} style={{ cursor: 'pointer' }}>
                  {workflowStatuses.find((s: any) => s.id === issue.status)?.name || issue.status}
                </Tag>
              )}
            </Field>

            <Field>
              <FieldLabel>Assignee</FieldLabel>
              {editMode.assignee ? (
                <Select
                  defaultValue={issue.assignee?.id}
                  style={{ width: '100%' }}
                  onBlur={() => setEditMode({ ...editMode, assignee: false })}
                  onChange={(value) => handleFieldUpdate('assigneeId', value)}
                  allowClear
                  placeholder="Select assignee"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  <Select.Option value="">Unassigned</Select.Option>
                  {users.map(user => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <div
                  onClick={() => setEditMode({ ...editMode, assignee: true })}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {issue.assignee ? (
                    <>
                      <Avatar size="small" style={{ background: colors.primary[500] }}>
                        {issue.assignee.name.charAt(0)}
                      </Avatar>
                      <span>{issue.assignee.name}</span>
                    </>
                  ) : (
                    <span style={{ color: colors.text.secondary }}>Unassigned</span>
                  )}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Reporter</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" style={{ background: colors.primary[500] }}>
                  {issue.reporter.name.charAt(0)}
                </Avatar>
                <span>{issue.reporter.name}</span>
              </div>
            </Field>

            <Field>
              <FieldLabel>Priority</FieldLabel>
              {editMode.priority ? (
                <Select
                  defaultValue={issue.priority}
                  style={{ width: '100%' }}
                  onBlur={() => setEditMode({ ...editMode, priority: false })}
                  onChange={(value) => handleFieldUpdate('priority', value)}
                >
                  <Select.Option value="lowest">Lowest</Select.Option>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="highest">Highest</Select.Option>
                </Select>
              ) : (
                <Tag
                  color={
                    issue.priority === 'highest' ? 'red' :
                      issue.priority === 'high' ? 'orange' :
                        issue.priority === 'medium' ? 'blue' :
                          issue.priority === 'low' ? 'green' :
                            'default'
                  }
                  onClick={() => setEditMode({ ...editMode, priority: true })}
                  style={{ cursor: 'pointer' }}
                >
                  {issue.priority}
                </Tag>
              )}
            </Field>

            <Field>
              <FieldLabel>Labels</FieldLabel>
              {editMode.labels ? (
                <Select
                  mode="tags"
                  defaultValue={issue.labels}
                  style={{ width: '100%' }}
                  onBlur={() => setEditMode({ ...editMode, labels: false })}
                  onChange={(value) => handleFieldUpdate('labels', value)}
                  placeholder="Add labels"
                />
              ) : (
                <div onClick={() => setEditMode({ ...editMode, labels: true })} style={{ cursor: 'pointer' }}>
                  {issue.labels.length > 0 ? (
                    issue.labels.map(label => (
                      <Tag key={label}>{label}</Tag>
                    ))
                  ) : (
                    <span style={{ color: colors.text.secondary }}>None</span>
                  )}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Sprint</FieldLabel>
              {editMode.sprint ? (
                <Select
                  defaultValue={issue.sprintId}
                  style={{ width: '100%' }}
                  onBlur={() => setEditMode({ ...editMode, sprint: false })}
                  onChange={(value) => handleFieldUpdate('sprintId', value)}
                >
                  <Select.Option value="">None</Select.Option>
                  <Select.Option value="sprint-1">Sprint 1</Select.Option>
                  <Select.Option value="sprint-2">Sprint 2</Select.Option>
                </Select>
              ) : (
                <div onClick={() => setEditMode({ ...editMode, sprint: true })} style={{ cursor: 'pointer' }}>
                  <span style={{ color: colors.text.secondary }}>
                    {issue.sprintId || 'None'}
                  </span>
                </div>
              )}
            </Field>

            {issue.storyPoints !== undefined && (
              <Field>
                <FieldLabel>Story Points</FieldLabel>
                {editMode.storyPoints ? (
                  <Input
                    type="number"
                    defaultValue={issue.storyPoints}
                    onBlur={(e) => handleFieldUpdate('storyPoints', parseInt(e.target.value))}
                    onPressEnter={(e) => handleFieldUpdate('storyPoints', parseInt(e.currentTarget.value))}
                    autoFocus
                    style={{ width: '100%' }}
                  />
                ) : (
                  <Tag
                    color="blue"
                    onClick={() => setEditMode({ ...editMode, storyPoints: true })}
                    style={{ cursor: 'pointer' }}
                  >
                    {issue.storyPoints}
                  </Tag>
                )}
              </Field>
            )}

            <Field>
              <FieldLabel>Original Estimate</FieldLabel>
              {editMode.originalEstimate ? (
                <Input
                  placeholder="e.g., 2h, 3d, 1w"
                  defaultValue={(issue as any).originalEstimate}
                  onBlur={(e) => handleFieldUpdate('originalEstimate', e.target.value)}
                  onPressEnter={(e) => handleFieldUpdate('originalEstimate', e.currentTarget.value)}
                  autoFocus
                  style={{ width: '100%' }}
                />
              ) : (
                <div onClick={() => setEditMode({ ...editMode, originalEstimate: true })} style={{ cursor: 'pointer' }}>
                  <span style={{ color: colors.text.secondary }}>
                    {(issue as any).originalEstimate || 'None'}
                  </span>
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Time Tracking</FieldLabel>
              {editMode.timeTracking ? (
                <div>
                  <Input
                    placeholder="Time spent (e.g., 2h)"
                    defaultValue={(issue as any).timeSpent}
                    onBlur={(e) => handleFieldUpdate('timeSpent', e.target.value)}
                    style={{ width: '100%', marginBottom: 4 }}
                  />
                  <Input
                    placeholder="Remaining (e.g., 1h)"
                    defaultValue={(issue as any).timeRemaining}
                    onBlur={(e) => handleFieldUpdate('timeRemaining', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div onClick={() => setEditMode({ ...editMode, timeTracking: true })} style={{ cursor: 'pointer', fontSize: 12 }}>
                  {(issue as any).timeSpent || (issue as any).timeRemaining ? (
                    <div>
                      <div>Spent: {(issue as any).timeSpent || '0h'}</div>
                      <div>Remaining: {(issue as any).timeRemaining || '0h'}</div>
                    </div>
                  ) : (
                    <span style={{ color: colors.text.secondary }}>Not Specified</span>
                  )}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Due Date</FieldLabel>
              {editMode.dueDate ? (
                <DatePicker
                  defaultValue={(issue as any).dueDate ? undefined : undefined}
                  onChange={(date: any) => {
                    handleFieldUpdate('dueDate', date ? date.toISOString() : null);
                    setEditMode({ ...editMode, dueDate: false });
                  }}
                  style={{ width: '100%' }}
                  autoFocus
                />
              ) : (
                <div onClick={() => setEditMode({ ...editMode, dueDate: true })} style={{ cursor: 'pointer' }}>
                  <span style={{ color: colors.text.secondary }}>
                    {(issue as any).dueDate ? new Date((issue as any).dueDate).toLocaleDateString() : 'None'}
                  </span>
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Epic Link</FieldLabel>
              {editMode.epicLink ? (
                <Select
                  defaultValue={(issue as any).epicId}
                  style={{ width: '100%' }}
                  onBlur={() => setEditMode({ ...editMode, epicLink: false })}
                  onChange={(value) => handleFieldUpdate('epicId', value)}
                  placeholder="Select epic"
                >
                  <Select.Option value="">None</Select.Option>
                  {issues.filter(i => i.type === 'epic').map(epic => (
                    <Select.Option key={epic.id} value={epic.id}>
                      {epic.key} - {epic.summary}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <div onClick={() => setEditMode({ ...editMode, epicLink: true })} style={{ cursor: 'pointer' }}>
                  <span style={{ color: colors.text.secondary }}>
                    {(issue as any).epicId || 'None'}
                  </span>
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Component/s</FieldLabel>
              {editMode.components ? (
                <Select
                  mode="multiple"
                  defaultValue={(issue as any).components || []}
                  style={{ width: '100%' }}
                  onBlur={() => setEditMode({ ...editMode, components: false })}
                  onChange={(value) => handleFieldUpdate('components', value)}
                  placeholder="Select components"
                >
                  <Select.Option value="frontend">Frontend</Select.Option>
                  <Select.Option value="backend">Backend</Select.Option>
                  <Select.Option value="database">Database</Select.Option>
                  <Select.Option value="api">API</Select.Option>
                  <Select.Option value="ui">UI/UX</Select.Option>
                </Select>
              ) : (
                <div onClick={() => setEditMode({ ...editMode, components: true })} style={{ cursor: 'pointer' }}>
                  {(issue as any).components?.length > 0 ? (
                    (issue as any).components.map((comp: string) => (
                      <Tag key={comp}>{comp}</Tag>
                    ))
                  ) : (
                    <span style={{ color: colors.text.secondary }}>None</span>
                  )}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Fix Version/s</FieldLabel>
              {editMode.fixVersions ? (
                <Select
                  mode="multiple"
                  defaultValue={(issue as any).fixVersions || []}
                  style={{ width: '100%' }}
                  onBlur={() => setEditMode({ ...editMode, fixVersions: false })}
                  onChange={(value) => handleFieldUpdate('fixVersions', value)}
                  placeholder="Select versions"
                >
                  <Select.Option value="v1.0">Version 1.0</Select.Option>
                  <Select.Option value="v1.1">Version 1.1</Select.Option>
                  <Select.Option value="v2.0">Version 2.0</Select.Option>
                  <Select.Option value="v2.1">Version 2.1</Select.Option>
                </Select>
              ) : (
                <div onClick={() => setEditMode({ ...editMode, fixVersions: true })} style={{ cursor: 'pointer' }}>
                  {(issue as any).fixVersions?.length > 0 ? (
                    (issue as any).fixVersions.map((version: string) => (
                      <Tag key={version} color="green">{version}</Tag>
                    ))
                  ) : (
                    <span style={{ color: colors.text.secondary }}>None</span>
                  )}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Created</FieldLabel>
              <div style={{ fontSize: 12 }}>
                {new Date(issue.createdAt).toLocaleString()}
              </div>
            </Field>

            <Field>
              <FieldLabel>Updated</FieldLabel>
              <div style={{ fontSize: 12 }}>
                {new Date(issue.updatedAt).toLocaleString()}
              </div>
            </Field>

            <Field>
              <FieldLabel>Resolved</FieldLabel>
              <span style={{ color: colors.text.secondary }}>Unresolved</span>
            </Field>
          </Section>

          <Section title="People" size="small" style={{ marginTop: 16 }}>
            <Field>
              <FieldLabel>Watchers</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Avatar size="small" style={{ background: colors.primary[500] }}>
                  {issue.reporter.name.charAt(0)}
                </Avatar>
                <span style={{ fontSize: 12 }}>1 watching</span>
              </div>
            </Field>

            <Field>
              <FieldLabel>Voters</FieldLabel>
              <span style={{ fontSize: 12, color: colors.text.secondary }}>0 votes</span>
            </Field>
          </Section>

          <Section title="Dates" size="small" style={{ marginTop: 16 }}>
            <Field>
              <FieldLabel>Created</FieldLabel>
              <div style={{ fontSize: 12 }}>
                {new Date(issue.createdAt).toLocaleDateString()}
              </div>
            </Field>

            <Field>
              <FieldLabel>Updated</FieldLabel>
              <div style={{ fontSize: 12 }}>
                {new Date(issue.updatedAt).toLocaleDateString()}
              </div>
            </Field>
          </Section>
        </Sidebar>
      </ContentGrid>

      {/* Link Issue Modal */}
      <Modal
        title="Link Issue"
        open={linkModalVisible}
        onCancel={() => setLinkModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleLinkIssue}>
          <Form.Item label="Link Type" name="linkType" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="blocks">Blocks</Select.Option>
              <Select.Option value="blocked_by">Blocked by</Select.Option>
              <Select.Option value="relates_to">Relates to</Select.Option>
              <Select.Option value="duplicates">Duplicates</Select.Option>
              <Select.Option value="clones">Clones</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Issue" name="targetIssueId" rules={[{ required: true }]}>
            <Select>
              {issues.filter(i => i.id !== issue.id).map(i => (
                <Select.Option key={i.id} value={i.id}>{i.key} - {i.summary}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">Link</Button>
        </Form>
      </Modal>

      {/* Create Subtask Modal */}
      <Modal
        title="Create Subtask"
        open={subtaskModalVisible}
        onCancel={() => setSubtaskModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleCreateSubtask}>
          <Form.Item label="Summary" name="summary" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Assignee" name="assigneeId">
            <Select allowClear placeholder="Select assignee">
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name || user.email}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">Create</Button>
        </Form>
      </Modal>

      {/* Link Test Case Modal */}
      <Modal
        title="Link Test Case"
        open={testCaseLinkModal}
        onCancel={() => setTestCaseLinkModal(false)}
        footer={null}
      >
        <Form form={testCaseForm} onFinish={handleLinkTestCase}>
          <Form.Item label="Test Case" name="testCaseId" rules={[{ required: true, message: 'Please select a test case' }]}>
            <Select
              showSearch
              placeholder="Search and select test case"
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableTestCases.map(tc => (
                <Select.Option key={tc.id} value={tc.id}>
                  {tc.title || tc.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Link Type" name="linkType" initialValue="tests">
            <Select>
              <Select.Option value="tests">Tests</Select.Option>
              <Select.Option value="tested-by">Tested By</Select.Option>
              <Select.Option value="covers">Covers</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Link Test Case
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Link Bug Modal */}
      <Modal
        title="Link Bug"
        open={bugLinkModal}
        onCancel={() => setBugLinkModal(false)}
        footer={null}
      >
        <Form form={bugForm} onFinish={handleLinkBug}>
          <Form.Item label="Bug" name="bugId" rules={[{ required: true, message: 'Please select a bug' }]}>
            <Select
              showSearch
              placeholder="Search and select bug"
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableBugs.map(bug => (
                <Select.Option key={bug.id} value={bug.id}>
                  {bug.key} - {bug.summary}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Link Type" name="linkType" initialValue="causes">
            <Select>
              <Select.Option value="causes">Causes</Select.Option>
              <Select.Option value="caused-by">Caused By</Select.Option>
              <Select.Option value="found-in">Found In</Select.Option>
              <Select.Option value="relates-to">Relates To</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Link Bug
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Bug Modal */}
      <Modal
        title="Create Bug"
        open={createBugModal}
        onCancel={() => {
          setCreateBugModal(false);
          createBugForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={createBugForm}
          layout="vertical"
          onFinish={handleCreateBugSubmit}
        >
          <Form.Item
            label="Summary"
            name="summary"
            rules={[{ required: true, message: 'Please enter bug summary' }]}
          >
            <Input placeholder="Brief summary of the bug" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="Describe the bug in detail"
            />
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
            initialValue="high"
          >
            <Select>
              <Select.Option value="highest">Highest</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="lowest">Lowest</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => {
              setCreateBugModal(false);
              createBugForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Bug
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Upload File Modal */}
      <Modal
        title="Attach Files"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Upload
          multiple
          fileList={fileList}
          onChange={handleFileUpload}
          beforeUpload={() => false}
        >
          <Button icon={<Paperclip size={16} />} block>
            Select Files
          </Button>
        </Upload>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={async () => {
            if (fileList.length === 0) {
              message.warning('Please select files first');
              return;
            }

            try {
              console.log('📎 Uploading files:', fileList.length);
              const formData = new FormData();
              fileList.forEach(file => {
                formData.append('files', file.originFileObj || file);
              });
              formData.append('issueId', issue?.id || '');
              formData.append('uploaderId', currentUser?.id || '');

              const response = await axios.post(
                'http://localhost:8500/api/attachments-v2/upload-multiple',
                formData,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                }
              );

              console.log('✅ Files uploaded:', response.data);
              message.success(`${fileList.length} file(s) attached successfully`);
              setFileList([]);
              setUploadModalVisible(false);

              // Reload attachments immediately (this will fetch all attachments fresh)
              await loadIssueData();
            } catch (error: any) {
              console.error('❌ File upload failed:', error);
              message.error('Failed to attach files');
            }
          }} block>
            Attach
          </Button>
        </div>
      </Modal>
    </Container>
  );
};
