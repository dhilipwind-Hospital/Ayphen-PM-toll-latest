import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Modal, message, Space, Tag, Popconfirm } from 'antd';
import { UserAddOutlined, DeleteOutlined, CrownOutlined, MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import { InviteModal } from '../../components/InviteModal';
import { PendingInvitations } from '../../components/PendingInvitations';

interface ProjectMembersTabProps {
  projectId: string;
}

export const ProjectMembersTab: React.FC<ProjectMembersTabProps> = ({ projectId }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('member');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [invitationsRefreshTrigger, setInvitationsRefreshTrigger] = useState(0);
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    loadMembers();
    loadAllUsers();
  }, [projectId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `https://ayphen-pm-toll-latest.onrender.com/api/project-members/project/${projectId}`
      );
      setMembers(data);
    } catch (error) {
      message.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data } = await axios.get('https://ayphen-pm-toll-latest.onrender.com/api/auth/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      message.warning('Please select a user');
      return;
    }

    try {
      await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/project-members', {
        projectId,
        userId: selectedUser,
        role: selectedRole,
        addedById: currentUserId,
      });
      message.success('Member added successfully');
      setAddModalVisible(false);
      setSelectedUser(null);
      setSelectedRole('member');
      loadMembers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to add member';
      message.error(errorMsg);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await axios.delete(`https://ayphen-pm-toll-latest.onrender.com/api/project-members/${memberId}`);
      message.success('Member removed from project');
      loadMembers();
    } catch (error) {
      message.error('Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await axios.patch(`https://ayphen-pm-toll-latest.onrender.com/api/project-members/${memberId}`, {
        role: newRole,
      });
      message.success('Role updated successfully');
      loadMembers();
    } catch (error) {
      message.error('Failed to update role');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'member':
        return 'blue';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: ['user', 'name'],
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          {name}
          {record.role === 'admin' && <CrownOutlined style={{ color: '#faad14' }} />}
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['user', 'email'],
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: any) => (
        <Select
          value={role}
          onChange={(newRole) => handleChangeRole(record.id, newRole)}
          style={{ width: 120 }}
          disabled={record.userId === currentUserId} // Can't change your own role
        >
          <Select.Option value="admin">
            <Tag color={getRoleColor('admin')}>Admin</Tag>
          </Select.Option>
          <Select.Option value="member">
            <Tag color={getRoleColor('member')}>Member</Tag>
          </Select.Option>
          <Select.Option value="viewer">
            <Tag color={getRoleColor('viewer')}>Viewer</Tag>
          </Select.Option>
        </Select>
      ),
    },
    {
      title: 'Added By',
      dataIndex: ['addedBy', 'name'],
      key: 'addedBy',
      render: (name: string) => name || 'System',
    },
    {
      title: 'Added On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Popconfirm
          title="Remove member from project?"
          description="This user will lose access to all project data."
          onConfirm={() => handleRemoveMember(record.id)}
          okText="Remove"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          disabled={record.userId === currentUserId} // Can't remove yourself
        >
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            disabled={record.userId === currentUserId}
          >
            Remove
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Filter out users who are already members
  const availableUsers = users.filter(
    user => !members.some(member => member.userId === user.id)
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Project Members ({members.length})</h3>
          <p style={{ color: '#8c8c8c' }}>
            Manage who has access to this project
          </p>
        </div>
        <Space>
          <Button
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
      </div>

      <PendingInvitations
        projectId={projectId}
        refreshTrigger={invitationsRefreshTrigger}
      />

      <Table
        dataSource={members}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title="Add Member to Project"
        open={addModalVisible}
        onOk={handleAddMember}
        onCancel={() => {
          setAddModalVisible(false);
          setSelectedUser(null);
          setSelectedRole('member');
        }}
        okText="Add Member"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Select User <span style={{ color: 'red' }}>*</span>
          </label>
          <Select
            placeholder="Choose a user to add"
            style={{ width: '100%' }}
            value={selectedUser}
            onChange={setSelectedUser}
            showSearch
            optionFilterProp="children"
          >
            {availableUsers.map(user => (
              <Select.Option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </Select.Option>
            ))}
          </Select>
          {availableUsers.length === 0 && (
            <p style={{ color: '#8c8c8c', marginTop: 8, fontSize: 12 }}>
              All users are already members of this project
            </p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Role <span style={{ color: 'red' }}>*</span>
          </label>
          <Select
            style={{ width: '100%' }}
            value={selectedRole}
            onChange={setSelectedRole}
          >
            <Select.Option value="admin">
              <Space>
                <Tag color="red">Admin</Tag>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Full access + member management
                </span>
              </Space>
            </Select.Option>
            <Select.Option value="member">
              <Space>
                <Tag color="blue">Member</Tag>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Can view and edit issues
                </span>
              </Space>
            </Select.Option>
            <Select.Option value="viewer">
              <Space>
                <Tag color="default">Viewer</Tag>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Read-only access
                </span>
              </Space>
            </Select.Option>
          </Select>
        </div>
      </Modal>

      <InviteModal
        visible={inviteModalVisible}
        projectId={projectId}
        projectName="Project"
        existingUsers={users}
        onClose={() => setInviteModalVisible(false)}
        onSuccess={() => {
          loadMembers();
          setInvitationsRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
};
