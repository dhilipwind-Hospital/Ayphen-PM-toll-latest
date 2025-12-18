import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, message, Input, Tooltip, Avatar, Tabs, Modal, Upload, Progress } from 'antd';
import { ArrowLeft, Link, Paperclip, Plus, Trash2, Edit, ArrowUp, ArrowDown, Minus, Ban, ShieldAlert, Copy, Clock, Search, Pencil, Download, ListTodo, MessageSquare, History, FileText, Bug, CheckSquare, BookOpen, Star } from 'lucide-react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { commentsApi, issuesApi, projectMembersApi, historyApi, issueLinksApi, api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { colors } from '../../theme/colors';
import { CreateIssueModal } from '../CreateIssueModal';
import { IssueLinkModal } from './IssueLinkModal';
import { IssueRightSidebar } from './Sidebar/IssueRightSidebar';
import { VoiceDescriptionButton } from '../VoiceDescription/VoiceDescriptionButton';
import { IssueBreadcrumbs } from '../common/IssueBreadcrumbs';

const { TextArea } = Input;

// --- Styled Components ---

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #FAF9F7;
  overflow: hidden;
`;

const MainColumn = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  scroll-behavior: smooth;
  position: relative;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #E0E0E0;
    border-radius: 4px;
  }
`;

const ContentWrapper = styled.div`
  padding: 32px 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: #FFFFFF;
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #F0F0F0;
`;

const IssueKeyBadge = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: #0EA5E9;
  padding: 6px 12px;
  border-radius: 8px; /* Rounded corners */
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const HeaderTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #1A1A1A;
  margin-left: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  max-width: 600px;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background: #F5F5F5;
  }
`;

const HeaderIconButton = styled(Button)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #F5F5F5;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s;
  
  &:hover {
    background: #E0E0E0 !important;
    color: #424242 !important;
  }
`;

const Section = styled.div`
  margin: 24px 0;
  background: #FAFAFA; /* Very light gray */
  border-radius: 8px;
  padding: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0px; 
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2C3E50; /* Dark navy */
  margin: 0;
`;

const ContentBox = styled.div`
  background: #FAFAFA;
  border-radius: 8px;
  padding: 16px 24px;
  margin-top: 12px;
  border: 1px solid #F0F0F0;
`;

const EmptyStateText = styled.div`
  text-align: left;
  color: #999999;
  font-size: 14px;
  font-style: italic;
  margin-top: 16px;
  line-height: 1.6;
`;

// Tabs Container - White background, connected to comment area
const TabsContainer = styled.div`
  background: #FFFFFF;
  margin-top: 32px;
  /* padding: 0 24px; remove padding here, padding inside tabs */
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0 !important;
    border-bottom: 1px solid #E0E0E0;
    padding: 0 24px; /* Padding for the nav bar specifically */
    &::before { border-bottom: none; }
  }
  .ant-tabs-tab {
    padding: 12px 16px !important;
    margin: 0 !important;
    font-size: 14px;
    color: #666666;
    font-weight: 500;
    
    &:hover {
      background: #F5F5F5;
      color: #666666;
    }
  }
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #0EA5E9 !important;
    font-weight: 600;
  }
  .ant-tabs-ink-bar {
    background: #0EA5E9 !important;
    height: 3px !important;
  }
    
  /* Content area connection */
  .ant-tabs-content-holder {
     background: #FFFFFF;
     padding: 24px;
  }
`;

const CommentButton = styled(Button)`
  && {
    background: linear-gradient(to right, #0284C7, #0EA5E9) !important;
    color: #FFFFFF !important;
    border: none !important;
    border-radius: 6px;
    padding: 10px 24px;
    height: auto;
    font-weight: 600;
    margin-top: 12px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    
    span {
      color: #FFFFFF !important;
    }
    
    &:hover {
      background: linear-gradient(to right, #0369A1, #0284C7) !important;
      color: #FFFFFF !important;
    }
    &:active {
      background: linear-gradient(to right, #075985, #0369A1) !important;
    }
  }
`;

const MarkdownContent = styled.div`
  line-height: 1.6;
  color: #1A1A1A;
  font-size: 14px;
  margin-top: 16px; 
  h1, h2, h3 { margin-top: 1em; font-weight: 600; }
  p { margin-bottom: 1em; }
`;

