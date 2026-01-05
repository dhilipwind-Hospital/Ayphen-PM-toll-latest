import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Select, Tag, Button, Input, Tooltip, InputNumber, DatePicker } from 'antd';
import { Edit, Sparkles, Zap } from 'lucide-react';
import dayjs from 'dayjs';
import { colors } from '../../../theme/colors';
import { SidebarSection } from './SidebarSection';
import { settingsApi } from '../../../services/api';

const FieldRow = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-bottom: 4px;
  font-weight: 500;
`;

const Value = styled.div`
  font-size: 14px;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  min-height: 24px;
`;

interface DetailsSectionProps {
    issue: any;
    epics?: any[];
    statuses?: any[];
    sprints?: any[];
    onUpdate: (field: string, value: any) => Promise<void>;
    onAIAction?: (action: string) => void;
}

// Default issue types fallback
const DEFAULT_ISSUE_TYPES = [
    { id: 'epic', name: 'Epic', icon: '🎯' },
    { id: 'story', name: 'Story', icon: '📖' },
    { id: 'task', name: 'Task', icon: '✅' },
    { id: 'bug', name: 'Bug', icon: '🐛' },
    { id: 'subtask', name: 'Subtask', icon: '📝' },
];

export const DetailsSection: React.FC<DetailsSectionProps> = ({ issue, epics = [], statuses = [], sprints = [], onUpdate, onAIAction }) => {
    const [customFields, setCustomFields] = useState<any[]>([]);
    const [issueTypes, setIssueTypes] = useState<any[]>(DEFAULT_ISSUE_TYPES);

    // Load custom fields and issue types on mount
    useEffect(() => {
        const loadCustomFields = async () => {
            try {
                const response = await settingsApi.getCustomFields();
                const fields = (response.data || []).filter((f: any) => 
                    f.isGlobal || f.projectId === issue?.projectId
                );
                setCustomFields(fields);
            } catch (error) {
                console.error('Failed to load custom fields:', error);
            }
        };

        const loadIssueTypes = async () => {
            try {
                const response = await settingsApi.getIssueTypes();
                if (response.data && response.data.length > 0) {
                    setIssueTypes(response.data);
                }
            } catch (error) {
                console.error('Failed to load issue types:', error);
            }
        };

        loadCustomFields();
        loadIssueTypes();
    }, [issue?.projectId]);

    const handleCustomFieldChange = (fieldId: string, value: any) => {
        const currentCustomFields = issue.customFields || {};
        const updatedCustomFields = { ...currentCustomFields, [fieldId]: value };
        onUpdate('customFields', updatedCustomFields);
    };

    const getCustomFieldValue = (fieldId: string) => {
        return issue.customFields?.[fieldId];
    };

    const getStatusColor = (category: string) => {
        switch (category) {
            case 'DONE': return colors.status.done;
            case 'IN_PROGRESS': return colors.status.inProgress;
            case 'TODO': return colors.status.todo;
            default: return 'default';
        }
    };

    return (
        <SidebarSection title="Details">
            {/* Issue Type */}
            <FieldRow>
                <Label>Type</Label>
                <Select
                    value={issue.type}
                    style={{ width: '100%' }}
                    bordered={false}
                    onChange={(val) => onUpdate('type', val)}
                >
                    {issueTypes.map((type: any) => (
                        <Select.Option key={type.id || type.name?.toLowerCase()} value={type.id || type.name?.toLowerCase()}>
                            {type.icon || '📋'} {type.name}
                        </Select.Option>
                    ))}
                </Select>
            </FieldRow>

            {/* Status */}
            <FieldRow>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Label>Status</Label>
                </div>
                <Select
                    value={issue.status}
                    style={{ width: '100%' }}
                    bordered={false}
                    onChange={(val) => onUpdate('status', val)}
                    dropdownMatchSelectWidth={false}
                >
                    {statuses.length > 0 ? (
                        statuses.map((s: any) => (
                            <Select.Option key={s.id} value={s.id}>
                                <Tag color={getStatusColor(s.category)}>{s.name}</Tag>
                            </Select.Option>
                        ))
                    ) : (
                        <>
                            <Select.Option value="backlog">
                                <Tag color="default">Backlog</Tag>
                            </Select.Option>
                            <Select.Option value="todo">
                                <Tag color={colors.status.todo}>To Do</Tag>
                            </Select.Option>
                            <Select.Option value="in-progress">
                                <Tag color={colors.status.inProgress}>In Progress</Tag>
                            </Select.Option>
                            <Select.Option value="in-review">
                                <Tag color="purple">In Review</Tag>
                            </Select.Option>
                            <Select.Option value="blocked">
                                <Tag color="red">Blocked</Tag>
                            </Select.Option>
                            <Select.Option value="done">
                                <Tag color={colors.status.done}>Done</Tag>
                            </Select.Option>
                        </>
                    )}
                </Select>
            </FieldRow>

            <FieldRow>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Label>Priority</Label>
                    <Tooltip title="AI Smart Priority">
                        <Button
                            type="text"
                            size="small"
                            icon={<Sparkles size={12} color={colors.primary[500]} />}
                            onClick={() => onAIAction && onAIAction('smart-priority')}
                        />
                    </Tooltip>
                </div>
                <Select
                    value={issue.priority}
                    style={{ width: '100%' }}
                    bordered={false}
                    onChange={(val) => onUpdate('priority', val)}
                >
                    <Select.Option value="highest">🔴 Highest</Select.Option>
                    <Select.Option value="high">🟠 High</Select.Option>
                    <Select.Option value="medium">🟡 Medium</Select.Option>
                    <Select.Option value="low">🟢 Low</Select.Option>
                    <Select.Option value="lowest">🔵 Lowest</Select.Option>
                </Select>
            </FieldRow>

            <FieldRow>
                <Label>Components</Label>
                <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="None"
                    bordered={false}
                    value={issue.components || []}
                    onChange={(val) => onUpdate('components', val)}
                >
                    <Select.Option value="Frontend">Frontend</Select.Option>
                    <Select.Option value="Backend">Backend</Select.Option>
                    <Select.Option value="API">API</Select.Option>
                </Select>
            </FieldRow>

            {/* Epic Link - Only show for non-epic issue types */}
            {issue.type !== 'epic' && (
                <FieldRow>
                    <Label>Epic Link</Label>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="None"
                        bordered={false}
                        allowClear
                        value={issue.epicId || issue.epicLink || undefined}
                        onChange={(val) => onUpdate('epicId', val)}
                    >
                        {epics.map((epic: any) => (
                            <Select.Option key={epic.id} value={epic.id}>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}>
                                    <span style={{
                                        background: '#9333EA',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        fontWeight: 600
                                    }}>
                                        {epic.key}
                                    </span>
                                    <span style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {epic.summary}
                                    </span>
                                </span>
                            </Select.Option>
                        ))}
                    </Select>
                </FieldRow>
            )}

            <FieldRow>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Label>Labels</Label>
                    <Tooltip title="AI Auto-Tag">
                        <Button
                            type="text"
                            size="small"
                            icon={<Sparkles size={12} color={colors.primary[500]} />}
                            onClick={() => onAIAction && onAIAction('auto-tag')}
                        />
                    </Tooltip>
                </div>
                <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Add labels"
                    bordered={false}
                    value={issue.labels || []}
                    onChange={(val) => onUpdate('labels', val)}
                >
                    <Select.Option value="frontend">frontend</Select.Option>
                    <Select.Option value="backend">backend</Select.Option>
                    <Select.Option value="api">api</Select.Option>
                    <Select.Option value="bug">bug</Select.Option>
                    <Select.Option value="feature">feature</Select.Option>
                    <Select.Option value="enhancement">enhancement</Select.Option>
                    <Select.Option value="documentation">documentation</Select.Option>
                    <Select.Option value="urgent">urgent</Select.Option>
                    <Select.Option value="blocked">blocked</Select.Option>
                    <Select.Option value="needs-review">needs-review</Select.Option>
                    <Select.Option value="testing">testing</Select.Option>
                    <Select.Option value="design">design</Select.Option>
                    <Select.Option value="performance">performance</Select.Option>
                    <Select.Option value="security">security</Select.Option>
                </Select>
            </FieldRow>

            {/* Story Points - Not for epics */}
            {issue.type !== 'epic' && (
                <FieldRow>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Label>Story Points</Label>
                        <Tooltip title="AI Estimate">
                            <Button
                                type="text"
                                size="small"
                                icon={<Zap size={12} color={colors.primary[500]} />}
                                onClick={() => onAIAction && onAIAction('estimate-points')}
                            />
                        </Tooltip>
                    </div>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="None"
                        bordered={false}
                        allowClear
                        value={issue.storyPoints || undefined}
                        onChange={(val) => onUpdate('storyPoints', val)}
                    >
                        <Select.Option value={1}>1</Select.Option>
                        <Select.Option value={2}>2</Select.Option>
                        <Select.Option value={3}>3</Select.Option>
                        <Select.Option value={5}>5</Select.Option>
                        <Select.Option value={8}>8</Select.Option>
                        <Select.Option value={13}>13</Select.Option>
                        <Select.Option value={21}>21</Select.Option>
                    </Select>
                </FieldRow>
            )}

            {/* Sprint - Not for epics */}
            {issue.type !== 'epic' && (
                <FieldRow>
                    <Label>Sprint</Label>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Backlog"
                        bordered={false}
                        allowClear
                        value={issue.sprintId || undefined}
                        onChange={(val) => onUpdate('sprintId', val)}
                    >
                        {sprints.map((sprint: any) => (
                            <Select.Option key={sprint.id} value={sprint.id}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {sprint.status === 'active' && (
                                        <span style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: '#22c55e'
                                        }} />
                                    )}
                                    {sprint.name}
                                </span>
                            </Select.Option>
                        ))}
                    </Select>
                </FieldRow>
            )}

            {/* Custom Fields Section */}
            {customFields.length > 0 && customFields.map((field: any) => (
                <FieldRow key={field.id}>
                    <Label>{field.name}{field.isRequired && <span style={{ color: 'red' }}> *</span>}</Label>
                    {field.type === 'text' && (
                        <Input
                            size="small"
                            value={getCustomFieldValue(field.id) || ''}
                            placeholder={`Enter ${field.name}`}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            onBlur={() => {}}
                        />
                    )}
                    {field.type === 'number' && (
                        <InputNumber
                            size="small"
                            style={{ width: '100%' }}
                            value={getCustomFieldValue(field.id)}
                            placeholder={`Enter ${field.name}`}
                            onChange={(val) => handleCustomFieldChange(field.id, val)}
                        />
                    )}
                    {field.type === 'date' && (
                        <DatePicker
                            size="small"
                            style={{ width: '100%' }}
                            value={getCustomFieldValue(field.id) ? dayjs(getCustomFieldValue(field.id)) : null}
                            onChange={(date) => handleCustomFieldChange(field.id, date?.toISOString())}
                        />
                    )}
                    {field.type === 'select' && (
                        <Select
                            size="small"
                            style={{ width: '100%' }}
                            value={getCustomFieldValue(field.id)}
                            placeholder={`Select ${field.name}`}
                            allowClear
                            onChange={(val) => handleCustomFieldChange(field.id, val)}
                        >
                            {(field.options || []).map((opt: string) => (
                                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                        </Select>
                    )}
                    {field.type === 'multiselect' && (
                        <Select
                            size="small"
                            mode="multiple"
                            style={{ width: '100%' }}
                            value={getCustomFieldValue(field.id) || []}
                            placeholder={`Select ${field.name}`}
                            onChange={(val) => handleCustomFieldChange(field.id, val)}
                        >
                            {(field.options || []).map((opt: string) => (
                                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                        </Select>
                    )}
                    {field.type === 'checkbox' && (
                        <Select
                            size="small"
                            style={{ width: '100%' }}
                            value={getCustomFieldValue(field.id)}
                            placeholder={`Select ${field.name}`}
                            allowClear
                            onChange={(val) => handleCustomFieldChange(field.id, val)}
                        >
                            <Select.Option value={true}>Yes</Select.Option>
                            <Select.Option value={false}>No</Select.Option>
                        </Select>
                    )}
                </FieldRow>
            ))}
        </SidebarSection>
    );
};
