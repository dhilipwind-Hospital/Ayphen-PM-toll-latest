import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Input, Tooltip, Avatar, Tabs, Modal, Upload, Progress } from 'antd';
import { ArrowLeft, Link, Paperclip, Plus, Trash2, Edit, ArrowUp, ArrowDown, Minus, Ban, ShieldAlert, Copy, Clock } from 'lucide-react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { commentsApi, issuesApi, projectMembersApi, historyApi } from '../../services/api';
import { colors } from '../../theme/colors';
import { CreateIssueModal } from '../CreateIssueModal';
import { IssueLinkModal } from './IssueLinkModal';
import { IssueRightSidebar } from './Sidebar/IssueRightSidebar';
import { VoiceDescriptionButton } from '../VoiceDescription/VoiceDescriptionButton';

const { TextArea } = Input;

// --- Styled Components ---

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  background: white; /* Pure white */
  overflow: hidden;
`;

const MainColumn = styled.div`
  flex: 1;
  overflow-y: auto;
  min-width: 0;
  scroll-behavior: smooth;
  position: relative;
`;

const ContentWrapper = styled.div`
  padding: 40px 60px; /* Generous padding */
  max-width: 1000px;
  margin: 0 auto;
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 1); /* Opaque white */
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* No border as requested */
`;

const IssueKeyBadge = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: ${colors.primary[400]}; /* Pink pill (Softer Top Gradient Color) */
  padding: 4px 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const HeaderTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-left: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
  max-width: 600px;
  
  &:hover { opacity: 0.8; }
`;

const Section = styled.div`
  margin-bottom: 48px; /* Large gaps */
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${colors.text.primary};
  margin: 0;
`;

const EmptyStateText = styled.div`
  padding: 24px;
  text-align: center;
  color: #9E9E9E; /* Gray */
  font-size: 14px;
  font-style: italic;
`;

const CommentButton = styled(Button)`
  && {
    background-color: ${colors.primary[400]}; /* Softer Pink */
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 24px;
    height: auto;
    font-weight: 500;
    margin-top: 12px;
    
    &:hover {
      background-color: ${colors.primary[500]} !important;
      color: white !important;
    }
  }
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 32px !important;
    border-bottom: 1px solid ${colors.border.light};
    &::before { border-bottom: none; }
  }
  .ant-tabs-tab {
    padding: 12px 0 !important;
    margin: 0 32px 0 0 !important;
    font-size: 14px;
    color: ${colors.text.secondary};
    
    &:hover {
      color: ${colors.primary[400]};
    }
  }
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: ${colors.primary[400]} !important;
    font-weight: 500;
  }
  .ant-tabs-ink-bar {
    background: ${colors.primary[400]} !important;
    height: 3px !important;
  }
`;

