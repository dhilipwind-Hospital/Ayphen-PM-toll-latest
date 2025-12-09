import { useNavigate } from 'react-router-dom';
import { Card, Tag } from 'antd';
import { FolderOpen, Flag, FileText, Bug, CheckSquare, List, Beaker, ArrowDown } from 'lucide-react';
import styled from 'styled-components';

interface HierarchyFlowProps {
  projectId?: string;
  epicId?: string;
}

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 32px;
  font-weight: 600;
`;

const FlowContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const LevelCard = styled(Card)<{ $color: string }>`
  width: 400px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid ${props => props.$color};
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
`;

const IconWrapper = styled.div<{ $color: string }>`
  color: ${props => props.$color};
`;

const TextContent = styled.div`
  flex: 1;
`;

const LevelTitle = styled.h3<{ $color: string }>`
  margin: 0 0 4px 0;
  font-weight: 600;
  color: ${props => props.$color};
`;

const Description = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
`;

const RelationshipsBox = styled.div`
  margin-top: 32px;
  padding: 24px;
  background: #f5f5f5;
  border-radius: 8px;
`;

export default function ProjectHierarchyFlow({ projectId, epicId }: HierarchyFlowProps) {
  const navigate = useNavigate();

  const levels = [
    { icon: <FolderOpen size={40} />, title: 'Project', description: 'Top-level container', color: '#1976d2', route: '/projects' },
    { icon: <Flag size={40} />, title: 'Epic', description: 'Large body of work', color: '#9c27b0', route: '/epics' },
    { icon: <FileText size={32} />, title: 'User Story', description: 'Feature from user perspective', color: '#2e7d32', route: '/stories' },
    { icon: <Bug size={32} />, title: 'Bug', description: 'Issue that needs fixing', color: '#d32f2f', route: '/bugs' },
    { icon: <CheckSquare size={32} />, title: 'Task', description: 'Work item to be completed', color: '#0288d1', route: '/board' },
    { icon: <List size={28} />, title: 'Subtask', description: 'Smaller piece of work', color: '#f57c00', route: '/board' },
    { icon: <Beaker size={32} />, title: 'Test Case', description: 'Manual test', color: '#6a1b9a', route: '/test-cases' }
  ];

  return (
    <Container>
      <Title>Project Hierarchy Flow</Title>
      <FlowContainer>
        {levels.map((level, index) => (
          <div key={level.title}>
            <LevelCard $color={level.color} onClick={() => navigate(level.route)}>
              <CardContent>
                <IconWrapper $color={level.color}>{level.icon}</IconWrapper>
                <TextContent>
                  <LevelTitle $color={level.color}>{level.title}</LevelTitle>
                  <Description>{level.description}</Description>
                </TextContent>
              </CardContent>
            </LevelCard>
            {index < levels.length - 1 && <ArrowDown size={24} color="#999" />}
          </div>
        ))}
      </FlowContainer>
      <RelationshipsBox>
        <h3>Hierarchy Relationships</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Tag color="blue">Project → Epics</Tag>
          <Tag color="purple">Epic → Stories, Bugs, Tasks</Tag>
          <Tag color="green">Story/Task → Subtasks</Tag>
          <Tag color="orange">Epic/Story → Test Cases</Tag>
        </div>
      </RelationshipsBox>
    </Container>
  );
}
