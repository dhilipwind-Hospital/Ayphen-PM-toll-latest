import React from 'react';
import styled from 'styled-components';
import { Calendar as AntCalendar, Badge, Card } from 'antd';
import { Dayjs } from 'dayjs';
import { useStore } from '../store/useStore';

const Container = styled.div`
  padding: 24px;
  height: calc(100vh - 64px);
  overflow-y: auto;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #6b7280;
`;

export const CalendarView: React.FC = () => {
  const { issues } = useStore();

  const getListData = (value: Dayjs) => {
    const listData = [];
    
    // Find issues with due date on this day
    const dayIssues = issues.filter(issue => {
      if (!issue.dueDate) return false;
      const dueDate = new Date(issue.dueDate);
      return (
        dueDate.getDate() === value.date() &&
        dueDate.getMonth() === value.month() &&
        dueDate.getFullYear() === value.year()
      );
    });

    // Find sprints starting or ending (if we had sprint data easily accessible here with dates formatted same way)
    // For now just issues

    return dayIssues.map(issue => ({
      type: issue.status === 'done' ? 'success' : issue.status === 'in-progress' ? 'processing' : 'warning',
      content: `${issue.key}: ${issue.summary}`
    }));
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type as any} text={item.content} style={{ fontSize: '12px' }} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Container>
      <Header>
        <Title>Calendar</Title>
        <Subtitle>View issue due dates and sprint schedules</Subtitle>
      </Header>
      
      <Card>
        <AntCalendar dateCellRender={dateCellRender} />
      </Card>
    </Container>
  );
};
