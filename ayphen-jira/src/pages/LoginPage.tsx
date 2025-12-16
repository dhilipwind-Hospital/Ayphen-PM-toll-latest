import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Form, Input, Button, Tabs, Divider } from 'antd';
import { Mail, Lock, User, Github, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

// Styled Components
const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #2e1065 0%, #be185d 50%, #f472b6 100%);
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

const BrandContent = styled.div`
  max-width: 480px;
  z-index: 2;
  animation: ${fadeIn} 1s ease-out;
`;

const Logo = styled.div`
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  img {
    height: 40px;
    background: white;
    border-radius: 8px;
    padding: 4px;
  }
`;

const Tagline = styled.h1`
  font-size: 48px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
  background: linear-gradient(to right, #ffffff, #fbcfe8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  font-size: 18px;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 40px;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
  
  svg {
    color: #f472b6;
  }
`;

const FloatingCard = styled.div`
  position: absolute;
  bottom: -40px;
  right: -40px;
  width: 400px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transform: rotate(-12deg);
  animation: ${float} 6s ease-in-out infinite;
  z-index: 1;
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

const AuthContainer = styled.div`
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
  }
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav::before {
    border-bottom: none;
  }
  
  .ant-tabs-tab {
    font-size: 16px;
    padding: 12px 0;
    
    &.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #be185d;
      font-weight: 600;
    }
  }

  .ant-tabs-ink-bar {
    background: #be185d;
    height: 3px;
    border-radius: 3px;
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
    border-color: #be185d;
    box-shadow: 0 0 0 4px rgba(190, 24, 93, 0.1);
  }

  .ant-input {
    background: transparent;
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
    border-color: #be185d;
    box-shadow: 0 0 0 4px rgba(190, 24, 93, 0.1);
  }

  .ant-input {
    background: transparent;
  }
`;

const PrimaryButton = styled(Button)`
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(to right, #be185d, #db2777);
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
  
  span {
    color: #FFFFFF !important;
  }
  
  &:hover {
    background: linear-gradient(to right, #9d174d, #be185d) !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(190, 24, 93, 0.4);
    color: #FFFFFF !important;
  }
`;

const SocialButton = styled(Button)`
  height: 48px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover {
    border-color: #be185d;
    color: #be185d;
    background: #fff1f2;
  }
`;

const Footer = styled.div`
  margin-top: 32px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      await register(values.name, values.email, values.password);
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <LeftPanel>
        <BrandContent>
          <Logo>
            <img src="/ayphen-logo.png" alt="Logo" />
            Ayphen
          </Logo>
          <Tagline>Ship products faster, together.</Tagline>
          <Description>
            The all-in-one project management platform designed for high-performance agile teams. Plan, track, and deliver world-class software.
          </Description>

          <FeatureList>
            <FeatureItem><CheckCircle2 size={20} /> Real-time Collaboration</FeatureItem>
            <FeatureItem><CheckCircle2 size={20} /> Advanced Sprint Planning</FeatureItem>
            <FeatureItem><CheckCircle2 size={20} /> AI-Powered Insights</FeatureItem>
          </FeatureList>
        </BrandContent>
        <FloatingCard />
      </LeftPanel>

      <RightPanel>
        <AuthContainer>
          <Header>
            <h2>Welcome back</h2>
            <p>Please enter your details to sign in.</p>
          </Header>

          <StyledTabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            items={[
              {
                key: 'login',
                label: 'Sign In',
                children: (
                  <Form
                    name="login"
                    onFinish={handleLogin}
                    layout="vertical"
                    size="large"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: 'Email is required' },
                        { type: 'email', message: 'Please enter a valid email' },
                      ]}
                    >
                      <StyledInput prefix={<Mail size={18} color="#9ca3af" />} placeholder="Enter your email" />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: 'Password is required' }]}
                    >
                      <StyledPassword prefix={<Lock size={18} color="#9ca3af" />} placeholder="Enter your password" />
                    </Form.Item>

                    <Form.Item>
                      <PrimaryButton type="primary" htmlType="submit" loading={loading} block>
                        Sign In <ArrowRight size={18} style={{ marginLeft: 8 }} />
                      </PrimaryButton>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: 'Create Account',
                children: (
                  <Form
                    name="register"
                    onFinish={handleRegister}
                    layout="vertical"
                    size="large"
                  >
                    <Form.Item
                      name="name"
                      rules={[{ required: true, message: 'Name is required' }]}
                    >
                      <StyledInput prefix={<User size={18} color="#9ca3af" />} placeholder="Full Name" />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: 'Email is required' },
                        { type: 'email', message: 'Please enter a valid email' },
                      ]}
                    >
                      <StyledInput prefix={<Mail size={18} color="#9ca3af" />} placeholder="Email Address" />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: 'Password is required' }, { min: 6, message: 'Min 6 characters' }]}
                    >
                      <StyledPassword prefix={<Lock size={18} color="#9ca3af" />} placeholder="Create Password" />
                    </Form.Item>

                    <Form.Item>
                      <PrimaryButton type="primary" htmlType="submit" loading={loading} block>
                        Create Account
                      </PrimaryButton>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />

          <Divider style={{ color: '#9ca3af', fontSize: 14, margin: '24px 0' }}>Or continue with</Divider>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <SocialButton>
              <Github size={20} /> GitHub
            </SocialButton>
            <SocialButton>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </SocialButton>
          </div>

          <Footer>
            <Lock size={12} /> Secured by 256-bit encryption
          </Footer>
        </AuthContainer>
      </RightPanel>
    </PageContainer>
  );
};
