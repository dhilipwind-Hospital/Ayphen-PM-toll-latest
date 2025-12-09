import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, Input, Progress, Tag, Card, Statistic, Row, Col, message, Upload, Spin, Tooltip } from 'antd';
import { Play, Square, CheckCircle, XCircle, Clock, AlertCircle, Upload as UploadIcon, FileText } from 'lucide-react';
import styled from 'styled-components';
import { testRunsApi, testResultsApi } from '../../services/test-execution-api';
import { aiTestSuitesApi, aiTestCasesApi } from '../../services/ai-test-automation-api';
import { useStore } from '../../store/useStore';

const { Option } = Select;
const { TextArea } = Input;

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const StatsRow = styled(Row)`
  margin-bottom: 24px;
`;

const TestCaseCard = styled(Card)<{ $status?: string }>`
  margin-bottom: 16px;
  border-left: 4px solid ${(props) => {
    if (props.$status === 'passed') return '#52c41a';
    if (props.$status === 'failed') return '#ff4d4f';
    if (props.$status === 'skipped') return '#faad14';
    if (props.$status === 'blocked') return '#8c8c8c';
    if (props.$status === 'running') return '#1890ff';
    return '#d9d9d9';
  }};
  
  .ant-card-body {
    padding: 16px;
  }
`;

const TestCaseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TestCaseTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  flex: 1;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const TestSteps = styled.div`
  margin: 12px 0;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
`;

const LogsArea = styled(TextArea)`
  margin-top: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
`;

