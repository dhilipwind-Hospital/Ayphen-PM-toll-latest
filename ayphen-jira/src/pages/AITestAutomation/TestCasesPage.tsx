import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, Tag, Space, Collapse, message, Button, Popconfirm, Modal, Form, Input, Select } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { aiTestCasesApi } from '../../services/ai-test-automation-api';
import { colors } from '../../theme/colors';
import { useStore } from '../../store/useStore';

const { Panel } = Collapse;

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 24px;
`;

const TestCaseCard = styled(Card)`
  margin-bottom: 16px;
`;

export const TestCasesPage: React.FC = () => {
  const [testCases, setTestCases] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<any>(null);
  const [form] = Form.useForm();
  const { currentProject } = useStore();

  useEffect(() => {
    loadTestCases();
  }, [currentProject]);

  const loadTestCases = async () => {
    try {
      // VALIDATE project exists
      if (!currentProject) {
        setTestCases([]);
        return;
      }
      
      const res = await aiTestCasesApi.getAll();
      // FILTER by current project only
      const filtered = (res.data || []).filter((tc: any) => tc.projectId === currentProject.id);
      setTestCases(filtered);
    } catch (error) {
      message.error('Failed to load test cases');
    }
  };

  const handleDelete = async (testCaseId: string, testCaseTitle: string) => {
    try {
      await aiTestCasesApi.delete(testCaseId);
      message.success(`Test case "${testCaseTitle}" deleted successfully`);
      loadTestCases();
    } catch (error) {
      message.error('Failed to delete test case');
    }
  };

  const handleEdit = (testCase: any) => {
    setEditingTestCase(testCase);
    form.setFieldsValue({
      title: testCase.title,
      steps: testCase.steps?.join('\n') || '',
      expectedResult: testCase.expectedResult,
      categories: testCase.categories || [],
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      await aiTestCasesApi.update(editingTestCase.id, {
        ...editingTestCase,
        title: values.title,
        steps: values.steps.split('\n').filter((s: string) => s.trim()),
        expectedResult: values.expectedResult,
        categories: values.categories,
      });
      message.success('Test case updated successfully');
      setEditModalVisible(false);
      setEditingTestCase(null);
      form.resetFields();
      loadTestCases();
    } catch (error) {
      message.error('Failed to update test case');
    }
  };

  return (
    <Container>
      <Title>🧪 Test Cases</Title>

      {testCases.map((tc) => (
        <TestCaseCard key={tc.id}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                {tc.testCaseKey && (
                  <Tag color="cyan" style={{ fontSize: '13px', fontWeight: 600 }}>
                    {tc.testCaseKey}
                  </Tag>
                )}
                <Tag color={tc.type === 'ui' ? 'green' : 'purple'}>
                  {tc.type?.toUpperCase()}
                </Tag>
                {tc.categories?.map((cat: string) => (
                  <Tag key={cat} color={
                    cat === 'smoke' ? 'red' :
                    cat === 'sanity' ? 'orange' : 'blue'
                  }>
                    {cat.toUpperCase()}
                  </Tag>
                ))}
                {tc.flagged && <Tag color="warning">⚠️ NEEDS REVIEW</Tag>}
              </div>
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(tc)}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete Test Case"
                  description={`Are you sure you want to delete "${tc.title}"?`}
                  onConfirm={() => handleDelete(tc.id, tc.title)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            </div>
            
            <h3 style={{ margin: '8px 0' }}>{tc.title}</h3>
            
            {tc.suiteKey && (
              <div style={{ marginTop: 4 }}>
                <span style={{ color: colors.text.secondary, fontSize: '13px' }}>Suite: </span>
                <Tag color="orange">{tc.suiteKey}</Tag>
              </div>
            )}
            
            <Collapse ghost>
              <Panel header="Test Steps" key="1">
                <ol>
                  {tc.steps?.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </Panel>
              <Panel header="Expected Result" key="2">
                <p>{tc.expectedResult}</p>
              </Panel>
            </Collapse>
          </Space>
        </TestCaseCard>
      ))}

      <Modal
        title="Edit Test Case"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingTestCase(null);
          form.resetFields();
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter test case title' }]}
          >
            <Input placeholder="Test case title" />
          </Form.Item>

          <Form.Item
            label="Test Steps (one per line)"
            name="steps"
            rules={[{ required: true, message: 'Please enter test steps' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="Step 1&#10;Step 2&#10;Step 3"
            />
          </Form.Item>

          <Form.Item
            label="Expected Result"
            name="expectedResult"
            rules={[{ required: true, message: 'Please enter expected result' }]}
          >
            <Input.TextArea rows={3} placeholder="Expected result" />
          </Form.Item>

          <Form.Item
            label="Categories"
            name="categories"
          >
            <Select
              mode="multiple"
              placeholder="Select categories"
              options={[
                { label: 'Smoke', value: 'smoke' },
                { label: 'Sanity', value: 'sanity' },
                { label: 'Regression', value: 'regression' },
                { label: 'Integration', value: 'integration' },
                { label: 'E2E', value: 'e2e' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};
