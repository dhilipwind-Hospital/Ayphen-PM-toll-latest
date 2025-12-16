import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Tag, Avatar, Tabs, Upload, message, Modal, Tooltip, Progress, Empty } from 'antd';
import { Edit, Paperclip, Calendar, Clock, Flag, Link, User, Trash2, Eye, Download, ArrowLeft, Plus } from 'lucide-react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { issuesApi, commentsApi, historyApi, projectsApi } from '../services/api';
import { VoiceAssistant } from '../components/VoiceAssistant/VoiceAssistant';
import { VoiceDescriptionButton } from '../components/VoiceDescription/VoiceDescriptionButton';
import { AutoAssignButton } from '../components/AI/AutoAssignButton';
import { SmartPrioritySelector } from '../components/AI/SmartPrioritySelector';
import { AutoTagButton } from '../components/AI/AutoTagButton';
import { TestCaseGeneratorButton } from '../components/AI/TestCaseGeneratorButton';
import { TestCaseList } from '../components/IssueDetail/TestCaseList';
import { IssueLinkModal } from '../components/IssueDetail/IssueLinkModal';
import { IssueBreadcrumbs } from '../components/common/IssueBreadcrumbs';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { QuickActionsBar } from '../components/IssueDetail/QuickActionsBar';
import { HierarchyTree } from '../components/IssueDetail/HierarchyTree';
import { GlassCard, GlassPanel } from '../components/common/GlassPanel';
import { colors } from '../theme/colors';

const DetailContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  padding-top: 20px;
  min-height: calc(100vh - 64px);
  position: relative;
  z-index: 1;
`;

const StickyHeader = styled(GlassPanel)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  position: sticky;
  top: 16px;
  z-index: 100;
  border-radius: 12px;
  margin-bottom: 16px;
  min-height: 52px;
  max-height: 52px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  gap: 16px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const BackButton = styled(Button)`
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 4px 8px;
  color: ${colors.text.secondary};
  margin-right: 16px;
  
  &:hover {
    background: rgba(0,0,0,0.05);
    color: ${colors.primary[600]};
  }
`;

const MainContent = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Sidebar = styled(GlassPanel)`
  flex: 1;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 20px;
  padding: 24px;
  border-radius: 12px;
  align-self: flex-start;
  z-index: 50;
`;

const StyledGlassCard = styled(GlassCard)`
  padding: 24px;
  overflow: visible;
`;

const IssueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
`;

const IssueTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const IssueKey = styled.span`
  color: ${colors.primary[600]};
  background: rgba(236, 72, 153, 0.1);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const IssueTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.text.primary};
  margin: 0;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FieldRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${colors.glass.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const FieldLabel = styled.span`
  font-weight: 600;
  color: ${colors.text.secondary};
  font-size: 14px;
`;

const FieldValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${colors.text.primary};
`;

const MarkdownContent = styled.div`
  line-height: 1.8;
  font-size: 15px;
  color: ${colors.text.primary};
  
  h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 700;
    color: ${colors.text.primary};
    line-height: 1.3;
  }
  
  h2 {
    font-size: 1.25rem;
    border-bottom: 1px solid ${colors.glass.border};
    padding-bottom: 8px;
  }
  
  p {
    margin-bottom: 16px;
  }
  
  code {
    background: rgba(0,0,0,0.05);
    padding: 2px 6px;
    border-radius: 4px;
    color: ${colors.primary[600]};
  }
  
  pre {
    background: #1F2937;
    color: #F9FAFB;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 16px;
  }
  
  blockquote {
    border-left: 4px solid ${colors.primary[500]};
    padding-left: 16px;
    margin: 16px 0;
    color: ${colors.text.secondary};
    font-style: italic;
    background: ${colors.primary[50]};
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
  }
`;

