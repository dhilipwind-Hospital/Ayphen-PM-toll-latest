import React from 'react';
import styled from 'styled-components';
import { Select, Button, Badge } from 'antd';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Priority color mapping
export const priorityColors = {
  highest: '#FF0000',
  high: '#FF5630',
  medium: '#FFAB00',
  low: '#36B37E',
  lowest: '#00B8D9',
};

// Helper: Calculate days in column (aging)
export const calculateDaysInColumn = (issue: any): number => {
  if (!issue.updatedAt) return 0;
  const daysSince = Math.floor((Date.now() - new Date(issue.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  return daysSince;
};

// Helper: Group issues by swimlane
export const groupIssuesBySwimlane = (issues: any[], groupBy: string) => {
  if (groupBy === 'none') {
    return [{ id: 'default', name: 'All Issues', issues }];
  }

  const grouped: Record<string, any[]> = {};

  issues.forEach(issue => {
    let key = 'Unassigned';
    let name = 'Unassigned';

    if (groupBy === 'epic') {
      key = issue.epicLink || 'no-epic';
      name = issue.epicKey || 'No Epic';
    } else if (groupBy === 'assignee') {
      key = issue.assigneeId || 'unassigned';
      name = issue.assignee?.name || 'Unassigned';
    } else if (groupBy === 'priority') {
      key = issue.priority || 'no-priority';
      name = issue.priority ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1) : 'No Priority';
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(issue);
  });

  return Object.entries(grouped).map(([id, issues]) => ({
    id,
    name: issues[0]?.assignee?.name || issues[0]?.epicKey || id.charAt(0).toUpperCase() + id.slice(1),
    issues,
  }));
};

// Aging Badge Component
export const AgingBadge = styled.div<{ days: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  background: ${props => 
    props.days > 7 ? '#ff4d4f' : 
    props.days > 3 ? '#faad14' : '#52c41a'
  };
  color: white;
  margin-left: 4px;
`;

// Swimlane Container
export const SwimlaneContainer = styled.div`
  margin-bottom: 24px;
`;

export const SwimlaneHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f4f5f7;
  border-radius: 3px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #172B4D;
`;

export const SwimlaneContent = styled.div`
  display: flex;
  gap: 16px;
`;

// Column Header with collapse
export const CollapsibleColumnHeader = styled.div<{ isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f4f5f7;
  border-radius: 3px 3px 0 0;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background: #e8eaed;
  }
`;

// Swimlane Selector Component
export const SwimlaneSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <Select
    value={value}
    onChange={onChange}
    style={{ width: 150 }}
    size="small"
  >
    <Select.Option value="none">No Swimlanes</Select.Option>
    <Select.Option value="epic">Group by Epic</Select.Option>
    <Select.Option value="assignee">Group by Assignee</Select.Option>
    <Select.Option value="priority">Group by Priority</Select.Option>
  </Select>
);

// Column Collapse Toggle
export const ColumnCollapseToggle: React.FC<{
  isCollapsed: boolean;
  onClick: () => void;
}> = ({ isCollapsed, onClick }) => (
  <Button
    type="text"
    size="small"
    icon={isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
    onClick={onClick}
  />
);

// Card with Color Coding
export const ColorCodedCard = styled.div<{ priority: string }>`
  border-left: 4px solid ${props => priorityColors[props.priority as keyof typeof priorityColors] || priorityColors.medium};
`;

// Sprint Health Indicator
export interface SprintHealth {
  status: 'on-track' | 'at-risk' | 'off-track';
  completionRate: number;
  velocity: number;
}

export const calculateSprintHealth = (sprint: any): SprintHealth => {
  if (!sprint || !sprint.startDate || !sprint.endDate) {
    return { status: 'on-track', completionRate: 0, velocity: 0 };
  }

  const totalDays = (new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = (Date.now() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24);
  const timeProgress = Math.min(daysElapsed / totalDays, 1);

  const completed = sprint.completedPoints || 0;
  const total = sprint.totalPoints || 1;
  const workProgress = completed / total;

  let status: 'on-track' | 'at-risk' | 'off-track' = 'on-track';
  if (workProgress < timeProgress * 0.7) {
    status = 'off-track';
  } else if (workProgress < timeProgress * 0.9) {
    status = 'at-risk';
  }

  return {
    status,
    completionRate: workProgress * 100,
    velocity: daysElapsed > 0 ? completed / daysElapsed : 0,
  };
};

export const SprintHealthBadge = styled(Badge)<{ status: string }>`
  .ant-badge-status-dot {
    width: 10px;
    height: 10px;
  }
`;

export const SprintHealthIndicator: React.FC<{ sprint: any }> = ({ sprint }) => {
  const health = calculateSprintHealth(sprint);
  
  const statusConfig = {
    'on-track': { text: 'On Track', color: '#52c41a' },
    'at-risk': { text: 'At Risk', color: '#faad14' },
    'off-track': { text: 'Off Track', color: '#ff4d4f' },
  };

  const config = statusConfig[health.status];

  return (
    <Badge 
      status="processing" 
      text={`${config.text} (${health.completionRate.toFixed(0)}%)`}
      style={{ color: config.color }}
    />
  );
};
