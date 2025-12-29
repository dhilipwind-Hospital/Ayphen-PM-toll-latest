import React, { useState } from 'react';
import { Modal, Radio, Space, message, Input } from 'antd';
import { AlertTriangle } from 'lucide-react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { colors } from '../../theme/colors';
import { parseTimeString, formatMinutesToTimeString, isValidTimeString } from '../../utils/timeFormat';
import { issuesApi } from '../../services/api';
import type { WorkLogData } from './WorkLogItem';

const WarningBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: ${colors.status.warning.light};
  border-radius: 8px;
  margin-bottom: 16px;
`;

const WarningIcon = styled.div`
  color: ${colors.status.warning.main};
  flex-shrink: 0;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.div`
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 4px;
`;

const WarningText = styled.div`
  font-size: 13px;
  color: ${colors.text.secondary};
`;

const LogDetails = styled.div`
  padding: 12px;
  background: ${colors.background.light};
  border-radius: 6px;
  margin-bottom: 16px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
  
  &:not(:last-child) {
    border-bottom: 1px solid ${colors.border.light};
    margin-bottom: 4px;
    padding-bottom: 8px;
  }
`;

const DetailLabel = styled.span`
  color: ${colors.text.secondary};
`;

const DetailValue = styled.span`
  font-weight: 600;
  color: ${colors.text.primary};
`;

const HelpText = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-top: 4px;
  padding: 8px 12px;
  background: ${colors.background.light};
  border-radius: 4px;
`;

const ParsedValue = styled.div`
  font-size: 11px;
  color: ${colors.primary[500]};
  margin-top: 4px;
`;

interface DeleteWorkLogModalProps {
  visible: boolean;
  issueId: string;
  workLog: WorkLogData;
  currentRemaining: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteWorkLogModal: React.FC<DeleteWorkLogModalProps> = ({
  visible,
  issueId,
  workLog,
  currentRemaining,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [remainingOption, setRemainingOption] = useState<'auto' | 'manual' | 'leave'>('auto');
  const [manualRemainingMinutes, setManualRemainingMinutes] = useState(0);
  const [manualRemainingValid, setManualRemainingValid] = useState(true);
  const [manualRemainingInput, setManualRemainingInput] = useState('');

  const handleManualRemainingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualRemainingInput(value);
    
    if (!value.trim()) {
      setManualRemainingMinutes(0);
      setManualRemainingValid(true);
      return;
    }

    const valid = isValidTimeString(value);
    setManualRemainingValid(valid);

    if (valid) {
      const minutes = parseTimeString(value);
      setManualRemainingMinutes(minutes);
    }
  };

  const getAdjustedRemaining = (): number => {
    if (currentRemaining === null) return workLog.timeSpentMinutes;
    return currentRemaining + workLog.timeSpentMinutes;
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      // Delete work log by updating issue with filtered workLogs
      // This is a simplified approach - in production, you'd have a dedicated delete endpoint
      await issuesApi.update(issueId, {
        deleteWorkLogId: workLog.id
      });

      // Calculate new remaining estimate based on option
      let newRemainingEstimate: number | null = null;
      if (remainingOption === 'auto') {
        newRemainingEstimate = getAdjustedRemaining();
      } else if (remainingOption === 'manual') {
        newRemainingEstimate = manualRemainingMinutes;
      }

      // Update remaining estimate if needed
      if (remainingOption !== 'leave' && newRemainingEstimate !== null) {
        await issuesApi.update(issueId, { remainingEstimate: newRemainingEstimate });
      }

      message.success('Work log deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Delete work log error:', error);
      message.error(error.response?.data?.message || 'Failed to delete work log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Delete Work Log"
      open={visible}
      onCancel={onClose}
      onOk={handleDelete}
      okText="Delete"
      okButtonProps={{ danger: true }}
      confirmLoading={loading}
      width={450}
      destroyOnClose
    >
      <WarningBox>
        <WarningIcon>
          <AlertTriangle size={24} />
        </WarningIcon>
        <WarningContent>
          <WarningTitle>Are you sure you want to delete this work log?</WarningTitle>
          <WarningText>This action cannot be undone.</WarningText>
        </WarningContent>
      </WarningBox>

      <LogDetails>
        <DetailRow>
          <DetailLabel>Time Logged</DetailLabel>
          <DetailValue>{formatMinutesToTimeString(workLog.timeSpentMinutes)}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Author</DetailLabel>
          <DetailValue>{workLog.author.name}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Date</DetailLabel>
          <DetailValue>{dayjs(workLog.createdAt).format('MMM DD, YYYY')}</DetailValue>
        </DetailRow>
        {workLog.description && (
          <DetailRow>
            <DetailLabel>Description</DetailLabel>
            <DetailValue style={{ maxWidth: 200, textAlign: 'right' }}>{workLog.description}</DetailValue>
          </DetailRow>
        )}
      </LogDetails>

      <div style={{ marginBottom: 8, fontWeight: 600 }}>Adjust Remaining Estimate</div>
      <Radio.Group
        value={remainingOption}
        onChange={(e) => setRemainingOption(e.target.value)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Radio value="auto">
            <strong>Auto Adjust</strong>
            <HelpText>
              Increase by <strong>{formatMinutesToTimeString(workLog.timeSpentMinutes)}</strong>
              <br />
              New remaining: <strong>{formatMinutesToTimeString(getAdjustedRemaining())}</strong>
            </HelpText>
          </Radio>

          <Radio value="manual">
            <strong>Set to</strong>
            {remainingOption === 'manual' && (
              <div style={{ marginTop: 8, marginLeft: 24 }}>
                <Input
                  placeholder="e.g., 6h"
                  value={manualRemainingInput}
                  onChange={handleManualRemainingChange}
                  status={!manualRemainingValid ? 'error' : undefined}
                  style={{ width: 200 }}
                />
                {manualRemainingMinutes > 0 && manualRemainingValid && (
                  <ParsedValue>
                    = {formatMinutesToTimeString(manualRemainingMinutes)}
                  </ParsedValue>
                )}
              </div>
            )}
          </Radio>

          <Radio value="leave">
            <strong>Leave as is</strong>
            {currentRemaining !== null && (
              <HelpText>
                Keep remaining estimate at{' '}
                <strong>{formatMinutesToTimeString(currentRemaining)}</strong>
              </HelpText>
            )}
          </Radio>
        </Space>
      </Radio.Group>
    </Modal>
  );
};
