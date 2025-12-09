import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Table, Spin } from 'antd';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, Clock } from 'lucide-react';
import styled from 'styled-components';
import { reportsApi } from '../services/api';
import dayjs from 'dayjs';

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 56px);
`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AdvancedReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('velocity');
  const [dateRange, setDateRange] = useState<[any, any]>([dayjs().subtract(30, 'days'), dayjs()]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadReport();
  }, [reportType, dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'velocity':
          response = await reportsApi.getVelocity('project-1');
          break;
        case 'burndown':
          response = await reportsApi.getBurndown('sprint-1');
          break;
        case 'cumulative':
          response = await reportsApi.getCumulativeFlow('project-1');
          break;
        case 'time-tracking':
          response = await reportsApi.getTimeTracking('project-1');
          break;
        case 'workload':
          response = await reportsApi.getUserWorkload('project-1');
          break;
        default:
          response = { data: null };
      }
      setData(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      await reportsApi.export(format, reportType);
      alert(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
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
        <Spin size="large" />
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
