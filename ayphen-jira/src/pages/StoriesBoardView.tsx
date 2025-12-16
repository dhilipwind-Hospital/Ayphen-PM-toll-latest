import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, Tag, Avatar, Progress, Button, Empty } from 'antd';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CreateIssueModal } from '../components/CreateIssueModal';

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
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

const BoardContainer = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
`;

const Column = styled.div`
  min-width: 300px;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 16px;
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #d9d9d9;
`;

const ColumnTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
`;

const StoryCard = styled(Card)`
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
`;

const StoryKey = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;

const StorySummary = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
`;

const StoryMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

const StoryPoints = styled.div`
  background: #0EA5E9;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

export const StoriesBoardView: React.FC = () => {
  const navigate = useNavigate();
  const { issues } = useStore();
  const [stories, setStories] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    // Filter to get only user stories
    const userStories = issues.filter(issue => issue.type === 'story');
    setStories(userStories);
  }, [issues]);

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress' },
    { id: 'in-review', title: 'In Review', status: 'in-review' },
    { id: 'done', title: 'Done', status: 'done' },
  ];

  const getStoriesByStatus = (status: string) => {
    return stories.filter(story => story.status === status);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'highest': 'red',
      'high': 'orange',
      'medium': 'blue',
      'low': 'green',
      'lowest': 'default',
    };
    return colors[priority] || 'default';
  };

  return (
    <Container>
      <Header>
        <Title>📊 Story Board</Title>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Story
        </Button>
      </Header>

      <BoardContainer>
        {columns.map(column => {
          const columnStories = getStoriesByStatus(column.status);
          
          return (
            <Column key={column.id}>
              <ColumnHeader>
                <ColumnTitle>{column.title}</ColumnTitle>
                <Tag>{columnStories.length}</Tag>
              </ColumnHeader>

              {columnStories.length === 0 ? (
                <Empty
                  description="No stories"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                columnStories.map(story => (
                  <StoryCard
                    key={story.id}
                    size="small"
                    onClick={() => navigate(`/issue/${story.key}`)}
                  >
                    <StoryKey>{story.key}</StoryKey>
                    <StorySummary>{story.summary}</StorySummary>
                    
                    {story.epic && (
                      <Tag color="purple" style={{ marginBottom: 8 }}>
                        {story.epic.name}
                      </Tag>
                    )}
                    
                    <Tag color={getPriorityColor(story.priority)}>
                      {story.priority?.toUpperCase()}
                    </Tag>

                    <StoryMeta>
                      <Avatar size="small" src={story.assignee?.avatar}>
                        {story.assignee?.name?.charAt(0) || 'U'}
                      </Avatar>
                      {story.storyPoints && (
                        <StoryPoints>{story.storyPoints} pts</StoryPoints>
                      )}
                    </StoryMeta>
                  </StoryCard>
                ))
              )}
            </Column>
          );
        })}
      </BoardContainer>

      <CreateIssueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
        }}
        defaultType="story"
      />
    </Container>
  );
};
