import React from 'react';
import styled from 'styled-components';
import { colors } from '../../../theme/colors';
import { DetailsSection } from './DetailsSection';
import { PeopleSection } from './PeopleSection';
import { DatesSection } from './DatesSection';
import { TimeTrackingSection } from './TimeTrackingSection';
import { Button } from 'antd';
import { Sparkles } from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 0 16px;
  border-left: 1px solid ${colors.border.light};
  background: white;
  min-width: 300px;
  max-width: 350px;
`;

const TopActions = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${colors.border.light};
  display: flex;
  gap: 8px;
`;

interface IssueRightSidebarProps {
    issue: any;
    users: any[];
    onUpdate: (field: string, value: any) => Promise<void>;
    onAIAction?: (action: string) => void;
}

export const IssueRightSidebar: React.FC<IssueRightSidebarProps> = ({
    issue,
    users,
    onUpdate,
    onAIAction
}) => {
    return (
        <Container>
            <TopActions>
                <Button
                    icon={<Sparkles size={16} />}
                    type="primary"
                    block
                    style={{
                        background: colors.primary[400],
                        border: 'none',
                        fontWeight: 600
                    }}
                    onClick={() => onAIAction && onAIAction('suggest')}
                >
                    AI Actions
                </Button>
            </TopActions>

            <PeopleSection issue={issue} users={users} onUpdate={onUpdate} onAIAction={onAIAction} />
            <DetailsSection issue={issue} onUpdate={onUpdate} onAIAction={onAIAction} />
            <DatesSection issue={issue} onUpdate={onUpdate} />
            <TimeTrackingSection issue={issue} onUpdate={onUpdate} />

        </Container>
    );
};
