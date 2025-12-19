import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Table, Spin } from 'antd';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, Clock } from 'lucide-react';
import styled from 'styled-components';
import { reportsApi } from '../services/api';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';
import { message } from 'antd';

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 56px);
`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AdvancedReports: React.FC = () => {
  const { currentProject, sprints } = useStore();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('velocity');
  const [dateRange, setDateRange] = useState<[any, any]>([dayjs().subtract(30, 'days'), dayjs()]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (currentProject) {
      loadReport();
    }
  }, [reportType, dateRange, currentProject]);

  const loadReport = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'velocity':
          response = await reportsApi.getVelocity(currentProject.id);
          break;
        case 'burndown':
          const activeSprint = sprints.find(s => s.status === 'active') || sprints[0];
          if (activeSprint) {
            response = await reportsApi.getBurndown(activeSprint.id);
          } else {
            message.warning('No sprints found for burndown chart');
            response = { data: null };
          }
          break;
        case 'cumulative':
          response = await reportsApi.getCumulativeFlow(currentProject.id);
          break;
        case 'time-tracking':
          response = await reportsApi.getTimeTracking(currentProject.id);
          break;
        case 'workload':
          response = await reportsApi.getUserWorkload(currentProject.id);
          break;
        default:
          response = { data: null };
      }
      setData(response?.data);
    } catch (error) {
      console.error('Error loading report:', error);
      message.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      await reportsApi.export(format, reportType);
      message.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export failed');
    }
  };

  return (
    <Container>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <h1>Advanced Reports</h1>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button icon={<Download size={16} />} onClick={() => exportReport('pdf')} style={{ marginRight: 8 }}>
            Export PDF
          </Button>
          <Button icon={<Download size={16} />} onClick={() => exportReport('csv')}>
            Export CSV
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Select
            value={reportType}
            onChange={setReportType}
            style={{ width: '100%' }}
            options={[
              { value: 'velocity', label: '📊 Velocity Chart' },
              { value: 'burndown', label: '🔥 Burndown Chart' },
              { value: 'cumulative', label: '📈 Cumulative Flow' },
              { value: 'time-tracking', label: '⏱️ Time Tracking' },
              { value: 'workload', label: '👥 User Workload' },
            ]}
          />
        </Col>
        <Col span={8}>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [any, any])}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Spin size="large" />
        </div>
      ) : !data || (Array.isArray(data) && data.length === 0) ? (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <TrendingUp size={48} color="#ccc" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#999' }}>No Data Available</h3>
          <p style={{ color: '#bbb' }}>
            No report data found for the selected period. Try selecting a different date range or report type.
          </p>
          <Button type="primary" onClick={loadReport} style={{ marginTop: 16 }}>
            Refresh Data
          </Button>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title={`${reportType.toUpperCase()} Report`}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};
