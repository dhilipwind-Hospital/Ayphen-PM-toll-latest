import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, Input, Button, Progress, Avatar, Row, Col, Modal, Form, Select, message, Popconfirm, Empty, Tabs, Table, Tag, Tooltip, Spin } from 'antd';
import { Search, UserPlus, Users, CheckCircle, Activity, Clock, Edit, Trash2, Mail, RefreshCw, XCircle, LayoutGrid, List } from 'lucide-react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { ENV } from '../config/env';

const Container = styled.div`
  padding: 24px;
  background: #F4F5F7;
  min-height: calc(100vh - 56px);
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #172B4D;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #5E6C84;
  margin: 0;
`;

const SearchBar = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const StatsRow = styled(Row)`
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  text-align: center;
  
  .ant-card-body {
    padding: 20px;
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: ${props => props.color};
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #172B4D;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #5E6C84;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const MemberCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
  
  .ant-card-body {
    padding: 24px;
  }
`;

const CardActions = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
`;

const ActionButton = styled(Button)`
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MemberHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const MemberAvatar = styled(Avatar) <{ bgColor: string }>`
  background: ${props => props.bgColor};
  font-size: 32px;
  font-weight: 600;
`;

const MemberInfo = styled.div`
  flex: 1;
`;

const MemberName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #172B4D;
  margin-bottom: 4px;
`;

const MemberRole = styled.div`
  font-size: 14px;
  color: #5E6C84;
`;

const MemberEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #5E6C84;
  margin-bottom: 20px;
`;

const CompletionSection = styled.div`
  margin-bottom: 20px;
`;

const CompletionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const CompletionLabel = styled.div`
  font-size: 12px;
  color: #5E6C84;
  font-weight: 600;
`;

const CompletionRate = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #172B4D;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatItemValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #172B4D;
  margin-bottom: 4px;
`;

const StatItemLabel = styled.div`
  font-size: 11px;
  color: #5E6C84;
  text-transform: uppercase;
  font-weight: 600;
`;

const ViewProfileButton = styled(Button)`
  width: 100%;
