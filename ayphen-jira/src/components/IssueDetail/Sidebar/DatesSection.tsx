import React from 'react';
import styled from 'styled-components';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { colors } from '../../../theme/colors';
import { SidebarSection } from './SidebarSection';

const FieldRow = styled.div`
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-bottom: 4px;
`;

const DateText = styled.div`
  font-size: 13px;
  color: ${colors.text.primary};
`;

interface DatesSectionProps {
    issue: any;
    onUpdate: (field: string, value: any) => Promise<void>;
}

export const DatesSection: React.FC<DatesSectionProps> = ({ issue, onUpdate }) => {
    return (
        <SidebarSection title="Dates">
            <FieldRow>
                <Label>Created</Label>
                <DateText>{dayjs(issue.createdAt).format('MMM D, YYYY h:mm A')}</DateText>
            </FieldRow>

            <FieldRow>
                <Label>Updated</Label>
                <DateText>{dayjs(issue.updatedAt).format('MMM D, YYYY h:mm A')}</DateText>
            </FieldRow>

            <FieldRow>
                <Label>Start Date</Label>
                <DatePicker
                    value={issue.startDate ? dayjs(issue.startDate) : null}
                    onChange={(date) => onUpdate('startDate', date ? date.toISOString() : null)}
                    bordered={false}
                    style={{ paddingLeft: 0 }}
                    placeholder="None"
                />
            </FieldRow>

            <FieldRow>
                <Label>Due Date</Label>
                <DatePicker
                    value={issue.dueDate ? dayjs(issue.dueDate) : null}
                    onChange={(date) => onUpdate('dueDate', date ? date.toISOString() : null)}
                    bordered={false}
                    style={{ paddingLeft: 0 }}
                    placeholder="None"
                />
            </FieldRow>
        </SidebarSection>
    );
};
