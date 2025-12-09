import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LockOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const ResultCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  text-align: center;
`;

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <ResultCard>
        <Result
          status="403"
          icon={<LockOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
          title={<h2 style={{ fontSize: 32, marginTop: 16 }}>Access Denied</h2>}
          subTitle={
            <p style={{ fontSize: 16, color: '#8c8c8c', marginTop: 16 }}>
              Sorry, you don't have permission to access this project.<br />
              Contact the project administrator to request access.
            </p>
          }
          extra={[
            <Button 
              type="primary" 
              key="home" 
              size="large"
              onClick={() => navigate('/')}
              style={{ marginRight: 8 }}
            >
              Go Home
            </Button>,
            <Button 
              key="projects" 
              size="large"
              onClick={() => navigate('/projects')}
            >
              View My Projects
            </Button>,
          ]}
        />
      </ResultCard>
    </Container>
  );
};
