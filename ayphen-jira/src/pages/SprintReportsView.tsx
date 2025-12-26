import React, { useState, useEffect } from 'react';
import { Card, Select, Row, Col, Statistic, Table, Button, message } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import styled from 'styled-components';
import { useStore } from '../store/useStore';
import { sprintsApi } from '../services/api';
import { colors } from '../theme/colors';

const Container = styled.div`
  padding: 24px;
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

const ChartCard = styled(Card)`
  margin-bottom: 24px;
`;

const StatsRow = styled(Row)`
  margin-bottom: 24px;
`;

export const SprintReportsView: React.FC = () => {
  const { sprints, currentProject, isInitialized } = useStore();
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [burndownData, setBurndownData] = useState<any[]>([]);
  const [velocityData, setVelocityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  const projectSprints = sprints.filter(s => 
    currentProject ? s.projectId === currentProject.id : true
  );

  const completedSprints = projectSprints.filter(s => s.status === 'completed');

  useEffect(() => {
    if (completedSprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(completedSprints[0].id);
    }
  }, [completedSprints, selectedSprintId]);

  useEffect(() => {
    if (selectedSprintId) {
      loadSprintReport();
      loadBurndownData();
    }
  }, [selectedSprintId]);

  useEffect(() => {
    if (currentProject) {
      loadVelocityData();
    }
  }, [currentProject]);

  const loadSprintReport = async () => {
    if (!selectedSprintId) return;
    
    setLoading(true);
    try {
      const response = await sprintsApi.getReport(selectedSprintId);
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to load sprint report:', error);
      message.error('Failed to load sprint report');
    } finally {
      setLoading(false);
    }
  };

  const loadBurndownData = async () => {
    if (!selectedSprintId) return;
    
    try {
      const response = await sprintsApi.getBurndown(selectedSprintId);
      setBurndownData(response.data);
    } catch (error) {
      console.error('Failed to load burndown data:', error);
    }
  };

  const loadVelocityData = async () => {
    if (!currentProject) return;
    
    try {
      const response = await sprintsApi.getVelocity(currentProject.id);
      setVelocityData(response.data);
    } catch (error) {
      console.error('Failed to load velocity data:', error);
    }
  };

  const handleExportPDF = () => {
    message.info('PDF export feature coming soon!');
  };

  const issueColumns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Story Points',
      dataIndex: 'storyPoints',
      key: 'storyPoints',
      render: (points: number) => points || '-',
    },
  ];

  return (
    <Container>
      <Header>
        <Title>Sprint Reports</Title>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
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
          <Button icon={<Download size={16} />} onClick={handleExportPDF}>
            Export PDF
          </Button>
        </div>
      </Header>

      {reportData && (
        <>
          {/* Statistics */}
          <StatsRow gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Completed Issues"
                  value={reportData.completedCount}
                  prefix={<CheckCircle size={20} color="#52c41a" />}
                  suffix={`/ ${reportData.totalCount}`}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Incomplete Issues"
                  value={reportData.incompleteCount}
                  prefix={<XCircle size={20} color="#ff4d4f" />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Story Points Completed"
                  value={reportData.completedPoints}
                  suffix={`/ ${reportData.totalPoints}`}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Completion Rate"
                  value={reportData.totalCount > 0 
                    ? Math.round((reportData.completedCount / reportData.totalCount) * 100)
                    : 0
                  }
                  suffix="%"
                  prefix={<TrendingUp size={20} color="#1890ff" />}
                />
              </Card>
            </Col>
          </StatsRow>

          {/* Burndown Chart */}
          <ChartCard title="Burndown Chart" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ideal" 
                  stroke="#8884d8" 
                  strokeDasharray="5 5"
                  name="Ideal"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Velocity Chart */}
          <ChartCard title="Velocity Chart (Last 6 Sprints)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprint" />
                <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="points" fill="#1890ff" name="Story Points Completed" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Completed Issues Table */}
          <ChartCard title={`Completed Issues (${reportData.completedCount})`}>
            <Table
              columns={issueColumns}
              dataSource={reportData.completed}
              rowKey="id"
              pagination={false}
            />
          </ChartCard>

          {/* Incomplete Issues Table */}
          {reportData.incompleteCount > 0 && (
            <ChartCard title={`Incomplete Issues (${reportData.incompleteCount})`}>
              <Table
                columns={issueColumns}
                dataSource={reportData.incomplete}
                rowKey="id"
                pagination={false}
              />
            </ChartCard>
          )}
        </>
      )}

      {!reportData && completedSprints.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: colors.text.secondary }}>
            <p>No completed sprints yet.</p>
            <p>Complete a sprint to see reports here.</p>
          </div>
        </Card>
      )}
    </Container>
  );
};
