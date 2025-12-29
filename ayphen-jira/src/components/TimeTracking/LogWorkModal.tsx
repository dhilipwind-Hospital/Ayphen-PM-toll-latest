import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Radio, Space, message } from 'antd';
import styled from 'styled-components';
import dayjs, { Dayjs } from 'dayjs';
import { colors } from '../../theme/colors';
import { parseTimeString, formatMinutesToTimeString, isValidTimeString } from '../../utils/timeFormat';
import { issuesApi, issuesEnhancedApi } from '../../services/api';

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

const FormatHint = styled.div`
  font-size: 11px;
  color: ${colors.text.secondary};
  margin-top: 4px;
`;

interface LogWorkModalProps {
  visible: boolean;
  issueId: string;
  issueKey: string;
  currentRemaining: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const LogWorkModal: React.FC<LogWorkModalProps> = ({
  visible,
  issueId,
  issueKey,
  currentRemaining,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState(0);
  const [timeSpentValid, setTimeSpentValid] = useState(true);
  const [remainingOption, setRemainingOption] = useState<'auto' | 'manual' | 'leave'>('auto');
  const [manualRemainingMinutes, setManualRemainingMinutes] = useState(0);
  const [manualRemainingValid, setManualRemainingValid] = useState(true);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setTimeSpentMinutes(0);
      setTimeSpentValid(true);
      setRemainingOption('auto');
      setManualRemainingMinutes(0);
      setManualRemainingValid(true);
    }
  }, [visible, form]);

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

  const getAdjustedRemaining = (): number => {
    if (currentRemaining === null) return 0;
    return Math.max(0, currentRemaining - timeSpentMinutes);
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
      const startDate = values.startDate ? values.startDate.toISOString() : new Date().toISOString();
      const description = values.description || '';
      const userId = localStorage.getItem('userId') || '';

      // Calculate new remaining estimate based on option
      let newRemainingEstimate: number | null = null;
      if (remainingOption === 'auto') {
        newRemainingEstimate = getAdjustedRemaining();
      } else if (remainingOption === 'manual') {
        newRemainingEstimate = manualRemainingMinutes;
      }
      // 'leave' option keeps current remaining (null means no change)

      // Log work using existing API
      await issuesEnhancedApi.logWork(issueId, timeSpentMinutes, description, userId);

      // Update remaining estimate if needed
      if (remainingOption !== 'leave' && newRemainingEstimate !== null) {
        await issuesApi.update(issueId, { remainingEstimate: newRemainingEstimate });
      }

      message.success('Work logged successfully');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Log work error:', error);
      message.error(error.response?.data?.message || 'Failed to log work');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Log Work - ${issueKey}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Log"
      confirmLoading={loading}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startDate: dayjs()
        }}
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
                = {formatMinutesToTimeString(timeSpentMinutes)} ({timeSpentMinutes} minutes)
              </ParsedValue>
            )}
            {!timeSpentValid && form.getFieldValue('timeSpent') && (
              <ErrorText>Invalid format. Use: 1w 2d 3h 30m</ErrorText>
            )}
            <FormatHint>Examples: 3w 4d 12h, 1d 6h, 45m</FormatHint>
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

        <Form.Item label="Remaining Estimate">
          <Radio.Group
            value={remainingOption}
            onChange={(e) => setRemainingOption(e.target.value)}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="auto">
                <strong>Auto Adjust</strong>
                {currentRemaining !== null && timeSpentMinutes > 0 && (
                  <HelpText>
                    The Remaining Estimate will be reduced by{' '}
                    <strong>{formatMinutesToTimeString(timeSpentMinutes)}</strong> automatically
                    <br />
                    New remaining: <strong>{formatMinutesToTimeString(getAdjustedRemaining())}</strong>
                  </HelpText>
                )}
                {currentRemaining === null && (
                  <HelpText>No current estimate set</HelpText>
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
                    {!manualRemainingValid && (
                      <ErrorText>Invalid format</ErrorText>
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
      </Form>
    </Modal>
  );
};
