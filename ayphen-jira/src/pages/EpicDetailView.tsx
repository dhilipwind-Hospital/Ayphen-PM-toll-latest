import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IssueDetailPanel } from '../components/IssueDetail/IssueDetailPanel';
import { Button, Result } from 'antd';
import styled from 'styled-components';

const Container = styled.div`
  height: 100vh;
  overflow: hidden;
`;

/**
 * EpicDetailView - Now uses the same IssueDetailPanel as User Stories/Bugs/Tasks
 * 
 * This provides consistent UI across all issue types with:
 * - Same layout and styling
 * - Same sidebar with AI actions, time tracking, dates
 * - Same comment system with edit/delete/attachments
 * - Same breadcrumbs and navigation
 * 
 * The IssueDetailPanel handles epic-specific features like:
 * - "Child Issues" instead of "Subtasks"
 * - Epic Link dropdown is hidden for epics
 */
export const EpicDetailView: React.FC = () => {
  const { epicId } = useParams<{ epicId: string }>();
  const navigate = useNavigate();

  if (!epicId) {
    return (
      <Result
        status="404"
        title="Epic Not Found"
        subTitle="Sorry, the epic key is missing."
        extra={<Button type="primary" onClick={() => navigate('/epics')}>Back to Epics</Button>}
      />
    );
  }

  return (
    <Container>
      <IssueDetailPanel
        issueKey={epicId}
        onClose={() => navigate(-1)}
      />
    </Container>
  );
};
