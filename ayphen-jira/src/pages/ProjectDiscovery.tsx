import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Input, message, Spin } from 'antd';
import { SearchOutlined, TeamOutlined, EyeOutlined, GlobalOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #8c8c8c;
  margin: 0;
`;

const SearchBar = styled(Input.Search)`
  max-width: 600px;
  margin-bottom: 24px;
  
  .ant-input {
    font-size: 16px;
    padding: 12px 16px;
  }
`;

const ProjectCard = styled(Card)`
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 12px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

const ProjectDescription = styled.p`
  min-height: 60px;
  color: #595959;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: #8c8c8c;
  font-size: 14px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
  
  .icon {
    font-size: 64px;
    color: #bfbfbf;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 20px;
    color: #595959;
    margin-bottom: 8px;
  }
  
  p {
    color: #8c8c8c;
  }
`;

export const ProjectDiscoveryPage: React.FC = () => {
  const [publicProjects, setPublicProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadPublicProjects();
  }, []);

  const loadPublicProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects/public');
      setPublicProjects(response.data || []);
    } catch (error) {
      message.error('Failed to load public projects');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProject = async (projectId: string) => {
    if (!userId) {
      message.error('Please login to join projects');
      return;
    }

    setJoiningId(projectId);
    try {
      await api.post(`/projects/${projectId}/join`, {
        userId,
      });
      message.success('Joined project successfully!');
      loadPublicProjects();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to join project');
    } finally {
      setJoiningId(null);
    }
  };

  const filteredProjects = publicProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <Title><GlobalOutlined /> Discover Public Projects</Title>
        <Subtitle>Find and join public projects that interest you</Subtitle>
      </Header>

      <SearchBar
        placeholder="Search projects by name, description, or category..."
        prefix={<SearchOutlined />}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="large"
        allowClear
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredProjects.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredProjects.map((project) => (
            <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
              <ProjectCard
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {project.name}
                  </div>
                }
                extra={<Tag color="green">Public</Tag>}
                actions={[
                  <Button
                    key="join"
                    type="primary"
                    icon={<TeamOutlined />}
                    onClick={() => handleJoinProject(project.id)}
                    loading={joiningId === project.id}
                    block
                  >
                    Join Project
                  </Button>,
                ]}
              >
                <ProjectDescription>
                  {project.description || 'No description available'}
                </ProjectDescription>

                <MetaInfo>
                  <span>
                    <EyeOutlined /> {project.type || 'scrum'}
                  </span>
                  {project.category && (
                    <Tag color="blue">{project.category}</Tag>
                  )}
                </MetaInfo>
              </ProjectCard>
            </Col>
          ))}
        </Row>
      ) : (
        <EmptyState>
          <div className="icon">
            <GlobalOutlined />
          </div>
          <h3>No Public Projects Found</h3>
          <p>
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'There are no public projects available at the moment'}
          </p>
        </EmptyState>
      )}
    </Container>
  );
};
