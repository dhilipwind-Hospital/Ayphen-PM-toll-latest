import React, { useState } from 'react';
import styled from 'styled-components';
import { Progress, InputNumber, Button, Tooltip } from 'antd';
import { Clock } from 'lucide-react';
import { colors } from '../../../theme/colors';
import { SidebarSection } from './SidebarSection';
import { LogWorkModal } from '../../TimeTracking/LogWorkModal';
import { WorkLogList } from '../../TimeTracking/WorkLogList';
import { formatMinutesToTimeString, calculateProgress, isOverBudget } from '../../../utils/timeFormat';

const ProgressContainer = styled.div`
  margin-bottom: 16px;
`;

const ProgressLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: ${colors.text.secondary};
  margin-top: 6px;
`;

const TimeLabel = styled.span<{ $highlight?: boolean }>`
  font-weight: ${props => props.$highlight ? 600 : 400};
  color: ${props => props.$highlight ? colors.primary[600] : colors.text.secondary};
`;

const FieldRow = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const EstimateInput = styled(InputNumber)`
  width: 100%;
  
  .ant-input-number-input {
    padding: 4px 8px;
  }
`;

const LogWorkButton = styled(Button)`
  margin-top: 8px;
`;

interface TimeTrackingSectionProps {
    issue: any;
    onUpdate: (field: string, value: any) => Promise<void>;
}

export const TimeTrackingSection: React.FC<TimeTrackingSectionProps> = ({ issue, onUpdate }) => {
    const [logWorkVisible, setLogWorkVisible] = useState(false);
    const [showWorkLogs, setShowWorkLogs] = useState(false);

    // Get time values (stored as numbers in minutes)
    const original = typeof issue.originalEstimate === 'number' ? issue.originalEstimate : 0;
    const spent = typeof issue.timeSpent === 'number' ? issue.timeSpent : 0;
    const remaining = typeof issue.remainingEstimate === 'number' 
        ? issue.remainingEstimate 
        : Math.max(0, original - spent);

    const percent = calculateProgress(spent, original);
    const overBudget = isOverBudget(spent, original);

    const handleLogWorkSuccess = () => {
        // Refresh the issue data
        onUpdate('refresh', true);
    };

    const handleEstimateChange = async (field: string, value: number | null) => {
        await onUpdate(field, value || 0);
    };

    return (
        <SidebarSection title="Time Tracking">
            {/* Progress Bar */}
            <ProgressContainer>
                <Progress 
                    percent={Math.min(percent, 100)} 
                    showInfo={false} 
                    strokeColor={overBudget ? colors.status.error.main : colors.primary[500]}
                    trailColor={colors.neutral[200]}
                />
                <ProgressLabels>
                    <TimeLabel $highlight={spent > 0}>
                        {formatMinutesToTimeString(spent)} logged
                    </TimeLabel>
                    <TimeLabel>
                        {formatMinutesToTimeString(remaining)} remaining
                    </TimeLabel>
                </ProgressLabels>
            </ProgressContainer>

            {/* Original Estimate */}
            <FieldRow>
                <Label>
                    <Clock size={12} />
                    Original Estimate
                </Label>
                <Tooltip title="Enter time in minutes">
                    <EstimateInput
                        value={original || undefined}
                        onChange={(val) => handleEstimateChange('originalEstimate', val as number)}
                        min={0}
                        placeholder="No estimate"
                        addonAfter="min"
                        size="small"
                    />
                </Tooltip>
            </FieldRow>

            {/* Remaining Estimate */}
            <FieldRow>
                <Label>
                    <Clock size={12} />
                    Remaining Estimate
                </Label>
                <Tooltip title="Enter time in minutes">
                    <EstimateInput
                        value={remaining || undefined}
                        onChange={(val) => handleEstimateChange('remainingEstimate', val as number)}
                        min={0}
                        placeholder="No estimate"
                        addonAfter="min"
                        size="small"
                    />
                </Tooltip>
            </FieldRow>

            {/* Log Work Button */}
            <LogWorkButton 
                type="primary" 
                block 
                onClick={() => setLogWorkVisible(true)}
            >
                Log Work
            </LogWorkButton>

            {/* Work Log List */}
            <WorkLogList
                issueId={issue.id}
                issueKey={issue.key}
                currentRemaining={remaining}
                initialWorkLogs={(issue.workLogs || []).map((log: any) => ({
                    id: log.id,
                    issueId: issue.id,
                    author: log.author || { id: 'unknown', name: 'Unknown' },
                    timeSpentMinutes: log.timeSpentMinutes || (typeof log.timeSpent === 'number' ? log.timeSpent : 0),
                    description: log.description,
                    startDate: log.startDate,
                    createdAt: log.createdAt || new Date().toISOString()
                }))}
                onUpdate={handleLogWorkSuccess}
            />

            {/* Log Work Modal */}
            <LogWorkModal
                visible={logWorkVisible}
                issueId={issue.id}
                issueKey={issue.key}
                currentRemaining={remaining}
                onClose={() => setLogWorkVisible(false)}
                onSuccess={handleLogWorkSuccess}
            />
        </SidebarSection>
    );
};