`;

const API_URL = ENV.API_URL;

interface TeamMember {
  id: string;
  membershipId: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  joinedAt: string;
  addedBy?: string;
  completionRate: number;
  stats: {
    total: number;
    done: number;
    active: number;
  };
}

export const PeoplePage: React.FC = () => {
  const { currentProject, isInitialized } = useStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);
  const [form] = Form.useForm();

  const [currentUserRole, setCurrentUserRole] = useState<string>('member'); // Default to member

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  useEffect(() => {
    if (currentProject) {
      loadTeamMembers();
      loadInvitations();
    }
  }, [currentProject]);

  const loadInvitations = async () => {
    try {
      const response = await axios.get(`${API_URL}/project-invitations/project/${currentProject?.id}`);
      setInvitations(response.data.filter((i: any) => i.status === 'pending'));
    } catch (error) {
      console.error('Failed to load invitations', error);
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      await axios.post(`${API_URL}/project-invitations/resend/${id}`);
      message.success('Invitation resent successfully');
    } catch (error) {
      message.error('Failed to resend invitation');
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/project-invitations/${id}`);
      message.success('Invitation revoked successfully');
      loadInvitations();
    } catch (error) {
      message.error('Failed to revoke invitation');
    }
  };

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      // Fetch members from the Project Members API safely
      const membersResponse = await axios.get(`${API_URL}/project-members/project/${currentProject?.id}`);
      const issuesResponse = await axios.get(`${API_URL}/issues`, { params: { userId } });

      const projectMembers = membersResponse.data;
      const issues = issuesResponse.data;

      // Load Workflow
      let wfStatuses: any[] = [];
      try {
        const wfId = currentProject?.workflowId || 'workflow-1';
        const wfRes = await axios.get(`${API_URL}/workflows/${wfId}`);
        wfStatuses = wfRes.data.statuses || [];
        setWorkflowStatuses(wfStatuses);
      } catch (e) {
        console.error('Failed to load workflow in PeoplePage', e);
      }

      const doneStatuses = wfStatuses.filter(s => s.category === 'DONE').map(s => s.id);
      const todoStatuses = wfStatuses.filter(s => s.category === 'TODO').map(s => s.id);

      const isDone = (status: string) => {
        if (doneStatuses.length > 0) return doneStatuses.includes(status);
        return status === 'done';
      };

      const isTodo = (status: string) => {
        if (todoStatuses.length > 0) return todoStatuses.includes(status);
        return status === 'todo' || status === 'backlog';
      };

      const teamMembers: TeamMember[] = projectMembers.map((pm: any, index: number) => {
        const user = pm.user;
        // Filter issues where assignee ID matches the user ID
        const userIssues = issues.filter((issue: any) => issue.assignee?.id === user.id);
        const doneIssues = userIssues.filter((issue: any) => isDone(issue.status));
        const activeIssues = userIssues.filter((issue: any) =>
          !isDone(issue.status) && !isTodo(issue.status)
        );

        const colors = ['#1890FF', '#52C41A', '#722ED1', '#FA8C16', '#13C2C2', '#EB2F96'];

        return {
          id: user.id,
          membershipId: pm.id,
          name: user.name,
          email: user.email,
          role: pm.role, // Use role from project membership
          avatarColor: colors[index % colors.length],
          joinedAt: pm.createdAt,
          addedBy: pm.addedBy?.name,
          completionRate: userIssues.length > 0
            ? Math.round((doneIssues.length / userIssues.length) * 100)
            : 0,
          stats: {
            total: userIssues.length,
            done: doneIssues.length,
            active: activeIssues.length,
          },
        };
      });

      // Find current user's role
      const currentUserMember = teamMembers.find(m => m.id === userId);
      if (currentUserMember) {
        setCurrentUserRole(currentUserMember.role);
      }

      setMembers(teamMembers);
    } catch (error) {
      console.error('Failed to load team members:', error);
      message.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (values: any) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!currentProject?.id) {
        message.error('No project selected');
        return;
      }

      const payload = {
        projectId: currentProject.id,
        email: values.email,
        role: values.role || 'member',
        invitedById: userId,
      };

      await axios.post(`${API_URL}/project-invitations`, payload);

      message.success('Invitation sent successfully');
      setIsAddModalOpen(false);
      form.resetFields();
      loadInvitations();
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      message.error(error.response?.data?.error || 'Failed to invite team member');
    }
  };

  const handleEditMember = async (values: any) => {
    if (!editingMember) {
      console.error('No editing member set');
      return;
    }

    try {
      // Only update the Role in the Project Context
      const payload = {
        role: values.role,
      };

      await axios.patch(`${API_URL}/project-members/${editingMember.membershipId}`, payload);

      message.success('Member role updated successfully');
      setIsEditModalOpen(false);
      setEditingMember(null);
      form.resetFields();
      loadTeamMembers();
    } catch (error: any) {
      console.error('Failed to update member:', error);
      message.error(error.response?.data?.error || 'Failed to update member role');
    }
  };

  const handleDeleteMember = async (membershipId: string) => {
    setLoading(true);
    try {
      // Delete the Project Membership, NOT the User
      await axios.delete(`${API_URL}/project-members/${membershipId}`);
      message.success('Member removed from project');
      loadTeamMembers();
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      message.error(error.response?.data?.error || 'Failed to remove team member');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    form.setFieldsValue({
      name: member.name,
      email: member.email,
      role: member.role,
    });
    setIsEditModalOpen(true);
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembers = members.length;
  const activeNow = members.filter(m => m.stats.active > 0).length;
  const tasksCompleted = members.reduce((sum, m) => sum + m.stats.done, 0);
  const inProgress = members.reduce((sum, m) => sum + m.stats.active, 0);

  return (
    <Container>
      <Header>
        <HeaderTop>
          <div>
            <Title>Team</Title>
            <Subtitle>Manage your team members and track their progress</Subtitle>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ background: 'white', padding: 4, borderRadius: 6, display: 'flex', gap: 4 }}>
              <Tooltip title="Grid View">
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'text'}
                  icon={<LayoutGrid size={16} />}
                  onClick={() => setViewMode('grid')}
                />
              </Tooltip>
              <Tooltip title="List View">
                <Button
                  type={viewMode === 'list' ? 'primary' : 'text'}
                  icon={<List size={16} />}
                  onClick={() => setViewMode('list')}
                />
              </Tooltip>
            </div>
            {currentUserRole === 'admin' && (
              <Button
                type="primary"
                icon={<UserPlus size={16} />}
                size="large"
                onClick={() => setIsAddModalOpen(true)}
              >
                Invite Member
              </Button>
            )}
          </div>
        </HeaderTop>
      </Header>

      <SearchBar>
        <Input
          placeholder="Search team members..."
          prefix={<Search size={16} color="#5E6C84" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="large"
          style={{ border: 'none' }}
        />
      </SearchBar>

      <StatsRow gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard>
            <StatIcon color="#1890FF">
              <Users size={24} />
            </StatIcon>
            <StatValue>{totalMembers}</StatValue>
            <StatLabel>Total Members</StatLabel>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard>
            <StatIcon color="#52C41A">
              <Activity size={24} />
            </StatIcon>
            <StatValue>{activeNow}</StatValue>
            <StatLabel>Active Now</StatLabel>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard>
            <StatIcon color="#722ED1">
              <CheckCircle size={24} />
            </StatIcon>
            <StatValue>{tasksCompleted}</StatValue>
            <StatLabel>Tasks Completed</StatLabel>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard>
            <StatIcon color="#FA8C16">
              <Clock size={24} />
            </StatIcon>
            <StatValue>{inProgress}</StatValue>
            <StatLabel>In Progress</StatLabel>
          </StatCard>
        </Col>
      </StatsRow>

      <Tabs defaultActiveKey="members" style={{ marginTop: 24 }}>
        <Tabs.TabPane tab="Team Members" key="members">
          {viewMode === 'grid' ? (
            <Row gutter={[16, 16]}>
              {filteredMembers.map((member) => (
                <Col xs={24} sm={12} lg={8} key={member.id}>
                  <MemberCard>
                    {currentUserRole === 'admin' && (
                      <CardActions>
                        <ActionButton
                          type="text"
                          icon={<Edit size={16} />}
                          onClick={() => openEditModal(member)}
                        />
                        <Popconfirm
                          title="Delete team member"
                          description="Are you sure you want to delete this team member?"
                          onConfirm={() => handleDeleteMember(member.membershipId)}
                          okText="Remove"
                          cancelText="Cancel"
                        >
                          <ActionButton
                            type="text"
                            danger
                            icon={<Trash2 size={16} />}
                          />
                        </Popconfirm>
                      </CardActions>
                    )}

                    <MemberHeader>
                      <MemberAvatar size={80} bgColor={member.avatarColor}>
                        {member.name.charAt(0)}
                      </MemberAvatar>
                      <MemberInfo>
                        <MemberName>{member.name}</MemberName>
                        <MemberRole>{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</MemberRole>
                      </MemberInfo>
                    </MemberHeader>

                    <MemberEmail>
                      <Mail size={14} />
                      {member.email}
                    </MemberEmail>

                    <CompletionSection>
                      <CompletionHeader>
                        <CompletionLabel>Completion Rate</CompletionLabel>
                        <CompletionRate>{member.completionRate}%</CompletionRate>
                      </CompletionHeader>
                      <Progress
                        percent={member.completionRate}
                        showInfo={false}
                        strokeColor={
                          member.completionRate === 100 ? '#52C41A' :
                            member.completionRate >= 50 ? '#1890FF' :
                              '#FA8C16'
                        }
                      />
                    </CompletionSection>

                    <StatsGrid>
                      <StatItem>
                        <StatItemValue>{member.stats.total}</StatItemValue>
                        <StatItemLabel>Total</StatItemLabel>
                      </StatItem>
                      <StatItem>
                        <StatItemValue>{member.stats.done}</StatItemValue>
                        <StatItemLabel>Done</StatItemLabel>
                      </StatItem>
                      <StatItem>
                        <StatItemValue>{member.stats.active}</StatItemValue>
                        <StatItemLabel>Active</StatItemLabel>
                      </StatItem>
                    </StatsGrid>

                    <ViewProfileButton
                      type="default"
                      onClick={() => window.location.href = `/settings/profile?userId=${member.id}`}
                    >
                      View Profile
                    </ViewProfileButton>
                  </MemberCard>
                </Col>
              ))}
            </Row>
          ) : (
            <Table
              dataSource={filteredMembers}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text: string, record: TeamMember) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar style={{ backgroundColor: record.avatarColor }}>{text.charAt(0)}</Avatar>
                      <span>{text}</span>
                    </div>
                  )
                },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color="blue">{role.toUpperCase()}</Tag> },
                {
                  title: 'Joined',
                  dataIndex: 'joinedAt',
                  key: 'joinedAt',
                  render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
                },
                {
                  title: 'Added By',
                  dataIndex: 'addedBy',
                  key: 'addedBy',
                  render: (val: string) => val || '-'
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_: any, record: TeamMember) => (
                    currentUserRole === 'admin' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          icon={<Edit size={14} />}
                          size="small"
                          onClick={() => openEditModal(record)}
                        />
                        <Popconfirm
                          title="Remove member?"
                          onConfirm={() => handleDeleteMember(record.membershipId)}
                          okText="Remove"
                          cancelText="Cancel"
                        >
                          <Button
                            icon={<Trash2 size={14} />}
                            size="small"
                            danger
                          />
                        </Popconfirm>
                      </div>
                    ) : null
                  )
                }
              ]}
            />
          )}
        </Tabs.TabPane>
        <Tabs.TabPane tab={`Pending Invitations (${invitations.length})`} key="invitations">
          <Table
            dataSource={invitations}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'Email', dataIndex: 'email', key: 'email' },
              { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color="blue">{role.toUpperCase()}</Tag> },
              { title: 'Sent By', dataIndex: ['invitedBy', 'name'], key: 'invitedBy' },
              { title: 'Sent At', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
              {
                title: 'Actions',
                key: 'actions',
                render: (_: any, record: any) => (
                  currentUserRole === 'admin' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Tooltip title="Resend Invitation">
                        <Button
                          icon={<RefreshCw size={14} />}
                          size="small"
                          onClick={() => handleResendInvitation(record.id)}
                        />
                      </Tooltip>
                      <Tooltip title="Revoke Invitation">
                        <Popconfirm
                          title="Revoke invitation?"
                          onConfirm={() => handleRevokeInvitation(record.id)}
                          okText="Revoke"
                          cancelText="Cancel"
                        >
                          <Button
                            icon={<XCircle size={14} />}
                            size="small"
                            danger
                          />
                        </Popconfirm>
                      </Tooltip>
                    </div>
                  ) : null
                )
              }
            ]}
          />
        </Tabs.TabPane>
      </Tabs>

      {/* Add Member Modal */}
      <Modal
        title="Invite Team Member"
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMember}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="Enter email address to invite" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            initialValue="member"
          >
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<Mail size={16} />}>
              Invite Member
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        title="Edit Team Member"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingMember(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditMember}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter member name" disabled />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="Enter email address" disabled />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
          >
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Member
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};