// --- Component ---

interface IssueDetailPanelProps {
  issueKey: string;
  onClose?: () => void;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({ issueKey, onClose }) => {
  const navigate = useNavigate();
  const [issue, setIssue] = useState<any>(null);
  const { toggleFavorite, isFavorite } = useStore();
  const isFavorited = issue ? isFavorite('issue', issue.id) : false;
  const [loading, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  // Data States
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  // const [linkedIssues, setLinkedIssues] = useState<any[]>([]); // Replaced by React Query
  const [history, setHistory] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const queryClient = useQueryClient();

  const { data: linkedIssues = [] } = useQuery({
    queryKey: ['issue-links', issue?.id],
    queryFn: async () => {
      const res = await issueLinksApi.getByIssue(issue.id);
      return res.data;
    },
    enabled: !!issue?.id,
    staleTime: 1000 * 60 * 2
  });

  // Edit States
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Modals & Preview
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [createSubtaskModalVisible, setCreateSubtaskModalVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('comments');

  useEffect(() => {
    if (issueKey) loadIssueData();
  }, [issueKey]);

  const loadIssueData = async () => {
    try {
      setLoading(true);
      const res = await issuesApi.getByKey(issueKey);
      setIssue(res.data);
      setDescriptionInput(res.data.description || '');
      setTitleInput(res.data.summary || '');

      const [commentsRes, membersRes, historyRes] = await Promise.all([
        commentsApi.getByIssue(res.data.id),
        projectMembersApi.getByProject(res.data.projectId, localStorage.getItem('userId') || '1'),
        historyApi.getByIssue(res.data.id)
      ]);

      setComments(commentsRes.data || []);
      setProjectMembers(membersRes.data?.map((m: any) => m.user) || []);
      setHistory(historyRes.data || []);

      loadAttachments(res.data.id);
      loadSubtasks(res.data.id);
      // loadLinkedIssues(res.data.id); // Handled by React Query

    } catch (error) {
      message.error('Failed to load issue');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttachments = async (issueId: string) => {
    try {
      const attRes = await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/issue/${issueId}`);
      if (attRes.ok) setAttachments(await attRes.json());
      else setAttachments([]);
    } catch (e) { setAttachments([]); }
  };

  const loadSubtasks = async (issueId: string) => {
    try {
      const getUrl = issue?.type === 'epic'
        ? `https://ayphen-pm-toll-latest.onrender.com/api/issues?epicLink=${issue.key}&userId=${localStorage.getItem('userId')}`
        : `https://ayphen-pm-toll-latest.onrender.com/api/issues?parentId=${issueId}&userId=${localStorage.getItem('userId')}`;

      const subRes = await fetch(getUrl);
      if (subRes.ok) {
        setSubtasks(await subRes.json());
      } else {
        setSubtasks([]);
      }
    } catch (e) {
      setSubtasks([]);
    }
  };



  // loadLinkedIssues removed - using React Query

  const handleUpdate = async (field: string, value: any) => {
    try {
      const oldValue = issue[field];

      // Optimistic update for immediate UI response
      setIssue((prev: any) => ({ ...prev, [field]: value }));

      // Include userId to properly record history
      const userId = localStorage.getItem('userId') || issue.reporterId;

      // Make API call with proper payload
      const response = await issuesApi.update(issue.id, {
        [field]: value,
        userId,
        updatedBy: userId,
      });

      // Update with server response to ensure data consistency
      if (response.data) {
        setIssue(response.data);
        setDescriptionInput(response.data.description || '');
        setTitleInput(response.data.summary || '');
      }

      message.success('Updated successfully');

      // Reload history to show the change
      try {
        const historyRes = await historyApi.getByIssue(issue.id);
        setHistory(historyRes.data || []);
      } catch (histErr) {
        console.error('Failed to reload history:', histErr);
      }

    } catch (error: any) {
      console.error('Update failed:', error);
      message.error(error.response?.data?.error || 'Failed to update');

      // Revert to server state on error
      loadIssueData();
    }
  };

  const handleTitleUpdate = async () => {
    if (titleInput !== issue.summary) {
      await handleUpdate('summary', titleInput);
    }
    setIsEditingTitle(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const userId = localStorage.getItem('userId') || issue.reporterId;
      await commentsApi.create({ issueId: issue.id, content: newComment, authorId: userId, userId });
      setNewComment('');
      message.success('Comment added');
      const res = await commentsApi.getByIssue(issue.id);
      setComments(res.data || []);
    } catch (e) { message.error('Failed to comment'); }
  };

  const handleFileUpload = async () => {
    if (fileList.length === 0 || isUploading) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      fileList.forEach(file => formData.append('files', file.originFileObj || file));
      formData.append('issueId', issue.id);
      formData.append('uploaderId', localStorage.getItem('userId') || issue.reporterId);

      const response = await fetch('https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/upload-multiple', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        message.success('Files uploaded');
        setFileList([]);
        setUploadModalVisible(false);
        loadAttachments(issue.id);

        // Reload history to show attachment upload
        const historyRes = await historyApi.getByIssue(issue.id);
        setHistory(historyRes.data || []);
      } else { throw new Error('Upload failed'); }
    } catch (error) {
      message.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'blocks': return <ShieldAlert size={14} color={colors.status.error.main} />;
      case 'blocked_by': return <Ban size={14} color={colors.status.error.main} />;
      case 'duplicates': return <Copy size={14} color={colors.status.warning.main} />;
      default: return <Link size={14} color={colors.primary[500]} />;
    }
  };

  if (loading || !issue) return <div>Loading...</div>;

  return (
    <LayoutContainer>
      <MainColumn>
        <StickyHeader>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button icon={<ArrowLeft size={20} color="#424242" />} type="text" onClick={() => onClose ? onClose() : navigate(-1)} style={{ marginRight: 24, padding: 0 }} />
            <IssueKeyBadge>{issue.key}</IssueKeyBadge>
            {issue.creationMetadata?.method === 'ai' && (
              <Tooltip title="Created with AI Assistance">
                <div style={{ marginLeft: 8, background: '#F3E8FF', color: '#9333EA', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600 }}>
                  🤖 AI
                </div>
              </Tooltip>
            )}
            {issue.creationMetadata?.method === 'template' && (
              <Tooltip title="Created from Template">
                <div style={{ marginLeft: 8, background: '#E0F2FE', color: '#0284C7', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600 }}>
                  📋 Template
                </div>
              </Tooltip>
            )}

            {isEditingTitle ? (
              <Input
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={handleTitleUpdate}
                onPressEnter={handleTitleUpdate}
                autoFocus
                style={{ fontSize: 20, fontWeight: 600, marginLeft: 16, width: 400, color: '#1A1A1A' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HeaderTitle onClick={() => setIsEditingTitle(true)}>{issue.summary}</HeaderTitle>
                <Tooltip title="Edit Title">
                  <Button
                    type="text"
                    icon={<Pencil size={16} color="#0EA5E9" />}
                    onClick={() => setIsEditingTitle(true)}
                    style={{ padding: 4 }}
                  />
                </Tooltip>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Tooltip title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}>
              <HeaderIconButton
                onClick={() => {
                  toggleFavorite('issue', issue.id);
                  message.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
                }}
              >
                <Star size={18} fill={isFavorited ? "#FFC107" : "none"} color={isFavorited ? "#FFC107" : "#666"} />
              </HeaderIconButton>
            </Tooltip>
            {/* Share/Copy Link */}
            <Tooltip title="Copy Link">
              <HeaderIconButton onClick={() => { navigator.clipboard.writeText(window.location.href); message.success('Copied link'); }}>
                <Link size={18} />
              </HeaderIconButton>
            </Tooltip>
          </div>
        </StickyHeader>

        <ContentWrapper>
          <IssueBreadcrumbs issueIdOrKey={issueKey} />

          {/* Description Section */}
          <Section>
            <SectionHeader>
              <SectionTitle>Description</SectionTitle>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <VoiceDescriptionButton issueType={issue.type} issueSummary={issue.summary} projectId={issue.projectId} currentDescription={issue.description} onTextGenerated={(text) => handleUpdate('description', text)} />
                <Button
                  size="small"
                  type="text"
                  icon={<Edit size={14} />}
                  onClick={() => setIsEditingDescription(!isEditingDescription)}
                  style={{ color: '#666', fontSize: 13 }}
                >
                  {isEditingDescription ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </SectionHeader>

            {isEditingDescription ? (
              <div style={{ marginBottom: 24, marginTop: 16, width: '100%' }}>
                <TextArea
                  rows={12}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  style={{
                    marginBottom: 12,
                    width: '100%',
                    minHeight: 200,
                    fontSize: 14,
                    lineHeight: 1.6,
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    resize: 'vertical'
                  }}
                  placeholder="Enter description using Markdown format..."
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setIsEditingDescription(false)}>Cancel</Button>
                  <Button
                    type="primary"
                    style={{ background: '#0EA5E9', borderColor: '#0EA5E9' }}
                    onClick={() => {
                      handleUpdate('description', descriptionInput);
                      setIsEditingDescription(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <ContentBox onClick={() => setIsEditingDescription(true)} style={{ cursor: 'pointer', minHeight: 60 }}>
                <MarkdownContent style={{ marginTop: 0 }}>
                  {issue.description ? (
                    <ReactMarkdown>{issue.description}</ReactMarkdown>
                  ) : (
                    <EmptyStateText style={{ marginTop: 0 }}>No description provided. Click to add Vision, Goals, Scope, and Success Criteria.</EmptyStateText>
                  )}
                </MarkdownContent>
              </ContentBox>
            )}
          </Section>

          {/* Child Issues / Subtasks Section */}
          <Section>
            <SectionHeader>
              <SectionTitle>
                <ListTodo size={16} style={{ marginRight: 8, color: '#0EA5E9' }} />
                {issue.type === 'epic' ? 'Child Issues' : 'Subtasks'} ({subtasks.length})
              </SectionTitle>
              <Button
                size="small"
                type="text"
                icon={<Plus size={14} />}
                onClick={() => setCreateSubtaskModalVisible(true)}
                style={{ color: '#0EA5E9', fontSize: 13, fontWeight: 500 }}
              >
                Add {issue.type === 'epic' ? 'Issue' : 'Subtask'}
              </Button>
            </SectionHeader>

            {subtasks.length > 0 ? (
              <ContentBox>
                {subtasks.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => navigate(`/issue/${sub.key}`)}
                    style={{
                      padding: '12px 0',
                      borderBottom: `1px solid ${colors.border.light}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {sub.type === 'bug' ? <Bug size={14} color="#EF4444" /> :
                        sub.type === 'story' ? <BookOpen size={14} color="#10B981" /> :
                          sub.type === 'task' ? <CheckSquare size={14} color="#3B82F6" /> :
                            <ListTodo size={14} color="#8B5CF6" />}
                      <span style={{ fontWeight: 500, color: '#0EA5E9' }}>{sub.key}</span>
                      <span style={{ color: colors.text.primary }}>{sub.summary}</span>
                    </div>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: sub.status === 'done' ? '#D1FAE5' : sub.status === 'in-progress' ? '#DBEAFE' : '#F3F4F6',
                      color: sub.status === 'done' ? '#059669' : sub.status === 'in-progress' ? '#2563EB' : '#6B7280'
                    }}>
                      {sub.status?.replace('-', ' ')}
                    </span>
                  </div>
                ))}
              </ContentBox>
            ) : (
              <ContentBox>
                <EmptyStateText style={{ marginTop: 0 }}>No {issue.type === 'epic' ? 'child issues' : 'subtasks'} yet. Click "Add" to create one.</EmptyStateText>
              </ContentBox>
            )}
          </Section>

          {/* Linked Issues Section */}
          <Section>
            <SectionHeader>
              <SectionTitle>
                <Link size={16} style={{ marginRight: 8, color: '#0EA5E9' }} />
                Linked Issues ({linkedIssues.length})
              </SectionTitle>
              <Button size="small" type="text" icon={<Plus size={14} />} onClick={() => setLinkModalVisible(true)} style={{ color: '#0EA5E9', fontSize: 13, fontWeight: 500 }}>Link Issue</Button>
            </SectionHeader>

            {linkedIssues.length > 0 ? (
              <ContentBox>
                {linkedIssues.map(l => (
                  <div key={l.id} onClick={() => navigate(`/issue/${l.targetIssue?.key}`)} style={{ padding: '12px 0', borderBottom: `1px solid ${colors.border.light}`, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: colors.neutral[100], padding: '2px 8px', borderRadius: 4 }}>
                        {getLinkIcon(l.linkType)}
                        <span style={{ fontSize: 12 }}>{l.linkType.replace('_', ' ')}</span>
                      </div>
                      <span style={{ fontWeight: 500, color: '#0EA5E9' }}>{l.targetIssue?.key}</span>
                      <span style={{ color: colors.text.primary }}>{l.targetIssue?.summary}</span>
                    </div>
                    <Tooltip title="Remove Link">
                      <Button type="text" danger icon={<Trash2 size={14} />} onClick={async (e) => { e.stopPropagation(); try { await issueLinksApi.delete(l.id); message.success('Link removed'); queryClient.invalidateQueries({ queryKey: ['issue-links', issue.id] }); } catch (e) { message.error('Failed to remove'); } }} />
                    </Tooltip>
                  </div>
                ))}
              </ContentBox>
            ) : (
              <ContentBox>
                <EmptyStateText style={{ marginTop: 0 }}>No child issues. Link stories, bugs, or tasks to this epic.</EmptyStateText>
              </ContentBox>
            )}
          </Section>

          {/* Combined Tabs Section - Separate White Container */}
          <TabsContainer>
            <StyledTabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'comments',
                  label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={14} /> Comments ({comments.length})</span>,
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <TextArea
                        rows={6}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        style={{ marginBottom: 8, borderRadius: 6, padding: 12, border: `1px solid #D0D0D0`, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <CommentButton onClick={handleAddComment}>Add Comment</CommentButton>
                        <Button
                          icon={<Paperclip size={14} />}
                          onClick={() => setUploadModalVisible(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            height: 'auto',
                            padding: '10px 16px',
                            borderRadius: 6,
                            border: '1px solid #D0D0D0',
                            background: '#FFFFFF',
                            color: '#374151',
                            fontWeight: 500
                          }}
                        >
                          Attach File
                        </Button>
                      </div>

                      <div style={{ marginTop: 40 }}>
                        {comments.length > 0 ? comments.map(c => {
                          const currentUserId = localStorage.getItem('userId');
                          const isCommentAuthor = c.userId === currentUserId || c.author?.id === currentUserId || c.user?.id === currentUserId;

                          return (
                            <div key={c.id} style={{ marginBottom: 32, display: 'flex', gap: 16 }}>
                              <Avatar size={40} src={c.user?.avatar}>{c.user?.name?.[0]}</Avatar>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 600, color: '#1A1A1A', fontSize: 15 }}>{c.user?.name}</span>
                                    <span style={{ fontSize: 12, color: colors.text.secondary }}>{new Date(c.createdAt).toLocaleString()}</span>
                                  </div>
                                  {isCommentAuthor && (
                                    <Tooltip title="Delete Comment">
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<Trash2 size={14} />}
                                        onClick={async () => {
                                          Modal.confirm({
                                            title: 'Delete Comment?',
                                            content: 'This action cannot be undone.',
                                            okText: 'Delete',
                                            okButtonProps: { danger: true },
                                            cancelText: 'Cancel',
                                            onOk: async () => {
                                              try {
                                                await api.delete(`/comments/${c.id}`, { params: { userId: currentUserId } });
                                                message.success('Comment deleted');
                                                const res = await commentsApi.getByIssue(issue.id);
                                                setComments(res.data || []);

                                                // Reload history
                                                const historyRes = await historyApi.getByIssue(issue.id);
                                                setHistory(historyRes.data || []);
                                              } catch (err) {
                                                message.error('Failed to delete comment');
                                              }
                                            }
                                          });
                                        }}
                                        style={{ padding: 4 }}
                                      />
                                    </Tooltip>
                                  )}
                                </div>
                                <div style={{ fontSize: 14, color: '#333333', lineHeight: 1.6 }}>{c.content}</div>
                              </div>
                            </div>
                          );
                        }) : <EmptyStateText style={{ textAlign: 'center' }}>No comments yet.</EmptyStateText>}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'test_cases',
                  label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} /> Test Cases</span>,
                  children: <EmptyStateText style={{ textAlign: 'center' }}>No test cases linked.</EmptyStateText>
                },
                {
                  key: 'attachments',
                  label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Paperclip size={14} /> Attachments ({attachments.length})</span>,
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <div style={{ marginBottom: 24 }}>
                        <Button icon={<Paperclip size={14} />} onClick={() => setUploadModalVisible(true)}>Add Attachment</Button>
                      </div>
                      {attachments.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                          {attachments.map(att => (
                            <div key={att.id} style={{ border: `1px solid ${colors.border.light}`, borderRadius: 8, overflow: 'hidden', position: 'relative', background: 'white' }}>
                              <div
                                style={{ height: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: att.isImage ? 'zoom-in' : 'default' }}
                                onClick={() => att.isImage && setPreviewImage(`https://ayphen-pm-toll-latest.onrender.com/uploads/${att.fileName}`)}
                              >
                                {att.isImage ? <img src={`https://ayphen-pm-toll-latest.onrender.com/uploads/thumbnails/${att.fileName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = `https://ayphen-pm-toll-latest.onrender.com/uploads/${att.fileName}` }} /> : <Paperclip color="#999" size={32} />}
                              </div>
                              <div style={{ padding: '8px 12px' }}>
                                <div style={{ fontSize: 12, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.originalName}</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <Tooltip title="Download">
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={<Download size={14} />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://ayphen-pm-toll-latest.onrender.com/uploads/${att.fileName}`, '_blank');
                                      }}
                                      style={{ color: '#0EA5E9' }}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <Button
                                      size="small"
                                      type="text"
                                      danger
                                      icon={<Trash2 size={14} />}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/${att.id}`, { method: 'DELETE' });
                                          message.success('Attachment deleted');
                                          loadAttachments(issue.id);
                                        } catch (err) {
                                          message.error('Failed to delete attachment');
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyStateText style={{ textAlign: 'center' }}>No files attached.</EmptyStateText>
                      )}
                    </div>
                  )
                },
                {
                  key: 'history',
                  label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><History size={14} /> History ({history.length})</span>,
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      {history.length > 0 ? history.map((h, index) => (
                        <div key={index} style={{ padding: '12px 0', borderBottom: `1px solid ${colors.border.light}` }}>
                          <div><b>{h.user?.name}</b> {h.description}</div>
                          <div style={{ fontSize: 12, color: colors.text.secondary }}>{new Date(h.createdAt || h.timestamp).toLocaleString()}</div>
                        </div>
                      )) : <EmptyStateText style={{ textAlign: 'center' }}>No history available.</EmptyStateText>}
                    </div>
                  )
                },
              ]}
            />
          </TabsContainer>
        </ContentWrapper>
      </MainColumn>

      {/* 3. Right Sidebar */}
      <IssueRightSidebar
        issue={issue}
        users={projectMembers}
        onUpdate={handleUpdate}
        onAIAction={(action) => message.info(`AI Action: ${action}`)}
      />

      {/* Modals & Hidden Logic */}
      <Modal
        open={uploadModalVisible}
        title="Upload Attachments"
        onOk={handleFileUpload}
        onCancel={() => !isUploading && setUploadModalVisible(false)}
        okText={isUploading ? 'Uploading...' : 'Upload'}
        okButtonProps={{ loading: isUploading, disabled: fileList.length === 0 || isUploading }}
        cancelButtonProps={{ disabled: isUploading }}
        closable={!isUploading}
        maskClosable={!isUploading}
      >
        <Upload
          fileList={fileList}
          onChange={({ fileList: newFileList }) => setFileList(newFileList)}
          beforeUpload={() => false}
          multiple
          disabled={isUploading}
        >
          <Button icon={<Paperclip size={14} />} disabled={isUploading}>Select Files</Button>
        </Upload>
      </Modal>

      <Modal open={!!previewImage} footer={null} onCancel={() => setPreviewImage(null)} width={800} centered>
        <img src={previewImage || ''} style={{ width: '100%', borderRadius: 8 }} />
      </Modal>

      <CreateIssueModal
        open={createSubtaskModalVisible}
        onClose={() => setCreateSubtaskModalVisible(false)}
        onSuccess={async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadSubtasks(issue.id);
          await loadIssueData();
        }}
        defaultType="subtask"
        defaultValues={{ parentId: issue.id, parentIssue: issue.id }}
      />

      <IssueLinkModal
        open={linkModalVisible}
        onCancel={() => setLinkModalVisible(false)}
        sourceIssueId={issue.id}
        projectId={issue.projectId}
        onSuccess={async () => {
          queryClient.invalidateQueries({ queryKey: ['issue-links', issue.id] });
        }}
      />

    </LayoutContainer>
  );
};
