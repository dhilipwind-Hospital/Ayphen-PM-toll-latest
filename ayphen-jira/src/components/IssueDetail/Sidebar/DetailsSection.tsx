import React from 'react';
import styled from 'styled-components';
import { Select, Tag, Button, Input, Tooltip } from 'antd';
import { Edit, Sparkles } from 'lucide-react';
import { colors } from '../../../theme/colors';
import { SidebarSection } from './SidebarSection';

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
    onUpdate: (field: string, value: any) => Promise<void>;
    onAIAction?: (action: string) => void;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({ issue, epics = [], statuses = [], onUpdate, onAIAction }) => {
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
            <FieldRow>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Label>Status</Label>
                    {/* Smart transition suggestion could go here */}
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
        </SidebarSection>
    );
};
