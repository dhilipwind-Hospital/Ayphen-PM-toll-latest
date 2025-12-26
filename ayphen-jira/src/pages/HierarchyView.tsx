import React, { useEffect, useState } from 'react';
import { Tree, Card, Spin, Tag, Empty, Button } from 'antd';
import { useStore } from '../store/useStore';
import { issuesApi, workflowsApi } from '../services/api';
import type { Issue } from '../types';
import styled from 'styled-components';
import {
  FolderOpen, Flag, FileText, Bug, CheckSquare,
  ChevronRight, ChevronDown
} from 'lucide-react';

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 56px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TreeContainer = styled(Card)`
  min-height: 500px;
  
  .ant-tree-node-content-wrapper {
    padding: 8px 0;
  }
`;

const NodeTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const IssueKey = styled.span`
  color: #666;
  font-size: 12px;
  min-width: 60px;
`;

const IssueSummary = styled.span`
  font-weight: 500;
  flex: 1;
`;

export default function HierarchyView() {
  const { currentProject, isInitialized } = useStore();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);

  useEffect(() => {
    if (currentProject) {
      loadIssues();
      loadWorkflow();
    }
  }, [currentProject]);

  const loadIssues = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const response = await issuesApi.getByProject(currentProject.id);
      setIssues(response.data);
      // buildTree is called after workflow is also loaded for correct coloring
      if (workflowStatuses.length > 0) {
        buildTree(response.data, workflowStatuses);
      } else {
        // Fallback for first load if workflow isn't ready
        buildTree(response.data, []);
      }
    } catch (error) {
      console.error('Failed to load issues hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflow = async () => {
    if (!currentProject) return;
    try {
      const res = await workflowsApi.getById(currentProject.workflowId || 'workflow-1');
      setWorkflowStatuses(res.data.statuses || []);
    } catch (e) {
      console.error('Failed to load workflow', e);
    }
  };

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  // Trigger rebuild when workflow statuses load
  useEffect(() => {
    if (issues.length > 0 && workflowStatuses.length > 0) {
      buildTree(issues, workflowStatuses);
    }
  }, [workflowStatuses, issues]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'epic': return <Flag size={16} color="#9024fa" />;
      case 'story': return <FileText size={16} color="#4bade8" />;
      case 'bug': return <Bug size={16} color="#e34935" />;
      case 'subtask': return <CheckSquare size={16} color="#4faeef" />;
      default: return <FileText size={16} />;
    }
  };

  const getStatusColor = (status: string, wfStatuses: any[]) => {
    const matched = wfStatuses.find(s => s.id === status);
    if (matched) {
      switch (matched.category) {
        case 'DONE': return 'green';
        case 'IN_PROGRESS': return 'blue';
        case 'TODO': return 'default';
        default: return 'default';
      }
    }
    switch (status) {
      case 'done': return 'green';
      case 'in-progress': return 'blue';
      case 'in-review': return 'orange';
      default: return 'default';
    }
  };

  const buildTree = (allIssues: Issue[], wfStatuses: any[]) => {
    // 1. Find all Epics
    const epics = allIssues.filter(i => i.type === 'epic');

    // 2. Find Issues without Epic (Orphans) and not Subtasks
    const orphans = allIssues.filter(i =>
      i.type !== 'epic' &&
      i.type !== 'subtask' &&
      (!i.epicLink || i.epicLink === '')
    );

    const mapIssueToNode = (issue: Issue) => {
      // Find children
      let children: Issue[] = [];

      if (issue.type === 'epic') {
        // Epic children are linked via epicLink
        children = allIssues.filter(i =>
          (i.epicLink === issue.key || i.epicLink === issue.id) &&
          i.type !== 'subtask'
        );
      } else {
        // Story/Task children are subtasks
        children = allIssues.filter(i => i.parentId === issue.id);
      }

      const node: any = {
        title: (
          <NodeTitle>
            {getIcon(issue.type)}
            <IssueKey>{issue.key}</IssueKey>
            <IssueSummary>{issue.summary}</IssueSummary>
            <Tag color={getStatusColor(issue.status, wfStatuses)}>{issue.status.toUpperCase()}</Tag>
            <span style={{ fontSize: 12, color: '#999' }}>{issue.assignee?.name || 'Unassigned'}</span>
          </NodeTitle>
        ),
        key: issue.id,
        isLeaf: children.length === 0,
      };

      if (children.length > 0) {
        node.children = children.map(mapIssueToNode);
      }

      return node;
    };

    const tree = [
      ...epics.map(mapIssueToNode),
      ...orphans.map(mapIssueToNode) // Append orphans at root
    ];

    setTreeData(tree);
  };

  if (!currentProject) {
    return (
      <Container>
        <Empty description="Please select a project" />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FolderOpen size={24} color="#0052cc" />
          Hierarchy - {currentProject.name}
        </Title>
        <Button onClick={loadIssues} loading={loading}>Refresh</Button>
      </Header>

      <TreeContainer>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : treeData.length > 0 ? (
          <Tree
            showLine={{ showLeafIcon: false }}
            showIcon={false}
            defaultExpandAll
            treeData={treeData}
            titleRender={(node: any) => node.title}
            switcherIcon={<ChevronDown size={14} />}
          />
        ) : (
          <Empty description="No nested issues found" />
        )}
      </TreeContainer>
    </Container>
  );
}
