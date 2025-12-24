import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Select, Button, Tabs, message, Spin, Row, Col, Statistic, Table } from 'antd';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { Download, Calendar, TrendingUp, Activity, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import axios from 'axios';
import { ENV } from '../config/env';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 56px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ChartCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  
  .ant-card-head {
    background: #fafafa;
    border-bottom: 2px solid #f0f0f0;
  }
`;

const StatsRow = styled(Row)`
  margin-bottom: 24px;
`;

const API_URL = ENV.API_URL;

export const AllReportsView: React.FC = () => {
  const { reportType } = useParams<{ reportType?: string }>();
  const { sprints, currentProject } = useStore();
  
  const [activeTab, setActiveTab] = useState(reportType || 'burndown');
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [selectedDays, setSelectedDays] = useState(30);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [burndownData, setBurndownData] = useState<any[]>([]);
  const [burnupData, setBurnupData] = useState<any[]>([]);
  const [cfdData, setCfdData] = useState<any[]>([]);
  const [controlData, setControlData] = useState<any>(null);
  const [velocityData, setVelocityData] = useState<any[]>([]);
  const [createdVsResolvedData, setCreatedVsResolvedData] = useState<any[]>([]);
  const [timeTrackingData, setTimeTrackingData] = useState<any>(null);
  const [workloadData, setWorkloadData] = useState<any[]>([]);
  
  const projectId = currentProject?.id || 'default-project';
  const projectSprints = sprints.filter(s => 
    currentProject ? s.projectId === currentProject.id : true
  );
  const completedSprints = projectSprints.filter(s => s.status === 'completed');
  
  useEffect(() => {
    if (completedSprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(completedSprints[0].id);
    }
  }, [completedSprints]);
  
  useEffect(() => {
    loadData();
  }, [activeTab, selectedSprintId, selectedDays, projectId]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'burndown':
          if (selectedSprintId) {
            const res = await axios.get(`${API_URL}/reports/burndown/${selectedSprintId}`);
            setBurndownData(res.data);
          }
          break;
        case 'burnup':
          if (selectedSprintId) {
            const res = await axios.get(`${API_URL}/reports/burnup/${selectedSprintId}`);
            setBurnupData(res.data);
          }
          break;
        case 'velocity':
          const velRes = await axios.get(`${API_URL}/reports/velocity/${projectId}`);
          setVelocityData(velRes.data);
          break;
        case 'cumulative-flow':
          const cfdRes = await axios.get(`${API_URL}/reports/cumulative-flow/${projectId}?days=${selectedDays}`);
          setCfdData(cfdRes.data);
          break;
        case 'control-chart':
          const controlRes = await axios.get(`${API_URL}/reports/control-chart/${projectId}?days=${selectedDays}`);
          setControlData(controlRes.data);
          break;
        case 'created-vs-resolved':
          const cvrRes = await axios.get(`${API_URL}/reports/created-vs-resolved/${projectId}?days=${selectedDays}`);
          setCreatedVsResolvedData(cvrRes.data);
          break;
        case 'time-tracking':
          const timeRes = await axios.get(`${API_URL}/reports/time-tracking/${projectId}`);
          setTimeTrackingData(timeRes.data);
          break;
        case 'user-workload':
          const workloadRes = await axios.get(`${API_URL}/reports/user-workload/${projectId}`);
          setWorkloadData(workloadRes.data);
          break;
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
      message.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = () => {
    const reportName = activeTab.replace(/-/g, '_');
    
    // Get current data based on active tab
    let dataToExport: any[] = [];
    
    switch (activeTab) {
      case 'velocity':
        dataToExport = velocityData;
        break;
      case 'burndown':
        dataToExport = burndownData;
        break;
      case 'burnup':
        dataToExport = burnupData;
        break;
      case 'cumulative-flow':
        dataToExport = cfdData;
        break;
      case 'control-chart':
        dataToExport = controlChartData;
        break;
      case 'created-vs-resolved':
        dataToExport = createdVsResolvedData;
        break;
      case 'time-tracking':
        dataToExport = timeTrackingData;
        break;
      case 'user-workload':
        dataToExport = userWorkloadData;
        break;
      default:
        dataToExport = [];
    }
    
    if (dataToExport.length > 0) {
      exportToCSV(dataToExport, `${reportName}_${new Date().toISOString().split('T')[0]}`);
      message.success('Report exported successfully!');
    } else {
      message.warning('No data to export');
    }
  };
  
  const renderBurndownChart = () => (
    <ChartCard title="Sprint Burndown Chart" loading={loading}>
      {burndownData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={burndownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ideal" 
                stroke="#8884d8" 
                strokeDasharray="5 5"
                name="Ideal Burndown"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#82ca9d" 
                name="Actual Burndown"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, padding: '12px', background: '#f9f9f9', borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              📊 The burndown chart shows the ideal vs actual progress of story points completion over the sprint duration.
            </p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No data available. Select a completed sprint to view burndown chart.
        </div>
      )}
    </ChartCard>
  );
  
  const renderBurnupChart = () => (
    <ChartCard title="Sprint Burnup Chart" loading={loading}>
      {burnupData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={burnupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="scope" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8"
                fillOpacity={0.3}
                name="Total Scope"
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="2"
                stroke="#82ca9d" 
                fill="#82ca9d"
                name="Completed Work"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, padding: '12px', background: '#f9f9f9', borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              📈 The burnup chart shows scope changes and completed work over time. Scope line shows total work added.
            </p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No data available. Select a completed sprint to view burnup chart.
        </div>
      )}
    </ChartCard>
  );
  
  const renderVelocityChart = () => (
    <ChartCard title="Velocity Chart (Last 6 Sprints)" loading={loading}>
      {velocityData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" />
              <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="committed" fill="#8884d8" name="Committed" />
              <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
          <StatsRow gutter={16} style={{ marginTop: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Average Velocity"
                  value={Math.round(velocityData.reduce((sum, d) => sum + d.completed, 0) / velocityData.length)}
                  suffix="points"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Completed"
                  value={velocityData.reduce((sum, d) => sum + d.completed, 0)}
                  suffix="points"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Completion Rate"
                  value={Math.round((velocityData.reduce((sum, d) => sum + d.completed, 0) / velocityData.reduce((sum, d) => sum + d.committed, 0)) * 100)}
                  suffix="%"
                />
              </Card>
            </Col>
          </StatsRow>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No velocity data available. Complete some sprints to see velocity trends.
        </div>
      )}
    </ChartCard>
  );
  
  const renderCumulativeFlowDiagram = () => (
    <ChartCard title="Cumulative Flow Diagram" loading={loading}>
      {cfdData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={cfdData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Issue Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Done" stackId="1" stroke="#52c41a" fill="#52c41a" />
              <Area type="monotone" dataKey="In Review" stackId="1" stroke="#faad14" fill="#faad14" />
              <Area type="monotone" dataKey="In Progress" stackId="1" stroke="#1890ff" fill="#1890ff" />
              <Area type="monotone" dataKey="To Do" stackId="1" stroke="#d9d9d9" fill="#d9d9d9" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, padding: '12px', background: '#f9f9f9', borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              📊 CFD shows the distribution of issues across different statuses over time. Helps identify bottlenecks.
            </p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No data available for the selected time period.
        </div>
      )}
    </ChartCard>
  );
  
  const renderControlChart = () => (
    <ChartCard title="Control Chart (Cycle Time)" loading={loading}>
      {controlData && controlData.data && controlData.data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="completedDate" name="Completed Date" />
              <YAxis dataKey="cycleTime" name="Cycle Time (days)" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <ReferenceLine y={controlData.average} stroke="#1890ff" strokeDasharray="3 3" label="Average" />
              <ReferenceLine y={controlData.upperLimit} stroke="#ff4d4f" strokeDasharray="3 3" label="Upper Limit" />
              <ReferenceLine y={controlData.lowerLimit} stroke="#52c41a" strokeDasharray="3 3" label="Lower Limit" />
              <Scatter name="Cycle Time" data={controlData.data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
          <StatsRow gutter={16} style={{ marginTop: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Average Cycle Time"
                  value={controlData.average}
                  suffix="days"
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Upper Control Limit"
                  value={controlData.upperLimit}
                  suffix="days"
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Lower Control Limit"
                  value={controlData.lowerLimit}
                  suffix="days"
                  precision={1}
                />
              </Card>
            </Col>
          </StatsRow>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No cycle time data available. Complete some issues to see control chart.
        </div>
      )}
    </ChartCard>
  );
  
  const renderCreatedVsResolvedChart = () => (
    <ChartCard title="Created vs Resolved Issues" loading={loading}>
      {createdVsResolvedData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={createdVsResolvedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Issue Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#1890ff" name="Created" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#52c41a" name="Resolved" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, padding: '12px', background: '#f9f9f9', borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              📈 Track the trend of issue creation vs resolution. Helps identify if backlog is growing or shrinking.
            </p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No data available for the selected time period.
        </div>
      )}
    </ChartCard>
  );
  
  const renderTimeTrackingReport = () => {
    const columns = [
      { title: 'Issue Key', dataIndex: 'key', key: 'key', width: 120 },
      { title: 'Summary', dataIndex: 'summary', key: 'summary' },
      { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
      { title: 'Estimated Hours', dataIndex: 'estimatedHours', key: 'estimatedHours', width: 150 },
      { title: 'Actual Hours', dataIndex: 'actualHours', key: 'actualHours', width: 150 },
      { 
        title: 'Variance', 
        key: 'variance', 
        width: 120,
        render: (_: any, record: any) => {
          const variance = record.actualHours - record.estimatedHours;
          return (
            <span style={{ color: variance > 0 ? '#ff4d4f' : '#52c41a' }}>
              {variance > 0 ? '+' : ''}{variance}h
            </span>
          );
        }
      },
    ];
    
    return (
      <ChartCard title="Time Tracking Report" loading={loading}>
        {timeTrackingData && timeTrackingData.issues ? (
          <>
            <StatsRow gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Estimated"
                    value={timeTrackingData.summary.totalEstimated}
                    suffix="hours"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Actual"
                    value={timeTrackingData.summary.totalActual}
                    suffix="hours"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Variance"
                    value={timeTrackingData.summary.variance}
                    suffix="hours"
                    valueStyle={{ color: timeTrackingData.summary.variance > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Accuracy"
                    value={timeTrackingData.summary.accuracy}
                    suffix="%"
                  />
                </Card>
              </Col>
            </StatsRow>
            <Table
              columns={columns}
              dataSource={timeTrackingData.issues}
              rowKey="key"
              pagination={{ pageSize: 10 }}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            No time tracking data available.
          </div>
        )}
      </ChartCard>
    );
  };
  
  const renderUserWorkloadReport = () => {
    const columns = [
      { title: 'User', dataIndex: 'userName', key: 'userName' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { title: 'Issue Count', dataIndex: 'issueCount', key: 'issueCount', width: 120 },
      { title: 'Story Points', dataIndex: 'totalPoints', key: 'totalPoints', width: 120 },
    ];
    
    return (
      <ChartCard title="User Workload Report" loading={loading}>
        {workloadData && workloadData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300} style={{ marginBottom: 24 }}>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="userName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="issueCount" fill="#1890ff" name="Issue Count" />
                <Bar dataKey="totalPoints" fill="#52c41a" name="Story Points" />
              </BarChart>
            </ResponsiveContainer>
            <Table
              columns={columns}
              dataSource={workloadData}
              rowKey="userId"
              pagination={false}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: 16, background: '#fafafa' }}>
                    <h4>Issues by Type:</h4>
                    {Object.entries(record.byType).map(([type, count]) => (
                      <div key={type} style={{ marginBottom: 8 }}>
                        <strong>{type}:</strong> {count as number}
                      </div>
                    ))}
                  </div>
                ),
              }}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            No workload data available.
          </div>
        )}
      </ChartCard>
    );
  };
  
  const tabItems = [
    { key: 'burndown', label: '📉 Burndown Chart', children: renderBurndownChart() },
    { key: 'burnup', label: '📈 Burnup Chart', children: renderBurnupChart() },
    { key: 'velocity', label: '⚡ Velocity Chart', children: renderVelocityChart() },
    { key: 'cumulative-flow', label: '🌊 Cumulative Flow', children: renderCumulativeFlowDiagram() },
    { key: 'control-chart', label: '🎯 Control Chart', children: renderControlChart() },
    { key: 'created-vs-resolved', label: '📊 Created vs Resolved', children: renderCreatedVsResolvedChart() },
    { key: 'time-tracking', label: '⏱️ Time Tracking', children: renderTimeTrackingReport() },
    { key: 'user-workload', label: '👥 User Workload', children: renderUserWorkloadReport() },
  ];
  
  return (
    <Container>
      <Header>
        <Title>
          <BarChart3 size={28} color="#1890ff" />
          Reports & Analytics
        </Title>
        <Controls>
          {(activeTab === 'burndown' || activeTab === 'burnup') && (
            <Select
              style={{ width: 250 }}
              placeholder="Select Sprint"
              value={selectedSprintId}
              onChange={setSelectedSprintId}
            >
              {completedSprints.map(sprint => (
                <Select.Option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </Select.Option>
              ))}
            </Select>
          )}
          {(activeTab === 'cumulative-flow' || activeTab === 'control-chart' || activeTab === 'created-vs-resolved') && (
            <Select
              style={{ width: 150 }}
              value={selectedDays}
              onChange={setSelectedDays}
            >
              <Select.Option value={7}>Last 7 days</Select.Option>
              <Select.Option value={14}>Last 14 days</Select.Option>
              <Select.Option value={30}>Last 30 days</Select.Option>
              <Select.Option value={60}>Last 60 days</Select.Option>
              <Select.Option value={90}>Last 90 days</Select.Option>
            </Select>
          )}
          <Button icon={<Download size={16} />} onClick={handleExport}>
            Export
          </Button>
        </Controls>
      </Header>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ background: 'white', padding: '0 24px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
      />
    </Container>
  );
};
