import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IssueDetailPanel } from '../components/IssueDetail/IssueDetailPanel';
import { Button, Result } from 'antd';
import styled from 'styled-components';

const Container = styled.div`
  height: 100vh;
  overflow: hidden;
`;

export const IssueDetailView: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const navigate = useNavigate();

  if (!issueKey) {
    return (
      <Result
        status="404"
        title="Issue Not Found"
        subTitle="Sorry, the issue key is missing."
        extra={<Button type="primary" onClick={() => navigate('/board')}>Back to Board</Button>}
      />
    );
  }

  return (
    <Container>
      <IssueDetailPanel
        issueKey={issueKey}
        onClose={() => navigate(-1)}
      />
    </Container>
  );
};
