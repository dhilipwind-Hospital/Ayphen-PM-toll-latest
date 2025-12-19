import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, Input, Button, Progress, Avatar, Row, Col, Modal, Form, Select, message, Popconfirm, Empty } from 'antd';
import { Search, UserPlus, Users, CheckCircle, Activity, Clock, Edit, Trash2, Mail } from 'lucide-react';
import axios from 'axios';
import { useStore } from '../store/useStore';

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

const API_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  completionRate: number;
  stats: {
    total: number;
    done: number;
    active: number;
  };
}

export const PeoplePage: React.FC = () => {
  const { currentProject } = useStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentProject) {
      loadTeamMembers();
    }
  }, [currentProject]);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const usersResponse = await axios.get(`${API_URL}/users`, {
        params: { projectId: currentProject?.id }
      });
      const issuesResponse = await axios.get(`${API_URL}/issues`, { params: { userId } });

      const users = usersResponse.data;
      const issues = issuesResponse.data;

      const teamMembers: TeamMember[] = users.map((user: any, index: number) => {
        const userIssues = issues.filter((issue: any) => issue.assignee?.id === user.id);
        const doneIssues = userIssues.filter((issue: any) => issue.status === 'done');
        const activeIssues = userIssues.filter((issue: any) =>
          issue.status !== 'done' && issue.status !== 'backlog'
        );

        const colors = ['#1890FF', '#52C41A', '#722ED1', '#FA8C16', '#13C2C2', '#EB2F96'];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'member',
          avatarColor: colors[index % colors.length],
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
      const payload = {
        name: values.name,
        email: values.email,
        role: values.role || 'member',
      };

      const response = await axios.post(`${API_URL}/users`, payload);

      message.success('Team member added successfully');
      setIsAddModalOpen(false);
      form.resetFields();
      loadTeamMembers();
    } catch (error: any) {
      console.error('Failed to add member:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      message.error(error.response?.data?.error || 'Failed to add team member');
    }
  };

  const handleEditMember = async (values: any) => {
    if (!editingMember) {
      console.error('No editing member set');
      return;
    }


    try {
      const payload = {
        name: values.name,
        email: values.email,
        role: values.role,
      };

      const response = await axios.patch(`${API_URL}/users/${editingMember.id}`, payload);

      message.success('Team member updated successfully');
      setIsEditModalOpen(false);
      setEditingMember(null);
      form.resetFields();
      loadTeamMembers();
    } catch (error: any) {
      console.error('Failed to update member:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      message.error(error.response?.data?.error || 'Failed to update team member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/users/${memberId}`);
      message.success('Team member removed successfully');
      loadTeamMembers();
    } catch (error: any) {
      console.error('Failed to delete member:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to remove team member';
      message.error(errorMessage);
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
          <Button
            type="primary"
            icon={<UserPlus size={16} />}
            size="large"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Member
          </Button>
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

      <Row gutter={[16, 16]}>
        {filteredMembers.map((member) => (
          <Col xs={24} sm={12} lg={8} key={member.id}>
            <MemberCard>
              <CardActions>
                <ActionButton
                  type="text"
                  icon={<Edit size={16} />}
                  onClick={() => openEditModal(member)}
                />
                <Popconfirm
                  title="Delete team member"
                  description="Are you sure you want to delete this team member?"
                  onConfirm={() => handleDeleteMember(member.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <ActionButton
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                  />
                </Popconfirm>
              </CardActions>

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

      {/* Add Member Modal */}
      <Modal
        title="Add Team Member"
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
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter member name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="Enter email address" />
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
            <Button type="primary" htmlType="submit" block>
              Add Member
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
            <Input placeholder="Enter member name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="Enter email address" />
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
