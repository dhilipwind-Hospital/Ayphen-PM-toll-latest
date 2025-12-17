import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Input, Button, message, Card } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import axios from 'axios';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 450px;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1890ff;
    margin: 0;
  }
  
  p {
    color: #8c8c8c;
    margin-top: 8px;
  }
`;

const SuccessMessage = styled.div`
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
  color: #52c41a;
`;

export const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/auth/forgot-password', {
        email: values.email,
      });
      setEmailSent(true);
      message.success('Reset link sent! Check your email.');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <StyledCard>
        <Logo>
          <img
            src="/ayphen-logo-new.png"
            alt="Ayphen Technologies"
            style={{
              width: '200px',
              display: 'block',
              margin: '0 auto 16px auto'
            }}
          />
          <p>Forgot Password</p>
        </Logo>

        {emailSent ? (
          <>
            <SuccessMessage>
              <strong>Email Sent!</strong>
              <p style={{ margin: '8px 0 0' }}>
                If an account exists with that email, you will receive a password reset link shortly.
              </p>
            </SuccessMessage>
            <Button type="primary" block onClick={() => window.location.href = '/login'}>
              Back to Login
            </Button>
          </>
        ) : (
          <>
            <p style={{ marginBottom: 24, textAlign: 'center', color: '#8c8c8c' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email address"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ marginBottom: 16 }}
                >
                  Send Reset Link
                </Button>

                <div style={{ textAlign: 'center' }}>
                  <Link to="/login" style={{ color: '#1890ff' }}>
                    Back to Login
                  </Link>
                </div>
              </Form.Item>
            </Form>
          </>
        )}
      </StyledCard>
    </PageContainer>
  );
};