export const TestExecutionPage: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [suites, setSuites] = useState<any[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [environment, setEnvironment] = useState('dev');
  const [browser, setBrowser] = useState('chrome');
  const [runName, setRunName] = useState('');
  
  const [currentRun, setCurrentRun] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<Map<string, any>>(new Map());
  const [executing, setExecuting] = useState(false);
  
  const { currentProject, currentUser } = useStore();

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

  const handleCreateRun = async () => {
    if (!selectedSuite) {
      message.error('Please select a test suite');
      return;
    }

    try {
      // Create test run
      const runData = {
        name: runName || `Test Run - ${new Date().toLocaleString()}`,
        suiteId: selectedSuite,
        environment,
        browser,
        projectId: currentProject?.id,
        executedBy: currentUser?.id,
        status: 'running',
      };

      const runRes = await testRunsApi.create(runData);
      setCurrentRun(runRes.data);

      // Load test cases for the suite
      const suite = suites.find(s => s.id === selectedSuite);
      if (suite && suite.testCaseKeys && suite.testCaseKeys.length > 0) {
        // Load test cases by keys
        const casesRes = await aiTestCasesApi.getAll();
        const allCases = casesRes.data || [];
        // FILTER by project AND suite keys
        const suiteCases = allCases.filter((tc: any) => 
          tc.projectId === currentProject.id && suite.testCaseKeys.includes(tc.testCaseKey)
        );
        setTestCases(suiteCases);
      } else {
        setTestCases([]);
      }

      setCreateModalVisible(false);
      message.success('Test run created successfully');
    } catch (error) {
      console.error('Error creating test run:', error);
      message.error('Failed to create test run');
    }
  };

  const handleExecuteTest = async (testCase: any, status: 'passed' | 'failed' | 'skipped' | 'blocked') => {
    if (!currentRun) return;

    try {
      const resultData = {
        testRunId: currentRun.id,
        testCaseId: testCase.id,
        status,
        environment,
        browser,
        executedBy: currentUser?.id,
        startTime: new Date(),
      };

      const res = await testResultsApi.create(resultData);
      
      // Update local state
      const newResults = new Map(testResults);
      newResults.set(testCase.id, { ...res.data, status });
      setTestResults(newResults);

      // Update test run stats
      const updatedRun = await testRunsApi.getById(currentRun.id);
      setCurrentRun(updatedRun.data);

      // Auto-create defect for failed tests
      if (status === 'failed') {
        try {
          await testResultsApi.createDefect(res.data.id, {
            projectId: currentProject?.id,
            reporterId: currentUser?.id,
          });
          message.success('Test failed - Bug created automatically');
        } catch (error) {
          console.error('Error creating defect:', error);
        }
      }
    } catch (error) {
      console.error('Error executing test:', error);
      message.error('Failed to record test result');
    }
  };

  const handleUpdateResult = async (testCaseId: string, field: string, value: any) => {
    const result = testResults.get(testCaseId);
    if (!result) return;

    try {
      await testResultsApi.update(result.id, { [field]: value });
      const newResults = new Map(testResults);
      newResults.set(testCaseId, { ...result, [field]: value });
      setTestResults(newResults);
    } catch (error) {
      console.error('Error updating result:', error);
    }
  };

  const handleCompleteRun = async () => {
    if (!currentRun) return;

    try {
      await testRunsApi.update(currentRun.id, { status: 'completed' });
      message.success('Test run completed');
      setCurrentRun(null);
      setTestCases([]);
      setTestResults(new Map());
    } catch (error) {
      message.error('Failed to complete test run');
    }
  };

  const handleAbortRun = async () => {
    if (!currentRun) return;

    try {
      await testRunsApi.abort(currentRun.id);
      message.warning('Test run aborted');
      setCurrentRun(null);
      setTestCases([]);
      setTestResults(new Map());
    } catch (error) {
      message.error('Failed to abort test run');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle size={16} color="#52c41a" />;
      case 'failed': return <XCircle size={16} color="#ff4d4f" />;
      case 'skipped': return <Clock size={16} color="#faad14" />;
      case 'blocked': return <AlertCircle size={16} color="#8c8c8c" />;
      case 'running': return <Spin size="small" />;
      default: return <Clock size={16} color="#d9d9d9" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'skipped': return 'warning';
      case 'blocked': return 'default';
      case 'running': return 'processing';
      default: return 'default';
    }
  };

  const calculateProgress = () => {
    if (testCases.length === 0) return 0;
    const executed = Array.from(testResults.values()).filter(r => r.status !== 'pending').length;
    return Math.round((executed / testCases.length) * 100);
  };

  return (
    <Container>
      <Header>
        <Title>Test Execution</Title>
        <div>
          {!currentRun ? (
            <Button
              type="primary"
              icon={<Play size={16} />}
              onClick={() => setCreateModalVisible(true)}
            >
              Start New Test Run
            </Button>
          ) : (
            <>
              <Button
                icon={<CheckCircle size={16} />}
                onClick={handleCompleteRun}
                style={{ marginRight: 8 }}
              >
                Complete Run
              </Button>
              <Button
                danger
                icon={<Square size={16} />}
                onClick={handleAbortRun}
              >
                Abort Run
              </Button>
            </>
          )}
        </div>
      </Header>

      {currentRun && (
        <>
          <Card style={{ marginBottom: 24 }}>
            <h3>{currentRun.name}</h3>
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue">{currentRun.environment}</Tag>
              <Tag color="green">{currentRun.browser}</Tag>
              <Tag color={currentRun.status === 'running' ? 'processing' : 'default'}>
                {currentRun.status}
              </Tag>
            </div>
            <Progress percent={calculateProgress()} status="active" />
          </Card>

          <StatsRow gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Tests"
                  value={testCases.length}
                  prefix={<FileText size={20} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Passed"
                  value={currentRun.passed || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircle size={20} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Failed"
                  value={currentRun.failed || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<XCircle size={20} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Skipped"
                  value={currentRun.skipped || 0}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<Clock size={20} />}
                />
              </Card>
            </Col>
          </StatsRow>

          <div>
            {testCases.map(testCase => {
              const result = testResults.get(testCase.id);
              const status = result?.status || 'pending';

              return (
                <TestCaseCard key={testCase.id} $status={status}>
                  <TestCaseHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      {getStatusIcon(status)}
                      <Tag color="cyan">{testCase.testCaseKey}</Tag>
                      <TestCaseTitle>{testCase.title}</TestCaseTitle>
                      <Tag color={testCase.type === 'ui' ? 'green' : 'purple'}>
                        {testCase.type?.toUpperCase()}
                      </Tag>
                    </div>
                    <ActionButtons>
                      {status === 'pending' && (
                        <>
                          <Tooltip title="Pass">
                            <Button
                              size="small"
                              type="primary"
                              icon={<CheckCircle size={14} />}
                              onClick={() => handleExecuteTest(testCase, 'passed')}
                            >
                              Pass
                            </Button>
                          </Tooltip>
                          <Tooltip title="Fail">
                            <Button
                              size="small"
                              danger
                              icon={<XCircle size={14} />}
                              onClick={() => handleExecuteTest(testCase, 'failed')}
                            >
                              Fail
                            </Button>
                          </Tooltip>
                          <Tooltip title="Skip">
                            <Button
                              size="small"
                              icon={<Clock size={14} />}
                              onClick={() => handleExecuteTest(testCase, 'skipped')}
                            >
                              Skip
                            </Button>
                          </Tooltip>
                          <Tooltip title="Block">
                            <Button
                              size="small"
                              icon={<AlertCircle size={14} />}
                              onClick={() => handleExecuteTest(testCase, 'blocked')}
                            >
                              Block
                            </Button>
                          </Tooltip>
                        </>
                      )}
                      {status !== 'pending' && (
                        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
                      )}
                    </ActionButtons>
                  </TestCaseHeader>

                  {testCase.steps && testCase.steps.length > 0 && (
                    <TestSteps>
                      <strong>Steps:</strong>
                      {testCase.steps.map((step: string, idx: number) => (
                        <div key={idx} style={{ marginTop: 4 }}>
                          {idx + 1}. {step}
                        </div>
                      ))}
                    </TestSteps>
                  )}

                  {testCase.expectedResult && (
                    <div style={{ marginTop: 8, fontSize: 13 }}>
                      <strong>Expected Result:</strong> {testCase.expectedResult}
                    </div>
                  )}

                  {result && status === 'failed' && (
                    <>
                      <TextArea
                        placeholder="Error message..."
                        rows={2}
                        value={result.errorMessage || ''}
                        onChange={(e) => handleUpdateResult(testCase.id, 'errorMessage', e.target.value)}
                        onBlur={() => {}}
                        style={{ marginTop: 12 }}
                      />
                      <TextArea
                        placeholder="Actual result..."
                        rows={2}
                        value={result.actualResult || ''}
                        onChange={(e) => handleUpdateResult(testCase.id, 'actualResult', e.target.value)}
                        onBlur={() => {}}
                        style={{ marginTop: 8 }}
                      />
                    </>
                  )}

                  {result && (
                    <LogsArea
                      placeholder="Test logs..."
                      rows={3}
                      value={result.logs || ''}
                      onChange={(e) => handleUpdateResult(testCase.id, 'logs', e.target.value)}
                      onBlur={() => {}}
                    />
                  )}
                </TestCaseCard>
              );
            })}
          </div>
        </>
      )}

      {!currentRun && (
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Play size={48} color="#1890ff" style={{ marginBottom: 16 }} />
          <h2>No Active Test Run</h2>
          <p style={{ color: '#8c8c8c', marginBottom: 24 }}>
            Start a new test run to begin executing test cases
          </p>
          <Button
            type="primary"
            size="large"
            icon={<Play size={16} />}
            onClick={() => setCreateModalVisible(true)}
          >
            Start New Test Run
          </Button>
        </Card>
      )}

      <Modal
        title="Start New Test Run"
        open={createModalVisible}
        onOk={handleCreateRun}
        onCancel={() => setCreateModalVisible(false)}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Run Name
          </label>
          <Input
            placeholder="e.g., Sprint 1 - Smoke Tests"
            value={runName}
            onChange={(e) => setRunName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Test Suite *
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Select a test suite"
            value={selectedSuite}
            onChange={setSelectedSuite}
          >
            {suites.map(suite => (
              <Option key={suite.id} value={suite.id}>
                {suite.name} ({suite.testCaseCount || 0} tests)
              </Option>
            ))}
          </Select>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Environment
            </label>
            <Select
              style={{ width: '100%' }}
              value={environment}
              onChange={setEnvironment}
            >
              <Option value="dev">Development</Option>
              <Option value="staging">Staging</Option>
              <Option value="prod">Production</Option>
            </Select>
          </Col>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Browser
            </label>
            <Select
              style={{ width: '100%' }}
              value={browser}
              onChange={setBrowser}
            >
              <Option value="chrome">Chrome</Option>
              <Option value="firefox">Firefox</Option>
              <Option value="safari">Safari</Option>
              <Option value="edge">Edge</Option>
            </Select>
          </Col>
        </Row>
      </Modal>
    </Container>
  );
};
