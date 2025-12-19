import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Form, Input, Button, message, Progress } from 'antd';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const floatParticle = keyframes`
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
`;

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #0C4A6E 0%, #0284C7 50%, #06B6D4 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
  color: white;

  @media (max-width: 900px) {
    display: none;
  }

  &::before {
    content: '';
    position: absolute;
    width: 150%;
    height: 150%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
    top: -25%;
    left: -25%;
  }
`;

const ParticlesContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
`;

const Particle = styled.div<{ size?: number; left?: string; delay?: number }>`
  position: absolute;
  bottom: -100px;
  left: ${props => props.left || '50%'};
  width: ${props => props.size || 8}px;
  height: ${props => props.size || 8}px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: ${floatParticle} 15s linear infinite;
  animation-delay: ${props => props.delay || 0}s;
`;

const BrandContent = styled.div`
  max-width: 480px;
  z-index: 2;
  animation: ${fadeIn} 1s ease-out;
  text-align: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  
  img {
    height: 56px;
    width: 56px;
    background: white;
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .brand-name {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: white;
    }
    
    .brand-suffix {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      opacity: 0.85;
      color: #BAE6FD;
    }
  }
`;

const Tagline = styled.h1`
  font-size: 42px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
  background: linear-gradient(to right, #ffffff, #BAE6FD);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const RightPanel = styled.div`
  flex: 1;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  position: relative;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 420px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;

  h2 {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
  }

  p {
    color: #6b7280;
    font-size: 16px;
    line-height: 1.6;
  }
`;

const StyledPassword = styled(Input.Password)`
  height: 50px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  font-size: 15px;

  &:hover, &:focus-within {
    background: #ffffff;
    border-color: #0284C7;
    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
  }

  .ant-input {
    background: transparent;
  }
`;

const PrimaryButton = styled(Button)`
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(to right, #0284C7, #0EA5E9);
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  
  span {
    color: #FFFFFF !important;
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(to right, #0369A1, #0284C7) !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
    color: #FFFFFF !important;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PasswordStrengthLabel = styled.div<{ $strength: number }>`
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${props => {
    if (props.$strength < 30) return '#ef4444';
    if (props.$strength < 60) return '#f59e0b';
    return '#22c55e';
  }};
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  
  svg {
    color: #ef4444;
    margin-bottom: 12px;
  }
  
  h3 {
    color: #991b1b;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  p {
    color: #b91c1c;
    margin: 0 0 16px 0;
    line-height: 1.6;
  }
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
      await api.post('/auth/reset-password', {
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
        <LeftPanel>
          <ParticlesContainer>
            <Particle size={6} left="10%" delay={0} />
            <Particle size={8} left="20%" delay={2} />
            <Particle size={5} left="30%" delay={4} />
            <Particle size={7} left="40%" delay={1} />
            <Particle size={6} left="50%" delay={3} />
            <Particle size={9} left="60%" delay={5} />
            <Particle size={5} left="70%" delay={2.5} />
            <Particle size={7} left="80%" delay={4.5} />
          </ParticlesContainer>
          <BrandContent>
            <Logo>
              <img src="/ayphen-logo-new.png" alt="Ayphen Logo" />
              <div className="brand-text">
                <div className="brand-name">Ayphen</div>
                <div className="brand-suffix">Technologies</div>
              </div>
            </Logo>
            <Tagline>Secure password management</Tagline>
          </BrandContent>
        </LeftPanel>

        <RightPanel>
          <FormContainer>
            <Header>
              <h2>Invalid Link</h2>
              <p>This password reset link is invalid or has expired.</p>
            </Header>

            <ErrorMessage>
              <AlertCircle size={48} />
              <h3>Reset Link Expired</h3>
              <p>
                This password reset link is no longer valid. Please request a new one.
              </p>
              <PrimaryButton type="primary" block onClick={() => navigate('/forgot-password')}>
                Request New Link
              </PrimaryButton>
            </ErrorMessage>
          </FormContainer>
        </RightPanel>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <LeftPanel>
        <ParticlesContainer>
          <Particle size={6} left="10%" delay={0} />
          <Particle size={8} left="20%" delay={2} />
          <Particle size={5} left="30%" delay={4} />
          <Particle size={7} left="40%" delay={1} />
          <Particle size={6} left="50%" delay={3} />
          <Particle size={9} left="60%" delay={5} />
          <Particle size={5} left="70%" delay={2.5} />
          <Particle size={7} left="80%" delay={4.5} />
        </ParticlesContainer>
        <BrandContent>
          <Logo>
            <img src="/ayphen-logo-new.png" alt="Ayphen Logo" />
            <div className="brand-text">
              <div className="brand-name">Ayphen</div>
              <div className="brand-suffix">Technologies</div>
            </div>
          </Logo>
          <Tagline>Create a strong, secure password</Tagline>
        </BrandContent>
      </LeftPanel>

      <RightPanel>
        <FormContainer>
          <Header>
            <h2>Reset Your Password</h2>
            <p>Choose a strong password to keep your account secure.</p>
          </Header>

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
              <StyledPassword
                prefix={<Lock size={18} color="#9ca3af" />}
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
                    passwordStrength < 30 ? '#ef4444' :
                      passwordStrength < 60 ? '#f59e0b' : '#22c55e'
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
              <StyledPassword
                prefix={<Lock size={18} color="#9ca3af" />}
                placeholder="Confirm Password"
              />
            </Form.Item>

            <Form.Item>
              <PrimaryButton
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                disabled={passwordStrength < 30}
              >
                Reset Password
              </PrimaryButton>
              {passwordStrength < 30 && passwordStrength > 0 && (
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
                  Password must be stronger to continue
                </p>
              )}
            </Form.Item>
          </Form>
        </FormContainer>
      </RightPanel>
    </PageContainer>
  );
};
