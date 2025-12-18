import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, Button, message } from 'antd';
import { Calendar } from 'lucide-react';
import styled from 'styled-components';
import { sprintsApi } from '../../services/api';
import dayjs from 'dayjs';

const FormSection = styled.div`
  margin-bottom: 16px;
`;

const Description = styled.p`
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 24px;
`;

interface CreateSprintModalProps {
    visible: boolean;
    onClose: () => void;
    projectId: string;
    projectKey: string;
    existingSprintCount: number;
    onSuccess: () => void;
}

export const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
    visible,
    onClose,
    projectId,
    projectKey,
    existingSprintCount,
    onSuccess
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const defaultSprintName = `${projectKey} Sprint ${existingSprintCount + 1}`;

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const sprintData = {
                name: values.name || defaultSprintName,
                goal: values.goal || '',
                projectId: projectId,
                status: 'future',
                startDate: values.dateRange?.[0]?.toISOString() || null,
                endDate: values.dateRange?.[1]?.toISOString() || null,
            };


            await sprintsApi.create(sprintData);

            message.success('Sprint created successfully!');
            form.resetFields();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create sprint:', error);
            if (error.errorFields) {
                // Form validation error
                return;
            }
            message.error(error?.response?.data?.message || 'Failed to create sprint');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Create Sprint"
            open={visible}
            onCancel={handleCancel}
            width={500}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
                    Create Sprint
                </Button>,
            ]}
        >
            <Description>
                Create a new sprint to plan and track work. Sprints help you organize issues into time-boxed iterations.
            </Description>

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    name: defaultSprintName,
                }}
            >
                <Form.Item
                    name="name"
                    label="Sprint Name"
                    rules={[{ required: true, message: 'Please enter a sprint name' }]}
                >
                    <Input placeholder={defaultSprintName} />
                </Form.Item>

                <Form.Item
                    name="goal"
                    label="Sprint Goal (optional)"
                >
                    <Input.TextArea
                        placeholder="What do you want to accomplish in this sprint?"
                        rows={3}
                    />
                </Form.Item>

                <Form.Item
                    name="dateRange"
                    label="Duration (optional)"
                    help="You can set dates when you start the sprint"
                >
                    <DatePicker.RangePicker
                        style={{ width: '100%' }}
                        format="MMM DD, YYYY"
                        placeholder={['Start date', 'End date']}
                    />
                </Form.Item>
            </Form>

            <div style={{
                padding: 12,
                background: '#f0f9ff',
                borderRadius: 6,
                marginTop: 16,
                fontSize: 12,
                color: '#0369a1'
            }}>
                💡 <strong>Tip:</strong> After creating the sprint, drag issues from the Backlog into this sprint, then click "Start Sprint" when ready.
            </div>
        </Modal>
    );
};
