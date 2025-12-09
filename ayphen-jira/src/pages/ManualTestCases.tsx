import { useState, useEffect } from 'react';
import { Button, Table, Modal, Form, Input, Select, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export default function ManualTestCases() {
  const [testCases, setTestCases] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8500/api/manual-test-cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestCases(res.data);
    } catch (error) {
      message.error('Failed to load test cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      const token = localStorage.getItem('token');
      if (editId) {
        await axios.put(`http://localhost:8500/api/manual-test-cases/${editId}`, values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Test case updated successfully');
      } else {
        await axios.post('http://localhost:8500/api/manual-test-cases', values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Test case created successfully');
      }
      setOpen(false);
      form.resetFields();
      setEditId(null);
      loadTestCases();
    } catch (error) {
      message.error('Failed to save test case');
    }
  };

  const handleEdit = (tc: any) => {
    form.setFieldsValue(tc);
    setEditId(tc.id);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8500/api/manual-test-cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Test case deleted successfully');
      loadTestCases();
    } catch (error) {
      message.error('Failed to delete test case');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Container>
      <Header>
        <h1>Manual Test Cases</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            form.resetFields();
            setEditId(null);
            setOpen(true);
          }}
        >
          Create Test Case
        </Button>
      </Header>

      <Table 
        columns={columns} 
        dataSource={testCases} 
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editId ? 'Edit Test Case' : 'Create Test Case'}
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setEditId(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ priority: 'Medium' }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="steps"
            label="Steps"
            rules={[{ required: true, message: 'Please enter test steps' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="Low">Low</Select.Option>
              <Select.Option value="Medium">Medium</Select.Option>
              <Select.Option value="High">High</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}
