import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Table, Tag, Button, Modal, Form, Input, Select, message, Space, Avatar, Popconfirm } from 'antd';
import { Plus, Users, Edit, Trash2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { usersApi } from '../services/api';
import axios from 'axios';
import { ENV } from '../config/env';

const Container = styled.div`
  padding: 0;
  background: #fff;
  min-height: calc(100vh - 56px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #172B4D;
`;

const TableContainer = styled.div`
  padding: 0;
  background: #fff;
`;

const API_URL = ENV.API_URL;

export const TeamsView: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, isInitialized } = useStore();
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentProject) {
      loadTeams();
    }
  }, [currentProject]);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersApi.getAll();
        setUsers(response.data || []);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    fetchUsers();
  }, []);

  const loadTeams = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/teams?projectId=${currentProject.id}`);
      setTeams(res.data);
    } catch (error) {
      console.error('Failed to load teams:', error);
      message.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const data = {
        ...values,
        projectId: currentProject?.id,
        memberIds: values.memberIds || []
      };

      if (editingTeam) {
        await axios.put(`${API_URL}/teams/${editingTeam.id}`, data);
        message.success('Team updated successfully');
      } else {
        await axios.post(`${API_URL}/teams`, data);
        message.success('Team created successfully');
      }

      setModalVisible(false);
      setEditingTeam(null);
      form.resetFields();
      loadTeams();
    } catch (error) {
      console.error('Failed to save team:', error);
      message.error('Failed to save team');
    }
  };

  const handleEdit = (team: any) => {
    setEditingTeam(team);
    form.setFieldsValue(team);
    setModalVisible(true);
  };

  const handleDelete = async (teamId: string) => {
    try {
      await axios.delete(`${API_URL}/teams/${teamId}`);
      message.success('Team deleted successfully');
      loadTeams();
    } catch (error) {
      console.error('Failed to delete team:', error);
      message.error('Failed to delete team');
    }
  };

  const columns = [
    {
      title: 'Team Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} color="#1890ff" />
          <strong>{name}</strong>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <span style={{ color: '#999' }}>No description</span>,
    },
    {
      title: 'Members',
      dataIndex: 'memberIds',
      key: 'memberIds',
      render: (memberIds: string[]) => (
        <div>
          <Tag color="blue">{(memberIds || []).length} members</Tag>
        </div>
      ),
    },
    {
      title: 'Team Lead',
      dataIndex: 'leadId',
      key: 'leadId',
      render: (leadId: string) => leadId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" style={{ background: '#1890ff' }}>
            {leadId.charAt(0).toUpperCase()}
          </Avatar>
          <span>{leadId}</span>
        </div>
      ) : (
        <span style={{ color: '#999' }}>No lead assigned</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<Edit size={14} />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete team?"
            description="Are you sure you want to delete this team?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={14} />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Container>
      <Header>
        <Title>
          <Users size={20} />
          Teams
        </Title>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingTeam(null);
            form.resetFields();
            setModalVisible(true);
          }}
          disabled={!currentProject}
        >
          Create Team
        </Button>
      </Header>

      <TableContainer>
        <Table
          dataSource={teams}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </TableContainer>

      <Modal
        title={editingTeam ? 'Edit Team' : 'Create Team'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTeam(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingTeam ? 'Update' : 'Create'}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="Team Name"
            rules={[{ required: true, message: 'Please enter team name' }]}
          >
            <Input placeholder="e.g., Frontend Team" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe the team's purpose and responsibilities"
            />
          </Form.Item>

          <Form.Item
            name="leadId"
            label="Team Lead"
          >
            <Select placeholder="Select team lead" allowClear showSearch>
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name || user.email}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="memberIds"
            label="Team Members"
          >
            <Select
              mode="multiple"
              placeholder="Select team members"
              allowClear
              showSearch
            >
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name || user.email}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};
