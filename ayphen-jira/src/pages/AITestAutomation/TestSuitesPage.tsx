import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, Tag, message, Button, Spin, Popconfirm, Space, Modal, Form, Input, Select } from 'antd';
import { DownOutlined, UpOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ENV } from '../../config/env';
import { aiTestSuitesApi } from '../../services/ai-test-automation-api';
import { colors } from '../../theme/colors';
import { useStore } from '../../store/useStore';

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

const SuiteCard = styled(Card)`
  margin-bottom: 16px;
`;

const TestCaseCard = styled.div`
  background: ${colors.background.paper};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
`;

const TestCaseStep = styled.div`
  padding: 8px 12px;
  background: ${colors.background.default};
  border-left: 3px solid ${colors.primary};
  margin: 4px 0;
  border-radius: 4px;
`;

export const TestSuitesPage: React.FC = () => {
  const [suites, setSuites] = useState<any[]>([]);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [suiteTestCases, setSuiteTestCases] = useState<Record<string, any[]>>({});
  const [loadingTestCases, setLoadingTestCases] = useState<Set<string>>(new Set());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSuite, setEditingSuite] = useState<any>(null);
  const [form] = Form.useForm();
  const { currentProject } = useStore();

  useEffect(() => {
    loadSuites();
  }, [currentProject]);

  const loadSuites = async () => {
    try {
      // VALIDATE project exists
      if (!currentProject) {
        setSuites([]);
        return;
      }
      
      const res = await aiTestSuitesApi.getAll();
      // FILTER by current project only
      const filtered = (res.data || []).filter((suite: any) => suite.projectId === currentProject.id);
      setSuites(filtered);
    } catch (error) {
      message.error('Failed to load test suites');
    }
  };

  const loadTestCasesForSuite = async (suiteId: string) => {
    if (suiteTestCases[suiteId]) {
      return; // Already loaded
    }

    setLoadingTestCases(prev => new Set(prev).add(suiteId));
    
    try {
      const res = await axios.get(`${ENV.API_URL}/ai-test-automation/generation/suites/${suiteId}/test-cases`);
      setSuiteTestCases(prev => ({
        ...prev,
        [suiteId]: res.data.testCases || []
      }));
    } catch (error) {
      message.error('Failed to load test cases for suite');
    } finally {
      setLoadingTestCases(prev => {
        const newSet = new Set(prev);
        newSet.delete(suiteId);
        return newSet;
      });
    }
  };

  const toggleSuite = async (suiteId: string) => {
    const newExpanded = new Set(expandedSuites);
    
    if (newExpanded.has(suiteId)) {
      newExpanded.delete(suiteId);
    } else {
      newExpanded.add(suiteId);
      await loadTestCasesForSuite(suiteId);
    }
    
    setExpandedSuites(newExpanded);
  };

  const handleDelete = async (suiteId: string, suiteName: string) => {
    try {
      await aiTestSuitesApi.delete(suiteId);
      message.success(`Test suite "${suiteName}" deleted successfully`);
      loadSuites();
    } catch (error) {
      message.error('Failed to delete test suite');
    }
  };

  const handleEdit = (suite: any) => {
    setEditingSuite(suite);
    form.setFieldsValue({
      name: suite.name,
      description: suite.description,
      category: suite.category,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      await aiTestSuitesApi.update(editingSuite.id, {
        ...editingSuite,
        name: values.name,
        description: values.description,
        category: values.category,
      });
      message.success('Test suite updated successfully');
      setEditModalVisible(false);
      setEditingSuite(null);
      form.resetFields();
      loadSuites();
    } catch (error) {
      message.error('Failed to update test suite');
    }
  };

  return (
    <Container>
      <Title>📦 Test Suites</Title>

      {suites.map((suite) => (
        <SuiteCard key={suite.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {suite.suiteKey && (
                <Tag color="orange" style={{ marginRight: 8, marginBottom: 8 }}>
                  {suite.suiteKey}
                </Tag>
              )}
              <h3 style={{ margin: 0, display: 'inline' }}>{suite.name}</h3>
              {suite.description && (
                <p style={{ color: colors.text.secondary, margin: '8px 0 0 0', fontSize: '14px' }}>
                  {suite.description}
                </p>
              )}
              <p style={{ color: colors.text.secondary, margin: '8px 0 0 0' }}>
                {suite.testCaseCount} test cases
              </p>
            </div>
            <Space>
              <Tag color={
                suite.category === 'smoke' ? 'red' :
                suite.category === 'sanity' ? 'orange' : 'blue'
              }>
                {suite.category.toUpperCase()}
              </Tag>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(suite)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete Test Suite"
                description={`Are you sure you want to delete "${suite.name}"?`}
                onConfirm={() => handleDelete(suite.id, suite.name)}
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

          {/* Test Case Keys */}
          {suite.testCaseKeys && suite.testCaseKeys.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Test Cases ({suite.testCaseKeys.length}):</strong>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => toggleSuite(suite.id)}
                  icon={expandedSuites.has(suite.id) ? <UpOutlined /> : <DownOutlined />}
                >
                  {expandedSuites.has(suite.id) ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suite.testCaseKeys.map((key: string) => (
                  <Tag key={key} color="cyan">{key}</Tag>
                ))}
              </div>
            </div>
          )}

          {/* Expanded Test Case Details */}
          {expandedSuites.has(suite.id) && (
            <div style={{ marginTop: 16 }}>
              {loadingTestCases.has(suite.id) ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin tip="Loading test cases..." />
                </div>
              ) : (
                <>
                  {suiteTestCases[suite.id]?.map((testCase: any) => (
                    <TestCaseCard key={testCase.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        {testCase.testCaseKey && (
                          <Tag color="cyan">{testCase.testCaseKey}</Tag>
                        )}
                        <Tag color={testCase.type === 'ui' ? 'green' : 'purple'}>
                          {testCase.type?.toUpperCase()}
                        </Tag>
                        <h4 style={{ margin: 0, flex: 1 }}>{testCase.title}</h4>
                        <Tag color={testCase.status === 'active' ? 'green' : 'default'}>
                          {testCase.status?.toUpperCase()}
                        </Tag>
                      </div>

                      {/* Categories */}
                      {testCase.categories && testCase.categories.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <strong style={{ fontSize: '12px', color: colors.text.secondary }}>Categories: </strong>
                          {testCase.categories.map((cat: string) => (
                            <Tag 
                              key={cat}
                              color={
                                cat === 'smoke' ? 'red' :
                                cat === 'sanity' ? 'orange' :
                                'blue'
                              }
                            >
                              {cat.toUpperCase()}
                            </Tag>
                          ))}
                        </div>
                      )}

                      {/* Steps */}
                      {testCase.steps && testCase.steps.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <strong style={{ fontSize: '14px' }}>Steps:</strong>
                          {testCase.steps.map((step: string, idx: number) => (
                            <TestCaseStep key={idx}>
                              <strong>{idx + 1}.</strong> {step}
                            </TestCaseStep>
                          ))}
                        </div>
                      )}

                      {/* Expected Result */}
                      {testCase.expectedResult && (
                        <div>
                          <strong style={{ fontSize: '14px' }}>Expected Result:</strong>
                          <div style={{ 
                            marginTop: 8, 
                            padding: '12px', 
                            background: colors.background.default,
                            borderRadius: '4px',
                            border: `1px solid ${colors.border}`
                          }}>
                            {testCase.expectedResult}
                          </div>
                        </div>
                      )}
                    </TestCaseCard>
                  ))}
                  
                  {(!suiteTestCases[suite.id] || suiteTestCases[suite.id].length === 0) && (
                    <div style={{ textAlign: 'center', padding: '20px', color: colors.text.secondary }}>
                      No test cases found for this suite
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </SuiteCard>
      ))}

      <Modal
        title="Edit Test Suite"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingSuite(null);
          form.resetFields();
        }}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Suite Name"
            name="name"
            rules={[{ required: true, message: 'Please enter suite name' }]}
          >
            <Input placeholder="Suite name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Suite description" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select
              placeholder="Select category"
              options={[
                { label: 'Smoke', value: 'smoke' },
                { label: 'Sanity', value: 'sanity' },
                { label: 'Regression', value: 'regression' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};
