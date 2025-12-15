import React from 'react';
import styled from 'styled-components';
import { colors } from '../../theme/colors';
import { FileText, Paperclip, MessageSquare, GitBranch, Share2, Layers } from 'lucide-react';

const RailContainer = styled.div`
  width: 200px;
  border-right: 1px solid ${colors.border.light};
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: sticky;
  top: 0;
  height: calc(100vh - 64px);
  overflow-y: auto;
  background: ${colors.background.sidebar};
`;

const NavItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: ${props => props.active ? colors.primary[600] : colors.text.secondary};
  background: ${props => props.active ? colors.primary[50] : 'transparent'};
  font-weight: ${props => props.active ? 600 : 500};
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    background: ${props => props.active ? colors.primary[50] : colors.background.hover};
    color: ${props => props.active ? colors.primary[600] : colors.text.primary};
  }
`;

const NavLabel = styled.span`
  flex: 1;
`;

interface IssueNavigationRailProps {
    activeSection: string;
    onNavigate: (sectionId: string) => void;
}

export const IssueNavigationRail: React.FC<IssueNavigationRailProps> = ({
    activeSection,
    onNavigate
}) => {
    const items = [
        { id: 'summary', label: 'Summary', icon: <FileText size={16} /> },
        { id: 'description', label: 'Description', icon: <FileText size={16} /> },
        { id: 'subtasks', label: 'Subtasks', icon: <Layers size={16} /> },
        { id: 'attachments', label: 'Attachments', icon: <Paperclip size={16} /> },
        { id: 'activity', label: 'Activity', icon: <MessageSquare size={16} /> },
    ];

    return (
        <RailContainer>
            {items.map(item => (
                <NavItem
                    key={item.id}
                    active={activeSection === item.id}
                    onClick={() => onNavigate(item.id)}
                >
                    {item.icon}
                    <NavLabel>{item.label}</NavLabel>
                </NavItem>
            ))}
        </RailContainer>
    );
};
