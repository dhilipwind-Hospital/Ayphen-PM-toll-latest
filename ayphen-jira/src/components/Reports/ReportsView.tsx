import React, { useState, useEffect } from 'react';
import { Card, Select, DatePicker, Button, Tabs, Spin } from 'antd';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';
import styled from 'styled-components';
import { reportsLegacyApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

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

const Filters = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const ChartCard = styled(Card)`
  margin-bottom: 24px;
`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState('burndown');
  const [projectId, setProjectId] = useState('project-1');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadReportData();
  }, [reportType, projectId]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'burndown':
          response = await reportsLegacyApi.getSprintBurndown('sprint-1');
          break;
        case 'velocity':
          response = await reportsLegacyApi.getVelocity(projectId);
          break;
        case 'cumulative-flow':
          response = await reportsLegacyApi.getCumulativeFlow(projectId);
          break;
        case 'created-vs-resolved':
          response = await reportsLegacyApi.getCreatedVsResolved(projectId);
          break;
        case 'pie-chart':
          response = await reportsLegacyApi.getPieChart(projectId, 'status');
          break;
        case 'time-tracking':
          response = await reportsLegacyApi.getTimeTracking(projectId);
          break;
        case 'average-age':
          response = await reportsLegacyApi.getAverageAge(projectId);
          break;
        case 'resolution-time':
          response = await reportsLegacyApi.getResolutionTime(projectId);
          break;
        case 'user-workload':
          response = await reportsLegacyApi.getUserWorkload(projectId);
          break;
        case 'sprint-report':
          response = await reportsLegacyApi.getSprintReport('sprint-1');
          break;
        default:
          response = { data: null };
      }
      setData(response.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!data) return <div>No data available</div>;

    switch (reportType) {
      case 'burndown':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ideal" stroke="#8884d8" name="Ideal" />
              <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'velocity':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="committed" fill="#8884d8" name="Committed" />
              <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'created-vs-resolved':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#8884d8" name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie-chart':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'user-workload':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="assignee" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" name="Total Issues" />
              <Bar dataKey="inProgress" fill="#82ca9d" name="In Progress" />
              <Bar dataKey="done" fill="#ffc658" name="Done" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Select a report type</div>;
    }
  };

  return (
    <Container>
      <Header>
        <h1>Reports & Analytics</h1>
        <Button icon={<Download size={16} />}>Export</Button>
      </Header>

      <Filters>
        <Select
          style={{ width: 200 }}
          value={reportType}
          onChange={setReportType}
          placeholder="Select Report"
        >
          <Option value="burndown">Sprint Burndown</Option>
          <Option value="velocity">Velocity Chart</Option>
          <Option value="cumulative-flow">Cumulative Flow</Option>
          <Option value="created-vs-resolved">Created vs Resolved</Option>
          <Option value="pie-chart">Pie Chart</Option>
          <Option value="time-tracking">Time Tracking</Option>
          <Option value="average-age">Average Age</Option>
          <Option value="resolution-time">Resolution Time</Option>
          <Option value="user-workload">User Workload</Option>
          <Option value="sprint-report">Sprint Report</Option>
        </Select>

        <Select
          style={{ width: 200 }}
          value={projectId}
          onChange={setProjectId}
          placeholder="Select Project"
        >
          <Option value="project-1">Project 1</Option>
          <Option value="project-2">Project 2</Option>
        </Select>

        <RangePicker />
      </Filters>

      <ChartCard>
        <Spin spinning={loading}>
          {renderChart()}
        </Spin>
      </ChartCard>
    </Container>
  );
};
