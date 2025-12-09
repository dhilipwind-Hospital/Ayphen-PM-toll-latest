import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Row, Col, Button, Tag, Avatar } from 'antd';
import { Star, Settings, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';

const Container = styled.div`
  padding: 24px;
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
`;

const ProjectCard = styled(Card)`
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${colors.primary[400]};
  }
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ProjectAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: ${colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const ProjectName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text.primary};
  flex: 1;
`;

export const ProjectsView: React.FC = () => {
  const navigate = useNavigate();
  const { projects, issues, setCurrentProject } = useStore();

  return (
    <Container>
      <Header>
        <Title>Projects ({projects.length})</Title>
        <Button 
          type="primary" 
          onClick={() => navigate('/projects/create')}
        >
          <Plus size={16} style={{ marginRight: 8 }} />
          Create Project
        </Button>
      </Header>

      <Row gutter={[16, 16]}>
        {projects.map(project => {
          const projectIssues = issues.filter(i => i.projectId === project.id);
          const completed = projectIssues.filter(i => i.status === 'done').length;
          
          return (
            <Col key={project.id} xs={24} sm={12} md={8} lg={6}>
              <ProjectCard onClick={() => {
                setCurrentProject(project);
                localStorage.setItem('lastProjectId', project.id);
                navigate('/board');
              }}>
                <ProjectHeader>
                  <ProjectAvatar>{project.key}</ProjectAvatar>
                  <ProjectName>{project.name}</ProjectName>
                  {project.isStarred && (
                    <Star size={16} fill={colors.status.warning.main} color={colors.status.warning.main} />
                  )}
                </ProjectHeader>
                <div style={{ marginBottom: 12, color: colors.text.secondary, fontSize: 13 }}>
                  {project.description || 'No description'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Tag color="blue">{project.type}</Tag>
                  <Tag>{project.category}</Tag>
                </div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>
                  {projectIssues.length} issues • {completed} completed
                </div>
                {project.lead && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size="small" style={{ background: colors.primary[500] }}>
                      {project.lead.name.charAt(0)}
                    </Avatar>
                    <span style={{ fontSize: 13 }}>{project.lead.name}</span>
                  </div>
                )}
              </ProjectCard>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};
