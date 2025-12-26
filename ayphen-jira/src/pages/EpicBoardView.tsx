import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, Tag, Progress, Button, message, Spin } from 'antd';
import { Plus, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import axios from 'axios';
import { ENV } from '../config/env';

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
  background: white;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BoardContainer = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
`;

const Column = styled.div`
  min-width: 300px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
`;

const ColumnHeader = styled.div`
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EpicCard = styled(Card)`
  margin-bottom: 12px;
  cursor: pointer;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const API_URL = ENV.API_URL;

const statusColumns = [
  { id: 'todo', name: 'To Do', color: '#d9d9d9' },
  { id: 'in-progress', name: 'In Progress', color: '#1890ff' },
  { id: 'in-review', name: 'In Review', color: '#faad14' },
  { id: 'done', name: 'Done', color: '#52c41a' },
];

export const EpicBoardView: React.FC = () => {
  const { currentProject, isInitialized } = useStore();
  const [loading, setLoading] = useState(false);
  const [epics, setEpics] = useState<any[]>([]);
  
  useEffect(() => {
    if (currentProject) {
      loadEpics();
    }
  }, [currentProject?.id]);
  
  const loadEpics = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`${API_URL}/epics?projectId=${currentProject.id}&userId=${userId}`);
      setEpics(response.data);
    } catch (error) {
      console.error('Failed to load epics:', error);
      message.error('Failed to load epics');
    } finally {
      setLoading(false);
    }
  };
  
  const getEpicsByStatus = (status: string) => {
    return epics.filter(epic => epic.status === status);
  };
  
  if (loading) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <Title>
          <TrendingUp size={28} color="#1890ff" />
          Epic Board
        </Title>
        <Button type="primary" icon={<Plus size={16} />}>
          Create Epic
        </Button>
      </Header>
      
      <BoardContainer>
        {statusColumns.map(column => {
          const columnEpics = getEpicsByStatus(column.id);
          
          return (
            <Column key={column.id}>
              <ColumnHeader>
                <span>{column.name}</span>
                <Tag color={column.color}>{columnEpics.length}</Tag>
              </ColumnHeader>
              
              {columnEpics.map(epic => (
                <EpicCard 
                  key={epic.id}
                  size="small"
                  onClick={() => window.location.href = `/epic/${epic.id}`}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Tag color="purple">{epic.key}</Tag>
                  </div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>
                    {epic.summary}
                  </div>
                  <Progress 
                    percent={epic.progress} 
                    size="small" 
                    status="active"
                    strokeColor={column.color}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    {epic.completedCount} / {epic.childCount} issues
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {epic.completedPoints} / {epic.totalPoints} points
                  </div>
                </EpicCard>
              ))}
            </Column>
          );
        })}
      </BoardContainer>
    </Container>
  );
};
