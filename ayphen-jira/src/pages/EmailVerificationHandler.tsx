import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Typography, Card, Spin, Result } from 'antd';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';

const { Title, Text } = Typography;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 500px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  animation: ${fadeIn} 0.6s ease-out;

  .ant-card-body {
    padding: 48px 32px;
    text-align: center;
  }
`;

const API_URL = import.meta.env.VITE_API_URL || 'https://ayphen-pm-toll-latest.onrender.com/api';

export const EmailVerificationHandler: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await axios.post(`${API_URL}/auth/verify-email`, { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <PageContainer>
      <StyledCard bordered={false}>
        {status === 'loading' && (
          <>
            <Spin size="large" />
            <Title level={3} style={{ marginTop: 24 }}>
              Verifying your email...
            </Title>
            <Text type="secondary">Please wait a moment</Text>
          </>
        )}

        {status === 'success' && (
          <Result
            icon={<CheckCircle size={72} color="#10b981" />}
            title="Email Verified!"
            subTitle={message}
            extra={[
              <Button
                key="login"
                type="primary"
                size="large"
                icon={<ArrowRight size={18} />}
                onClick={() => navigate('/login')}
                style={{
                  borderRadius: '12px',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                Go to Login
              </Button>,
            ]}
          />
        )}

        {status === 'error' && (
          <Result
            icon={<XCircle size={72} color="#ef4444" />}
            status="error"
            title="Verification Failed"
            subTitle={message}
            extra={[
              <Button
                key="retry"
                type="primary"
                size="large"
                onClick={() => navigate('/verify-email')}
                style={{
                  borderRadius: '12px',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                Request New Link
              </Button>,
              <Button
                key="login"
                type="link"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>,
            ]}
          />
        )}
      </StyledCard>
    </PageContainer>
  );
};

export default EmailVerificationHandler;
