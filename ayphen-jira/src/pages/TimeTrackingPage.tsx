import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Tag, Tabs, DatePicker, Select, Empty, Spin, Avatar, Statistic, Input, message, Progress } from 'antd';
import { Clock, Calendar, CalendarDays, CalendarRange, Download, Timer, Play, Pause, Square, BarChart3, Users, Filter } from 'lucide-react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useStore } from '../store/useStore';
import { issuesApi } from '../services/api';
import { colors } from '../theme/colors';
import { formatMinutesToTimeString } from '../utils/timeFormat';

dayjs.extend(isoWeek);

const PageContainer = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  min-height: calc(100vh - 64px);
`;

const TimerCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);
  border: 1px solid rgba(14, 165, 233, 0.1);
  margin-bottom: 24px;
  background: linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%);
  text-align: center;
`;

const TimerDisplay = styled.div`
  font-size: 56px;
  font-weight: bold;
  color: #0EA5E9;
  margin: 20px 0;
  font-family: 'Monaco', 'Consolas', monospace;
  letter-spacing: 4px;
`;

const ControlButton = styled(Button)<{ $variant?: 'start' | 'pause' | 'stop' }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.$variant) {
      case 'start': return 'linear-gradient(135deg, #10B981, #059669)';
      case 'pause': return 'linear-gradient(135deg, #F59E0B, #D97706)';
      case 'stop': return 'linear-gradient(135deg, #EF4444, #DC2626)';
      default: return 'linear-gradient(135deg, #0EA5E9, #38BDF8)';
    }
  }};
  border: none !important;
  color: white !important;
  box-shadow: 0 4px 15px ${props => {
    switch (props.$variant) {
      case 'start': return 'rgba(16, 185, 129, 0.4)';
      case 'pause': return 'rgba(245, 158, 11, 0.4)';
      case 'stop': return 'rgba(239, 68, 68, 0.4)';
      default: return 'rgba(14, 165, 233, 0.4)';
    }
  }};
  
  &:hover {
    transform: scale(1.08);
    transition: all 0.2s ease;
    opacity: 0.95;
  }

  svg {
    color: white !important;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .ant-statistic-title {
    font-size: 13px;
    color: ${colors.text.secondary};
  }

  .ant-statistic-content-value {
    font-size: 24px;
    font-weight: 600;
    color: ${colors.primary[600]};
  }
`;

const ContentCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .ant-card-head {
    border-bottom: 1px solid ${colors.border.light};
  }
`;

const WorkLogItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid ${colors.border.light};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${colors.background.light};
  }
`;

const WorkLogContent = styled.div`
  flex: 1;
`;

const WorkLogHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const IssueTag = styled(Tag)`
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const TimeTag = styled.div`
  display: inline-block;
  background: ${colors.primary[50]};
  color: ${colors.primary[700]};
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
`;

const DateGroup = styled.div`
  margin-bottom: 24px;
`;

const DateHeader = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.secondary};
  padding: 8px 16px;
  background: ${colors.background.light};
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid ${colors.border.light};
  margin-bottom: 16px;
