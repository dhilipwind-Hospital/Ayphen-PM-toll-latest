import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Progress } from 'antd';
import { User, Mail, Lock, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { BodyLarge } from '../components/Typography';

const float = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(30px, 30px) rotate(180deg); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-45deg, #E0F2FE, #7DD3FC, #38BDF8, #0EA5E9);
  background-size: 400% 400%;
  animation: ${gradientShift} 15s ease infinite;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    top: -300px;
    right: -300px;
    animation: ${float} 8s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(249, 168, 212, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    bottom: -250px;
    left: -250px;
    animation: ${float} 10s ease-in-out infinite reverse;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.98);
  padding: 48px;
  border-radius: 20px;
  box-shadow: 0 25px 80px rgba(14, 165, 233, 0.2), 0 15px 40px rgba(249, 168, 212, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(252, 231, 243, 0.3);
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
  animation: ${slideIn} 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &:hover {
    box-shadow: 0 30px 90px rgba(14, 165, 233, 0.25), 0 20px 50px rgba(249, 168, 212, 0.2);
    transform: translateY(-8px) scale(1.02);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
`;

const LogoWrapper = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #38BDF8, #0EA5E9);
  border-radius: 12px;
  margin-bottom: 16px;
  animation: ${sparkle} 2s ease-in-out infinite;
  
  svg {
    color: white;
  }
`;

const Logo = styled.h1`
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #38BDF8 0%, #0EA5E9 50%, #7DD3FC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  margin-bottom: 32px;
  font-size: 16px;
  font-weight: 500;
`;

const PasswordStrengthLabel = styled.div<{ $strength: number }>`
  margin-top: 8px;
  font-size: 12px;
  color: ${(props) => {
    if (props.$strength < 30) return '#ff4d4f';
    if (props.$strength < 70) return '#faad14';
    return '#52c41a';
  }};
`;

const StyledButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #38BDF8, #0EA5E9);
  border: none;
  color: #FFFFFF;
  
  span {
    color: #FFFFFF !important;
  }
  
  &:hover {
    background: linear-gradient(135deg, #0EA5E9, #0284C7);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
    color: #FFFFFF !important;
  }
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 24px;
  color: #666;
  
  a {
    color: #0EA5E9;
    font-weight: 600;
    text-decoration: none;
    
    &:hover {
      color: #38BDF8;
    }
  }
`;

export const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z\d]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 30) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      message.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <LogoWrapper>
          <img
            src="/ayphen-logo.png"
            alt="Ayphen Technologies"
            style={{
              width: '240px',
              display: 'block',
              margin: '0 auto 16px auto'
            }}
          />
          <BodyLarge style={{ textAlign: 'center', marginTop: '8px', color: '#6B7280' }}>
            Create your account
          </BodyLarge>
        </LogoWrapper>

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input prefix={<User size={18} />} placeholder="Full Name" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<Mail size={18} />} placeholder="Email Address" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={18} />}
              placeholder="Password"
              size="large"
              onChange={handlePasswordChange}
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <>
              <Progress
                percent={passwordStrength}
                showInfo={false}
                strokeColor={
                  passwordStrength < 30
                    ? '#ff4d4f'
                    : passwordStrength < 70
                      ? '#faad14'
                      : '#52c41a'
                }
              />
              <PasswordStrengthLabel $strength={passwordStrength}>
                Password Strength: {getPasswordStrengthText(passwordStrength)}
              </PasswordStrengthLabel>
            </>
          )}

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<Lock size={18} />}
              placeholder="Confirm Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Please accept the terms and conditions')),
              },
            ]}
          >
            <Checkbox>
              I agree to the <a href="/terms">Terms and Conditions</a>
            </Checkbox>
          </Form.Item>

          <StyledButton
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            icon={<Zap size={18} />}
          >
            Create Account
          </StyledButton>
        </Form>

        <FooterText>
          Already have an account? <Link to="/login">Sign in</Link>
        </FooterText>
      </Card>
    </Container>
  );
};
