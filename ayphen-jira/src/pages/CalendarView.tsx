import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Calendar as AntCalendar, Badge, Card, Select, Tag, Button, Tooltip, Row, Col, Statistic, Spin } from 'antd';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { api } from '../services/api';

const Container = styled.div`
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f5f5f5;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
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

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  border-radius: 12px;
  .ant-card-body {
    padding: 16px 20px;
  }
`;

const CalendarCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  
  .ant-picker-calendar {
    background: transparent;
  }
  
  .ant-picker-cell-selected .ant-picker-cell-inner {
    background: #0EA5E9 !important;
  }
  
  .ant-picker-cell-today .ant-picker-cell-inner::before {
    border-color: #0EA5E9 !important;
  }
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
`;

const LegendDot = styled.div<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const EventItem = styled.div<{ type: string }>`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 2px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: ${props =>
    props.type === 'bug' ? '#FEE2E2' :
      props.type === 'story' ? '#D1FAE5' :
        props.type === 'task' ? '#DBEAFE' :
          props.type === 'sprint-start' ? '#FEF3C7' :
            props.type === 'sprint-end' ? '#E0E7FF' :
              '#F3F4F6'
  };
  color: ${props =>
    props.type === 'bug' ? '#DC2626' :
      props.type === 'story' ? '#059669' :
        props.type === 'task' ? '#2563EB' :
          props.type === 'sprint-start' ? '#D97706' :
            props.type === 'sprint-end' ? '#4F46E5' :
              '#374151'
  };
  
  &:hover {
    opacity: 0.8;
  }
`;

export const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useStore();
  const [filter, setFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  // Local state for fresh API data
  const [issues, setIssues] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);

  // Fetch fresh data from API
  useEffect(() => {
    const loadData = async (isBackground = false) => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      if (!isBackground) setLoading(true);
      else setIsRefreshing(true);

      try {
        const userId = localStorage.getItem('userId');

        // Fetch issues, sprints and workflow in parallel
        const [issuesRes, sprintsRes, workflowRes] = await Promise.all([
          api.get('/issues', { params: { projectId: currentProject.id, userId } }),
          api.get('/sprints', { params: { projectId: currentProject.id } }),
          api.get(`/workflows/${currentProject.workflowId || 'workflow-1'}`)
        ]);

        setIssues(issuesRes.data || []);
        setWorkflowStatuses(workflowRes.data.statuses || []);

        const sprintData = Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.sprints || []);
        setSprints(sprintData);
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    loadData();

    // Refresh data every 30 seconds silently
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [currentProject?.id]);

  // Calculate stats
  const projectIssues = issues;

  const dueThisWeek = projectIssues.filter(i => {
    if (!i.dueDate) return false;
    const due = dayjs(i.dueDate);
    return due.isAfter(dayjs()) && due.isBefore(dayjs().add(7, 'day'));
  }).length;

  const overdue = projectIssues.filter(i => {
    if (!i.dueDate) return false;
    const ws = workflowStatuses.find(s => s.id === i.status);
    const isDone = ws ? ws.category === 'DONE' : i.status === 'done';
    return !isDone && dayjs(i.dueDate).isBefore(dayjs());
  }).length;

  const upcomingSprints = sprints.filter(s =>
    s.status !== 'completed' && s.status !== 'active' && s.startDate && dayjs(s.startDate).isAfter(dayjs())
  ).length;

  const getListData = (value: Dayjs) => {
    const events: any[] = [];

    // Find issues with due date on this day
    const dayIssues = projectIssues.filter(issue => {
      if (!issue.dueDate) return false;
      if (filter !== 'all' && issue.type !== filter) return false;
      const dueDate = dayjs(issue.dueDate);
      return dueDate.isSame(value, 'day');
    });

    dayIssues.forEach(issue => {
      events.push({
        type: issue.type,
        key: issue.key,
        content: issue.summary,
        status: issue.status,
        issueKey: issue.key
      });
    });

    // Find sprint starts/ends
    sprints.forEach(sprint => {
      if (sprint.startDate && dayjs(sprint.startDate).isSame(value, 'day')) {
        events.push({
          type: 'sprint-start',
          key: `sprint-start-${sprint.id}`,
          content: `🚀 ${sprint.name} starts`,
          sprintId: sprint.id
        });
      }
      if (sprint.endDate && dayjs(sprint.endDate).isSame(value, 'day')) {
        events.push({
          type: 'sprint-end',
          key: `sprint-end-${sprint.id}`,
          content: `🏁 ${sprint.name} ends`,
          sprintId: sprint.id
        });
      }
    });

    return events;
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    if (listData.length === 0) return null;

    return (
      <div style={{ maxHeight: 60, overflow: 'hidden' }}>
        {listData.slice(0, 3).map((item) => (
          <Tooltip key={item.key} title={item.content}>
            <EventItem
              type={item.type}
              onClick={(e) => {
                e.stopPropagation();
                if (item.issueKey) {
                  navigate(`/issue/${item.issueKey}`);
                }
              }}
            >
              {item.content.substring(0, 20)}{item.content.length > 20 ? '...' : ''}
            </EventItem>
          </Tooltip>
        ))}
        {listData.length > 3 && (
          <div style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
            +{listData.length - 3} more
          </div>
        )}
      </div>
    );
  };

  return (
    <Container>
      <Header>
        <Title>
          <Calendar size={28} color="#0EA5E9" />
          Calendar
          {isRefreshing && (
            <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#999', marginLeft: '8px' }}>
              (Refreshing...)
            </span>
          )}
        </Title>
        <Controls>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 140 }}
            options={[
              { label: 'All Issues', value: 'all' },
              { label: 'Stories', value: 'story' },
              { label: 'Bugs', value: 'bug' },
              { label: 'Tasks', value: 'task' },
            ]}
          />
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Issue
          </Button>
        </Controls>
      </Header>

      <StatsRow>
        <StatCard>
          <Statistic
            title="Due This Week"
            value={dueThisWeek}
            valueStyle={{ color: '#F59E0B' }}
          />
        </StatCard>
        <StatCard>
          <Statistic
            title="Overdue"
            value={overdue}
            valueStyle={{ color: '#EF4444' }}
          />
        </StatCard>
        <StatCard>
          <Statistic
            title="Upcoming Sprints"
            value={upcomingSprints}
            valueStyle={{ color: '#8B5CF6' }}
          />
        </StatCard>
        <StatCard>
          <Statistic
            title="Total with Due Date"
            value={projectIssues.filter(i => i.dueDate).length}
            valueStyle={{ color: '#10B981' }}
          />
        </StatCard>
      </StatsRow>

      <CalendarCard>
        <Spin spinning={loading} tip="Loading calendar data...">
          <Legend>
            <LegendItem><LegendDot color="#D1FAE5" /> Story</LegendItem>
            <LegendItem><LegendDot color="#FEE2E2" /> Bug</LegendItem>
            <LegendItem><LegendDot color="#DBEAFE" /> Task</LegendItem>
            <LegendItem><LegendDot color="#FEF3C7" /> Sprint Start</LegendItem>
            <LegendItem><LegendDot color="#E0E7FF" /> Sprint End</LegendItem>
          </Legend>
          <AntCalendar
            dateCellRender={dateCellRender}
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </Spin>
      </CalendarCard>

      <CreateIssueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => setCreateModalOpen(false)}
      />
    </Container>
  );
};
