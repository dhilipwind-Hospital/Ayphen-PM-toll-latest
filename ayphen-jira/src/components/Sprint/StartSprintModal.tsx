import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { sprintsApi } from '../../services/api';

interface StartSprintModalProps {
  visible: boolean;
  sprint: any;
  onClose: () => void;
  onSuccess: () => void;
  activeSprints?: any[]; // Pass active sprints to check if one is already running
}

export const StartSprintModal: React.FC<StartSprintModalProps> = ({
  visible,
  sprint,
  onClose,
  onSuccess,
  activeSprints = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(14);

  const handleStartSprint = async (values: any) => {
    if (!sprint) return;

    // Check if there's already an active sprint
    if (activeSprints.length > 0) {
      message.error('Cannot start a new sprint while another sprint is active. Please complete the current sprint first.');
      return;
    }

    setLoading(true);
    try {
      await sprintsApi.start(sprint.id, {
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        goal: values.goal,
        capacity: values.capacity,
      });

      message.success('Sprint started successfully!');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to start sprint:', error);
      message.error('Failed to start sprint');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    if (date) {
      const endDate = date.add(duration, 'day');
      form.setFieldsValue({ endDate });
    }
  };

  const handleDurationChange = (value: number | null) => {
    if (value) {
      setDuration(value);
      const startDate = form.getFieldValue('startDate');
      if (startDate) {
        const endDate = startDate.add(value, 'day');
        form.setFieldsValue({ endDate });
      }
    }
  };

  return (
    <Modal
      title={`Start Sprint: ${sprint?.name || 'Sprint'}`}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      okText="Start Sprint"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleStartSprint}
        initialValues={{
          startDate: dayjs(),
          endDate: dayjs().add(14, 'day'),
          duration: 14,
        }}
      >
        <Form.Item
          label="Sprint Name"
          name="name"
          initialValue={sprint?.name}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Start Date"
          name="startDate"
          rules={[{ required: true, message: 'Please select start date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            onChange={handleStartDateChange}
          />
        </Form.Item>

        <Form.Item
          label="Duration (days)"
          name="duration"
        >
          <InputNumber
            min={1}
            max={30}
            style={{ width: '100%' }}
            onChange={handleDurationChange}
          />
        </Form.Item>

        <Form.Item
          label="End Date"
          name="endDate"
          rules={[
            { required: true, message: 'Please select end date' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || !getFieldValue('startDate')) {
                  return Promise.resolve();
                }
                if (value.isBefore(getFieldValue('startDate'))) {
                  return Promise.reject(new Error('End date must be after start date'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Sprint Goal"
          name="goal"
        >
          <Input.TextArea
            rows={3}
            placeholder="What is the goal of this sprint? (optional)"
          />
        </Form.Item>

        <Form.Item
          label="Team Capacity (hours)"
          name="capacity"
          tooltip="Total team capacity in hours for this sprint"
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="e.g., 320 (4 people × 8 hours × 10 days)"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
