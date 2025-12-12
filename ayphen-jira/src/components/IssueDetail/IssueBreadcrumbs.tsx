import React, { useState, useEffect } from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined, FolderOutlined, FileTextOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { issuesApi } from '../../services/api';

const BreadcrumbContainer = styled.div`
  padding: 0;
  
  .ant-breadcrumb {
    font-size: 14px;
  }
  
  .ant-breadcrumb-link {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #6B7280;
    transition: color 0.2s;
    
    &:hover {
      color: #EC4899;
    }
  }
  
  .ant-breadcrumb-separator {
    color: #D1D5DB;
  }
`;

const TruncatedSpan = styled.span`
  display: inline-block;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CurrentIssueText = styled.span`
  font-weight: 600;
  color: #1F2937;
  display: inline-block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface IssueBreadcrumbsProps {
  issue: any;
  project?: any;
}

export const IssueBreadcrumbs: React.FC<IssueBreadcrumbsProps> = ({ issue, project }) => {
  const [epicIssue, setEpicIssue] = useState<any>(null);
  const [parentIssue, setParentIssue] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHierarchy();
  }, [issue.epicLink, issue.parentId]);

  const loadHierarchy = async () => {
    setLoading(true);
    try {
      // Load epic if exists
      if (issue.epicLink) {
        // Since we don't have a direct getByLink or similar, and getAll might be heavy, 
        // usually we would use getById if epicLink is an ID. 
        // If epicLink is a Key, we use getByKey.
        // Based on typical Jira, epicLink might be an ID or Key. 
        // The plan code suggested getting all issues for project and finding. 
        // But checking api.ts, we have getById and getByKey.
        // Let's assume epicLink is an ID for now as per plan logic "const epic = epicRes.data.find((i: any) => i.key === issue.epicLink);"
        // Wait, if issue.epicLink is a KEY, then "i.key === issue.epicLink" makes sense.
        // But usually links are IDs in databases.
        // Let's stick to the plan's approach but optimize if possible.
        // The plan uses: const epicRes = await issuesApi.getAll({ projectId: issue.projectId });
        // This seems inefficient if there are many issues.
        // If epicLink is stored as ID in database, we should use getById.
        // If it is stored as Key, we use getByKey.
        // Let's look at IssueDetailPanel.tsx to see how epicLink is used.
        // Line 477: api/epics/${issue.epicLink}/link/${issue.id}
        // It seems issue.epicLink might be an ID.
        // But the plan says: const epic = epicRes.data.find((i: any) => i.key === issue.epicLink);
        // This implies issue.epicLink is a Key string (e.g., 'PROJ-123').
        // I will try to use getByKey if it looks like a key, or getById if it looks like an ID.
        // Or better, if issue.epicLink is a key, use getByKey.
        
        // Actually, looking at IssueDetailPanel.tsx line 473: <Tag color="purple">{issue.epicKey}</Tag>
        // and line 469: {issue.epicKey && ...}
        // It seems we have issue.epicKey. 
        // If we have issue.epicKey, we can just fetch that.
        
        if (issue.epicKey) {
             const res = await issuesApi.getByKey(issue.epicKey);
             setEpicIssue(res.data);
        } else if (issue.epicLink) {
            // Fallback to plan's method or getById
             const userId = localStorage.getItem('userId');
             const res = await issuesApi.getAll({ projectId: issue.projectId, userId: userId || undefined });
             const epic = res.data.find((i: any) => i.key === issue.epicLink || i.id === issue.epicLink);
             setEpicIssue(epic);
        }
      }

      // Load parent if exists
      if (issue.parentId) {
        const parentRes = await issuesApi.getById(issue.parentId);
        setParentIssue(parentRes.data);
      }
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [];

  // 1. Project (always first)
  if (project) {
    breadcrumbs.push({
      key: 'project',
      title: (
        <Link to={`/projects/${project.id}`}>
          <HomeOutlined />
          <span>{project.name}</span>
        </Link>
      ),
    });
  }

  // 2. Epic (if linked)
  if (epicIssue) {
    breadcrumbs.push({
      key: 'epic',
      title: (
        <Link to={`/issue/${epicIssue.key}`}>
          <FolderOutlined />
          <span>{epicIssue.key}: {epicIssue.summary}</span>
        </Link>
      ),
    });
  }

  // 3. Parent Issue (if exists - for subtasks)
  if (parentIssue) {
    breadcrumbs.push({
      key: 'parent',
      title: (
        <Link to={`/issue/${parentIssue.key}`}>
          <FileTextOutlined />
          <span>{parentIssue.key}: {parentIssue.summary}</span>
        </Link>
      ),
    });
  }

  // Note: Current issue is NOT shown in breadcrumb
  // It will be displayed in the main content area instead

  return (
    <BreadcrumbContainer>
      <Breadcrumb items={breadcrumbs} />
    </BreadcrumbContainer>
  );
};
