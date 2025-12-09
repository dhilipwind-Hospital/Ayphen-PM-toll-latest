# Project Invitation System - Complete Implementation Plan

**Date:** December 3, 2025  
**Status:** Implementation Required  
**Priority:** High  

---

## Executive Summary

Your Jira-clone application has a **well-architected backend** for project invitations, but the **frontend UI is missing**. This document provides a complete implementation plan to enable email-based project invitations, allowing users to invite collaborators who don't yet have accounts.

### Current State
- ✅ Backend API for invitations (100% complete)
- ✅ Direct member addition (100% complete)
- ✅ Database entities and relationships (100% complete)
- ❌ Frontend invitation UI (0% complete)
- ❌ Email service integration (0% complete)
- ❌ Invitation acceptance flow (0% complete)

### Goal
Enable users to invite team members to projects via email, with a seamless signup and onboarding experience.

---

## System Architecture Review

### Existing Backend Components

#### Database Entities

**ProjectInvitation** (`/ayphen-jira-backend/src/entities/ProjectInvitation.ts`)
```typescript
{
  id: UUID
  projectId: string
  email: string
  role: string (admin | member | viewer)
  invitedById: string
  token: string (64-char unique token)
  status: string (pending | accepted | rejected | expired)
  expiresAt: Date (7 days)
  acceptedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

**ProjectMember** (`/ayphen-jira-backend/src/entities/ProjectMember.ts`)
```typescript
{
  id: UUID
  projectId: string
  userId: string
  role: string (admin | member | viewer)
  addedById: string
  createdAt: Date
}
```

#### API Endpoints Available

**Invitations API** (`/api/project-invitations`)
- `GET /project/:projectId` - List all invitations for a project
- `POST /` - Create new invitation
- `POST /accept/:token` - Accept invitation
- `POST /reject/:token` - Reject invitation
- `DELETE /:id` - Cancel invitation
- `POST /resend/:id` - Resend invitation

**Members API** (`/api/project-members`)
- `GET /project/:projectId` - List project members
- `POST /` - Add member directly
- `PATCH /:id` - Update member role
- `DELETE /:id` - Remove member

---

## Implementation Tasks

### Phase 1: Email Service Integration (Backend)

#### Task 1.1: Choose and Setup Email Provider

**Options:**
1. **SendGrid** (Recommended)
   - Free tier: 100 emails/day
   - Easy integration
   - Good deliverability

2. **AWS SES**
   - Very cheap ($0.10 per 1000 emails)
   - Requires AWS account setup

3. **Mailgun**
   - Free tier: First 5,000 emails/month

**Action Items:**
```bash
# Install email service (using SendGrid as example)
cd ayphen-jira-backend
npm install @sendgrid/mail dotenv
```

**Environment Variables:**
```env
# Add to .env file
SENDGRID_API_KEY=your_api_key_here
FRONTEND_URL=http://localhost:5173
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Ayphen Jira
```

#### Task 1.2: Create Email Service

**File:** `/ayphen-jira-backend/src/services/email.service.ts`

```typescript
import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourapp.com';
const FROM_NAME = process.env.FROM_NAME || 'Ayphen Jira';

export class EmailService {
  /**
   * Send project invitation email
   */
  async sendProjectInvitation(data: {
    to: string;
    projectName: string;
    inviterName: string;
    role: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    const { to, projectName, inviterName, role, token, expiresAt } = data;
    
    const acceptLink = `${FRONTEND_URL}/accept-invitation/${token}`;
    const expiryDate = new Date(expiresAt).toLocaleDateString();
    
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `${inviterName} invited you to join "${projectName}"`,
      html: this.getInvitationEmailTemplate({
        projectName,
        inviterName,
        role,
        acceptLink,
        expiryDate,
      }),
      text: `
${inviterName} has invited you to join the project "${projectName}" as a ${role}.

Click the link below to accept the invitation:
${acceptLink}

This invitation will expire on ${expiryDate}.

If you didn't expect this invitation, you can safely ignore this email.
      `.trim(),
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Invitation email sent to ${to}`);
    } catch (error: any) {
      console.error('❌ Failed to send invitation email:', error.response?.body || error.message);
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Send invitation reminder
   */
  async sendInvitationReminder(data: {
    to: string;
    projectName: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    const { to, projectName, token, expiresAt } = data;
    
    const acceptLink = `${FRONTEND_URL}/accept-invitation/${token}`;
    const expiryDate = new Date(expiresAt).toLocaleDateString();
    
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `Reminder: Join "${projectName}" on Ayphen Jira`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>📬 Reminder: You've been invited to join "${projectName}"</h2>
          <p>This is a friendly reminder that you have a pending invitation to join this project.</p>
          <p>
            <a href="${acceptLink}" 
               style="background: #1890FF; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p><strong>⏰ This invitation expires on ${expiryDate}</strong></p>
        </div>
      `,
    };

    await sgMail.send(msg);
  }

