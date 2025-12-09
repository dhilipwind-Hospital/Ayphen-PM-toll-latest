import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Table, message, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

interface CustomField {
  id: string;
  name: string;
  type: string;
  options?: string[];
  isGlobal: boolean;
  isRequired: boolean;
  sortOrder: number;
}

export const CustomFieldManager: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFields();
  }, [projectId]);

  const loadFields = async () => {
    try {
      const params = projectId ? { projectId } : {};
      const { data } = await axios.get('http://localhost:8500/api/custom-fields', { params });
      setFields(data);
    } catch (error) {
      message.error('Failed to load custom fields');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        projectId: values.isGlobal ? null : projectId,
        options: values.type === 'select' || values.type === 'multiselect' 
          ? values.options?.split(',').map((s: string) => s.trim()) 
          : null,
      };

      if (editingField) {
        await axios.put(`http://localhost:8500/api/custom-fields/${editingField.id}`, payload);
        message.success('Custom field updated');
      } else {
        await axios.post('http://localhost:8500/api/custom-fields', payload);
        message.success('Custom field created');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingField(null);
      loadFields();
    } catch (error) {
      message.error('Failed to save custom field');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    form.setFieldsValue({
      ...field,
      options: field.options?.join(', '),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8500/api/custom-fields/${id}`);
      message.success('Custom field deleted');
      loadFields();
    } catch (error) {
      message.error('Failed to delete custom field');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Scope',
      dataIndex: 'isGlobal',
      key: 'isGlobal',
      render: (isGlobal: boolean) => (
        <Tag color={isGlobal ? 'blue' : 'green'}>
          {isGlobal ? 'Global' : 'Project'}
        </Tag>
      ),
    },
    {
      title: 'Required',
      dataIndex: 'isRequired',
      key: 'isRequired',
      render: (isRequired: boolean) => (isRequired ? 'Yes' : 'No'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CustomField) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3>Custom Fields</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingField(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Custom Field
        </Button>
      </div>

      <Table
        dataSource={fields}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editingField ? 'Edit Custom Field' : 'Add Custom Field'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingField(null);
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Field Name"
            rules={[{ required: true, message: 'Please enter field name' }]}
          >
            <Input placeholder="e.g., Customer Impact" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Field Type"
            rules={[{ required: true, message: 'Please select field type' }]}
          >
            <Select placeholder="Select type">
              <Select.Option value="text">Text</Select.Option>
              <Select.Option value="number">Number</Select.Option>
              <Select.Option value="select">Select (Dropdown)</Select.Option>
              <Select.Option value="multiselect">Multi-Select</Select.Option>
              <Select.Option value="date">Date</Select.Option>
              <Select.Option value="checkbox">Checkbox</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) =>
              ['select', 'multiselect'].includes(getFieldValue('type')) ? (
                <Form.Item
                  name="options"
                  label="Options (comma-separated)"
                  rules={[{ required: true, message: 'Please enter options' }]}
                >
                  <Input.TextArea
                    placeholder="e.g., High, Medium, Low"
                    rows={3}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="isGlobal" label="Scope" initialValue={false}>
            <Select>
              <Select.Option value={false}>Project Only</Select.Option>
              <Select.Option value={true}>Global (All Projects)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="isRequired" label="Required" initialValue={false}>
            <Select>
              <Select.Option value={false}>Optional</Select.Option>
              <Select.Option value={true}>Required</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="sortOrder" label="Sort Order" initialValue={0}>
            <Input type="number" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {editingField ? 'Update' : 'Create'} Field
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
