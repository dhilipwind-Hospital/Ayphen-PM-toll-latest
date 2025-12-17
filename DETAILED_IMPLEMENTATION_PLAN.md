# 🚀 DETAILED IMPLEMENTATION PLAN - PRIORITY FEATURES

**Project:** Ayphen PM Application  
**Date:** December 17, 2025  
**Focus Areas:** 12 Critical Features for Enterprise Readiness  
**Total Estimated Effort:** 180-220 hours (~5-6 weeks)

---

## 📋 TABLE OF CONTENTS

1. [Project Invitations System](#1-project-invitations-system)
2. [Team Member Management](#2-team-member-management)
3. [Issue CRUD Operations Enhancement](#3-issue-crud-operations-enhancement)
4. [Sprint Management Completion](#4-sprint-management-completion)
5. [Board Views Enhancement](#5-board-views-enhancement)
6. [Real-Time Features](#6-real-time-features)
7. [Team Chat Enhancement](#7-team-chat-enhancement)
8. [Notifications System](#8-notifications-system)
9. [Search & Filters](#9-search--filters)
10. [Advanced Custom Fields](#10-advanced-custom-fields)
11. [Version/Release Management](#11-versionrelease-management)
12. [Import/Export Bulk Operations](#12-importexport-bulk-operations)

---

## 1. PROJECT INVITATIONS SYSTEM

### 📊 **Current Status Analysis**

✅ **What Works:**
- Email invitations sent successfully
- Invitation acceptance flow functional
- Backend `/api/invitations` endpoints exist
- Email templates working

❌ **What's Missing:**
- No invitation management UI
- Can't resend invitations
- No invitation expiry mechanism
- Can't revoke pending invitations
- No bulk invite feature
- Missing invitation history/audit

### 🎯 **Implementation Plan**

#### **Phase 1.1: Database Schema** (2 hours)

**File:** `ayphen-jira-backend/src/entities/ProjectInvitation.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Project } from './Project';

@Entity('project_invitations')
export class ProjectInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  invitedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User;

  @Column({ default: 'pending' }) // pending, accepted, expired, revoked
  status: string;

  @Column()
  role: string; // admin, member, viewer

  @Column({ unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date; // 7 days from creation

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  acceptedById: string;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ nullable: true })
  revokedById: string;

  @Column({ type: 'text', nullable: true })
  message: string; // Personal invitation message

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Migration Script:**
```bash
cd ayphen-jira-backend
npm run typeorm migration:create -- -n AddInvitationEnhancements
```

---

#### **Phase 1.2: Backend API Enhancements** (6 hours)

**File:** `ayphen-jira-backend/src/routes/invitations.ts`

**New Endpoints:**

```typescript
// GET /api/invitations/project/:projectId - List all invitations for a project
router.get('/project/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { status } = req.query; // filter by status
  
  const where: any = { projectId };
  if (status) where.status = status;
  
  const invitations = await invitationRepo.find({
    where,
    relations: ['invitedBy', 'project'],
    order: { createdAt: 'DESC' }
  });
  
  res.json(invitations);
});

// POST /api/invitations/resend/:id - Resend invitation email
router.post('/resend/:id', async (req, res) => {
  const { id } = req.params;
  const invitation = await invitationRepo.findOne({ where: { id } });
  
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found' });
  }
  
  if (invitation.status !== 'pending') {
    return res.status(400).json({ error: 'Can only resend pending invitations' });
  }
  
  // Check if expired, generate new token if needed
  if (new Date() > invitation.expiresAt) {
    invitation.token = generateToken();
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitationRepo.save(invitation);
  }
  
  // Send email
  await emailService.sendEmail(
    invitation.email,
    'Project Invitation - Ayphen PM',
    generateInvitationEmail(invitation)
  );
  
  res.json({ message: 'Invitation resent successfully' });
});

// DELETE /api/invitations/:id - Revoke invitation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body; // Who is revoking
  
  const invitation = await invitationRepo.findOne({ where: { id } });
  
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found' });
  }
  
  if (invitation.status !== 'pending') {
    return res.status(400).json({ error: 'Can only revoke pending invitations' });
  }
  
  invitation.status = 'revoked';
  invitation.revokedAt = new Date();
  invitation.revokedById = userId;
  
  await invitationRepo.save(invitation);
  
  res.json({ message: 'Invitation revoked successfully' });
});

// POST /api/invitations/bulk - Send bulk invitations
router.post('/bulk', async (req, res) => {
  const { emails, projectId, role, message, invitedById } = req.body;
  
  const invitations = [];
  const errors = [];
  
  for (const email of emails) {
    try {
      // Check if user already in project
      const existingMember = await projectMemberRepo.findOne({
        where: { projectId, userEmail: email }
      });
      
      if (existingMember) {
        errors.push({ email, error: 'Already a member' });
        continue;
      }
      
      // Create invitation
      const token = generateToken();
      const invitation = invitationRepo.create({
        email,
        projectId,
        role,
        message,
        invitedById,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending'
      });
      
      await invitationRepo.save(invitation);
      
      // Send email
      await emailService.sendEmail(
        email,
        'Project Invitation - Ayphen PM',
        generateInvitationEmail(invitation)
      );
      
      invitations.push(invitation);
    } catch (error) {
      errors.push({ email, error: error.message });
    }
  }
  
  res.json({
    success: invitations.length,
    failed: errors.length,
    invitations,
    errors
  });
});

// Background job to expire old invitations
async function expireOldInvitations() {
  const expiredInvitations = await invitationRepo.find({
    where: {
      status: 'pending',
      expiresAt: LessThan(new Date())
    }
  });
  
  for (const invitation of expiredInvitations) {
    invitation.status = 'expired';
    await invitationRepo.save(invitation);
  }
}

// Run every hour
setInterval(expireOldInvitations, 60 * 60 * 1000);
```

---

#### **Phase 1.3: Frontend Components** (8 hours)

**File:** `ayphen-jira/src/components/Invitations/InvitationManager.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, Input, message, Select, Tooltip, Space } from 'antd';
import { Mail, Send, Ban, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import styled from 'styled-components';

const API_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
  invitedBy: { name: string };
}

export const InvitationManager: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkRole, setBulkRole] = useState('member');
  const [bulkMessage, setBulkMessage] = useState('');

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/invitations/project/${projectId}`);
      setInvitations(response.data);
    } catch (error) {
      message.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await axios.post(`${API_URL}/invitations/resend/${id}`);
      message.success('Invitation resent successfully');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to resend invitation');
    }
  };

  const handleRevoke = async (id: string) => {
    Modal.confirm({
      title: 'Revoke Invitation?',
      content: 'This user will no longer be able to accept this invitation.',
      okText: 'Revoke',
      okType: 'danger',
      onOk: async () => {
        try {
          const userId = localStorage.getItem('userId');
          await axios.delete(`${API_URL}/invitations/${id}`, {
            data: { userId }
          });
          message.success('Invitation revoked');
          loadInvitations();
        } catch (error) {
          message.error('Failed to revoke invitation');
        }
      }
    });
  };

  const handleBulkInvite = async () => {
    try {
      const emails = bulkEmails.split('\n').filter(e => e.trim());
      const userId = localStorage.getItem('userId');
      
      const response = await axios.post(`${API_URL}/invitations/bulk`, {
        emails,
        projectId,
        role: bulkRole,
        message: bulkMessage,
        invitedById: userId
      });
      
      message.success(`Sent ${response.data.success} invitations`);
      if (response.data.failed > 0) {
        message.warning(`${response.data.failed} invitations failed`);
      }
      
      setBulkModalVisible(false);
      setBulkEmails('');
      setBulkMessage('');
      loadInvitations();
    } catch (error) {
      message.error('Failed to send bulk invitations');
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
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending: 'orange',
          accepted: 'green',
          expired: 'gray',
          revoked: 'red'
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Invited By',
      dataIndex: ['invitedBy', 'name'],
      key: 'invitedBy',
    },
    {
      title: 'Sent',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => {
        const isExpired = new Date(date) < new Date();
        return (
          <span style={{ color: isExpired ? '#ff4d4f' : '#52c41a' }}>
            {new Date(date).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Invitation) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Resend">
                <Button
                  icon={<Send size={14} />}
                  size="small"
                  onClick={() => handleResend(record.id)}
                />
              </Tooltip>
              <Tooltip title="Revoke">
                <Button
                  icon={<Ban size={14} />}
                  danger
                  size="small"
                  onClick={() => handleRevoke(record.id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Container>
      <Header>
        <h2>Project Invitations</h2>
        <Button
          type="primary"
          icon={<Users size={16} />}
          onClick={() => setBulkModalVisible(true)}
        >
          Bulk Invite
        </Button>
      </Header>

      <Table
        dataSource={invitations}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Bulk Invite Team Members"
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        onOk={handleBulkInvite}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <label>Email Addresses (one per line):</label>
          <Input.TextArea
            rows={6}
            value={bulkEmails}
            onChange={(e) => setBulkEmails(e.target.value)}
            placeholder="john@example.com&#10;jane@example.com&#10;..."
          />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label>Role:</label>
          <Select
            style={{ width: '100%' }}
            value={bulkRole}
            onChange={setBulkRole}
          >
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="member">Member</Select.Option>
            <Select.Option value="viewer">Viewer</Select.Option>
          </Select>
        </div>
        
        <div>
          <label>Personal Message (Optional):</label>
          <Input.TextArea
            rows={3}
            value={bulkMessage}
            onChange={(e) => setBulkMessage(e.target.value)}
            placeholder="Join our team to collaborate on this project!"
          />
        </div>
      </Modal>
    </Container>
  );
};

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;
```

**Add to Project Settings:**

```typescript
// In ProjectSettingsView.tsx, add new tab:
{
  key: 'invitations',
  label: 'Invitations',
  icon: <Mail size={14} />
}

// Render in content area:
case 'invitations':
  return <InvitationManager projectId={project.id} />;
```

---

#### **Phase 1.4: Testing Checklist** (2 hours)

- [ ] Send single invitation
- [ ] Send bulk invitations (10+ emails)
- [ ] Resend invitation
- [ ] Revoke invitation
- [ ] Accept invitation
- [ ] Invitation expires after 7 days
- [ ] Can't accept revoked invitation
- [ ] Can't accept expired invitation
- [ ] Email templates render correctly
- [ ] Invitation history displays properly

**Total Effort:** 18 hours

---

## 2. TEAM MEMBER MANAGEMENT

### 📊 **Current Status**

✅ **Working:**
- Basic member addition
- Project member roles
- Member listing

❌ **Missing:**
- Can't remove members
- Can't change member roles
- No member activity tracking
- No member permissions view
- Missing member search/filter

### 🎯 **Implementation Plan**

#### **Phase 2.1: Backend Enhancements** (4 hours)

**File:** `ayphen-jira-backend/src/routes/project-members.ts`

```typescript
// PUT /api/project-members/:id/role - Change member role
router.put('/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role, updatedBy } = req.body;
  
  const member = await projectMemberRepo.findOne({ where: { id } });
  
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  // Don't allow changing your own role if you're the last admin
  if (member.role === 'admin' && role !== 'admin') {
    const adminCount = await projectMemberRepo.count({
      where: { projectId: member.projectId, role: 'admin' }
    });
    
    if (adminCount === 1) {
      return res.status(400).json({
        error: 'Cannot remove last admin. Assign another admin first.'
      });
    }
  }
  
  member.role = role;
  await projectMemberRepo.save(member);
  
  // Log activity
  await activityLogRepo.create({
    projectId: member.projectId,
    userId: updatedBy,
    action: 'ROLE_CHANGED',
    targetType: 'member',
    targetId: id,
    metadata: { oldRole: member.role, newRole: role }
  }).save();
  
  res.json(member);
});

// DELETE /api/project-members/:id - Remove member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { removedBy } = req.body;
  
  const member = await projectMemberRepo.findOne({ where: { id } });
  
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  // Don't allow removing last admin
  if (member.role === 'admin') {
    const adminCount = await projectMemberRepo.count({
      where: { projectId: member.projectId, role: 'admin' }
    });
    
    if (adminCount === 1) {
      return res.status(400).json({
        error: 'Cannot remove last admin'
      });
    }
  }
  
  // Unassign all issues
  await issueRepo.update(
    { projectId: member.projectId, assigneeId: member.userId },
    { assigneeId: null }
  );
  
  await projectMemberRepo.delete(id);
  
  // Log activity
  await activityLogRepo.create({
    projectId: member.projectId,
    userId: removedBy,
    action: 'MEMBER_REMOVED',
    targetType: 'member',
    targetId: id
  }).save();
  
  res.json({ message: 'Member removed successfully' });
});

// GET /api/project-members/:projectId/activity - Member activity summary
router.get('/:projectId/activity', async (req, res) => {
  const { projectId } = req.params;
  
  const members = await projectMemberRepo.find({
    where: { projectId },
    relations: ['user']
  });
  
  const activity = [];
  
  for (const member of members) {
    const issuesCreated = await issueRepo.count({
      where: { projectId, reporterId: member.userId }
    });
    
    const issuesAssigned = await issueRepo.count({
      where: { projectId, assigneeId: member.userId }
    });
    
    const issuesResolved = await issueRepo.count({
      where: { 
        projectId, 
        assigneeId: member.userId,
        status: 'done'
      }
    });
    
    const commentsCount = await commentRepo.count({
      where: { userId: member.userId }
    });
    
    activity.push({
      ...member,
      activity: {
        issuesCreated,
        issuesAssigned,
        issuesResolved,
        commentsCount,
        lastActive: await getLastActivity(member.userId, projectId)
      }
    });
  }
  
  res.json(activity);
});
```

---

#### **Phase 2.2: Frontend Component** (6 hours)

**File:** `ayphen-jira/src/components/TeamManagement/TeamMemberList.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Avatar, Modal, Select, Input, message, Dropdown, Menu } from 'antd';
import { UserPlus, MoreVertical, Shield, Trash2, Search } from 'lucide-react';
import axios from 'axios';

export const TeamMemberList: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/project-members/${projectId}/activity`);
      setMembers(response.data);
    } catch (error) {
      message.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const userId = localStorage.getItem('userId');
      await axios.put(`/api/project-members/${memberId}/role`, {
        role: newRole,
        updatedBy: userId
      });
      message.success('Role updated successfully');
      loadMembers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    Modal.confirm({
      title: 'Remove Team Member?',
      content: 'This member will lose access to the project. All assigned issues will be unassigned.',
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          const userId = localStorage.getItem('userId');
          await axios.delete(`/api/project-members/${memberId}`, {
            data: { removedBy: userId }
          });
          message.success('Member removed successfully');
          loadMembers();
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Failed to remove member');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Member',
      key: 'member',
      render: (record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
            {record.user.name[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.user.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{record.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (record: any) => (
        <Select
          value={record.role}
          onChange={(role) => handleRoleChange(record.id, role)}
          style={{ width: 120 }}
        >
          <Select.Option value="admin">
            <Tag color="red">ADMIN</Tag>
          </Select.Option>
          <Select.Option value="member">
            <Tag color="blue">MEMBER</Tag>
          </Select.Option>
          <Select.Option value="viewer">
            <Tag color="gray">VIEWER</Tag>
          </Select.Option>
        </Select>
      ),
    },
    {
      title: 'Issues Created',
      dataIndex: ['activity', 'issuesCreated'],
      key: 'issuesCreated',
    },
    {
      title: 'Issues Assigned',
      dataIndex: ['activity', 'issuesAssigned'],
      key: 'issuesAssigned',
    },
    {
      title: 'Issues Resolved',
      dataIndex: ['activity', 'issuesResolved'],
      key: 'issuesResolved',
    },
    {
      title: 'Comments',
      dataIndex: ['activity', 'commentsCount'],
      key: 'commentsCount',
    },
    {
      title: 'Last Active',
      dataIndex: ['activity', 'lastActive'],
      key: 'lastActive',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Button
          danger
          size="small"
          icon={<Trash2 size={14} />}
          onClick={() => handleRemoveMember(record.id)}
        >
          Remove
        </Button>
      ),
    },
  ];

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const filteredMembers = members.filter((m: any) =>
    m.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Input
          prefix={<Search size={16} />}
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
      </div>
      
      <Table
        dataSource={filteredMembers}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};
```

**Total Effort:** 10 hours

---

## 3. ISSUE CRUD OPERATIONS ENHANCEMENT

### 📊 **Current Status**

✅ **Working:**
- Create issues ✅
- View issues ✅  
- Edit issues ✅
- Delete issues ✅

❌ **Missing:**
- No bulk edit
- No clone/duplicate
- No move to different project
- No issue archiving (soft delete)
- No issue templates
- No quick create (keyboard shortcut)

### 🎯 **Implementation Plan**

#### **Phase 3.1: Bulk Operations Backend** (5 hours)

**File:** `ayphen-jira-backend/src/routes/bulk-operations.ts`

```typescript
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';

const router = Router();
const issueRepo = AppDataSource.getRepository(Issue);

// POST /api/bulk-operations/edit - Bulk edit issues
router.post('/edit', async (req, res) => {
  const { issueIds, updates, userId } = req.body;
  
  // Allowed bulk edit fields
  const allowedFields = ['status', 'priority', 'assigneeId', 'sprintId', 'labels'];
  const filteredUpdates: any = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  
  filteredUpdates.updatedBy = userId;
  
  try {
    await issueRepo.update(
      { id: In(issueIds) },
      filteredUpdates
    );
    
    const updatedIssues = await issueRepo.findByIds(issueIds);
    
    // Log activity for each issue
    for (const issue of updatedIssues) {
      await activityLogRepo.create({
        projectId: issue.projectId,
        userId,
        action: 'BULK_EDIT',
        targetType: 'issue',
        targetId: issue.id,
        metadata: { updates: filteredUpdates }
      }).save();
    }
    
    res.json({
      success: true,
      updated: updatedIssues.length,
      issues: updatedIssues
    });
  } catch (error) {
    res.status(500).json({ error: 'Bulk edit failed' });
  }
});

// POST /api/bulk-operations/archive - Archive multiple issues
router.post('/archive', async (req, res) => {
  const { issueIds, userId } = req.body;
  
  try {
    await issueRepo.update(
      { id: In(issueIds) },
      {
        archived: true,
        archivedAt: new Date(),
        archivedById: userId
      }
    );
    
    res.json({
      success: true,
      archived: issueIds.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Archive failed' });
  }
});

// POST /api/bulk-operations/clone - Clone multiple issues
router.post('/clone', async (req, res) => {
  const { issueIds, targetProjectId, userId } = req.body;
  
  const clonedIssues = [];
  
  try {
    for (const issueId of issueIds) {
      const original = await issueRepo.findOne({ where: { id: issueId } });
      
      if (!original) continue;
      
      const { id, key, createdAt, updatedAt, ...issueData } = original as any;
      
      const cloned = issueRepo.create({
        ...issueData,
        projectId: targetProjectId,
        reporterId: userId,
        summary: `Copy of ${original.summary}`,
        key: await generateIssueKey(targetProjectId)
      });
      
      await issueRepo.save(cloned);
      clonedIssues.push(cloned);
    }
    
    res.json({
      success: true,
      cloned: clonedIssues.length,
      issues: clonedIssues
    });
  } catch (error) {
    res.status(500).json({ error: 'Clone failed' });
  }
});

// POST /api/bulk-operations/move - Move issues to different project
router.post('/move', async (req, res) => {
  const { issueIds, targetProjectId, userId } = req.body;
  
  try {
    const issues = await issueRepo.findByIds(issueIds);
    
    for (const issue of issues) {
      // Generate new key for target project
      const newKey = await generateIssueKey(targetProjectId);
      
      issue.key = newKey;
      issue.projectId = targetProjectId;
      issue.updatedBy = userId;
      
      await issueRepo.save(issue);
    }
    
    res.json({
      success: true,
      moved: issues.length,
      issues
    });
  } catch (error) {
    res.status(500).json({ error: 'Move failed' });
  }
});

export default router;
```

---

#### **Phase 3.2: Issue Templates System** (6 hours)

**Database Entity:**

```typescript
// File: ayphen-jira-backend/src/entities/IssueTemplate.ts
@Entity('issue_templates')
export class IssueTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; // bug, story, task, epic

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  defaultValues: {
    priority?: string;
    labels?: string[];
    components?: string[];
    storyPoints?: number;
  };

  @Column({ nullable: true })
  projectId: string; // null = global template

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

**API Endpoints:**

```typescript
// GET /api/templates - List all templates
// POST /api/templates - Create template
// POST /api/issues/from-template/:templateId - Create issue from template
```

**Total Effort:** 11 hours

---

## 4-12. [CONTINUED IN NEXT SECTIONS...]

Due to length, I'll provide the remaining sections (Sprint Management, Board Views, Real-Time, etc.) in a structured format:

---

## SUMMARY: EFFORT BREAKDOWN

| Feature | Backend | Frontend | Testing | Total |
|---------|---------|----------|---------|-------|
| 1. Project Invitations | 8h | 8h | 2h | **18h** |
| 2. Team Management | 4h | 6h | 2h | **12h** |
| 3. Issue CRUD Enhancements | 5h | 6h | 2h | **13h** |
| 4. Sprint Management | 6h | 8h | 2h | **16h** |
| 5. Board Views | 4h | 10h | 2h | **16h** |
| 6. Real-Time Features | 8h | 6h | 3h | **17h** |
| 7. Team Chat | 5h | 7h | 2h | **14h** |
| 8. Notifications | 6h | 8h | 2h | **16h** |
| 9. Search & Filters | 8h | 10h | 3h | **21h** |
| 10. Custom Fields | 10h | 12h | 3h | **25h** |
| 11. Version/Release | 8h | 10h | 2h | **20h** |
| 12. Import/Export | 10h | 8h | 3h | **21h** |
| **TOTAL** | **82h** | **99h** | **28h** | **209h** |

---

## 🚀 RECOMMENDED EXECUTION SEQUENCE

### **Week 1-2: Foundation** (60h)
1. Project Invitations (18h)
2. Team Management (12h)
3. Issue CRUD (13h)
4. Notifications (16h)

### **Week 3-4: Core Features** (70h)
5. Sprint Management (16h)
6. Board Views (16h)
7. Search & Filters (21h)
8. Real-Time (17h)

### **Week 5-6: Advanced** (79h)
9. Team Chat Enhancement (14h)
10. Custom Fields (25h)
11. Version/Release (20h)
12. Import/Export (21h)

---

## 📋 NEXT STEPS

1. **Review this plan** and confirm priorities
2. **Select Phase 1 features** to implement first
3. **Set up development branch**: `feature/enterprise-enhancements`
4. **Begin with Project Invitations** (highest ROI, quickest win)
5. **Daily progress tracking** via our conversations

Would you like me to:
1. Expand any specific section with full implementation code?
2. Create database migration scripts?
3. Start implementing Phase 1 (Project Invitations)?

Let me know which feature to tackle first! 🚀
