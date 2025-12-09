import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Edit, User, Link, Copy, Trash2, Flag, GitBranch, Plus } from 'lucide-react';
import { colors } from '../theme/colors';

const MenuContainer = styled.div<{ x: number; y: number; visible: boolean }>`
  position: fixed;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  z-index: 9999;
  display: ${props => props.visible ? 'block' : 'none'};
  opacity: ${props => props.visible ? 1 : 0};
  transform: ${props => props.visible ? 'scale(1)' : 'scale(0.95)'};
  transition: opacity 0.15s, transform 0.15s;
`;

const MenuSection = styled.div`
  padding: 4px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid ${colors.border.light};
  }
`;

const MenuItem = styled.div<{ danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: ${props => props.danger ? '#DE350B' : colors.text.primary};
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.danger ? '#DE350B' : colors.text.secondary};
  }
  
  &:hover {
    background: ${colors.sidebar.backgroundHover};
  }
`;

const MenuTitle = styled.div`
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 600;
  color: ${colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SubMenu = styled.div`
  padding-left: 28px;
`;

export interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onAssignToMe: () => void;
  onLinkIssue: () => void;
  onClone: () => void;
  onDelete: () => void;
  onCreateSubtask?: () => void;
  onCreateBug?: () => void;
  onChangePriority?: (priority: string) => void;
  onChangeStatus?: (status: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  onClose,
  onEdit,
  onAssignToMe,
  onLinkIssue,
  onClone,
  onDelete,
  onCreateSubtask,
  onCreateBug,
  onChangePriority,
  onChangeStatus,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <MenuContainer ref={menuRef} x={x} y={y} visible={visible}>
      <MenuSection>
        <MenuTitle>Quick Actions</MenuTitle>
        <MenuItem onClick={() => handleAction(onEdit)}>
          <Edit />
          Edit Issue
        </MenuItem>
        <MenuItem onClick={() => handleAction(onAssignToMe)}>
          <User />
          Assign to me
        </MenuItem>
        <MenuItem onClick={() => handleAction(onLinkIssue)}>
          <Link />
          Link Issue
        </MenuItem>
        <MenuItem onClick={() => handleAction(onClone)}>
          <Copy />
          Clone Issue
        </MenuItem>
      </MenuSection>

      {(onCreateSubtask || onCreateBug) && (
        <MenuSection>
          <MenuTitle>Create</MenuTitle>
          {onCreateSubtask && (
            <MenuItem onClick={() => handleAction(onCreateSubtask)}>
              <GitBranch />
              Create Subtask
            </MenuItem>
          )}
          {onCreateBug && (
            <MenuItem onClick={() => handleAction(onCreateBug)}>
              <Plus />
              Create Bug
            </MenuItem>
          )}
        </MenuSection>
      )}

      {(onChangePriority || onChangeStatus) && (
        <MenuSection>
          <MenuTitle>Quick Change</MenuTitle>
          {onChangePriority && (
            <>
              <SubMenu>
                <MenuItem onClick={() => handleAction(() => onChangePriority('highest'))}>
                  <Flag style={{ color: '#FF5630' }} />
                  Priority: Highest
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onChangePriority('high'))}>
                  <Flag style={{ color: '#FF991F' }} />
                  Priority: High
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onChangePriority('medium'))}>
                  <Flag style={{ color: '#0052CC' }} />
                  Priority: Medium
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onChangePriority('low'))}>
                  <Flag style={{ color: '#00875A' }} />
                  Priority: Low
                </MenuItem>
              </SubMenu>
            </>
          )}
          {onChangeStatus && (
            <>
              <SubMenu>
                <MenuItem onClick={() => handleAction(() => onChangeStatus('todo'))}>
                  To Do
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onChangeStatus('in-progress'))}>
                  In Progress
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onChangeStatus('in-review'))}>
                  In Review
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onChangeStatus('done'))}>
                  Done
                </MenuItem>
              </SubMenu>
            </>
          )}
        </MenuSection>
      )}

      <MenuSection>
        <MenuItem danger onClick={() => handleAction(onDelete)}>
          <Trash2 />
          Delete Issue
        </MenuItem>
      </MenuSection>
    </MenuContainer>
  );
};
