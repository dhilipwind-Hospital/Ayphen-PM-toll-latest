import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Form, Input, Button, message } from 'antd';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
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

const StyledInput = styled(Input)`
  height: 50px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  font-size: 15px;

  &:hover, &:focus {
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
  
  &:hover {
    background: linear-gradient(to right, #0369A1, #0284C7) !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
    color: #FFFFFF !important;
  }
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
  
  &:hover {
    color: #0284C7;
  }
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
  
  svg {
    color: #22c55e;
    margin-bottom: 12px;
  }
  
  h3 {
    color: #166534;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  p {
    color: #15803d;
    margin: 0;
    line-height: 1.6;
  }
`;

export const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {
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
          <Tagline>Reset your password securely</Tagline>
        </BrandContent>
      </LeftPanel>

      <RightPanel>
        <FormContainer>
          <Header>
            <h2>Forgot Password?</h2>
            <p>No worries! Enter your email and we'll send you reset instructions.</p>
          </Header>

          {emailSent ? (
            <>
              <SuccessMessage>
                <CheckCircle size={48} />
                <h3>Email Sent!</h3>
                <p>
                  If an account exists with that email, you will receive a password reset link shortly.
                  Please check your inbox.
                </p>
              </SuccessMessage>
              <PrimaryButton type="primary" block onClick={() => window.location.href = '/login'}>
                Back to Login
              </PrimaryButton>
            </>
          ) : (
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
                <StyledInput
                  prefix={<Mail size={18} color="#9ca3af" />}
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item>
                <PrimaryButton
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ marginBottom: 16 }}
                >
                  Send Reset Link
                </PrimaryButton>

                <div style={{ textAlign: 'center' }}>
                  <BackLink to="/login">
                    <ArrowLeft size={16} />
                    Back to Login
                  </BackLink>
                </div>
              </Form.Item>
            </Form>
          )}
        </FormContainer>
      </RightPanel>
    </PageContainer>
  );
};