`;

interface WorkLogEntry {
  id: string;
  issueId: string;
  issueKey: string;
  issueSummary: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timeSpentMinutes: number;
  description?: string;
  startDate: string;
  createdAt: string;
}

type ViewMode = 'today' | 'week' | 'month' | 'all';

export const TimeTrackingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const { currentProject, issues, currentUser } = useStore();

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentIssue, setCurrentIssue] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    loadWorkLogs();
  }, [currentProject]);

  const formatTimerDisplay = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!currentIssue) {
      message.warning('Please select an issue first');
      return;
    }
    setIsRunning(true);
    setStartTime(new Date());
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = async () => {
    if (elapsedTime > 0 && currentIssue) {
      try {
        const timeSpentMinutes = Math.ceil(elapsedTime / 60);
        const userId = localStorage.getItem('userId') || '';
        const userName = localStorage.getItem('userName') || 'User';

        const newWorkLog = {
          id: `worklog-${Date.now()}`,
          timeSpentMinutes,
          description,
          startDate: startTime?.toISOString() || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          author: {
            id: userId,
            name: userName,
            avatar: localStorage.getItem('userAvatar') || undefined
          }
        };

        await issuesApi.update(currentIssue, {
          $addWorkLog: newWorkLog,
          timeSpent: timeSpentMinutes
        });

        message.success(`Logged ${formatMinutesToTimeString(timeSpentMinutes)} successfully!`);
        loadWorkLogs();
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

  const loadWorkLogs = async () => {
    if (!currentProject) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await issuesApi.getAll({ projectId: currentProject.id });
      const allIssues = response.data || [];

      const allWorkLogs: WorkLogEntry[] = [];
      
      allIssues.forEach((issue: any) => {
        if (issue.workLogs && Array.isArray(issue.workLogs)) {
          issue.workLogs.forEach((log: any) => {
            allWorkLogs.push({
              id: log.id,
              issueId: issue.id,
              issueKey: issue.key,
              issueSummary: issue.summary,
              author: log.author || { 
                id: 'unknown', 
                name: localStorage.getItem('userName') || 'User' 
              },
              timeSpentMinutes: log.timeSpentMinutes || log.timeSpent || 0,
              description: log.description,
              startDate: log.startDate,
              createdAt: log.createdAt
            });
          });
        }
      });

      allWorkLogs.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setWorkLogs(allWorkLogs);
    } catch (error) {
      console.error('Error loading work logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique assignees for filter
  const assignees = useMemo(() => {
    const uniqueAssignees = new Map<string, { id: string; name: string; avatar?: string }>();
    workLogs.forEach(log => {
      if (log.author?.id && !uniqueAssignees.has(log.author.id)) {
        uniqueAssignees.set(log.author.id, log.author);
      }
    });
    return Array.from(uniqueAssignees.values());
  }, [workLogs]);

  // Filter work logs based on view mode and assignee
  const filteredWorkLogs = useMemo(() => {
    const now = selectedDate;
    
    return workLogs.filter(log => {
      const logDate = dayjs(log.createdAt);
      
      // Date filter
      let dateMatch = true;
      switch (viewMode) {
        case 'today':
          dateMatch = logDate.isSame(now, 'day');
          break;
        case 'week':
          dateMatch = logDate.isSame(now, 'isoWeek');
          break;
        case 'month':
          dateMatch = logDate.isSame(now, 'month');
          break;
        case 'all':
        default:
          dateMatch = true;
      }

      // Assignee filter
      const assigneeMatch = selectedAssignee === 'all' || log.author?.id === selectedAssignee;

      return dateMatch && assigneeMatch;
    });
  }, [workLogs, viewMode, selectedDate, selectedAssignee]);

  // Group work logs by date
  const groupedWorkLogs = useMemo(() => {
    const groups: { [date: string]: WorkLogEntry[] } = {};
    
    filteredWorkLogs.forEach(log => {
      const dateKey = dayjs(log.createdAt).format('YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });

    return groups;
  }, [filteredWorkLogs]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalMinutes = filteredWorkLogs.reduce((sum, log) => sum + log.timeSpentMinutes, 0);
    const uniqueIssues = new Set(filteredWorkLogs.map(log => log.issueId)).size;
    const uniqueDays = Object.keys(groupedWorkLogs).length;
    const uniqueUsers = new Set(filteredWorkLogs.map(log => log.author?.id)).size;
    
    return {
      totalTime: formatMinutesToTimeString(totalMinutes),
      totalMinutes,
      entriesCount: filteredWorkLogs.length,
      uniqueIssues,
      uniqueDays,
      uniqueUsers,
      avgPerDay: uniqueDays > 0 ? formatMinutesToTimeString(Math.round(totalMinutes / uniqueDays)) : '0m'
    };
  }, [filteredWorkLogs, groupedWorkLogs]);

  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'today':
        return selectedDate.format('MMM DD, YYYY');
      case 'week':
        const weekStart = selectedDate.startOf('isoWeek').format('MMM DD');
        const weekEnd = selectedDate.endOf('isoWeek').format('MMM DD, YYYY');
        return `${weekStart} - ${weekEnd}`;
      case 'month':
        return selectedDate.format('MMMM YYYY');
      case 'all':
        return 'All Time';
      default:
        return '';
    }
  };

  const tabItems = [
    {
      key: 'today',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} /> Today
        </span>
      )
    },
    {
      key: 'week',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarDays size={14} /> This Week
        </span>
      )
    },
    {
      key: 'month',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarRange size={14} /> This Month
        </span>
      )
    },
    {
      key: 'all',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} /> All
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>
          <Timer size={28} color={colors.primary[500]} />
          Time Tracking
        </Title>
        <FilterBar>
          <Button icon={<Download size={14} />}>
            Export Timesheet
          </Button>
        </FilterBar>
      </PageHeader>

      {/* Timer Section */}
      <TimerCard title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Play size={18} /> Track Time</span>}>
        <TimerDisplay>
          {formatTimerDisplay(elapsedTime)}
        </TimerDisplay>

        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Select
            value={currentIssue || undefined}
            onChange={setCurrentIssue}
            placeholder="Select issue to track"
            style={{ width: 280 }}
            showSearch
            filterOption={(input, option) =>
              String(option?.label || '').toLowerCase().includes(input.toLowerCase())
            }
            options={issues.map(issue => ({
              value: issue.id,
              label: `${issue.key} - ${issue.summary}`
            }))}
          />

          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            style={{ width: 280 }}
          />
        </div>

        <div>
          {!isRunning ? (
            <ControlButton
              $variant="start"
              onClick={startTimer}
              disabled={!currentIssue}
            >
              <Play size={24} fill="white" />
            </ControlButton>
          ) : (
            <ControlButton
              $variant="pause"
              onClick={pauseTimer}
            >
              <Pause size={24} fill="white" />
            </ControlButton>
          )}

          <ControlButton
            $variant="stop"
            onClick={stopTimer}
            disabled={elapsedTime === 0}
          >
            <Square size={24} fill="white" />
          </ControlButton>
        </div>
      </TimerCard>

      {/* Stats */}
      <StatsRow>
        <StatCard>
          <Statistic
            title="Total Time"
            value={stats.totalTime}
            prefix={<Clock size={16} style={{ color: colors.primary[500] }} />}
          />
        </StatCard>
        <StatCard>
          <Statistic
            title="Entries"
            value={stats.entriesCount}
            prefix={<Timer size={16} style={{ color: colors.primary[500] }} />}
          />
        </StatCard>
        <StatCard>
          <Statistic
            title="Issues Worked"
            value={stats.uniqueIssues}
            prefix={<BarChart3 size={16} style={{ color: colors.primary[500] }} />}
          />
        </StatCard>
        <StatCard>
          <Statistic
            title="Team Members"
            value={stats.uniqueUsers}
            prefix={<Users size={16} style={{ color: colors.primary[500] }} />}
          />
        </StatCard>
        <StatCard>
          <Statistic
            title="Avg per Day"
            value={stats.avgPerDay}
          />
        </StatCard>
      </StatsRow>

      {/* Filters */}
      <FilterSection>
        <Filter size={16} style={{ color: colors.text.secondary }} />
        <span style={{ fontWeight: 500, color: colors.text.secondary }}>Filters:</span>
        
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          picker={viewMode === 'month' ? 'month' : viewMode === 'week' ? 'week' : 'date'}
          allowClear={false}
          style={{ width: 180 }}
        />

        <Select
          value={selectedAssignee}
          onChange={setSelectedAssignee}
          style={{ width: 200 }}
          options={[
            { value: 'all', label: 'All Team Members' },
            ...assignees.map(a => ({ value: a.id, label: a.name }))
          ]}
        />
      </FilterSection>

      {/* View Mode Tabs */}
      <ContentCard>
        <Tabs
          activeKey={viewMode}
          onChange={(key) => setViewMode(key as ViewMode)}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        <div style={{ 
          padding: '12px 16px', 
          background: colors.primary[50], 
          borderRadius: 8, 
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 600, color: colors.primary[700] }}>
            {getViewModeLabel()}
          </span>
          <span style={{ color: colors.primary[600], fontWeight: 600 }}>
            {stats.totalTime} total • {stats.entriesCount} entries
          </span>
        </div>

        {/* Work Logs List */}
        {Object.keys(groupedWorkLogs).length > 0 ? (
          Object.entries(groupedWorkLogs)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, logs]) => {
              const dayTotal = logs.reduce((sum, log) => sum + log.timeSpentMinutes, 0);
              
              return (
                <DateGroup key={date}>
                  <DateHeader>
                    <span>{dayjs(date).format('dddd, MMMM D, YYYY')}</span>
                    <TimeTag>{formatMinutesToTimeString(dayTotal)}</TimeTag>
                  </DateHeader>
                  
                  {logs.map(log => (
                    <WorkLogItem key={log.id}>
                      <Avatar 
                        size={36} 
                        src={log.author?.avatar} 
                        style={{ flexShrink: 0, backgroundColor: colors.primary[500] }}
                      >
                        {log.author?.name?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      
                      <WorkLogContent>
                        <WorkLogHeader>
                          <IssueTag color="blue">{log.issueKey}</IssueTag>
                          <span style={{ color: colors.text.secondary, fontSize: 13 }}>
                            {log.issueSummary}
                          </span>
                        </WorkLogHeader>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                          <TimeTag>{formatMinutesToTimeString(log.timeSpentMinutes)}</TimeTag>
                          <span style={{ color: colors.text.tertiary, fontSize: 12 }}>
                            by {log.author?.name || 'User'}
                          </span>
                        </div>
                        
                        {log.description && (
                          <div style={{ color: colors.text.secondary, fontSize: 13, marginTop: 8 }}>
                            {log.description}
                          </div>
                        )}
                      </WorkLogContent>
                      
                      <div style={{ 
                        fontSize: 11, 
                        color: colors.text.tertiary,
                        whiteSpace: 'nowrap'
                      }}>
                        {dayjs(log.createdAt).format('h:mm A')}
                      </div>
                    </WorkLogItem>
                  ))}
                </DateGroup>
              );
            })
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: colors.text.secondary }}>
                No work logs found for {getViewModeLabel().toLowerCase()}
              </span>
            }
          />
        )}
      </ContentCard>
    </PageContainer>
  );
};

export default TimeTrackingPage;
