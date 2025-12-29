import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Radio, Space, message } from 'antd';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { colors } from '../../theme/colors';
import { parseTimeString, formatMinutesToTimeString, isValidTimeString } from '../../utils/timeFormat';
import { issuesApi } from '../../services/api';
import type { WorkLogData } from './WorkLogItem';

const { TextArea } = Input;

const HelpText = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-top: 4px;
  padding: 8px 12px;
  background: ${colors.background.light};
  border-radius: 4px;
`;

const TimeInputWrapper = styled.div`
  position: relative;
`;

const ParsedValue = styled.div`
  font-size: 11px;
  color: ${colors.primary[500]};
  margin-top: 4px;
`;

const ErrorText = styled.div`
  font-size: 11px;
  color: ${colors.status.error.main};
  margin-top: 4px;
`;

const MetaInfo = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: ${colors.background.light};
  border-radius: 6px;
  font-size: 12px;
  color: ${colors.text.secondary};
`;

interface EditWorkLogModalProps {
  visible: boolean;
  issueId: string;
  issueKey: string;
  workLog: WorkLogData;
  currentRemaining: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditWorkLogModal: React.FC<EditWorkLogModalProps> = ({
  visible,
  issueId,
  issueKey,
  workLog,
  currentRemaining,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState(workLog.timeSpentMinutes);
  const [timeSpentValid, setTimeSpentValid] = useState(true);
  const [remainingOption, setRemainingOption] = useState<'auto' | 'manual' | 'leave'>('leave');
  const [manualRemainingMinutes, setManualRemainingMinutes] = useState(0);
  const [manualRemainingValid, setManualRemainingValid] = useState(true);

  const originalTimeSpent = workLog.timeSpentMinutes;

  useEffect(() => {
    if (visible && workLog) {
      form.setFieldsValue({
        timeSpent: formatMinutesToTimeString(workLog.timeSpentMinutes),
        startDate: workLog.startDate ? dayjs(workLog.startDate) : dayjs(workLog.createdAt),
        description: workLog.description || ''
      });
      setTimeSpentMinutes(workLog.timeSpentMinutes);
      setTimeSpentValid(true);
      setRemainingOption('leave');
    }
  }, [visible, workLog, form]);

  const handleTimeSpentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setFieldValue('timeSpent', value);
    
    if (!value.trim()) {
      setTimeSpentMinutes(0);
      setTimeSpentValid(true);
      return;
    }

    const valid = isValidTimeString(value);
    setTimeSpentValid(valid);

    if (valid) {
      const minutes = parseTimeString(value);
      setTimeSpentMinutes(minutes);
    }
  };

  const handleManualRemainingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setFieldValue('manualRemaining', value);
    
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

  const getTimeDifference = (): number => {
    return timeSpentMinutes - originalTimeSpent;
  };

  const getAdjustedRemaining = (): number => {
    if (currentRemaining === null) return 0;
    const difference = getTimeDifference();
    return Math.max(0, currentRemaining - difference);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields(['timeSpent']);
      
      if (!timeSpentValid || timeSpentMinutes <= 0) {
        message.error('Please enter a valid time spent');
        return;
      }

      if (remainingOption === 'manual' && !manualRemainingValid) {
        message.error('Please enter a valid remaining estimate');
        return;
      }

      setLoading(true);

      const values = form.getFieldsValue();
      const startDate = values.startDate ? values.startDate.toISOString() : workLog.startDate;
      const description = values.description || '';

      // Update work log (using update endpoint)
      await issuesApi.update(issueId, {
        workLogs: [{
          id: workLog.id,
          timeSpentMinutes,
          description,
          startDate
        }]
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

      message.success('Work log updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Edit work log error:', error);
      message.error(error.response?.data?.message || 'Failed to update work log');
    } finally {
      setLoading(false);
    }
  };

  const difference = getTimeDifference();

  return (
    <Modal
      title={`Edit Work Log - ${issueKey}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save"
      confirmLoading={loading}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label="Time Spent"
          name="timeSpent"
          rules={[{ required: true, message: 'Please enter time spent' }]}
        >
          <TimeInputWrapper>
            <Input
              placeholder="e.g., 2h 30m"
              onChange={handleTimeSpentChange}
              status={!timeSpentValid ? 'error' : undefined}
            />
            {timeSpentMinutes > 0 && timeSpentValid && (
              <ParsedValue>
                = {formatMinutesToTimeString(timeSpentMinutes)}
                {difference !== 0 && (
                  <span style={{ marginLeft: 8, color: difference > 0 ? colors.status.error.main : colors.status.success.main }}>
                    ({difference > 0 ? '+' : ''}{formatMinutesToTimeString(difference)})
                  </span>
                )}
              </ParsedValue>
            )}
            {!timeSpentValid && form.getFieldValue('timeSpent') && (
              <ErrorText>Invalid format. Use: 1w 2d 3h 30m</ErrorText>
            )}
          </TimeInputWrapper>
        </Form.Item>

        <Form.Item
          label="Date Started"
          name="startDate"
        >
          <DatePicker
            showTime
            format="MMM DD, YYYY hh:mm A"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="Adjust Remaining Estimate">
          <Radio.Group
            value={remainingOption}
            onChange={(e) => setRemainingOption(e.target.value)}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="auto">
                <strong>Auto Adjust</strong>
                {currentRemaining !== null && difference !== 0 && (
                  <HelpText>
                    {difference > 0 ? 'Decrease' : 'Increase'} by{' '}
                    <strong>{formatMinutesToTimeString(Math.abs(difference))}</strong>
                    <br />
                    New remaining: <strong>{formatMinutesToTimeString(getAdjustedRemaining())}</strong>
                  </HelpText>
                )}
                {difference === 0 && (
                  <HelpText>No change needed (same time)</HelpText>
                )}
              </Radio>

              <Radio value="manual">
                <strong>Set to</strong>
                {remainingOption === 'manual' && (
                  <div style={{ marginTop: 8, marginLeft: 24 }}>
                    <Input
                      placeholder="e.g., 1h"
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
        </Form.Item>

        <Form.Item
          label="Work Description"
          name="description"
        >
          <TextArea
            rows={3}
            placeholder="Describe what you worked on..."
          />
        </Form.Item>

        <MetaInfo>
          <div><strong>Logged by:</strong> {workLog.author.name}</div>
          <div><strong>Created:</strong> {dayjs(workLog.createdAt).format('MMM DD, YYYY hh:mm A')}</div>
          {workLog.updatedAt && (
            <div><strong>Updated:</strong> {dayjs(workLog.updatedAt).format('MMM DD, YYYY hh:mm A')}</div>
          )}
        </MetaInfo>
      </Form>
    </Modal>
  );
};
