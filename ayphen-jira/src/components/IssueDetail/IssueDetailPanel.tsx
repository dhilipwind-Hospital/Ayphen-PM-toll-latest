import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Input, Tooltip, Avatar, Tabs, Modal, Upload, Progress } from 'antd';
import { ArrowLeft, Link, Share2, MoreHorizontal, Paperclip, Plus, Trash2, Edit, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { commentsApi, issuesApi, projectMembersApi } from '../../services/api';
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
  background: white;
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
  padding: 32px 40px;
  max-width: 900px;
  margin: 0 auto;
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  padding: 12px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${colors.border.light};
`;

const IssueKey = styled.div`
  font-size: 14px;
  color: ${colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IssueTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0 0 24px 0;
  line-height: 1.3;
`;

const Section = styled.div`
  margin-bottom: 40px;
  scroll-margin-top: 80px; 
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MarkdownContent = styled.div`
  line-height: 1.6;
  color: ${colors.text.primary};
  font-size: 15px;
  h1, h2, h3 { margin-top: 1em; font-weight: 600; }
  p { margin-bottom: 1em; }
  ul, ol { padding-left: 20px; margin-bottom: 1em; }
  code { background: ${colors.neutral[100]}; padding: 2px 4px; borderRadius: 4px; }
`;

interface IssueDetailPanelProps {
  issueKey: string;
  onClose?: () => void;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({ issueKey, onClose }) => {
  const navigate = useNavigate();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('summary'); // State for rail

  // Data States
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [linkedIssues, setLinkedIssues] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  // Description Edit State
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');

  // Modals
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [createSubtaskModalVisible, setCreateSubtaskModalVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // Refs for Scroll Spy
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (issueKey) loadIssueData();
  }, [issueKey]);

  useEffect(() => {
    // Spy Scroll Logic
    const handleScroll = () => {
      if (!mainScrollRef.current) return;
      const scrollPos = mainScrollRef.current.scrollTop + 120; // Offset
      let current = 'summary';
      for (const [id, ref] of Object.entries(sectionRefs.current)) {
        if (ref && ref.offsetTop <= scrollPos) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    const scrollContainer = mainScrollRef.current;
    if (scrollContainer) scrollContainer.addEventListener('scroll', handleScroll);
    return () => { if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll); };
  }, [loading]);

  const loadIssueData = async () => {
    try {
      setLoading(true);
      const res = await issuesApi.getByKey(issueKey);
      setIssue(res.data);
      setDescriptionInput(res.data.description || '');

      const [commentsRes, membersRes] = await Promise.all([
        commentsApi.getByIssue(res.data.id),
        projectMembersApi.getByProject(res.data.projectId, localStorage.getItem('userId') || '1')
      ]);

      setComments(commentsRes.data || []);
      setProjectMembers(membersRes.data?.map((m: any) => m.user) || []);

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

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id];
    if (element) {
      // Small timeout to allow render
      setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 0);
    }
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

  if (loading || !issue) return <div>Loading...</div>;

  return (
    <LayoutContainer>
      {/* 1. Left Nav Rail Removed */}

      {/* 2. Main Content Area */}
      <MainColumn ref={mainScrollRef}>
        <StickyHeader>
          <IssueKey>
            <Button icon={<ArrowLeft size={16} />} type="text" onClick={() => onClose ? onClose() : navigate(-1)} />
            {issue.key} / {issue.type}
          </IssueKey>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tooltip title="Share"><Button icon={<Share2 size={16} />} type="text" /></Tooltip>
            <Button icon={<MoreHorizontal size={16} />} type="text" />
          </div>
        </StickyHeader>

        <ContentWrapper>
          {/* Summary Section */}
          <Section ref={el => { sectionRefs.current['summary'] = el; }}>
            <IssueTitle>{issue.summary}</IssueTitle>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <Button icon={<Paperclip size={14} />} onClick={() => setUploadModalVisible(true)}>Attach</Button>
              <Button icon={<Plus size={14} />} onClick={() => setCreateSubtaskModalVisible(true)}>Create Subtask</Button>
              <Button icon={<Link size={14} />} onClick={() => setLinkModalVisible(true)}>Link Issue</Button>
            </div>
          </Section>

          {/* Description Section */}
          <Section ref={el => { sectionRefs.current['description'] = el; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SectionTitle style={{ marginBottom: 0 }}>Description</SectionTitle>
              <div style={{ display: 'flex', gap: 8 }}>
                <VoiceDescriptionButton
                  issueType={issue.type}
                  issueSummary={issue.summary}
                  projectId={issue.projectId}
                  currentDescription={issue.description}
                  onTextGenerated={(text) => handleUpdate('description', text)}
                />
                <Button
                  size="small"
                  icon={<Edit size={14} />}
                  onClick={() => setIsEditingDescription(!isEditingDescription)}
                >
                  {isEditingDescription ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </div>

            {isEditingDescription ? (
              <div style={{ marginBottom: 24 }}>
                <TextArea
                  rows={10}
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
              <MarkdownContent onClick={() => setIsEditingDescription(true)} style={{ cursor: 'pointer', minHeight: 60 }}>
                {issue.description ? (
                  <ReactMarkdown>{issue.description}</ReactMarkdown>
                ) : (
                  <p style={{ color: colors.text.secondary, fontStyle: 'italic' }}>No description provided. Click to add.</p>
                )}
              </MarkdownContent>
            )}
          </Section>

          {/* Subtasks Section */}
          <Section ref={el => { sectionRefs.current['subtasks'] = el; }}>
            <SectionTitle>Subtasks</SectionTitle>

            {subtasks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Progress
                  percent={Math.round((subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100)}
                  strokeColor={colors.status.done}
                  size="small"
                  format={percent => `${subtasks.filter(s => s.status === 'done').length} of ${subtasks.length} done`}
                />
              </div>
            )}

            {subtasks.length > 0 ? (
              subtasks.map(s => (
                <div key={s.id} onClick={() => navigate(`/issue/${s.key}`)} style={{ padding: '8px 12px', border: `1px solid ${colors.border.light}`, borderRadius: 6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                    {/* Priority Icon Mockup - assuming basic mapping if priority data present */}
                    {s.priority === 'high' || s.priority === 'highest' ? <ArrowUp size={14} color={colors.priority.high} /> :
                      s.priority === 'low' || s.priority === 'lowest' ? <ArrowDown size={14} color={colors.priority.low} /> :
                        <Minus size={14} color={colors.priority.medium} />}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 500, color: colors.text.secondary }}>{s.key}</span>
                        <span style={{ color: colors.text.primary }}>{s.summary}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Assignee Avatar Mockup - assuming s.assignee object might exist, else fallback */}
                    <Tooltip title={s.assignee?.name || 'Unassigned'}>
                      <Avatar size={24} src={s.assignee?.avatar} style={{ backgroundColor: s.assignee ? undefined : '#f56a00' }}>
                        {s.assignee?.name?.[0] || 'U'}
                      </Avatar>
                    </Tooltip>

                    <span style={{ fontSize: 12, background: s.status === 'done' ? colors.status.done : colors.neutral[200], color: s.status === 'done' ? 'white' : colors.text.primary, padding: '2px 8px', borderRadius: 10, alignSelf: 'center' }}>{s.status}</span>
                    <Tooltip title="Unlink/Delete Subtask">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          Modal.confirm({
                            title: 'Delete Subtask',
                            content: `Are you sure you want to delete ${s.key}? This action cannot be undone.`,
                            okText: 'Delete',
                            okType: 'danger',
                            onOk: async () => {
                              try {
                                await issuesApi.delete(s.id);
                                message.success('Subtask deleted');
                                loadSubtasks(issue.id);
                              } catch (e) {
                                message.error('Failed to delete subtask');
                              }
                            }
                          });
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: colors.text.secondary }}>No subtasks linked.</div>
            )}
          </Section>

          {/* Linked Issues Section */}
          <Section ref={el => { sectionRefs.current['linkedIssues'] = el; }}>
            <SectionTitle>Linked Issues</SectionTitle>
            {linkedIssues.length > 0 ? (
              linkedIssues.map(l => (
                <div key={l.id} onClick={() => navigate(`/issue/${l.targetIssue?.key}`)} style={{ padding: '8px 12px', border: `1px solid ${colors.border.light}`, borderRadius: 6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, background: colors.neutral[200], padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>{l.linkType}</span>
                    <span style={{ fontWeight: 500, color: colors.text.secondary }}>{l.targetIssue?.key}</span>
                    <span style={{ color: colors.text.primary }}>{l.targetIssue?.summary}</span>
                  </div>
                  <Tooltip title="Remove Link">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/issue-links/${l.id}`, { method: 'DELETE' });
                          message.success('Link removed');
                          loadLinkedIssues(issue.id);
                        } catch (err) {
                          message.error('Failed to remove link');
                        }
                      }}
                    />
                  </Tooltip>
                </div>
              ))
            ) : (
              <div style={{ color: colors.text.secondary }}>No linked issues.</div>
            )}
          </Section>

          {/* Attachments Section */}
          <Section ref={el => { sectionRefs.current['attachments'] = el; }}>
            <SectionTitle>Attachments</SectionTitle>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {attachments.map(att => (
                <div key={att.id} style={{ width: 150, border: `1px solid ${colors.border.light}`, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {att.isImage ?
                      <img
                        src={`https://ayphen-pm-toll-latest.onrender.com/uploads/thumbnails/${att.fileName}`}
                        onError={(e) => {
                          // Fallback to main image if thumbnail fails or blocked
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ayphen-pm-toll-latest.onrender.com/uploads/${att.fileName}`;
                          target.onerror = null;
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      : <Paperclip color="#999" size={32} />}
                  </div>
                  <div style={{ padding: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }} title={att.originalName}>{att.originalName}</div>
                    <Trash2 size={12} style={{ cursor: 'pointer', color: 'red' }} onClick={() => {/* Handle Delete */ }} />
                  </div>
                </div>
              ))}
              {attachments.length === 0 && <span style={{ color: colors.text.secondary }}>No attachments</span>}
            </div>
          </Section>

          {/* Activity Section */}
          <Section ref={el => { sectionRefs.current['activity'] = el; }}>
            <SectionTitle>Activity</SectionTitle>
            <Tabs
              items={[
                {
                  key: 'comments', label: 'Comments', children: (
                    <div>
                      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
                        <TextArea rows={2} placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                        <Button type="primary" onClick={handleAddComment}>Save</Button>
                      </div>
                      {comments.map(c => (
                        <div key={c.id} style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                          <Avatar src={c.user?.avatar}>{c.user?.name?.[0]}</Avatar>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.user?.name} <span style={{ fontWeight: 400, color: colors.text.secondary }}>{new Date(c.createdAt).toLocaleString()}</span></div>
                            <div>{c.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                },
                { key: 'history', label: 'History', children: <div>History log...</div> },
                { key: 'worklog', label: 'Work Log', children: <div>Work logs...</div> }
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

      {/* Modals */}
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

      <CreateIssueModal
        open={createSubtaskModalVisible}
        onClose={() => setCreateSubtaskModalVisible(false)}
        onSuccess={async () => {
          // Small delay to ensure backend consistency/indexing
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
