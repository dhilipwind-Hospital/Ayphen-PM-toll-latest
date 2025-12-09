import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spin, Form, Input, message, Tag, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { projectInvitationsApi, usersApi } from '../services/api';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const StyledCard = styled(Card)`
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #172B4D;
    margin: 0;
  }
  
  p {
    color: #5E6C84;
    margin: 8px 0 0;
  }
`;

const ProjectInfo = styled.div`
  background: #F4F5F7;
  padding: 20px;
  border-radius: 8px;
  margin: 24px 0;
  
  h3 {
    margin: 0 0 8px;
    color: #172B4D;
  }
  
  p {
    margin: 0;
    color: #5E6C84;
  }
`;

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);
  
  const [form] = Form.useForm();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    setLoading(true);
    try {
      const { data } = await projectInvitationsApi.verify(token!);
      setInvitation(data);
      
      // Check if user is logged in
      if (!userId) {
        setNeedsSignup(true);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('This invitation link is invalid or has expired.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.error || 'This invitation is no longer valid.');
      } else {
        setError('Failed to load invitation details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (needsSignup) {
      // User needs to sign up first
      try {
        await form.validateFields();
        const values = form.getFieldsValue();
        
        setAccepting(true);
        
        // Create user account
        const userResponse = await usersApi.create({
          name: values.name,
          email: invitation.email,
          password: values.password,
        });
        
        const newUserId = userResponse.data.id;
        
        // Accept invitation with new user ID
        await projectInvitationsApi.accept(token!, newUserId);
        
        // Store user session
        localStorage.setItem('userId', newUserId);
        localStorage.setItem('userName', values.name);
        
        message.success('Account created and invitation accepted!');
        
        // Redirect to project
        setTimeout(() => {
          navigate(`/projects/${invitation.projectId}`);
        }, 1500);
      } catch (error: any) {
        message.error(error.response?.data?.error || 'Failed to create account');
      } finally {
        setAccepting(false);
      }
    } else {
      // User is already logged in
      setAccepting(true);
      try {
        const { data } = await projectInvitationsApi.accept(token!, userId!);
        message.success('Invitation accepted!');
        
        setTimeout(() => {
          navigate(`/projects/${data.project?.id || invitation.projectId}`);
        }, 1500);
      } catch (error: any) {
        message.error(error.response?.data?.error || 'Failed to accept invitation');
      } finally {
        setAccepting(false);
      }
    }
  };

  const handleReject = async () => {
    try {
      await projectInvitationsApi.reject(token!);
      message.info('Invitation declined');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      message.error('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <Container>
        <Spin size="large" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <StyledCard>
          <Alert
            message="Invalid Invitation"
            description={error}
            type="error"
            showIcon
          />
          <Button
            type="primary"
            block
            size="large"
            style={{ marginTop: 24 }}
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>
        </StyledCard>
      </Container>
    );
  }

  return (
    <Container>
      <StyledCard>
        <Logo>
          <h1>🎉 You're Invited!</h1>
          <p>Join your team on Ayphen Project Management</p>
        </Logo>

        <ProjectInfo>
          <h3>{invitation?.projectName || 'Project'}</h3>
          <p>
            <strong>{invitation?.invitedBy?.name}</strong> invited you as a{' '}
            <Tag color={invitation?.role === 'admin' ? 'red' : invitation?.role === 'member' ? 'blue' : 'default'}>
              {invitation?.role?.toUpperCase()}
            </Tag>
          </p>
        </ProjectInfo>

        {needsSignup ? (
          <>
            <Alert
              message="Create your account"
              description="You'll need to create an account to accept this invitation."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Form form={form} layout="vertical">
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="John Doe"
                  size="large"
                />
              </Form.Item>

              <Form.Item label="Email">
                <Input
                  prefix={<MailOutlined />}
                  value={invitation?.email}
                  disabled
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter a password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Create a password"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
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
                  prefix={<LockOutlined />}
                  placeholder="Confirm password"
                  size="large"
                />
              </Form.Item>
            </Form>
          </>
        ) : (
          <Alert
            message="You're logged in"
            description={`Accept this invitation to join the project as ${invitation?.role}.`}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button
            type="primary"
            size="large"
            block
            icon={<CheckCircleOutlined />}
            loading={accepting}
            onClick={handleAccept}
          >
            {needsSignup ? 'Create Account & Accept' : 'Accept Invitation'}
          </Button>
          
          <Button
            size="large"
            block
            icon={<CloseCircleOutlined />}
            onClick={handleReject}
          >
            Decline
          </Button>
        </Space>
      </StyledCard>
    </Container>
  );
};
