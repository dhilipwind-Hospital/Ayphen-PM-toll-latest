import React from 'react';
import styled from 'styled-components';
import { Settings } from 'lucide-react';
import { colors } from '../theme/colors';
import type { Project } from '../types';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid ${colors.border.light};
  margin-bottom: 24px;
`;

const ProjectInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ProjectAvatar = styled.div`
  width: 48px;
  height: 48px;
  background: #1890ff;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
`;

const ProjectDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProjectName = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const ProjectType = styled.span`
  font-size: 13px;
  color: ${colors.text.secondary};
`;

const SettingsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid ${colors.border.light};
  border-radius: 4px;
  cursor: pointer;
  color: ${colors.text.secondary};
  transition: all 0.2s;
  
  &:hover {
    background: ${colors.background.hover};
    border-color: ${colors.border.main};
    color: ${colors.text.primary};
  }
`;

interface ProjectHeaderProps {
  project: Project;
  onSettingsClick?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onSettingsClick,
}) => {
  return (
    <HeaderContainer>
      <ProjectInfo>
        <ProjectAvatar>
          {project.key.substring(0, 3)}
        </ProjectAvatar>
        <ProjectDetails>
          <ProjectName>{project.name}</ProjectName>
          <ProjectType>Scrum Project</ProjectType>
        </ProjectDetails>
      </ProjectInfo>
      <SettingsButton onClick={onSettingsClick}>
        <Settings size={18} />
      </SettingsButton>
    </HeaderContainer>
  );
};
