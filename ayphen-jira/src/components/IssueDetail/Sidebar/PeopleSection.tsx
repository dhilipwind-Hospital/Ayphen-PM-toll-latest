import React from 'react';
import styled from 'styled-components';
import { Select, Avatar, Button, Tooltip } from 'antd';
import { UserPlus, Sparkles } from 'lucide-react';
import { colors } from '../../../theme/colors';
import { SidebarSection } from './SidebarSection';

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
`;

const UserName = styled.span`
  font-size: 14px;
  color: ${colors.text.primary};
`;

const FieldWrapper = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-bottom: 6px;
`;

interface PeopleSectionProps {
    issue: any;
    users: any[]; // List of available users
    onUpdate: (field: string, value: any) => Promise<void>;
}

export const PeopleSection: React.FC<PeopleSectionProps> = ({ issue, users, onUpdate }) => {
    return (
        <SidebarSection title="People">
            <FieldWrapper>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Label style={{ marginBottom: 0 }}>Assignee</Label>
                    <Tooltip title="AI Auto-Assign">
                        <Button
                            type="text"
                            size="small"
                            icon={<Sparkles size={12} color={colors.primary[500]} />}
                            onClick={() => onUpdate('assigneeId', 'active-sprint-assignee')} // Mock logic trigger
                        />
                    </Tooltip>
                </div>
                <Select
                    showSearch
                    style={{ width: '100%' }}
                    placeholder="Unassigned"
                    optionFilterProp="children"
                    value={issue.assigneeId}
                    onChange={(val) => onUpdate('assigneeId', val)}
                    bordered={false}
                >
                    {users.map(user => (
                        <Select.Option key={user.id} value={user.id}>
                            <UserRow>
                                <Avatar size="small" src={user.avatar} style={{ backgroundColor: colors.primary[500] }}>
                                    {user.name?.[0]}
                                </Avatar>
                                <UserName>{user.name}</UserName>
                            </UserRow>
                        </Select.Option>
                    ))}
                </Select>
                <Button
                    type="link"
                    size="small"
                    style={{ paddingLeft: 0, fontSize: '12px' }}
                    onClick={() => {
                        // Logic to assign to me
                        const currentUserId = localStorage.getItem('userId');
                        if (currentUserId) onUpdate('assigneeId', currentUserId);
                    }}
                >
                    Assign to me
                </Button>
            </FieldWrapper>

            <FieldWrapper>
                <Label>Reporter</Label>
                <UserRow>
                    <Avatar size="small" src={issue.reporter?.avatar} style={{ backgroundColor: colors.neutral[400] }}>
                        {issue.reporter?.name?.[0] || '?'}
                    </Avatar>
                    <UserName>{issue.reporter?.name || 'Unknown'}</UserName>
                </UserRow>
            </FieldWrapper>
        </SidebarSection>
    );
};
