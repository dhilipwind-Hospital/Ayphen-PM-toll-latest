import React from 'react';
import { Button, Typography, Card, Space, message } from 'antd';
import { Mail, RefreshCw, ArrowRight } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8500/api';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0) 70%);
    top: -100px;
    right: -100px;
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(236,72,153,0) 70%);
    bottom: -50px;
    left: -50px;
    border-radius: 50%;
  }
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 500px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  animation: ${fadeIn} 0.6s ease-out;

  .ant-card-body {
    padding: 48px 32px;
    text-align: center;
  }
`;

const IconContainer = styled.div`
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
  color: white;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
  animation: ${float} 3s ease-in-out infinite;
`;

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [resending, setResending] = React.useState(false);
  
  // Get email from location state (passed from registration) or fallback to user email
  const email = (location.state as any)?.email || user?.email;

  const handleResend = async () => {
    if (!email) {
      message.error('Email address not found');
      return;
    }

    setResending(true);
    try {
      await axios.post(`${API_URL}/auth/resend-verification`, { email });
      message.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <PageContainer>
      <StyledCard bordered={false}>
        <IconContainer>
          <Mail size={48} strokeWidth={1.5} />
        </IconContainer>
        
        <Title level={2} style={{ marginBottom: 16, color: '#111827' }}>
          Check your inbox
        </Title>
        
        <Paragraph style={{ fontSize: '16px', color: '#6b7280', marginBottom: 8 }}>
          We've sent a verification link to
        </Paragraph>
        
        <Text strong style={{ fontSize: '18px', color: '#1e40af', display: 'block', marginBottom: 32 }}>
          {email || 'your@email.com'}
        </Text>
        
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: 32, border: '1px solid #e2e8f0' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Didn't receive the email? Check your spam folder or try resending.
          </Text>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            size="large" 
            icon={<RefreshCw size={18} className={resending ? 'spin' : ''} />}
            onClick={handleResend}
            loading={resending}
            style={{ 
              width: '100%', 
              height: '48px', 
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
          
          <Button 
            type="link" 
            onClick={() => navigate('/dashboard')}
            style={{ color: '#6b7280' }}
          >
            Back to Dashboard (Testing Mode)
          </Button>

          <Button 
            type="text" 
            onClick={logout}
            style={{ color: '#ef4444' }}
          >
            Logout
          </Button>
        </Space>
      </StyledCard>
    </PageContainer>
  );
};

export default VerifyEmailPage;
