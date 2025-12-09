import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Input, Button, message, Card, Progress } from 'antd';
import { LockOutlined } from '@ant-design/icons';
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

const PasswordStrengthLabel = styled.div<{ $strength: number }>`
  margin-top: 8px;
  font-size: 12px;
  color: ${props => {
    if (props.$strength < 30) return '#ff4d4f';
    if (props.$strength < 60) return '#faad14';
    return '#52c41a';
  }};
`;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [form] = Form.useForm();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strength = calculatePasswordStrength(e.target.value);
    setPasswordStrength(strength);
  };

  const getStrengthLabel = (strength: number): string => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (values: { newPassword: string }) => {
    if (!token || !email) {
      message.error('Invalid reset link');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:8500/api/auth/reset-password', {
        email,
        token,
        newPassword: values.newPassword,
      });
      message.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <PageContainer>
        <StyledCard>
          <Logo>
            <h1>🎯 Jira Clone</h1>
            <p>Invalid Reset Link</p>
          </Logo>
          <p style={{ textAlign: 'center', color: '#8c8c8c' }}>
            This password reset link is invalid or has expired.
          </p>
          <Button type="primary" block onClick={() => navigate('/forgot-password')}>
            Request New Link
          </Button>
        </StyledCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <StyledCard>
        <Logo>
          <h1>🎯 Jira Clone</h1>
          <p>Reset Your Password</p>
        </Logo>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New Password"
              onChange={handlePasswordChange}
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <div style={{ marginTop: -16, marginBottom: 24 }}>
              <Progress 
                percent={passwordStrength} 
                showInfo={false}
                strokeColor={
                  passwordStrength < 30 ? '#ff4d4f' : 
                  passwordStrength < 60 ? '#faad14' : '#52c41a'
                }
                size="small"
              />
              <PasswordStrengthLabel $strength={passwordStrength}>
                Password Strength: {getStrengthLabel(passwordStrength)}
              </PasswordStrengthLabel>
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              disabled={passwordStrength < 30}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </StyledCard>
    </PageContainer>
  );
};
