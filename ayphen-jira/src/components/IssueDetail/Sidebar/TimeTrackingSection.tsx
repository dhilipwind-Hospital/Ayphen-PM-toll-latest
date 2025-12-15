import React from 'react';
import styled from 'styled-components';
import { Progress, InputNumber, Button } from 'antd';
import { colors } from '../../../theme/colors';
import { SidebarSection } from './SidebarSection';

const FieldRow = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-bottom: 4px;
`;

interface TimeTrackingSectionProps {
    issue: any;
    onUpdate: (field: string, value: any) => Promise<void>;
}

export const TimeTrackingSection: React.FC<TimeTrackingSectionProps> = ({ issue, onUpdate }) => {
    const original = issue.originalEstimate || 0; // minutes
    const spent = issue.timeSpent || 0;
    const remaining = issue.remainingEstimate || (original - spent);

    const percent = original > 0 ? Math.min(100, (spent / original) * 100) : 0;

    return (
        <SidebarSection title="Time Tracking">
            <div style={{ marginBottom: 12 }}>
                <Progress percent={percent} showInfo={false} strokeColor={colors.primary[500]} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.text.secondary, marginTop: 4 }}>
                    <span>{spent}m logged</span>
                    <span>{remaining}m remaining</span>
                </div>
            </div>

            <FieldRow>
                <Label>Original Estimate (min)</Label>
                <InputNumber
                    value={original}
                    onChange={(val) => onUpdate('originalEstimate', val)}
                    bordered={false}
                    style={{ width: '100%', padding: 0 }}
                />
            </FieldRow>

            <Button size="small" type="default" block>Log Work</Button>
        </SidebarSection>
    );
};