  /**
   * HTML template for invitation email
   */
  private getInvitationEmailTemplate(data: {
    projectName: string;
    inviterName: string;
    role: string;
    acceptLink: string;
    expiryDate: string;
  }): string {
    const { projectName, inviterName, role, acceptLink, expiryDate } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #172B4D; font-size: 24px; font-weight: 600;">
                🎉 You've Been Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #5E6C84; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                <strong style="color: #172B4D;">${inviterName}</strong> has invited you to join the project 
                <strong style="color: #172B4D;">"${projectName}"</strong> as a <strong>${role}</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${acceptLink}" 
                       style="background: #1890FF; color: white; padding: 14px 32px; text-decoration: none; 
                              border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Role Info -->
              <div style="background: #F4F5F7; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px; color: #172B4D; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                  What you can do as a ${role}:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #5E6C84;">
                  ${role === 'admin' ? `
                    <li>Full access to all project features</li>
                    <li>Manage team members and permissions</li>
                    <li>Configure project settings</li>
                  ` : role === 'member' ? `
                    <li>View and edit all issues</li>
                    <li>Create and manage tasks</li>
                    <li>Collaborate with team members</li>
                  ` : `
                    <li>View all project issues</li>
                    <li>Add comments and feedback</li>
                    <li>Track project progress</li>
                  `}
                </ul>
              </div>
              
              <!-- Expiry Warning -->
              <div style="background: #FFF7E6; border-left: 4px solid #FA8C16; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; color: #5E6C84; font-size: 14px;">
                  <strong style="color: #FA8C16;">⏰ Note:</strong> This invitation will expire on 
                  <strong>${expiryDate}</strong>
                </p>
              </div>
              
              <!-- Alt Link -->
              <p style="color: #8C8C8C; font-size: 12px; margin: 20px 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${acceptLink}" style="color: #1890FF; word-break: break-all;">${acceptLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background: #F4F5F7; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #8C8C8C; font-size: 12px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

export const emailService = new EmailService();
```

#### Task 1.3: Update Invitation Routes to Send Emails

**File:** `/ayphen-jira-backend/src/routes/project-invitations.ts`

**Changes to make:**

```typescript
// Add import at top
import { emailService } from '../services/email.service';

// In POST '/' route, after line 86 (await invitationRepo.save(invitation)):
// Replace the TODO comment with:

try {
  // Get inviter details
  const inviter = await userRepo.findOne({ where: { id: invitedById } });
  
  // Send invitation email
  await emailService.sendProjectInvitation({
    to: email,
    projectName: project.name,
    inviterName: inviter?.name || 'A team member',
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
  });
  
  console.log(`✅ Invitation email sent to ${email}`);
} catch (emailError) {
  console.error('⚠️ Failed to send email, but invitation was created:', emailError);
  // Don't fail the request if email fails
}

// In POST '/resend/:id' route, after line 213:
// Replace the TODO with:

try {
  await emailService.sendProjectInvitation({
    to: invitation.email,
    projectName: invitation.project.name,
    inviterName: invitation.invitedBy.name,
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
  });
  console.log(`✅ Invitation email resent to ${invitation.email}`);
} catch (emailError) {
  console.error('⚠️ Failed to resend email:', emailError);
}
```

---

### Phase 2: Frontend - Invitation Management UI

#### Task 2.1: Create API Client for Invitations

**File:** `/ayphen-jira/src/services/api.ts`

**Add this after the projectMembersApi definition:**

```typescript
// Project Invitations API
export const projectInvitationsApi = {
  getByProject: (projectId: string) => 
    api.get(`/project-invitations/project/${projectId}`),
  create: (data: {
    projectId: string;
    email: string;
    role: string;
    invitedById: string;
  }) => api.post('/project-invitations', data),
  accept: (token: string, userId?: string) => 
    api.post(`/project-invitations/accept/${token}`, { userId }),
  reject: (token: string) => 
    api.post(`/project-invitations/reject/${token}`),
  cancel: (id: string) => 
    api.delete(`/project-invitations/${id}`),
  resend: (id: string) => 
    api.post(`/project-invitations/resend/${id}`),
};
```

#### Task 2.2: Create Invite Modal Component

**File:** `/ayphen-jira/src/components/InviteModal.tsx`

```typescript
import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message, Alert } from 'antd';
import { MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { projectInvitationsApi } from '../services/api';

interface InviteModalProps {
  visible: boolean;
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  projectId,
  projectName,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const currentUserId = localStorage.getItem('userId');

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await projectInvitationsApi.create({
        projectId,
        email: values.email,
        role: values.role,
        invitedById: currentUserId || '',
      });

      message.success(`Invitation sent to ${values.email}`);
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to send invitation';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MailOutlined />
          <span>Invite Member to {projectName}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Alert
        message="Send an email invitation"
        description="The recipient will receive an email with a link to join this project. They can create an account if they don't have one."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'member' }}
      >
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: 'Please enter email address' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="colleague@example.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select size="large">
            <Select.Option value="admin">
              <div>
                <strong>Admin</strong>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Full access + member management
                </div>
              </div>
            </Select.Option>
            <Select.Option value="member">
              <div>
                <strong>Member</strong>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Can view and edit issues
                </div>
              </div>
            </Select.Option>
            <Select.Option value="viewer">
              <div>
                <strong>Viewer</strong>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Read-only access
                </div>
              </div>
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<UserAddOutlined />}
            >
              Send Invitation
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

#### Task 2.3: Create Pending Invitations List Component

**File:** `/ayphen-jira/src/components/PendingInvitations.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Popconfirm, message, Tooltip } from 'antd';
import { DeleteOutlined, SendOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { projectInvitationsApi } from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface PendingInvitationsProps {
  projectId: string;
  refreshTrigger?: number;
}

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({
  projectId,
  refreshTrigger,
}) => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, [projectId, refreshTrigger]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data } = await projectInvitationsApi.getByProject(projectId);
      // Only show pending invitations
      const pending = data.filter((inv: any) => inv.status === 'pending');
      setInvitations(pending);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await projectInvitationsApi.cancel(id);
      message.success('Invitation cancelled');
      loadInvitations();
    } catch (error) {
      message.error('Failed to cancel invitation');
    }
  };

  const handleResend = async (id: string, email: string) => {
    try {
      await projectInvitationsApi.resend(id);
      message.success(`Invitation resent to ${email}`);
    } catch (error) {
      message.error('Failed to resend invitation');
    }
  };

  const getStatusTag = (invitation: any) => {
    const expiresAt = dayjs(invitation.expiresAt);
    const now = dayjs();
    const hoursLeft = expiresAt.diff(now, 'hours');

    if (hoursLeft < 0) {
      return <Tag color="red">Expired</Tag>;
    } else if (hoursLeft < 24) {
      return <Tag color="orange">Expires in {hoursLeft}h</Tag>;
    } else {
      return <Tag color="blue">Pending</Tag>;
    }
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'member' ? 'blue' : 'default'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Invited By',
      dataIndex: ['invitedBy', 'name'],
      key: 'invitedBy',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: any) => getStatusTag(record),
    },
    {
      title: 'Sent',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('MMMM D, YYYY h:mm A')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('MMMM D, YYYY h:mm A')}>
          <Space>
            <ClockCircleOutlined />
            {dayjs(date).fromNow()}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Resend invitation email">
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleResend(record.id, record.email)}
            />
          </Tooltip>
          <Popconfirm
            title="Cancel invitation?"
            description="This person will no longer be able to accept the invitation."
            onConfirm={() => handleCancel(record.id)}
            okText="Cancel Invitation"
            cancelText="Keep"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (invitations.length === 0 && !loading) {
    return null;
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ marginBottom: 16 }}>
        Pending Invitations ({invitations.length})
      </h4>
      <Table
        dataSource={invitations}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />
    </div>
  );
};
```

#### Task 2.4: Update ProjectMembersTab to Include Invitations

**File:** `/ayphen-jira/src/pages/ProjectSettings/ProjectMembersTab.tsx`

**Add these imports:**
```typescript
import { InviteModal } from '../../components/InviteModal';
import { PendingInvitations } from '../../components/PendingInvitations';
import { MailOutlined } from '@ant-design/icons';
```

**Add state variables (after line 16):**
```typescript
const [inviteModalVisible, setInviteModalVisible] = useState(false);
const [invitationsRefreshTrigger, setInvitationsRefreshTrigger] = useState(0);
```

**Update the "Add Member" button section (around line 198):**
```typescript
<Space>
  <Button
    type="default"
    icon={<MailOutlined />}
    onClick={() => setInviteModalVisible(true)}
  >
    Invite by Email
  </Button>
  <Button
    type="primary"
    icon={<UserAddOutlined />}
    onClick={() => setAddModalVisible(true)}
  >
    Add Existing User
  </Button>
</Space>
```

**Add components before the Table (after line 205):**
```typescript
<PendingInvitations
  projectId={projectId}
  refreshTrigger={invitationsRefreshTrigger}
/>
```

**Add InviteModal at the end (before closing div):**
```typescript
<InviteModal
  visible={inviteModalVisible}
  projectId={projectId}
  projectName="Project" // You can get this from props if available
  onClose={() => setInviteModalVisible(false)}
  onSuccess={() => {
    setInvitationsRefreshTrigger(prev => prev + 1);
  }}
/>
```

---

### Phase 3: Invitation Acceptance Flow

#### Task 3.1: Create Accept Invitation Page

**File:** `/ayphen-jira/src/pages/AcceptInvitation.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spin, Form, Input, message, Tag, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { projectInvitationsApi, usersApi } from '../services/api';
import axios from 'axios';

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
      // Try to fetch invitation info (we'll need a new endpoint for this)
      const response = await axios.get(
        `http://localhost:8500/api/project-invitations/verify/${token}`
      );
      setInvitation(response.data);
      
      // Check if user is logged in
      if (!userId) {
        setNeedsSignup(true);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('This invitation link is invalid or has expired.');
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
        await projectInvitationsApi.accept(token!, userId!);
        message.success('Invitation accepted!');
        
        setTimeout(() => {
          navigate(`/projects/${invitation.projectId}`);
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
          <p>Join your team on Ayphen Jira</p>
        </Logo>

        <ProjectInfo>
          <h3>{invitation.project?.name || 'Project'}</h3>
          <p>
            <strong>{invitation.invitedBy?.name}</strong> invited you as a{' '}
            <Tag color={invitation.role === 'admin' ? 'red' : 'blue'}>
              {invitation.role.toUpperCase()}
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
                  value={invitation.email}
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
            description={`Accept this invitation to join the project as ${invitation.role}.`}
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
```

#### Task 3.2: Add Verification Endpoint (Backend)

**File:** `/ayphen-jira-backend/src/routes/project-invitations.ts`

**Add this new route after the existing routes:**

```typescript
// VERIFY invitation (get details without accepting)
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await invitationRepo.findOne({
      where: { token },
      relations: ['project', 'invitedBy'],
    });
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    // Check if expired
    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }
    
    // Check if already used
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Invitation has already been ${invitation.status}` 
      });
    }
    
    res.json(invitation);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to verify invitation' });
  }
});
```

#### Task 3.3: Add Route to Frontend Router

**File:** `/ayphen-jira/src/App.tsx`

**Add import:**
```typescript
import { AcceptInvitation } from './pages/AcceptInvitation';
```

**Add route (in your Routes section):**
```typescript
<Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
```

---

### Phase 4: Testing & Polish

#### Task 4.1: Manual Testing Checklist

**Test Scenario 1: Invite New User**
- [ ] Open project settings → Members tab
- [ ] Click "Invite by Email"
- [ ] Enter email address and select role
- [ ] Verify invitation appears in "Pending Invitations"
- [ ] Check email was received (check logs if email not configured)
- [ ] Copy invitation link from email/logs
- [ ] Open link in incognito window
- [ ] Fill signup form and accept invitation
- [ ] Verify user is redirected to project
- [ ] Verify user appears in project members list
- [ ] Verify invitation status changed to "accepted"

**Test Scenario 2: Invite Existing User**
- [ ] Send invitation to existing user's email
- [ ] Login as that user
- [ ] Click invitation link
- [ ] Should skip signup, show accept button directly
- [ ] Accept invitation
- [ ] Verify added to project

**Test Scenario 3: Manage Invitations**
- [ ] Send invitation
- [ ] Verify appears in pending list
- [ ] Click "Resend" button
- [ ] Verify new email sent (check logs)
- [ ] Click "Cancel" button
- [ ] Verify invitation removed

**Test Scenario 4: Expiry Handling**
- [ ] Manually update invitation expiry in database to past date
- [ ] Try to access invitation link
- [ ] Should show "expired" error
- [ ] Verify cannot accept

**Test Scenario 5: Duplicate Prevention**
- [ ] Try to send invitation to existing member
- [ ] Should show error
- [ ] Try to send second invitation to same email
- [ ] Should show "already sent" error

#### Task 4.2: Edge Cases to Handle

1. **Email Already Member**
   - Backend already checks this ✅
   - Show clear error message in UI

2. **Invalid Email Format**
   - Frontend validation ✅
   - Form won't submit

3. **Invitation Expired**
   - Show clear message on acceptance page ✅
   - Provide option to request new invitation

4. **User Logs Out During Acceptance**
   - Store token in session
   - Redirect to login then back to acceptance

5. **Network Errors**
   - Show retry buttons
   - Don't lose form data

#### Task 4.3: UI/UX Improvements

**Add to PendingInvitations:**
- [ ] Show expired invitations in gray/strikethrough
- [ ] Add "Copy Link" button to manually share invitation
- [ ] Add bulk actions (select multiple to cancel)
- [ ] Add search/filter for invitations

**Add to InviteModal:**
- [ ] Allow inviting multiple emails at once (comma-separated)
- [ ] Show recent invites
- [ ] Add invitation preview

**Add to AcceptInvitation:**
- [ ] Loading states for all actions
- [ ] Better error messages
- [ ] "Already a member" detection
- [ ] Background animations

---

### Phase 5: Optional Enhancements

#### Task 5.1: Invitation Analytics

Track invitation metrics:
- Total sent
- Acceptance rate
- Average time to accept
- Expired invitations
- Top inviters

#### Task 5.2: Invitation Templates

Allow customizing invitation messages:
- Personal message field
- Project description
- Welcome video link

#### Task 5.3: Batch Invitations

**File:** `/ayphen-jira/src/components/BatchInviteModal.tsx`

Features:
- CSV upload
- Paste email list
- Assign same role to all
- Progress indicator
- Success/failure report

#### Task 5.4: Invitation Reminders

Automated reminders:
- After 3 days: First reminder
- After 6 days: Final reminder (1 day before expiry)
- Cron job or scheduled task

#### Task 5.5: Custom Expiry

Let users set custom expiry:
- 1 day, 3 days, 7 days, 30 days, Never
- Update invitation creation flow

---

## Installation Instructions

### Step 1: Install Dependencies

```bash
# Backend
cd ayphen-jira-backend
npm install @sendgrid/mail dayjs

# Frontend
cd ../ayphen-jira
npm install dayjs
```

### Step 2: Configure Environment

```bash
# Create/update .env in backend
cd ayphen-jira-backend
echo "SENDGRID_API_KEY=your_key_here" >> .env
echo "FRONTEND_URL=http://localhost:5173" >> .env
echo "FROM_EMAIL=noreply@yourapp.com" >> .env
echo "FROM_NAME=Ayphen Jira" >> .env
```

### Step 3: Get SendGrid API Key

1. Sign up at https://sendgrid.com
2. Go to Settings → API Keys
3. Create new API key with "Mail Send" permission
4. Copy key to .env file

### Step 4: Verify Email Domain (Production Only)

For production, verify your domain:
1. Go to SendGrid → Settings → Sender Authentication
2. Authenticate your domain
3. Add DNS records as instructed

---

## File Checklist

### Backend Files to Create/Modify

- [ ] `/src/services/email.service.ts` (CREATE)
- [ ] `/src/routes/project-invitations.ts` (MODIFY - add email sending)
- [ ] `/.env` (MODIFY - add email config)
- [ ] `/package.json` (MODIFY - add dependencies)

### Frontend Files to Create/Modify

- [ ] `/src/components/InviteModal.tsx` (CREATE)
- [ ] `/src/components/PendingInvitations.tsx` (CREATE)
- [ ] `/src/pages/AcceptInvitation.tsx` (CREATE)
- [ ] `/src/pages/ProjectSettings/ProjectMembersTab.tsx` (MODIFY)
- [ ] `/src/services/api.ts` (MODIFY - add invitation API)
- [ ] `/src/App.tsx` (MODIFY - add route)
- [ ] `/package.json` (MODIFY - add dayjs)

---

## Timeline Estimate

- **Phase 1** (Email Service): 2-3 hours
- **Phase 2** (Invitation UI): 3-4 hours
- **Phase 3** (Acceptance Flow): 2-3 hours
- **Phase 4** (Testing): 1-2 hours
- **Phase 5** (Enhancements): 4-6 hours (optional)

**Total: 8-12 hours for core functionality**

---

## Success Criteria

✅ Users can invite others by email  
✅ Invitations send real emails (or log to console in dev)  
✅ Recipients can accept invitations  
✅ New users can sign up via invitation  
✅ Invitations expire after 7 days  
✅ Project admins can manage pending invitations  
✅ No duplicate invitations allowed  
✅ Clear error messages for all edge cases  

---

## Rollout Plan

### Development
1. Implement Phase 1 (email service)
2. Test email sending in dev (SendGrid sandbox mode)
3. Implement Phase 2 & 3 (UI components)
4. Test complete flow locally

### Staging
1. Deploy to staging environment
2. Configure production email settings
3. Run full test suite
4. Get stakeholder approval

### Production
1. Enable feature flag for beta users
2. Monitor invitation metrics
3. Collect feedback
4. Full rollout

---

## Support & Maintenance

### Monitoring
- Log all invitation sends
- Track acceptance rates
- Alert on email delivery failures
- Monitor expired invitations

### Documentation
- Add invitation flow to user guide
- Create video tutorial
- Update onboarding docs

### Troubleshooting
**"Email not received"**
- Check spam folder
- Verify SendGrid API key
- Check email delivery logs
- Test with different email provider

**"Invitation link broken"**
- Verify frontend URL in .env
- Check token in database
- Verify route is registered

**"Can't accept invitation"**
- Check expiry date
- Verify user isn't already member
- Check database permissions

---

## Additional Resources

- [SendGrid Node.js Documentation](https://docs.sendgrid.com/for-developers/sending-email/v3-nodejs-code-example)
- [TypeORM Relations Guide](https://typeorm.io/relations)
- [React Router v6 Params](https://reactrouter.com/docs/en/v6/hooks/use-params)
- [Ant Design Form Validation](https://ant.design/components/form#components-form-demo-validate-other)

---

## Next Steps

1. **Review this plan** - Make sure it aligns with your requirements
2. **Setup SendGrid account** - Get API key ready
3. **Start with Phase 1** - Email service is foundation
4. **Build incrementally** - Test each phase before moving to next
5. **Get feedback** - Test with real users early

Good luck with the implementation! 🚀
