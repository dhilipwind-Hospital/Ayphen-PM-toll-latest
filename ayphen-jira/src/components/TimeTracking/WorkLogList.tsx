import React, { useState, useEffect } from 'react';
import { Button, Empty, Spin, message, Collapse } from 'antd';
import { Plus, ChevronDown } from 'lucide-react';
import styled from 'styled-components';
import { WorkLogItem } from './WorkLogItem';
import type { WorkLogData } from './WorkLogItem';
import { LogWorkModal } from './LogWorkModal';
import { EditWorkLogModal } from './EditWorkLogModal';
import { DeleteWorkLogModal } from './DeleteWorkLogModal';
import { issuesEnhancedApi } from '../../services/api';
import { formatMinutesToTimeString } from '../../utils/timeFormat';
import { colors } from '../../theme/colors';

const Container = styled.div`
  margin-top: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Count = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: ${colors.text.secondary};
  background: ${colors.background.light};
  padding: 2px 8px;
  border-radius: 10px;
`;

const LogsContainer = styled.div`
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid ${colors.border.light};
  border-radius: 8px;
  background: ${colors.background.default};
`;

const TotalTime = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: ${colors.primary[50]};
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
  color: ${colors.primary[700]};
  font-size: 13px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px;
`;

const EmptyContainer = styled.div`
  padding: 24px;
  text-align: center;
`;

interface WorkLogListProps {
  issueId: string;
  issueKey: string;
  currentRemaining: number | null;
  onUpdate: () => void;
}

export const WorkLogList: React.FC<WorkLogListProps> = ({
  issueId,
  issueKey,
  currentRemaining,
  onUpdate
}) => {
  const [workLogs, setWorkLogs] = useState<WorkLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkLogData | null>(null);

  useEffect(() => {
    if (issueId) {
      loadWorkLogs();
    }
  }, [issueId]);

  const loadWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await issuesEnhancedApi.getWorklog(issueId);
      const logs = response.data || [];
      
      // Sort by createdAt descending (newest first)
      const sortedLogs = logs.sort((a: WorkLogData, b: WorkLogData) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setWorkLogs(sortedLogs);
    } catch (error) {
      console.error('Failed to load work logs:', error);
      // Don't show error message for empty logs
      setWorkLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log: WorkLogData) => {
    setSelectedLog(log);
    setEditModalVisible(true);
  };

  const handleDelete = (log: WorkLogData) => {
    setSelectedLog(log);
    setDeleteModalVisible(true);
  };

  const handleSuccess = () => {
    loadWorkLogs();
    onUpdate();
  };

  const handleLogWorkSuccess = () => {
    loadWorkLogs();
    onUpdate();
  };

  const totalTime = workLogs.reduce((sum, log) => sum + (log.timeSpentMinutes || 0), 0);

  return (
    <Container>
      <Header>
        <Title>
          Work Log
          {workLogs.length > 0 && <Count>{workLogs.length}</Count>}
        </Title>
        <Button
          type="primary"
          size="small"
          icon={<Plus size={14} />}
          onClick={() => setLogModalVisible(true)}
        >
          Log Work
        </Button>
      </Header>

      {loading ? (
        <LoadingContainer>
          <Spin />
        </LoadingContainer>
      ) : workLogs.length === 0 ? (
        <EmptyContainer>
          <Empty
            description="No work logged yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </EmptyContainer>
      ) : (
        <>
          <LogsContainer>
            {workLogs.map(log => (
              <WorkLogItem
                key={log.id}
                workLog={log}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </LogsContainer>

          <TotalTime>
            Total Time Logged: {formatMinutesToTimeString(totalTime)}
          </TotalTime>
        </>
      )}

      <LogWorkModal
        visible={logModalVisible}
        issueId={issueId}
        issueKey={issueKey}
        currentRemaining={currentRemaining}
        onClose={() => setLogModalVisible(false)}
        onSuccess={handleLogWorkSuccess}
      />

      {selectedLog && (
        <>
          <EditWorkLogModal
            visible={editModalVisible}
            issueId={issueId}
            issueKey={issueKey}
            workLog={selectedLog}
            currentRemaining={currentRemaining}
            onClose={() => {
              setEditModalVisible(false);
              setSelectedLog(null);
            }}
            onSuccess={handleSuccess}
          />

          <DeleteWorkLogModal
            visible={deleteModalVisible}
            issueId={issueId}
            workLog={selectedLog}
            currentRemaining={currentRemaining}
            onClose={() => {
              setDeleteModalVisible(false);
              setSelectedLog(null);
            }}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </Container>
  );
};
