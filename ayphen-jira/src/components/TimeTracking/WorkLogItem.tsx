import React from 'react';
import { Avatar, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import styled from 'styled-components';
import { formatMinutesToTimeString } from '../../utils/timeFormat';
import { colors } from '../../theme/colors';
import dayjs from 'dayjs';
import { useStore } from '../../store/useStore';

const Container = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${colors.border.light};
  transition: background 0.2s;
  
  &:hover {
    background: ${colors.background.hover};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const AuthorName = styled.span`
  font-weight: 600;
  font-size: 13px;
  color: ${colors.text.primary};
`;

const LogDate = styled.span`
  font-size: 11px;
  color: ${colors.text.tertiary};
`;

const TimeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  margin-left: 36px;
  font-size: 13px;
`;

const TimeSpent = styled.span`
  font-weight: 600;
  color: ${colors.primary[500]};
  background: ${colors.primary[50]};
  padding: 2px 8px;
  border-radius: 4px;
`;

const Separator = styled.span`
  color: ${colors.text.tertiary};
`;

const Description = styled.span`
  color: ${colors.text.secondary};
`;

const StartedAt = styled.div`
  font-size: 11px;
  color: ${colors.text.tertiary};
  margin-top: 4px;
  margin-left: 36px;
`;

export interface WorkLogData {
  id: string;
  issueId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timeSpentMinutes: number;
  description?: string;
  startDate?: string;
  createdAt: string;
  updatedAt?: string;
}

interface WorkLogItemProps {
  workLog: WorkLogData;
  onEdit: (log: WorkLogData) => void;
  onDelete: (log: WorkLogData) => void;
}

export const WorkLogItem: React.FC<WorkLogItemProps> = ({
  workLog,
  onEdit,
  onDelete
}) => {
  const { currentUser } = useStore();
  const isOwn = currentUser?.id === workLog.author.id;

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit2 size={14} />,
      onClick: () => onEdit(workLog)
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: () => onDelete(workLog)
    }
  ];

  return (
    <Container>
      <Header>
        <AuthorInfo>
          <Avatar src={workLog.author.avatar} size={28}>
            {workLog.author.name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <AuthorDetails>
            <AuthorName>{workLog.author.name}</AuthorName>
            <LogDate>
              {dayjs(workLog.createdAt).format('MMM DD, YYYY hh:mm A')}
            </LogDate>
          </AuthorDetails>
        </AuthorInfo>

        {isOwn && (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              size="small"
              icon={<MoreVertical size={16} />}
              style={{ color: colors.text.secondary }}
            />
          </Dropdown>
        )}
      </Header>

      <TimeInfo>
        <TimeSpent>{formatMinutesToTimeString(workLog.timeSpentMinutes)}</TimeSpent>
        {workLog.description && (
          <>
            <Separator>|</Separator>
            <Description>{workLog.description}</Description>
          </>
        )}
      </TimeInfo>

      {workLog.startDate && (
        <StartedAt>
          Started: {dayjs(workLog.startDate).format('MMM DD, YYYY hh:mm A')}
        </StartedAt>
      )}
    </Container>
  );
};
