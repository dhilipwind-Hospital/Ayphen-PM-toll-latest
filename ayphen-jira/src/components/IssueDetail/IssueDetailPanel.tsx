import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Input, Tooltip, Avatar, Tabs, Modal, Upload } from 'antd';
import { ArrowLeft, Link, Share2, MoreHorizontal, Paperclip, Plus, Trash2 } from 'lucide-react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { issuesApi, commentsApi, projectMembersApi } from '../../services/api';
import { colors } from '../../theme/colors';
import { IssueNavigationRail } from './IssueNavigationRail';
import { IssueRightSidebar } from './Sidebar/IssueRightSidebar';
import { CreateIssueModal } from '../CreateIssueModal';
import { IssueLinkModal } from './IssueLinkModal';

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
  code { background: ${colors.background.neutral}; padding: 2px 4px; borderRadius: 4px; }
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
  const [activeSection, setActiveSection] = useState('summary');

  // Data States
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

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
    const handleScroll = () => {
      if (!mainScrollRef.current) return;
      const scrollPos = mainScrollRef.current.scrollTop + 120; // Offset for header

      let current = 'summary';
      for (const [id, ref] of Object.entries(sectionRefs.current)) {
        if (ref && ref.offsetTop <= scrollPos) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    const scrollContainer = mainScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loading]);

  const loadIssueData = async () => {
    try {
      setLoading(true);
      const res = await issuesApi.getByKey(issueKey);
      setIssue(res.data);

      const [commentsRes, membersRes] = await Promise.all([
        commentsApi.getByIssue(res.data.id),
        projectMembersApi.getByProject(res.data.projectId, localStorage.getItem('userId') || '1')
      ]);

      setComments(commentsRes.data || []);
      setProjectMembers(membersRes.data?.map((m: any) => m.user) || []);

      loadAttachments(res.data.id);
      loadSubtasks(res.data.id);

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
      // Mocked endpoint until backend route verified
      // const subRes = await fetch(`https://ayphen-pm-toll-latest.onrender.com/api/subtasks/parent/${issueId}`);
      // setSubtasks(await subRes.json());
      setSubtasks([]); // Clearing for safety if endpoint 404s
    } catch (e) { setSubtasks([]); }
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
      element.scrollIntoView({ behavior: 'smooth' });
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
      {/* 1. Left Nav Rail */}
      <IssueNavigationRail
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* 2. Main Content Area */}
      <MainColumn ref={mainScrollRef}>
        <StickyHeader>
          <IssueKey>
            <Button icon={<ArrowLeft size={16} />} type="text" onClick={() => onClose ? onClose() : navigate(-1)} />
            {issue.key} / {issue.type}
          </IssueKey>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tooltip title="Share"><Button icon={<Share2 size={16} />} type="text" /></Tooltip>
            <Tooltip title="Copy Link"><Button icon={<Link size={16} />} type="text" /></Tooltip>
            <Button icon={<MoreHorizontal size={16} />} type="text" />
          </div>
        </StickyHeader>

        <ContentWrapper>
          {/* Summary Section */}
          <Section ref={el => sectionRefs.current['summary'] = el}>
            <IssueTitle>{issue.summary}</IssueTitle>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <Button icon={<Paperclip size={14} />} onClick={() => setUploadModalVisible(true)}>Attach</Button>
              <Button icon={<Plus size={14} />} onClick={() => setCreateSubtaskModalVisible(true)}>Create Subtask</Button>
              <Button icon={<Link size={14} />} onClick={() => setLinkModalVisible(true)}>Link Issue</Button>
            </div>
          </Section>

          {/* Description Section */}
          <Section ref={el => sectionRefs.current['description'] = el}>
            <SectionTitle>Description</SectionTitle>
            <MarkdownContent>
              {issue.description ? (
                <ReactMarkdown>{issue.description}</ReactMarkdown>
              ) : (
                <p style={{ color: colors.text.secondary, fontStyle: 'italic' }}>No description provided.</p>
              )}
            </MarkdownContent>
          </Section>

          {/* Subtasks Section */}
          <Section ref={el => sectionRefs.current['subtasks'] = el}>
            <SectionTitle>Subtasks</SectionTitle>
            {subtasks.length > 0 ? (
              subtasks.map(s => (
                <div key={s.id} onClick={() => navigate(`/issue/${s.key}`)} style={{ padding: '8px 12px', border: `1px solid ${colors.border.light}`, borderRadius: 6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span>{s.key} {s.summary}</span>
                  <span style={{ fontSize: 12, background: colors.status.todo, padding: '2px 8px', borderRadius: 10 }}>{s.status}</span>
                </div>
              ))
            ) : (
              <div style={{ color: colors.text.secondary }}>No subtasks linked.</div>
            )}
          </Section>

          {/* Attachments Section */}
          <Section ref={el => sectionRefs.current['attachments'] = el}>
            <SectionTitle>Attachments</SectionTitle>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {attachments.map(att => (
                <div key={att.id} style={{ width: 150, border: `1px solid ${colors.border.light}`, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {att.isImage ?
                      <img src={`https://ayphen-pm-toll-latest.onrender.com/uploads/thumbnails/${att.fileName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <Section ref={el => sectionRefs.current['activity'] = el}>
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
        onSuccess={() => { loadSubtasks(issue.id); }}
        defaultType="subtask"
        defaultValues={{ parentId: issue.id, parentIssue: issue.id }}
      />

      <IssueLinkModal
        open={linkModalVisible}
        onClose={() => setLinkModalVisible(false)}
        issueId={issue.id}
        onSuccess={() => message.success('Issue linked')}
      />

    </LayoutContainer>
  );
};
