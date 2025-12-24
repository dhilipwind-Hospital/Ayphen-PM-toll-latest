import React, { useState } from 'react';
import { Modal, Button, message, Card, Tag, Progress, Checkbox, Collapse } from 'antd';
import { ExperimentOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ENV } from '../../config/env';

const { Panel } = Collapse;

interface TestCaseGeneratorButtonProps {
  issueId: string;
  issueKey?: string;
  onGenerated?: (testCases: any[]) => void;
}

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'functional' | 'integration' | 'unit' | 'e2e' | 'api';
  automated: boolean;
}

interface TestSuite {
  issueKey: string;
  summary: string;
  testCases: TestCase[];
  coverage: {
    happy_path: number;
    edge_cases: number;
    error_handling: number;
    total: number;
  };
  recommendations: string[];
}

export const TestCaseGeneratorButton: React.FC<TestCaseGeneratorButtonProps> = ({
  issueId,
  issueKey = 'Issue',
  onGenerated
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${ENV.API_URL}/ai-test-case-generator/generate/${issueId}`
      );

      if (response.data.success) {
        const suite = response.data.data;
        setTestSuite(suite);
        // Select all by default
        setSelectedTests(new Set(suite.testCases.map((tc: TestCase) => tc.id)));
        message.success(`Generated ${suite.testCases.length} test cases!`);
        
        if (onGenerated) {
          onGenerated(suite.testCases);
        }
      }
    } catch (error: any) {
      console.error('Test generation error:', error);
      message.error(error.response?.data?.error || 'Failed to generate test cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!testSuite) return;

    setLoading(true);
    try {
      const selectedTestCases = testSuite.testCases
        .filter(tc => selectedTests.has(tc.id))
        .map(tc => ({
          ...tc,
          issueId,
          status: 'active',
          id: undefined // Let backend assign IDs
        }));

      const response = await axios.post(`${ENV.API_URL}/test-cases/batch`, {
        testCases: selectedTestCases
      });

      if (response.data.success) {
        message.success(`Saved ${selectedTestCases.length} test cases to issue!`);
        if (onGenerated) {
          onGenerated(response.data.data);
        }
        setIsModalVisible(false);
        setTestSuite(null);
      }
    } catch (error: any) {
      console.error('Failed to save test cases:', error);
      message.error('Failed to save test cases');
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
    setTestSuite(null);
    setSelectedTests(new Set());
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setTestSuite(null);
  };

  const toggleTestSelection = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'blue'
    };
    return colors[priority] || 'default';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      functional: 'blue',
      integration: 'purple',
      unit: 'green',
      e2e: 'cyan',
      api: 'magenta'
    };
    return colors[type] || 'default';
  };

  const getCoveragePercent = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <>
      <Button
        type="primary"
        icon={<ExperimentOutlined />}
        onClick={showModal}
        style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          border: 'none'
        }}
      >
        Generate Test Cases
      </Button>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExperimentOutlined style={{ color: '#00f2fe', fontSize: 20 }} />
            <span>AI Test Case Generator: {issueKey}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={900}
        footer={null}
      >
        {!testSuite ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#f0f7ff',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #bae0ff',
              textAlign: 'center'
            }}>
              <ExperimentOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }} />
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                AI-Powered Test Case Generation
              </div>
              <div style={{ color: '#595959' }}>
                Generate comprehensive test cases covering happy paths, edge cases, and error handling
              </div>
            </div>

            <div style={{
              background: '#f6ffed',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #b7eb8f'
            }}>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#52c41a' }}>
                🤖 AI Will Generate:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
                <li>Happy path test scenarios</li>
                <li>Edge case tests</li>
                <li>Error handling tests</li>
                <li>Boundary condition tests</li>
                <li>Integration test scenarios</li>
                <li>Test steps and expected results</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<ExperimentOutlined />}
                onClick={handleGenerate}
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  border: 'none'
                }}
              >
                Generate Test Cases
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card
              title="Test Coverage Analysis"
              size="small"
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Total Tests</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                    {testSuite.coverage.total}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Happy Path</div>
                  <Progress
                    type="circle"
                    percent={getCoveragePercent(testSuite.coverage.happy_path, testSuite.coverage.total)}
                    width={60}
                    strokeColor="#52c41a"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Edge Cases</div>
                  <Progress
                    type="circle"
                    percent={getCoveragePercent(testSuite.coverage.edge_cases, testSuite.coverage.total)}
                    width={60}
                    strokeColor="#faad14"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Error Handling</div>
                  <Progress
                    type="circle"
                    percent={getCoveragePercent(testSuite.coverage.error_handling, testSuite.coverage.total)}
                    width={60}
                    strokeColor="#ff4d4f"
                  />
                </div>
              </div>
            </Card>

            {testSuite.recommendations.length > 0 && (
              <Card size="small" style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
                <div style={{ fontWeight: 500, color: '#faad14', marginBottom: 8 }}>
                  <WarningOutlined /> Recommendations:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {testSuite.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </Card>
            )}

            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Generated Test Cases</span>
                  <span style={{ fontSize: 12, fontWeight: 'normal', color: '#8c8c8c' }}>
                    {selectedTests.size} of {testSuite.testCases.length} selected
                  </span>
                </div>
              }
              size="small"
              style={{ maxHeight: 400, overflow: 'auto' }}
            >
              <Collapse accordion>
                {testSuite.testCases.map((testCase) => (
                  <Panel
                    key={testCase.id}
                    header={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Checkbox
                          checked={selectedTests.has(testCase.id)}
                          onChange={() => toggleTestSelection(testCase.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span style={{ flex: 1 }}>{testCase.title}</span>
                        <Tag color={getPriorityColor(testCase.priority)}>
                          {testCase.priority.toUpperCase()}
                        </Tag>
                        <Tag color={getTypeColor(testCase.type)}>
                          {testCase.type.toUpperCase()}
                        </Tag>
                        {testCase.automated && (
                          <Tag color="green">
                            <CheckCircleOutlined /> Automated
                          </Tag>
                        )}
                      </div>
                    }
                  >
                    <div style={{ padding: 8 }}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>Description:</div>
                        <div style={{ color: '#595959' }}>{testCase.description}</div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>Test Steps:</div>
                        <ol style={{ margin: 0, paddingLeft: 20 }}>
                          {testCase.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>Expected Result:</div>
                        <div style={{
                          padding: 8,
                          background: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: 4,
                          color: '#52c41a'
                        }}>
                          <CheckCircleOutlined /> {testCase.expectedResult}
                        </div>
                      </div>
                    </div>
                  </Panel>
                ))}
              </Collapse>
            </Card>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <div style={{ color: '#8c8c8c', fontSize: 12, display: 'flex', alignItems: 'center' }}>
                💡 Tip: Click on a test case to view details
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={handleCancel}>
                  Close
                </Button>
                <Button
                  type="primary"
                  onClick={handleSave}
                  loading={loading}
                  disabled={selectedTests.size === 0}
                  style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    border: 'none'
                  }}
                >
                  Save {selectedTests.size} Test Cases
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
