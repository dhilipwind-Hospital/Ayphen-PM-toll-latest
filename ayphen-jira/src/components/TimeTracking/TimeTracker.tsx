import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Table, Progress, Statistic, Row, Col, DatePicker, Tag, message } from 'antd';
import { Play, Pause, Square, Clock, Calendar, BarChart3, Download } from 'lucide-react';
import styled from 'styled-components';
import { useStore } from '../../store/useStore';
import axios from 'axios';

const TrackerContainer = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%);
  min-height: calc(100vh - 64px);
`;

const TimerCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.1);
  border: 1px solid rgba(244, 114, 182, 0.1);
  margin-bottom: 24px;
  text-align: center;
`;

const TimerDisplay = styled.div`
  font-size: 48px;
  font-weight: bold;
  color: #EC4899;
  margin: 20px 0;
  font-family: 'Monaco', monospace;
`;

const ControlButton = styled(Button)<{ variant?: 'start' | 'pause' | 'stop' }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.variant) {
      case 'start': return 'linear-gradient(135deg, #10B981, #059669)';
      case 'pause': return 'linear-gradient(135deg, #F59E0B, #D97706)';
      case 'stop': return 'linear-gradient(135deg, #EF4444, #DC2626)';
      default: return 'linear-gradient(135deg, #EC4899, #F472B6)';
    }
  }};
  border: none;
  color: white;
  
  &:hover {
    transform: scale(1.05);
    transition: transform 0.2s ease;
  }
`;

interface TimeEntry {
  id: string;
  issue: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  date: string;
  billable: boolean;
}

export const TimeTracker: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentIssue, setCurrentIssue] = useState('');
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [todayStats, setTodayStats] = useState({ total: 0, billable: 0, efficiency: 0 });
  
  const { issues, currentUser, currentProject } = useStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadTimeEntries();
    loadTodayStats();
  }, [currentProject]);

  const loadTimeEntries = async () => {
    if (!currentProject || !currentUser) return;
    
    try {
      const response = await axios.get(`http://localhost:8500/api/time-tracking/entries`, {
        params: { 
          projectId: currentProject.id,
          userId: currentUser.id,
          date: new Date().toISOString().split('T')[0]
        }
      });
      setTimeEntries(response.data);
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  const loadTodayStats = async () => {
    if (!currentProject || !currentUser) return;
    
    try {
      const response = await axios.get(`http://localhost:8500/api/time-tracking/stats/today`, {
        params: { 
          projectId: currentProject.id,
          userId: currentUser.id
        }
      });
      setTodayStats(response.data);
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const startTimer = () => {
    if (!currentIssue) {
      message.error('Please select an issue first');
      return;
    }
    setIsRunning(true);
    setStartTime(new Date());
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = async () => {
    if (elapsedTime > 0 && currentIssue && startTime && currentUser) {
      try {
        const timeEntry = {
          issueId: currentIssue,
          userId: currentUser.id,
          projectId: currentProject?.id,
          description: description,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString(),
          duration: Math.floor(elapsedTime / 60), // minutes
          billable: true
        };
        
        await axios.post('http://localhost:8500/api/time-tracking/entries', timeEntry);
        
        message.success('Time entry saved successfully!');
        loadTimeEntries();
        loadTodayStats();
      } catch (error) {
        console.error('Error saving time entry:', error);
        message.error('Failed to save time entry');
      }
    }
    
    setIsRunning(false);
    setElapsedTime(0);
    setCurrentIssue('');
    setDescription('');
    setStartTime(null);
  };

  const exportTimesheet = async () => {
    try {
      const response = await axios.get(`http://localhost:8500/api/time-tracking/export`, {
        params: { 
          projectId: currentProject?.id,
          userId: currentUser?.id,
          format: 'csv'
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `timesheet-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Timesheet exported successfully!');
    } catch (error) {
      console.error('Error exporting timesheet:', error);
      message.error('Failed to export timesheet');
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const columns = [
    {
      title: 'Issue',
      dataIndex: 'issue',
      key: 'issue',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (minutes: number) => formatDuration(minutes)
    },
    {
      title: 'Billable',
      dataIndex: 'billable',
      key: 'billable',
      render: (billable: boolean) => (
        <Tag color={billable ? 'green' : 'red'}>
          {billable ? 'Yes' : 'No'}
        </Tag>
      )
    }
  ];

  return (
    <TrackerContainer>
      <TimerCard title="Time Tracker">
        <TimerDisplay>
          {formatTime(elapsedTime)}
        </TimerDisplay>
        
        <div style={{ marginBottom: 20 }}>
          <Select
            value={currentIssue}
            onChange={setCurrentIssue}
            placeholder="Select issue"
            style={{ width: 200, marginRight: 12 }}
            showSearch
            filterOption={(input, option) =>
              (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {issues.map(issue => (
              <Select.Option key={issue.id} value={issue.id}>
                {issue.key} - {issue.summary}
              </Select.Option>
            ))}
          </Select>
          
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            style={{ width: 300 }}
          />
        </div>

        <div>
          {!isRunning ? (
            <ControlButton
              variant="start"
              icon={<Play size={24} />}
              onClick={startTimer}
              disabled={!currentIssue}
            />
          ) : (
            <ControlButton
              variant="pause"
              icon={<Pause size={24} />}
              onClick={pauseTimer}
            />
          )}
          
          <ControlButton
            variant="stop"
            icon={<Square size={24} />}
            onClick={stopTimer}
            disabled={elapsedTime === 0}
          />
        </div>
      </TimerCard>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Time Today"
              value={formatDuration(todayStats.total)}
              prefix={<Clock style={{ color: '#EC4899' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Billable Time"
              value={formatDuration(todayStats.billable)}
              prefix={<BarChart3 style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Efficiency"
              value={todayStats.efficiency}
              suffix="%"
              prefix={<Calendar style={{ color: '#F59E0B' }} />}
            />
            <Progress percent={todayStats.efficiency} strokeColor="#EC4899" size="small" />
          </Card>
        </Col>
      </Row>

      <Card
        title="Time Entries"
        extra={
          <Button 
            icon={<Download size={16} />} 
            style={{ color: '#EC4899' }}
            onClick={exportTimesheet}
          >
            Export
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={timeEntries}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </TrackerContainer>
  );
};