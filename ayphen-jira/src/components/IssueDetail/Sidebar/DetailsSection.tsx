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
    onUpdate: (field: string, value: any) => Promise<void>;
    onAIAction?: (action: string) => void;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({ issue, onUpdate, onAIAction }) => {
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
                    <Select.Option value="todo">
                        <Tag color={colors.status.todo}>To Do</Tag>
                    </Select.Option>
                    <Select.Option value="in-progress">
                        <Tag color={colors.status.inProgress}>In Progress</Tag>
                    </Select.Option>
                    <Select.Option value="done">
                        <Tag color={colors.status.done}>Done</Tag>
                    </Select.Option>
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
                />
            </FieldRow>
        </SidebarSection>
    );
};
