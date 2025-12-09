import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import styled from 'styled-components';
import { useStore } from '../store/useStore';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
  gap: 16px;
`;

interface ProjectGuardProps {
  children: React.ReactNode;
}

export const ProjectGuard: React.FC<ProjectGuardProps> = ({ children }) => {
  const { currentProject, projects } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      message.warning('Please select a project first');
      navigate('/projects');
    }
  }, [currentProject, projects, navigate]);

  if (projects.length === 0) {
    return (
      <LoadingContainer>
        <Spin size="large" />
        <p>Loading projects...</p>
      </LoadingContainer>
    );
  }

  if (!currentProject) {
    return (
      <LoadingContainer>
        <Spin size="large" />
        <p>Redirecting to projects...</p>
      </LoadingContainer>
    );
  }

  return <>{children}</>;
};
