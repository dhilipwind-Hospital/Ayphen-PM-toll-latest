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
      const daysLeft = Math.floor(hoursLeft / 24);
      return <Tag color="blue">Expires in {daysLeft}d</Tag>;
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