const MarkdownContent = styled.div`
  line-height: 1.6;
  color: ${colors.text.primary};
  font-size: 15px;
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
  const [loading, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  // Data States
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [linkedIssues, setLinkedIssues] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

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
      loadLinkedIssues(res.data.id);

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

  const loadLinkedIssues = async (issueId: string) => {
    try {
      const linkRes = await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/issue-links/issue/${issueId}`);
      if (linkRes.ok) {
        setLinkedIssues(await linkRes.json());
      } else {
        setLinkedIssues([]);
      }
    } catch (e) {
      setLinkedIssues([]);
    }
  };

  const handleUpdate = async (field: string, value: any) => {
    try {
      setIssue((prev: any) => ({ ...prev, [field]: value }));
      await issuesApi.update(issue.id, { [field]: value });
      message.success('Updated');
    } catch (error) {
      message.error('Failed to update');
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
    if (fileList.length === 0) return;
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
      } else { throw new Error('Upload failed'); }
    } catch (error) {
      message.error('Failed to upload files');
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
            <Button icon={<ArrowLeft size={20} />} type="text" onClick={() => onClose ? onClose() : navigate(-1)} style={{ marginRight: 24, padding: 0 }} />
            <IssueKeyBadge>{issue.key}</IssueKeyBadge>

            {isEditingTitle ? (
              <Input
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={handleTitleUpdate}
                onPressEnter={handleTitleUpdate}
                autoFocus
                style={{ fontSize: 18, fontWeight: 600, marginLeft: 16, width: 400 }}
              />
            ) : (
              <HeaderTitle onClick={() => setIsEditingTitle(true)}>{issue.summary}</HeaderTitle>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Tooltip title="Copy Link"><Button icon={<Link size={18} />} type="text" onClick={() => { navigator.clipboard.writeText(window.location.href); message.success('Copied link'); }} /></Tooltip>
            <VoiceDescriptionButton issueType={issue.type} issueSummary={issue.summary} projectId={issue.projectId} currentDescription={issue.description} onTextGenerated={(text) => handleUpdate('description', text)} />
          </div>
        </StickyHeader>

        <ContentWrapper>

          {/* Description Section */}
          <Section>
            <SectionHeader>
              <SectionTitle>Description</SectionTitle>
              <Button
                size="middle"
                icon={<Edit size={14} />}
                onClick={() => setIsEditingDescription(!isEditingDescription)}
              >
                {isEditingDescription ? 'Cancel' : 'Edit'}
              </Button>
            </SectionHeader>

            {isEditingDescription ? (
              <div style={{ marginBottom: 24 }}>
                <TextArea
                  rows={8}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setIsEditingDescription(false)}>Cancel</Button>
                  <Button type="primary" onClick={() => {
                    handleUpdate('description', descriptionInput);
                    setIsEditingDescription(false);
                  }}>Save</Button>
                </div>
              </div>
            ) : (
              <MarkdownContent onClick={() => setIsEditingDescription(true)} style={{ cursor: 'pointer', minHeight: 40 }}>
                {issue.description ? (
                  <ReactMarkdown>{issue.description}</ReactMarkdown>
                ) : (
                  <EmptyStateText>No description provided. Click to add Vision, Goals, Scope, and Success Criteria.</EmptyStateText>
                )}
              </MarkdownContent>
            )}
          </Section>

          {/* Linked Issues Section */}
          <Section>
            <SectionHeader>
              <SectionTitle>Linked Issues ({linkedIssues.length})</SectionTitle>
              <Button size="middle" icon={<Link size={16} />} onClick={() => setLinkModalVisible(true)}>Link Issue</Button>
            </SectionHeader>

            {linkedIssues.length > 0 ? (
              linkedIssues.map(l => (
                <div key={l.id} onClick={() => navigate(`/issue/${l.targetIssue?.key}`)} style={{ padding: '12px 0', borderBottom: `1px solid ${colors.border.light}`, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: colors.neutral[100], padding: '2px 8px', borderRadius: 4 }}>
                      {getLinkIcon(l.linkType)}
                      <span style={{ fontSize: 12 }}>{l.linkType.replace('_', ' ')}</span>
                    </div>
                    <span style={{ fontWeight: 500, color: colors.primary[400] }}>{l.targetIssue?.key}</span>
                    <span style={{ color: colors.text.primary }}>{l.targetIssue?.summary}</span>
                  </div>
                  <Tooltip title="Remove Link">
                    <Button type="text" danger icon={<Trash2 size={14} />} onClick={async (e) => { e.stopPropagation(); try { await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/issue-links/${l.id}`, { method: 'DELETE' }); message.success('Link removed'); loadLinkedIssues(issue.id); } catch (e) { message.error('Failed to remove'); } }} />
                  </Tooltip>
                </div>
              ))
            ) : (
              <EmptyStateText>No child issues. Link stories, bugs, or tasks to this epic.</EmptyStateText>
            )}
          </Section>

          {/* Combined Tabs Section */}
          <Section>
            <StyledTabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'comments',
                  label: `Comments (${comments.length})`,
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <TextArea
                        rows={4}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        style={{ marginBottom: 8, borderRadius: 4, padding: 16, border: `1px solid ${colors.neutral[200]}`, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <CommentButton onClick={handleAddComment}>Add Comment</CommentButton>
                      </div>

                      <div style={{ marginTop: 40 }}>
                        {comments.length > 0 ? comments.map(c => (
                          <div key={c.id} style={{ marginBottom: 32, display: 'flex', gap: 16 }}>
                            <Avatar size={40} src={c.user?.avatar}>{c.user?.name?.[0]}</Avatar>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: colors.text.primary, fontSize: 15 }}>{c.user?.name}</span>
                                <span style={{ fontSize: 12, color: colors.text.secondary }}>{new Date(c.createdAt).toLocaleString()}</span>
                              </div>
                              <div style={{ fontSize: 15, color: colors.text.primary, lineHeight: 1.6 }}>{c.content}</div>
                            </div>
                          </div>
                        )) : <EmptyStateText>No comments yet.</EmptyStateText>}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'test_cases',
                  label: 'Test Cases',
                  children: <EmptyStateText>No test cases linked.</EmptyStateText>
                },
                {
                  key: 'attachments',
                  label: `Attachments (${attachments.length})`,
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <div style={{ marginBottom: 24 }}>
                        <Button icon={<Paperclip size={14} />} onClick={() => setUploadModalVisible(true)}>Add Attachment</Button>
                      </div>
                      {attachments.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                          {attachments.map(att => (
                            <div key={att.id} style={{ border: `1px solid ${colors.border.light}`, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                              <div
                                style={{ height: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: att.isImage ? 'zoom-in' : 'default' }}
                                onClick={() => att.isImage && setPreviewImage(`https://ayphen-pm-toll-latest.onrender.com/uploads/${att.fileName}`)}
                              >
                                {att.isImage ? <img src={`https://ayphen-pm-toll-latest.onrender.com/uploads/thumbnails/${att.fileName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = `https://ayphen-pm-toll-latest.onrender.com/uploads/${att.fileName}` }} /> : <Paperclip color="#999" size={32} />}
                              </div>
                              <div style={{ padding: 8, fontSize: 12 }}>{att.originalName}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyStateText>No files attached.</EmptyStateText>
                      )}
                    </div>
                  )
                },
                {
                  key: 'history',
                  label: `History (${history.length})`,
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      {history.length > 0 ? history.map((h, index) => (
                        <div key={index} style={{ padding: '12px 0', borderBottom: `1px solid ${colors.border.light}` }}>
                          <div><b>{h.user?.name}</b> {h.description}</div>
                          <div style={{ fontSize: 12, color: colors.text.secondary }}>{new Date(h.createdAt || h.timestamp).toLocaleString()}</div>
                        </div>
                      )) : <EmptyStateText>No history available.</EmptyStateText>}
                    </div>
                  )
                },
              ]}
            />
          </Section>
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
      <Modal open={uploadModalVisible} title="Upload Attachments" onOk={handleFileUpload} onCancel={() => setUploadModalVisible(false)}>
        <Upload
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          beforeUpload={() => false}
          multiple
        >
          <Button icon={<Paperclip size={14} />}>Select Files</Button>
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
          message.success('Issue linked');
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadLinkedIssues(issue.id);
          loadIssueData();
        }}
      />

    </LayoutContainer>
  );
};
