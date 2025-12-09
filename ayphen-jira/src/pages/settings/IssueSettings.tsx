import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Table, Tag, Modal, message, Spin } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';
import styled from 'styled-components';
import { settingsApi } from '../../services/api';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.1);
`;

export const IssueSettings: React.FC = () => {
  const [issueTypes, setIssueTypes] = useState<any[]>([]);
  const [priorities] = useState([
    { id: '1', name: 'Highest', color: '#DC2626', order: 1 },
    { id: '2', name: 'High', color: '#EF4444', order: 2 },
    { id: '3', name: 'Medium', color: '#F59E0B', order: 3 },
    { id: '4', name: 'Low', color: '#10B981', order: 4 },
    { id: '5', name: 'Lowest', color: '#6B7280', order: 5 }
  ]);
  const [statuses] = useState([
    { id: '1', name: 'To Do', category: 'todo', color: '#6B7280' },
    { id: '2', name: 'In Progress', category: 'inprogress', color: '#3B82F6' },
    { id: '3', name: 'In Review', category: 'review', color: '#F59E0B' },
    { id: '4', name: 'Done', category: 'done', color: '#10B981' }
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssueTypes();
  }, []);

  const loadIssueTypes = async () => {
    try {
      const response = await settingsApi.getIssueTypes();
      setIssueTypes(response.data || []);
    } catch (error) {
      console.error('Error loading issue types:', error);
      message.error('Failed to load issue types');
    } finally {
      setLoading(false);
    }
  };

  const issueTypeColumns = [
    {
      title: 'Icon',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon: string) => <span style={{ fontSize: '20px' }}>{icon}</span>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => (
        <div style={{ 
          width: 20, 
          height: 20, 
          backgroundColor: color, 
          borderRadius: 4 
        }} />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            size="small" 
            icon={<Edit size={14} />}
            onClick={() => {
              setEditingType(record);
              setModalVisible(true);
            }}
          />
          <Button 
            size="small" 
            danger 
            icon={<Trash2 size={14} />}
            onClick={async () => {
              try {
                await settingsApi.deleteIssueType(record.id);
                message.success('Issue type deleted');
                loadIssueTypes();
              } catch (error) {
                message.error('Failed to delete issue type');
              }
            }}
          />
        </div>
      )
    }
  ];

  const priorityColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      render: (color: string, record: any) => (
        <Tag color={color}>{record.name}</Tag>
      )
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order'
    }
  ];

  const statusColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag>{category.replace('-', ' ')}</Tag>
      )
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      render: (color: string, record: any) => (
        <Tag color={color}>{record.name}</Tag>
      )
    }
  ];

  const handleSaveIssueType = async (values: any) => {
    try {
      if (editingType) {
        await settingsApi.updateIssueType(editingType.id, values);
        message.success('Issue type updated');
      } else {
        await settingsApi.createIssueType(values);
        message.success('Issue type created');
      }
      loadIssueTypes();
      setModalVisible(false);
      setEditingType(null);
    } catch (error) {
      message.error('Failed to save issue type');
    }
  };

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading settings..." />
      </Container>
    );
  }

  return (
    <Container>
      <h1>Issue Settings</h1>

      <StyledCard 
        title="Issue Types" 
        extra={
          <Button 
            type="primary" 
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingType(null);
              setModalVisible(true);
            }}
          >
            Add Issue Type
          </Button>
        }
      >
        <Table 
          columns={issueTypeColumns} 
          dataSource={issueTypes} 
          rowKey="id"
          pagination={false}
        />
      </StyledCard>

      <StyledCard title="Priorities">
        <Table 
          columns={priorityColumns} 
          dataSource={priorities} 
          rowKey="id"
          pagination={false}
        />
      </StyledCard>

      <StyledCard title="Statuses">
        <Table 
          columns={statusColumns} 
          dataSource={statuses} 
          rowKey="id"
          pagination={false}
        />
      </StyledCard>

      <Modal
        title={editingType ? 'Edit Issue Type' : 'Create Issue Type'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingType(null);
        }}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleSaveIssueType}
          initialValues={editingType}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="icon" label="Icon" rules={[{ required: true }]}>
            <Input placeholder="e.g., 📖" />
          </Form.Item>
          
          <Form.Item name="description" label="Description">
            <Input />
          </Form.Item>
          
          <Form.Item name="color" label="Color" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="#EC4899">Pink</Select.Option>
              <Select.Option value="#EF4444">Red</Select.Option>
              <Select.Option value="#10B981">Green</Select.Option>
              <Select.Option value="#3B82F6">Blue</Select.Option>
              <Select.Option value="#8B5CF6">Purple</Select.Option>
              <Select.Option value="#F59E0B">Orange</Select.Option>
            </Select>
          </Form.Item>
          
          <Button type="primary" htmlType="submit" block>
            {editingType ? 'Update' : 'Create'} Issue Type
          </Button>
        </Form>
      </Modal>
    </Container>
  );
};