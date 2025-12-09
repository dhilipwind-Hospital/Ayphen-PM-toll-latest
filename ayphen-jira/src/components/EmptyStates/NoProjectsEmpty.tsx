import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 48px 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin: 24px;
`;

const EmptyImage = styled.div`
  font-size: 120px;
  color: #bfbfbf;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const EmptyTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 16px 0 8px 0;
`;

const EmptyDescription = styled.p`
  color: #8c8c8c;
  font-size: 16px;
  max-width: 400px;
  text-align: center;
  line-height: 1.6;
`;

interface NoProjectsEmptyProps {
  onCreateClick: () => void;
}

export const NoProjectsEmpty: React.FC<NoProjectsEmptyProps> = ({ onCreateClick }) => {
  return (
    <EmptyContainer>
      <EmptyImage>
        <FolderOpenOutlined />
      </EmptyImage>
      <Empty
        description={
          <div>
            <EmptyTitle>No Projects Yet</EmptyTitle>
            <EmptyDescription>
              Create your first project to start tracking issues and managing your team's work
            </EmptyDescription>
          </div>
        }
      >
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={onCreateClick}
        >
          Create Your First Project
        </Button>
      </Empty>
    </EmptyContainer>
  );
};
