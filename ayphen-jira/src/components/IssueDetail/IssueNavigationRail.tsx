import React from 'react';
import styled from 'styled-components';
import { FileText, Layers, Paperclip, MessageSquare } from 'lucide-react';
import { colors } from '../../theme/colors';

const RailContainer = styled.div`
  width: 240px;
  background: ${colors.background.sidebar}; // Light pinkish
  border-right: 1px solid ${colors.border.light};
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100vh;
  position: sticky;
  top: 0;
`;

const RailItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  background: ${props => props.active ? colors.sidebar.activeBackground : 'transparent'};
  color: ${props => props.active ? colors.sidebar.active : colors.text.secondary};
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: ${colors.sidebar.backgroundHover};
    color: ${colors.sidebar.textHover};
  }

  svg {
    color: ${props => props.active ? colors.sidebar.active : colors.text.secondary};
  }
`;

// Specific icons requested:
// Summary: Document (FileText) - Pink/Magenta if active
// Description: Document (FileText) - Gray
// Subtasks: Layers/Stack (Layers) - Gray
// Attachments: Paperclip - Gray
// Activity: Chat Bubble (MessageSquare) - Gray

interface IssueNavigationRailProps {
    activeSection: string;
    onNavigate: (sectionId: string) => void;
}

export const IssueNavigationRail: React.FC<IssueNavigationRailProps> = ({ activeSection, onNavigate }) => {
    const items = [
        { id: 'summary', label: 'Summary', icon: FileText },
        { id: 'description', label: 'Description', icon: FileText }, // Using FileText for both as requested (document icon)
        { id: 'subtasks', label: 'Subtasks', icon: Layers },
        { id: 'attachments', label: 'Attachments', icon: Paperclip },
        { id: 'activity', label: 'Activity', icon: MessageSquare },
    ];

    return (
        <RailContainer>
            {items.map(item => {
                const isActive = activeSection === item.id;
                // Override icon color based on spec: "pink/magenta" for Summary (if active or always?), others gray.
                // Assuming "pink/magenta" means the Active Color which we handle via props.active.

                return (
                    <RailItem
                        key={item.id}
                        active={isActive}
                        onClick={() => onNavigate(item.id)}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </RailItem>
                );
            })}
        </RailContainer>
    );
};
