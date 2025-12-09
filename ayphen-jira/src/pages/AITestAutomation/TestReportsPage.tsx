import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tabs, Select, DatePicker, Spin, Table, Tag, Progress } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Clock, CheckCircle, XCircle, Target } from 'lucide-react';
import styled from 'styled-components';
import { testReportsApi } from '../../services/test-reports-api';
import { useStore } from '../../store/useStore';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Container = styled.div`
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  background: #f5f5f5;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  color: #8c8c8c;
  margin: 0;
`;

const StatsRow = styled(Row)`
  margin-bottom: 24px;
`;

const StatsCard = styled(Card)`
  .ant-card-body {
    padding: 20px;
  }
`;

const ChartCard = styled(Card)`
  margin-bottom: 24px;
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

const COLORS = ['#52c41a', '#ff4d4f', '#faad14', '#1890ff', '#722ed1', '#fa8c16'];

export const TestReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [passRateBySuite, setPassRateBySuite] = useState<any[]>([]);
  const [passRateByEnv, setPassRateByEnv] = useState<any[]>([]);
  const [flakyTests, setFlakyTests] = useState<any[]>([]);
  const [executionTime, setExecutionTime] = useState<any>(null);
  const [defects, setDefects] = useState<any>(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [days, setDays] = useState(30);
  
  const { currentProject } = useStore();

  useEffect(() => {
    loadAllData();
  }, [days, currentProject]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const params = { projectId: currentProject?.id, days };
      
      const [
        summaryRes,
        trendsRes,
        passRateSuiteRes,
        passRateEnvRes,
        flakyRes,
        execTimeRes,
        defectsRes,
        coverageRes,
      ] = await Promise.all([
        testReportsApi.getSummary(params),
        testReportsApi.getTrends(params),
        testReportsApi.getPassRate({ ...params, groupBy: 'suite' }),
        testReportsApi.getPassRate({ ...params, groupBy: 'environment' }),
        testReportsApi.getFlakyTests(params),
        testReportsApi.getExecutionTime(params),
        testReportsApi.getDefects(params),
        testReportsApi.getCoverage(params),
      ]);

      setSummary(summaryRes.data);
      setTrends(trendsRes.data);
      setPassRateBySuite(passRateSuiteRes.data);
      setPassRateByEnv(passRateEnvRes.data);
      setFlakyTests(flakyRes.data);
      setExecutionTime(execTimeRes.data);
      setDefects(defectsRes.data);
      setCoverage(coverageRes.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const flakyTestColumns = [
    {
      title: 'Test Case',
      dataIndex: 'testCaseKey',
      key: 'testCaseKey',
      render: (text: string, record: any) => (
        <div>
          <Tag color="cyan">{text}</Tag>
          <div style={{ marginTop: 4, fontSize: 13 }}>{record.title}</div>
        </div>
      ),
    },
    {
      title: 'Total Runs',
      dataIndex: 'totalRuns',
      key: 'totalRuns',
      width: 100,
    },
    {
      title: 'Passed',
      dataIndex: 'passed',
      key: 'passed',
      width: 80,
      render: (val: number) => <Tag color="success">{val}</Tag>,
    },
    {
      title: 'Failed',
      dataIndex: 'failed',
      key: 'failed',
      width: 80,
      render: (val: number) => <Tag color="error">{val}</Tag>,
    },
    {
      title: 'Pass Rate',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 120,
      render: (val: number) => (
        <Progress 
          percent={val} 
          size="small" 
          status={val < 50 ? 'exception' : val < 80 ? 'normal' : 'success'}
        />
      ),
    },
    {
      title: 'Flakiness Score',
      dataIndex: 'flakinessScore',
      key: 'flakinessScore',
      width: 120,
      render: (val: number) => (
        <Tag color={val > 70 ? 'red' : val > 40 ? 'orange' : 'green'}>
          {val.toFixed(0)}%
        </Tag>
      ),
    },
  ];

  const slowTestColumns = [
    {
      title: 'Test Case',
      dataIndex: 'testCaseKey',
      key: 'testCaseKey',
      render: (text: string, record: any) => (
        <div>
          <Tag color="cyan">{text}</Tag>
          <div style={{ marginTop: 4, fontSize: 13 }}>{record.title}</div>
        </div>
      ),
    },
    {
      title: 'Execution Time',
      dataIndex: 'executionTime',
      key: 'executionTime',
      width: 150,
      render: (val: number) => `${(val / 1000).toFixed(2)}s`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'passed' ? 'success' : 'error'}>
          {val.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Environment',
      dataIndex: 'environment',
      key: 'environment',
      width: 120,
    },
  ];

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="Loading reports..." />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title>Test Reports & Analytics</Title>
            <Subtitle>Comprehensive test execution insights and metrics</Subtitle>
          </div>
          <Select value={days} onChange={setDays} style={{ width: 150 }}>
            <Option value={7}>Last 7 days</Option>
            <Option value={14}>Last 14 days</Option>
            <Option value={30}>Last 30 days</Option>
            <Option value={60}>Last 60 days</Option>
            <Option value={90}>Last 90 days</Option>
          </Select>
        </div>
      </Header>

      {/* Summary Statistics */}
      <StatsRow gutter={16}>
        <Col span={6}>
          <StatsCard>
            <Statistic
              title="Total Test Runs"
              value={summary?.totalRuns || 0}
              prefix={<Activity size={20} color="#1890ff" />}
              suffix={
                <span style={{ fontSize: 14, color: '#8c8c8c' }}>
                  ({summary?.completedRuns || 0} completed)
                </span>
              }
            />
          </StatsCard>
        </Col>
        <Col span={6}>
          <StatsCard>
            <Statistic
              title="Pass Rate"
              value={summary?.passRate || 0}
              suffix="%"
              prefix={
                summary?.passRate >= 80 ? 
                  <TrendingUp size={20} color="#52c41a" /> : 
                  <TrendingDown size={20} color="#ff4d4f" />
              }
              valueStyle={{ 
                color: summary?.passRate >= 80 ? '#52c41a' : summary?.passRate >= 60 ? '#faad14' : '#ff4d4f' 
              }}
            />
          </StatsCard>
        </Col>
        <Col span={6}>
          <StatsCard>
            <Statistic
              title="Avg Execution Time"
              value={(summary?.avgExecutionTime || 0) / 1000}
              suffix="s"
              precision={2}
              prefix={<Clock size={20} color="#722ed1" />}
            />
          </StatsCard>
        </Col>
        <Col span={6}>
          <StatsCard>
            <Statistic
              title="Active Bugs"
              value={summary?.activeBugs || 0}
              prefix={<AlertTriangle size={20} color="#ff4d4f" />}
              valueStyle={{ color: summary?.activeBugs > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </StatsCard>
        </Col>
      </StatsRow>

      <Tabs defaultActiveKey="1">
        {/* Overview Tab */}
        <TabPane tab="Overview" key="1">
          <Row gutter={16}>
            <Col span={16}>
              <ChartCard title="Test Execution Trends">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="passed" stackId="1" stroke="#52c41a" fill="#52c41a" name="Passed" />
                    <Area type="monotone" dataKey="failed" stackId="1" stroke="#ff4d4f" fill="#ff4d4f" name="Failed" />
                    <Area type="monotone" dataKey="skipped" stackId="1" stroke="#faad14" fill="#faad14" name="Skipped" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
            <Col span={8}>
              <ChartCard title="Test Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Passed', value: summary?.passedTests || 0 },
                        { name: 'Failed', value: summary?.failedTests || 0 },
                        { name: 'Skipped', value: summary?.skippedTests || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <ChartCard title="Pass Rate by Test Suite">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={passRateBySuite}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="passRate" fill="#52c41a" name="Pass Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
            <Col span={12}>
              <ChartCard title="Pass Rate by Environment">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={passRateByEnv}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="environment" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="passRate" fill="#1890ff" name="Pass Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>
        </TabPane>

        {/* Flaky Tests Tab */}
        <TabPane tab={`Flaky Tests (${flakyTests.length})`} key="2">
          <ChartCard title="Flaky Tests Detection">
            <p style={{ marginBottom: 16, color: '#8c8c8c' }}>
              Tests with inconsistent results (both passes and failures). High flakiness score indicates unreliable tests.
            </p>
            <Table
              columns={flakyTestColumns}
              dataSource={flakyTests}
              rowKey="testCaseId"
              pagination={{ pageSize: 10 }}
            />
          </ChartCard>
        </TabPane>

        {/* Performance Tab */}
        <TabPane tab="Performance" key="3">
          <Row gutter={16}>
            <Col span={24}>
              <ChartCard title={`Slowest Tests (Avg: ${(executionTime?.averageExecutionTime || 0) / 1000}s)`}>
                <Table
                  columns={slowTestColumns}
                  dataSource={executionTime?.slowestTests || []}
                  rowKey="testCaseId"
                  pagination={{ pageSize: 10 }}
                />
              </ChartCard>
            </Col>
          </Row>
        </TabPane>

        {/* Quality Metrics Tab */}
        <TabPane tab="Quality Metrics" key="4">
          <Row gutter={16}>
            <Col span={12}>
              <ChartCard title="Test Coverage">
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={coverage?.coveragePercentage || 0}
                    width={200}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ marginTop: 24 }}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic
                          title="Total Test Cases"
                          value={coverage?.totalTestCases || 0}
                          prefix={<Target size={16} />}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Executed"
                          value={coverage?.executedTestCases || 0}
                          prefix={<CheckCircle size={16} color="#52c41a" />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Not Executed"
                          value={coverage?.notExecuted || 0}
                          prefix={<XCircle size={16} color="#ff4d4f" />}
                          valueStyle={{ color: '#ff4d4f' }}
                        />
                      </Col>
                    </Row>
                  </div>
                </div>
              </ChartCard>
            </Col>
            <Col span={12}>
              <ChartCard title="Defect Metrics">
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <Statistic
                      title="Total Bugs"
                      value={defects?.totalBugs || 0}
                      prefix={<AlertTriangle size={16} />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Test-Related"
                      value={defects?.testRelatedBugs || 0}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Auto-Created"
                      value={defects?.autoCreatedBugs || 0}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
                
                <div style={{ marginTop: 24 }}>
                  <h4>By Status</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={Object.entries(defects?.byStatus || {}).map(([key, value]) => ({ status: key, count: value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ff4d4f" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Container>
  );
};