const SectionTitle = styled.h4`
  color: ${colors.text.primary};
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

export const EpicDetailView: React.FC = () => {
  const { epicId } = useParams<{ epicId: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [logWorkModalVisible, setLogWorkModalVisible] = useState(false);
  const [testCaseRefreshTrigger, setTestCaseRefreshTrigger] = useState(0);
  const [timeSpent, setTimeSpent] = useState('');
  const [workComment, setWorkComment] = useState('');
  const [availableIssues, setAvailableIssues] = useState<any[]>([]);
  const [linkedIssues, setLinkedIssues] = useState<any[]>([]);
  const [childIssues, setChildIssues] = useState<any[]>([]);
  const [linkChildModalVisible, setLinkChildModalVisible] = useState(false);
  const [createChildModalVisible, setCreateChildModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [project, setProject] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (epicId) {
      loadIssueData();
    }
  }, [epicId]);

  // Smart Nudge: Prompt to close Epic if all children are done
  useEffect(() => {
    if (issue && issue.type === 'epic' && issue.status !== 'done' && childIssues.length > 0) {
      const allDone = childIssues.every((c: any) => c.status === 'done');
      if (allDone) {
        const key = `epic-complete-nudge-${issue.id}`;
        if (!sessionStorage.getItem(key)) {
          message.info({
            content: (
              <span>
                🎉 All child issues are done!
                <Button type="link" size="small" onClick={async () => {
                  try {
                    await issuesApi.update(issue.id, { status: 'done' });
                    setIssue((prev: any) => ({ ...prev, status: 'done' }));
                    message.success('Epic marked as Done');
                  } catch (e) { message.error('Failed to update'); }
                }}>
                  Mark Epic as Done
                </Button>
              </span>
            ),
            duration: 8,
          });
          sessionStorage.setItem(key, 'shown');
        }
      }
    }
  }, [childIssues, issue]);

  const loadIssueData = async () => {
    try {
      setLoading(true);
      setError(null);
      const issueRes = await issuesApi.getById(epicId!);
      setIssue(issueRes.data);

      try {
        const projectRes = await projectsApi.getById(issueRes.data.projectId);
        setProject(projectRes.data);
      } catch (error) {
        console.error('Failed to load project details');
      }

      try {
        const commentsRes = await commentsApi.getByIssue(issueRes.data.id);
        setComments(commentsRes.data || []);
      } catch (e) {
        setComments([]);
      }

      try {
        const attachmentsRes = await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/issue/${issueRes.data.id}`);
        const attachmentsData = await attachmentsRes.json();
        setAttachments(attachmentsData || []);
      } catch (e) {
        setAttachments([]);
      }

      try {
        const historyRes = await historyApi.getByIssue(issueRes.data.id);
        setHistory(historyRes.data || []);
      } catch (e) {
        setHistory([]);
      }

      try {
        const linksRes = await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/issue-links/issue/${issueRes.data.id}`);
        const linksData = await linksRes.json();
        setLinkedIssues(linksData || []);
      } catch (e) {
        setLinkedIssues([]);
      }

      // Load child issues for epic
      if (issueRes.data.type === 'epic') {
        try {
          const childRes = await issuesApi.getAll({ epicLink: issueRes.data.id });
          setChildIssues(childRes.data || []);
        } catch (e) {
          setChildIssues([]);
        }
      }
    } catch (error: any) {
      console.error('Failed to load epic data:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('network');
        message.error('Cannot connect to server');
      } else {
        setError('not_found');
        message.error('Failed to load epic details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSave = async (field: string) => {
    try {
      const value = form.getFieldValue(field);
      await issuesApi.update(issue.id, { [field]: value });
      setIssue({ ...issue, [field]: value });
      setEditing(null);
      message.success('Field updated successfully');
    } catch (error) {
      console.error('Failed to update field:', error);
      message.error('Failed to update field');
    }
  };

  const generateAiSuggestions = (type: string, summary: string) => {
    const suggestions: Record<string, string[]> = {
      epic: [
        `Epic: ${summary}\n\n## Vision\n\n## Goals\n- \n- \n\n## User Stories\n- \n- \n\n## Success Criteria\n`,
        `Initiative: ${summary}\n\n## Objective\n\n## Scope\n\n## Milestones\n1. \n2. \n3. `,
        `Epic Overview: ${summary}\n\n## Business Value\n\n## Technical Approach\n\n## Risks\n`
      ]
    };
    setAiSuggestions(suggestions[type] || suggestions.epic);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'story': return '📖';
      case 'bug': return '🐛';
      case 'task': return '✅';
      case 'epic': return '🎯';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <DetailContainer>
        <div style={{ textAlign: 'center', padding: 60 }}>Loading epic...</div>
      </DetailContainer>
    );
  }

  if (error === 'network') {
    return (
      <DetailContainer>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Connection Error</h2>
          <p>Cannot connect to the backend server. Please check if the server is running on port 8500.</p>
          <Button onClick={loadIssueData} type="primary">Retry Connection</Button>
        </div>
      </DetailContainer>
    );
  }

  if (!issue) {
    return (
      <DetailContainer>
        <div style={{ textAlign: 'center', padding: 60 }}>Epic not found</div>
      </DetailContainer>
    );
  }

  const detailsTab = (
    <div>
      <FieldRow>
        <FieldLabel>Type</FieldLabel>
        <FieldValue>
          {editing === 'type' ? (
            <Select defaultValue={issue.type} size="small" style={{ width: 120 }} autoFocus onBlur={() => setEditing(null)} onChange={async (v) => {
              try {
                await issuesApi.update(issue.id, { type: v });
                setIssue({ ...issue, type: v });
                setEditing(null);
                message.success('Type updated');
              } catch (error) {
                message.error('Failed to update');
              }
            }}>
              <Select.Option value="story">Story</Select.Option>
              <Select.Option value="bug">Bug</Select.Option>
              <Select.Option value="task">Task</Select.Option>
              <Select.Option value="epic">Epic</Select.Option>
            </Select>
          ) : (
            <>
              <span style={{ fontSize: '16px' }}>{getTypeIcon(issue.type)}</span>
              <span style={{ textTransform: 'capitalize' }}>{issue.type}</span>
              <Button size="small" icon={<Edit size={14} />} onClick={() => setEditing('type')} />
            </>
          )}
        </FieldValue>
      </FieldRow>

      <FieldRow>
        <FieldLabel>Status</FieldLabel>
        <FieldValue>
          {editing === 'status' ? (
            <Select defaultValue={issue.status} size="small" style={{ width: 120 }} autoFocus onBlur={() => setEditing(null)} onChange={async (v) => {
              try {
                await issuesApi.update(issue.id, { status: v });
                setIssue({ ...issue, status: v });
                setEditing(null);
                message.success('Status updated');
              } catch (error) {
                message.error('Failed to update');
              }
            }}>
              <Select.Option value="todo">To Do</Select.Option>
              <Select.Option value="in-progress">In Progress</Select.Option>
              <Select.Option value="in-review">In Review</Select.Option>
              <Select.Option value="done">Done</Select.Option>
            </Select>
          ) : (
            <>
              <Tag color="blue">{issue.status?.replace('-', ' ')}</Tag>
              <Button size="small" icon={<Edit size={14} />} onClick={() => setEditing('status')} />
            </>
          )}
        </FieldValue>
      </FieldRow>

      <FieldRow>
        <FieldLabel>Priority</FieldLabel>
        <FieldValue>
          {editing === 'priority' ? (
            <Select defaultValue={issue.priority} size="small" style={{ width: 100 }} autoFocus onBlur={() => setEditing(null)} onChange={async (v) => {
              try {
                await issuesApi.update(issue.id, { priority: v });
                setIssue({ ...issue, priority: v });
                setEditing(null);
                message.success('Priority updated');
              } catch (error) {
                message.error('Failed to update');
              }
            }}>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
            </Select>
          ) : (
            <>
              <Tag color="orange"><Flag size={12} style={{ marginRight: 4 }} />{issue.priority}</Tag>
              <Button size="small" icon={<Edit size={14} />} onClick={() => setEditing('priority')} />
            </>
          )}
        </FieldValue>
      </FieldRow>

      <FieldRow>
        <FieldLabel>Assignee</FieldLabel>
        <FieldValue>
          {editing === 'assignee' ? (
            <Select defaultValue={issue.assignee?.id} size="small" style={{ width: 150 }} onBlur={() => setEditing(null)} onChange={(v) => { form.setFieldsValue({ assigneeId: v }); handleFieldSave('assigneeId'); }} allowClear>
              <Select.Option value="">Unassigned</Select.Option>
            </Select>
          ) : (
            <>
              {issue.assignee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar size="small" style={{ backgroundColor: '#0EA5E9' }}>{issue.assignee.name[0]}</Avatar>
                  <span>{issue.assignee.name}</span>
                </div>
              ) : (
                <span style={{ color: '#9CA3AF' }}>Unassigned</span>
              )}
              <Button size="small" icon={<Edit size={14} />} onClick={() => setEditing('assignee')} />
            </>
          )}
        </FieldValue>
      </FieldRow>

      <FieldRow>
        <FieldLabel>Story Points</FieldLabel>
        <FieldValue>
          {editing === 'storyPoints' ? (
            <Input type="number" defaultValue={issue.storyPoints} size="small" style={{ width: 80 }} autoFocus onBlur={async (e) => {
              try {
                await issuesApi.update(issue.id, { storyPoints: parseInt(e.target.value) });
                setIssue({ ...issue, storyPoints: parseInt(e.target.value) });
                setEditing(null);
                message.success('Story points updated');
              } catch (error) {
                message.error('Failed to update');
              }
            }} onPressEnter={async (e) => {
              try {
                await issuesApi.update(issue.id, { storyPoints: parseInt(e.currentTarget.value) });
                setIssue({ ...issue, storyPoints: parseInt(e.currentTarget.value) });
                setEditing(null);
                message.success('Story points updated');
              } catch (error) {
                message.error('Failed to update');
              }
            }} />
          ) : (
            <>
              <Tag color="blue">{issue.storyPoints || 0} pts</Tag>
              <Button size="small" icon={<Edit size={14} />} onClick={() => setEditing('storyPoints')} />
            </>
          )}
        </FieldValue>
      </FieldRow>

      <FieldRow>
        <FieldLabel>Created</FieldLabel>
        <FieldValue>
          <Calendar size={14} style={{ color: '#6B7280' }} />
          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
        </FieldValue>
      </FieldRow>
    </div>
  );

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await commentsApi.create({ issueId: issue.id, content: newComment, authorId: 'current-user' });
      message.success('Comment added');
      setNewComment('');
      loadIssueData();
    } catch (error) {
      message.error('Failed to add comment');
    }
  };

  const handleFileUpload = async () => {
    if (fileList.length === 0) return;
    try {
      const formData = new FormData();
      fileList.forEach(file => formData.append('files', file.originFileObj || file));
      formData.append('issueId', issue.id);
      const userId = localStorage.getItem('userId') || issue.reporterId || issue.assigneeId;
      formData.append('uploaderId', userId);

      const response = await fetch('https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/upload-multiple', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        message.success('Files uploaded');
        setFileList([]);
        setUploadModalVisible(false);
        loadIssueData();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      message.error('Failed to upload files');
    }
  };

  const commentsTab = (
    <div>
      <Input.TextArea placeholder="Add a comment..." rows={3} value={newComment} onChange={(e) => setNewComment(e.target.value)} style={{ marginBottom: 8 }} />
      <Button type="primary" onClick={handleAddComment}>Add Comment</Button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {comments.map((comment) => (
          <div key={comment.id} style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid rgba(14, 165, 233, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Avatar size="small" style={{ backgroundColor: '#0EA5E9' }}>{comment.user?.name?.[0] || 'U'}</Avatar>
              <span style={{ fontWeight: 600 }}>{comment.user?.name || 'Unknown'}</span>
              <span style={{ color: '#6B7280', fontSize: '12px' }}>{new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div>{comment.content}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const attachmentsTab = (
    <div>
      <Button icon={<Paperclip size={16} />} onClick={() => setUploadModalVisible(true)} style={{ marginBottom: 16 }}>Upload Files</Button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {attachments.map((att) => (
          <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'white', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              {att.isImage && att.thumbnailPath ? (
                <img src={`https://ayphen-pm-toll-latest.onrender.com/uploads/thumbnails/${att.fileName}`} alt={att.originalName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Paperclip size={20} color="#999" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{att.originalName || att.fileName}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{att.fileSize ? (att.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown size'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {att.isImage && (
                <Button size="small" icon={<Eye size={14} />} onClick={() => window.open(`https://ayphen-pm-toll-latest.onrender.com/uploads/${att.fileName}`, '_blank')}>Preview</Button>
              )}
              <Button size="small" icon={<Download size={14} />} onClick={() => {
                const a = document.createElement('a');
                a.href = `https://ayphen-pm-toll-latest.onrender.com/uploads/${att.fileName}`;
                a.download = att.originalName || att.fileName;
                a.click();
              }}>Download</Button>
              <Button size="small" danger icon={<Trash2 size={14} />} onClick={async () => {
                try {
                  await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/${att.id}`, { method: 'DELETE' });
                  message.success('Attachment deleted');
                  loadIssueData();
                } catch (error) {
                  message.error('Failed to delete');
                }
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DetailContainer>
      {/* Sticky Header - REMOVED to see layout without it */}
      {/* {issue && (
        <StickyHeader>
          <RightSection style={{ marginLeft: 'auto' }}>
            <QuickActionsBar 
              issue={issue} 
              onIssueCreated={() => {
                message.success('Issue created successfully');
                loadIssueData();
              }}
            />
          </RightSection>
        </StickyHeader>
      )} */}

      <div style={{ display: 'flex', gap: 24 }}>
        <MainContent>
          {epicId && <IssueBreadcrumbs issueIdOrKey={epicId} />}
          <StyledGlassCard>
            <IssueHeader>
              <IssueTitleRow>
                <Button
                  icon={<ArrowLeft size={16} />}
                  onClick={() => navigate(-1)}
                  type="text"
                  size="small"
                  style={{ marginRight: 8 }}
                />
                <IssueKey>{issue?.key}</IssueKey>
                {issue?.creationMetadata?.method === 'ai' && (
                  <Tooltip title="Created with AI Assistance">
                    <div style={{
                      marginLeft: 8,
                      marginRight: 8,
                      background: '#F3E8FF',
                      color: '#9333EA',
                      padding: '2px 6px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      border: '1px solid #E9D5FF'
                    }}>
                      🤖 AI
                    </div>
                  </Tooltip>
                )}
                {issue?.creationMetadata?.method === 'template' && (
                  <Tooltip title="Created from Template">
                    <div style={{
                      marginLeft: 8,
                      marginRight: 8,
                      background: '#E0F2FE',
                      color: '#0284C7',
                      padding: '2px 6px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      📋 Template
                    </div>
                  </Tooltip>
                )}
                <IssueTitle>{issue?.summary}</IssueTitle>
              </IssueTitleRow>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <Tooltip title="Copy link to clipboard">
                  <Button
                    icon={<Link size={16} />}
                    onClick={async () => {
                      const url = `${window.location.origin}/epic/${issue.id}`;
                      await navigator.clipboard.writeText(url);
                      message.success('Link copied to clipboard!');
                    }}
                    type="text"
                    size="small"
                  />
                </Tooltip>
                <VoiceAssistant issueId={issue?.id} onUpdate={loadIssueData} />
              </div>
            </IssueHeader>

            <Tabs defaultActiveKey="overview" items={[
              {
                key: 'overview',
                label: 'Overview',
                children: (
                  <div>
                    {/* Progress Bar */}
                    <div style={{ marginBottom: 24, padding: 20, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>Epic Progress</span>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>
                          {childIssues.filter((i: any) => i.status === 'done').length} of {childIssues.length} completed
                        </span>
                      </div>
                      <Progress
                        percent={childIssues.length ? Math.round((childIssues.filter((i: any) => i.status === 'done').length / childIssues.length) * 100) : 0}
                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                        strokeWidth={10}
                      />
                    </div>

                    {/* Description Section */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <SectionTitle>Description</SectionTitle>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {editingDescription && (
                            <VoiceDescriptionButton
                              issueType={issue.type}
                              issueSummary={issue.summary}
                              projectId={issue.projectId}
                              epicId={issue.epicId}
                              parentIssueId={issue.parentId}
                              currentDescription={descriptionValue}
                              onTextGenerated={(text) => setDescriptionValue(text)}
                            />
                          )}
                          {!editingDescription && (
                            <Button size="small" icon={<Edit size={14} />} onClick={() => {
                              setEditingDescription(true);
                              setDescriptionValue(issue.description || '');
                              generateAiSuggestions(issue.type, issue.summary);
                            }}>Edit</Button>
                          )}
                        </div>
                      </div>
                      {editingDescription ? (
                        <div>
                          <Input.TextArea
                            rows={8}
                            value={descriptionValue}
                            onChange={(e) => setDescriptionValue(e.target.value)}
                            placeholder="Enter epic description with Vision, Goals, Scope, etc..."
                            style={{ marginBottom: 8 }}
                          />
                          {aiSuggestions.length > 0 && (
                            <div style={{ marginBottom: 8, padding: 8, background: '#f0f9ff', borderRadius: 4, border: '1px solid #bae6fd' }}>
                              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#0284c7' }}>AI Suggestions:</div>
                              {aiSuggestions.map((suggestion, idx) => (
                                <div key={idx} style={{ fontSize: 12, padding: 4, cursor: 'pointer', borderRadius: 4 }} onClick={() => setDescriptionValue(suggestion)}>
                                  • Template {idx + 1}
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button type="primary" onClick={async () => {
                              try {
                                await issuesApi.update(issue.id, { description: descriptionValue });
                                setIssue({ ...issue, description: descriptionValue });
                                setEditingDescription(false);
                                message.success('Description updated');
                              } catch (error) {
                                message.error('Failed to update');
                              }
                            }}>Save</Button>
                            <Button onClick={() => {
                              setEditingDescription(false);
                              setDescriptionValue('');
                              setAiSuggestions([]);
                            }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: 16,
                          background: '#F9FAFB',
                          borderRadius: 8,
                          border: '1px solid rgba(14, 165, 233, 0.1)',
                          cursor: 'pointer'
                        }} onClick={() => {
                          setEditingDescription(true);
                          setDescriptionValue(issue.description || '');
                          generateAiSuggestions(issue.type, issue.summary);
                        }}>
                          <MarkdownContent>
                            <ReactMarkdown>
                              {issue.description || '*No description provided. Click to add Vision, Goals, Scope, and Success Criteria.*'}
                            </ReactMarkdown>
                          </MarkdownContent>
                        </div>
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: 'child-issues',
                label: `Child Issues (${childIssues.length})`,
                children: (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, color: '#475569' }}>Issues in this Epic</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="small" icon={<Link size={14} />} onClick={async () => {
                          // Load available issues first before opening modal
                          try {
                            const userId = localStorage.getItem('userId');
                            const res = await issuesApi.getAll({ projectId: issue.projectId, userId: userId || undefined });
                            setAvailableIssues(res.data.filter((i: any) =>
                              i.id !== issue.id &&
                              i.type !== 'epic' &&
                              !i.epicLink
                            ));
                          } catch (error) {
                            console.error('Failed to load issues:', error);
                          }
                          setLinkChildModalVisible(true);
                        }}>Link Existing Issue</Button>

                        <Button size="small" type="primary" icon={<Plus size={14} />} onClick={() => setCreateChildModalVisible(true)}>
                          Create Child Issue
                        </Button>
                      </div>
                    </div>

                    {childIssues.length === 0 ? (
                      <div style={{ padding: 32, background: '#f9fafb', borderRadius: 8, textAlign: 'center', color: '#6b7280', border: '1px dashed #e2e8f0' }}>
                        <p style={{ marginBottom: 16 }}>No child issues yet.</p>
                        <Button type="primary" onClick={() => setCreateChildModalVisible(true)}>Create your first Story</Button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {childIssues.map((child: any) => (
                          <div key={child.id} style={{ padding: 12, background: 'white', border: '1px solid #f0f0f0', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => navigate(`/issue/${child.key}`)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: '16px' }}>{getTypeIcon(child.type)}</span>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 600, color: '#334155' }}>{child.key}</span>
                                  <span style={{ color: '#64748B' }}>{child.summary}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                  <Tag style={{ margin: 0, fontSize: 10, lineHeight: '18px' }} color="blue">{child.status}</Tag>
                                  {child.assignee && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B' }}>
                                      <Avatar size={16} src={child.assignee.avatar}>{child.assignee.name[0]}</Avatar>
                                      {child.assignee.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button size="small" danger type="text" icon={<Trash2 size={14} />} onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const userId = localStorage.getItem('userId') || issue.reporterId;
                                await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/epics/${issue.id}/link/${child.id}?userId=${userId}`, { method: 'DELETE' });
                                message.success('Child issue removed');
                                loadIssueData();
                              } catch (error) {
                                message.error('Failed to remove');
                              }
                            }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'timeline',
                label: 'Timeline',
                children: (
                  <div style={{ padding: 24, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ margin: 0 }}>Project Roadmap</h3>
                      <p style={{ color: '#666', margin: 0 }}>Timeline based on Child Issues due dates</p>
                    </div>
                    {childIssues.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {childIssues.map((child: any) => (
                          <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 150, flexShrink: 0, fontWeight: 500 }}>{child.key}</div>
                            <div style={{ flex: 1, background: '#f5f5f5', height: 32, borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
                              {/* Minimal bar representation */}
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: child.status === 'done' ? '100%' : '50%',
                                  background: child.status === 'done' ? '#10B981' : '#3B82F6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  paddingLeft: 12,
                                  color: 'white',
                                  fontSize: 12,
                                  fontWeight: 500
                                }}
                              >
                                {child.summary}
                              </div>
                            </div>
                            <div style={{ width: 100, flexShrink: 0, fontSize: 12, color: '#666', textAlign: 'right' }}>
                              {child.dueDate ? new Date(child.dueDate).toLocaleDateString() : 'No Due Date'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty description="No child issues with dates found" />
                    )}
                  </div>
                )
              }
            ]} />

            {linkedIssues.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <SectionTitle>Linked Issues ({linkedIssues.length})</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedIssues.map((link: any) => (
                    <div key={link.id} style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Tag color="blue">{link.linkType.replace('_', ' ')}</Tag>
                        <span style={{ marginLeft: 8 }}>{link.targetIssue?.key || 'Unknown'} - {link.targetIssue?.summary || 'Unknown'}</span>
                      </div>
                      <Button size="small" danger icon={<Trash2 size={14} />} onClick={async () => {
                        try {
                          await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/issue-links/${link.id}`, { method: 'DELETE' });
                          message.success('Link removed');
                          loadIssueData();
                        } catch (error) {
                          message.error('Failed to remove link');
                        }
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Tabs
              items={[
                { key: 'comments', label: `Comments (${comments.length})`, children: commentsTab },
                { key: 'testCases', label: 'Test Cases', children: <TestCaseList issueId={issue.id} refreshTrigger={testCaseRefreshTrigger} /> },
                { key: 'attachments', label: `Attachments (${attachments.length})`, children: attachmentsTab },
                {
                  key: 'history', label: `History (${history.length})`, children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {history.map((h: any) => (
                        <div key={h.id} style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid #e0e0e0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Avatar size="small" style={{ backgroundColor: '#0EA5E9' }}>{h.user?.name?.[0] || 'U'}</Avatar>
                            <span style={{ fontWeight: 600 }}>{h.user?.name || 'Unknown'}</span>
                            <span style={{ fontSize: 12, color: '#999' }}>{new Date(h.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: 13 }}>{h.description || `Changed ${h.field} from "${h.oldValue}" to "${h.newValue}"`}</div>
                        </div>
                      ))}
                    </div>
                  )
                }
              ]}
            />

            <Modal title="Upload Files" open={uploadModalVisible} onCancel={() => setUploadModalVisible(false)} onOk={handleFileUpload}>
              <Upload multiple fileList={fileList} onChange={(info) => setFileList(info.fileList)} beforeUpload={() => false}>
                <Button icon={<Paperclip size={16} />}>Select Files</Button>
              </Upload>
            </Modal>
          </StyledGlassCard>
        </MainContent>

        <Sidebar>
          <StyledGlassCard title="Details">
            {detailsTab}
          </StyledGlassCard>

          <StyledGlassCard title="Hierarchy" style={{ marginTop: 16 }}>
            <HierarchyTree issue={issue} />
          </StyledGlassCard>

          <StyledGlassCard title="Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button icon={<Link size={16} />} block onClick={() => setLinkModalVisible(true)}>Link Issue</Button>
              <Button icon={<User size={16} />} block onClick={async () => {
                try {
                  const userId = localStorage.getItem('userId') || issue.reporterId;
                  await issuesApi.update(issue.id, { assigneeId: userId });
                  message.success('Assigned to you');
                  loadIssueData();
                } catch (error) {
                  message.error('Failed to assign');
                }
              }}>Assign to me</Button>
              <Button icon={<Flag size={16} />} block onClick={async () => {
                try {
                  const userId = localStorage.getItem('userId') || issue.reporterId;
                  const response = await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/issue-actions/${issue.id}/flag`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                  });
                  const data = await response.json();
                  message.success(data.isFlagged ? 'Epic flagged' : 'Flag removed');
                  loadIssueData();
                } catch (error) {
                  message.error('Failed to flag epic');
                }
              }}>Flag</Button>
              <Button icon={<Clock size={16} />} block onClick={() => setLogWorkModalVisible(true)}>Log Work</Button>
            </div>
          </StyledGlassCard>

          <StyledGlassCard title="🤖 AI Assistant">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AutoAssignButton
                issueId={issue.id}
                onAssigned={(_userId, userName) => {
                  message.success(`Assigned to ${userName}`);
                  loadIssueData();
                }}
                size="middle"
                type="default"
                showText={true}
              />
              <SmartPrioritySelector
                issueId={issue.id}
                currentPriority={issue.priority}
                onPriorityChanged={(priority) => {
                  message.success(`Priority updated to ${priority}`);
                  loadIssueData();
                }}
                size="middle"
                type="default"
                showText={true}
              />
              <AutoTagButton
                issueId={issue.id}
                currentTags={issue.labels || []}
                onTagsChanged={(tags) => {
                  message.success(`Tags updated: ${tags.join(', ')}`);
                  loadIssueData();
                }}
                size="middle"
                type="default"
                showText={true}
              />
              <TestCaseGeneratorButton
                issueId={issue.id}
                issueKey={issue.key}
                onGenerated={() => {
                  message.success('Test cases generated');
                  loadIssueData();
                  setTestCaseRefreshTrigger(prev => prev + 1);
                }}
              />
            </div>
          </StyledGlassCard>

          <IssueLinkModal
            open={linkModalVisible}
            onCancel={() => setLinkModalVisible(false)}
            onSuccess={() => {
              loadIssueData();
            }}
            sourceIssueId={issue.id}
            projectId={issue.projectId}
          />

          <Modal title="Link Child Issue to Epic" open={linkChildModalVisible} onCancel={() => setLinkChildModalVisible(false)} footer={null}>
            <Form onFinish={async (values) => {
              try {
                const userId = localStorage.getItem('userId') || issue.reporterId;
                await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/epics/${issue.id}/link`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ issueId: values.issueId, userId })
                });
                message.success('Issue linked to epic');
                setLinkChildModalVisible(false);
                loadIssueData();
              } catch (error) {
                message.error('Failed to link issue');
              }
            }}>
              <Form.Item label="Issue" name="issueId" rules={[{ required: true }]}>
                <Select showSearch placeholder="Search issue" onFocus={async () => {
                  try {
                    const userId = localStorage.getItem('userId');
                    const res = await issuesApi.getAll({ projectId: issue.projectId, userId: userId || undefined });
                    setAvailableIssues(res.data.filter((i: any) =>
                      i.id !== issue.id &&
                      i.type !== 'epic' &&
                      !i.epicLink
                    ));
                  } catch (error) {
                    console.error('Failed to load issues');
                  }
                }}>
                  {availableIssues.map(i => (
                    <Select.Option key={i.id} value={i.id}>{i.key} - {i.summary}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Button type="primary" htmlType="submit" block>Link to Epic</Button>
            </Form>
          </Modal>

          <Modal title="Log Work" open={logWorkModalVisible} onCancel={() => setLogWorkModalVisible(false)} onOk={async () => {
            try {
              const userId = localStorage.getItem('userId') || issue.reporterId;
              const response = await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/issue-actions/${issue.id}/log-work`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeSpent, comment: workComment, userId })
              });
              await response.json();
              message.success(`Logged ${timeSpent}`);
              setLogWorkModalVisible(false);
              setTimeSpent('');
              setWorkComment('');
              loadIssueData();
            } catch (error) {
              message.error('Failed to log work');
            }
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Time Spent</label>
                <Input placeholder="e.g., 2h, 30m, 1d" value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)} />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Format: 2h (hours), 30m (minutes), 1d (days)</div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Comment (optional)</label>
                <Input.TextArea rows={3} placeholder="What did you work on?" value={workComment} onChange={(e) => setWorkComment(e.target.value)} />
              </div>
            </div>
          </Modal>
        </Sidebar>
      </div>
      <CreateIssueModal
        open={createChildModalVisible}
        onClose={() => setCreateChildModalVisible(false)}
        onSuccess={() => {
          message.success('Child issue created');
          loadIssueData();
        }}
        defaultType="story"
        defaultValues={{
          epicLink: issue?.id, // Pass ID to lock context
          projectId: issue?.projectId
        }}
      />
    </DetailContainer >
  );
};
