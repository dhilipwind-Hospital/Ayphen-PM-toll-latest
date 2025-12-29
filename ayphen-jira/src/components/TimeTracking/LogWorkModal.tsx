import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, message } from 'antd';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { colors } from '../../theme/colors';
import { parseTimeString, formatMinutesToTimeString, isValidTimeString } from '../../utils/timeFormat';
import { issuesApi } from '../../services/api';

const { TextArea } = Input;

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
  color: ${colors.text.tertiary};
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

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setTimeSpentMinutes(0);
      setTimeSpentValid(true);
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

      setLoading(true);

      const values = form.getFieldsValue();
      const startDate = values.startDate ? values.startDate.toISOString() : new Date().toISOString();
      const description = values.description || '';
      const userId = localStorage.getItem('userId') || '';
      const userName = localStorage.getItem('userName') || 'User';

      // Create new work log entry with proper author info
      const newWorkLog = {
        id: `worklog-${Date.now()}`,
        timeSpentMinutes,
        description,
        startDate: startDate,
        createdAt: new Date().toISOString(),
        author: {
          id: userId,
          name: userName,
          avatar: localStorage.getItem('userAvatar') || undefined
        }
      };

      // Build update payload
      const updatePayload: any = {
        $addWorkLog: newWorkLog,
        timeSpent: timeSpentMinutes,
        remainingEstimate: getAdjustedRemaining()
      };

      // Update issue with new work log and time tracking data
      await issuesApi.update(issueId, updatePayload);

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
