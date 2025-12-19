import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Tag, Button, Progress } from 'antd';
import { ArrowLeftOutlined, BugOutlined, FileTextOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

export default function ProjectDetailView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [epics, setEpics] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    loadProject();
    loadEpics();
    loadWorkflow();
    loadIssues();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadEpics = async () => {
    try {
      const res = await api.get('/epics', { params: { projectId } });
      setEpics(res.data || []);
    } catch (error) {
      console.error('Failed to load epics:', error);
    }
  };

  const loadWorkflow = async () => {
    try {
      const projRes = await api.get(`/projects/${projectId}`);
      const wfId = projRes.data.workflowId || 'workflow-1';
      const wfRes = await api.get(`/workflows/${wfId}`);
      setWorkflowStatuses(wfRes.data.statuses || []);
    } catch (e) {
      console.error('Failed to load workflow:', e);
    }
  };

  const loadIssues = async () => {
    try {
      const res = await api.get('/issues', { params: { projectId } });
      setIssues(res.data || []);
    } catch (error) {
      console.error('Failed to load issues:', error);
    }
  };

  const getEpicProgress = (epic: any) => {
    if (!epic.childIssues || epic.childIssues.length === 0) return 0;
    const doneStatuses = workflowStatuses.filter(s => s.category === 'DONE').map(s => s.id);
    const completed = epic.childIssues.filter((i: any) => {
      if (doneStatuses.length > 0) return doneStatuses.includes(i.status);
      return i.status === 'done' || i.status === 'resolved';
    }).length;
    return Math.round((completed / epic.childIssues.length) * 100);
  };

  if (!project) return <Container>Loading...</Container>;

  return (
    <Container>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} />
        <h1 style={{ marginLeft: 16 }}>{project.name}</h1>
      </div>

      <Tabs activeKey={String(tab)} onChange={(key) => setTab(Number(key))} style={{ marginBottom: 24 }}>
        <Tabs.TabPane tab="Overview" key="0" />
        <Tabs.TabPane tab="Epics" key="1" />
        <Tabs.TabPane tab="Issues" key="2" />
        <Tabs.TabPane tab="Test Cases" key="3" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <h3>Project Details</h3>
          <p>{project.description}</p>
          <Tag>{project.type}</Tag>
        </Card>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>Epics ({epics.length})</h3>
            <Button type="primary" onClick={() => navigate('/epics/create')}>Create Epic</Button>
          </div>
          {epics.map((epic: any) => (
            <Card key={epic.id} style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => navigate(`/epic/${epic.id}`)}>
              <h4>{epic.summary}</h4>
              <p>{epic.description}</p>
              <Tag>{epic.status}</Tag>
              <Tag>{epic.childIssues?.length || 0} issues</Tag>
              <Progress percent={getEpicProgress(epic)} />
            </Card>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div>
          <h3>All Issues</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Card onClick={() => navigate('/stories')}>
              <FileTextOutlined style={{ fontSize: 24 }} />
              <h4>User Stories</h4>
              <h2>{issues.filter(i => i.type === 'story').length}</h2>
            </Card>
            <Card onClick={() => navigate('/bugs')}>
              <BugOutlined style={{ fontSize: 24 }} />
              <h4>Bugs</h4>
              <h2>{issues.filter(i => i.type === 'bug').length}</h2>
            </Card>
            <Card onClick={() => navigate('/board')}>
              <CheckSquareOutlined style={{ fontSize: 24 }} />
              <h4>Tasks</h4>
              <h2>{issues.filter(i => i.type === 'task').length}</h2>
            </Card>
            <Card onClick={() => navigate('/board')}>
              <FileTextOutlined style={{ fontSize: 24 }} />
              <h4>Subtasks</h4>
              <h2>{issues.filter(i => i.parentId).length}</h2>
            </Card>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>Test Cases</h3>
            <Button type="primary" onClick={() => navigate('/test-cases')}>View All Test Cases</Button>
          </div>
          <Card>
            <p>Manage manual test cases and test suites for this project</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button onClick={() => navigate('/test-cases')}>Test Cases</Button>
              <Button onClick={() => navigate('/test-suites')}>Test Suites</Button>
              <Button onClick={() => navigate('/test-runs')}>Test Runs</Button>
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
