import React, { useState } from 'react';
import { Dropdown, Menu, message, Modal } from 'antd';
import { 
  MoreHorizontal, 
  Copy, 
  Link as LinkIcon, 
  TestTube, 
  Bug, 
  Paperclip, 
  Tag as TagIcon, 
  User, 
  GitBranch,
  RefreshCw,
  Download,
  Trash2,
  Check
} from 'lucide-react';
import styled from 'styled-components';

const MenuIcon = styled.span`
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
`;

interface MoreActionsMenuProps {
  issue: any;
  onCopyLink?: () => void;
  onLinkIssue?: () => void;
  onLinkTestCase?: () => void;
  onLinkBug?: () => void;
  onCreateBug?: () => void;
  onAttachFile?: () => void;
  onAddLabel?: () => void;
  onAssignToMe?: () => void;
  onMoveToSprint?: () => void;
  onChangeType?: (newType: string) => void;
  onExport?: (format: string) => void;
  onDelete?: () => void;
}

export const MoreActionsMenu: React.FC<MoreActionsMenuProps> = ({
  issue,
  onCopyLink,
  onLinkIssue,
  onLinkTestCase,
  onLinkBug,
  onCreateBug,
  onAttachFile,
  onAddLabel,
  onAssignToMe,
  onMoveToSprint,
  onChangeType,
  onExport,
  onDelete,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/issue/${issue.key}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    message.success('Link copied to clipboard!');
    setTimeout(() => setCopySuccess(false), 2000);
    if (onCopyLink) onCopyLink();
  };

  const handleChangeType = (newType: string) => {
    Modal.confirm({
      title: `Convert ${issue.type} to ${newType}?`,
      content: `Are you sure you want to convert this ${issue.type} to a ${newType}? This action cannot be undone.`,
      okText: 'Convert',
      cancelText: 'Cancel',
      onOk: () => {
        if (onChangeType) onChangeType(newType);
      },
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Issue?',
      content: 'Are you sure you want to delete this issue? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        if (onDelete) onDelete();
      },
    });
  };

  const getChangeTypeItems = () => {
    const items = [];
    if (issue.type === 'story') {
      items.push(
        <Menu.Item key="story-to-epic" onClick={() => handleChangeType('epic')}>
          Story → Epic
        </Menu.Item>,
        <Menu.Item key="story-to-bug" onClick={() => handleChangeType('bug')}>
          Story → Bug
        </Menu.Item>,
        <Menu.Item key="story-to-task" onClick={() => handleChangeType('task')}>
          Story → Task
        </Menu.Item>
      );
    } else if (issue.type === 'epic') {
      items.push(
        <Menu.Item key="epic-to-story" onClick={() => handleChangeType('story')}>
          Epic → Story
        </Menu.Item>,
        <Menu.Item key="epic-to-task" onClick={() => handleChangeType('task')}>
          Epic → Task
        </Menu.Item>
      );
    } else if (issue.type === 'bug') {
      items.push(
        <Menu.Item key="bug-to-story" onClick={() => handleChangeType('story')}>
          Bug → Story
        </Menu.Item>,
        <Menu.Item key="bug-to-task" onClick={() => handleChangeType('task')}>
          Bug → Task
        </Menu.Item>
      );
    } else if (issue.type === 'task') {
      items.push(
        <Menu.Item key="task-to-story" onClick={() => handleChangeType('story')}>
          Task → Story
        </Menu.Item>,
        <Menu.Item key="task-to-bug" onClick={() => handleChangeType('bug')}>
          Task → Bug
        </Menu.Item>
      );
    }
    return items;
  };

  const menu = (
    <Menu>
      <Menu.Item key="copy-link" onClick={handleCopyLink}>
        <MenuIcon>
          {copySuccess ? <Check size={16} color="#52c41a" /> : <Copy size={16} />}
        </MenuIcon>
        Copy Link to Issue
      </Menu.Item>
      
      <Menu.Divider />
      
      <Menu.Item key="link-issue" onClick={onLinkIssue}>
        <MenuIcon><LinkIcon size={16} /></MenuIcon>
        Link Issue
      </Menu.Item>
      
      <Menu.Item key="link-test-case" onClick={onLinkTestCase}>
        <MenuIcon><TestTube size={16} /></MenuIcon>
        Link Test Case
      </Menu.Item>
      
      <Menu.Item key="link-bug" onClick={onLinkBug}>
        <MenuIcon><Bug size={16} /></MenuIcon>
        Link Bug
      </Menu.Item>
      
      <Menu.Item key="create-bug" onClick={onCreateBug}>
        <MenuIcon><Bug size={16} /></MenuIcon>
        Create Bug
      </Menu.Item>
      
      <Menu.Divider />
      
      <Menu.Item key="attach-file" onClick={onAttachFile}>
        <MenuIcon><Paperclip size={16} /></MenuIcon>
        Attach File
      </Menu.Item>
      
      <Menu.Item key="add-label" onClick={onAddLabel}>
        <MenuIcon><TagIcon size={16} /></MenuIcon>
        Add Label
      </Menu.Item>
      
      <Menu.Item key="assign-to-me" onClick={onAssignToMe}>
        <MenuIcon><User size={16} /></MenuIcon>
        Assign to Me
      </Menu.Item>
      
      <Menu.Item key="move-to-sprint" onClick={onMoveToSprint}>
        <MenuIcon><GitBranch size={16} /></MenuIcon>
        Move to Sprint
      </Menu.Item>
      
      <Menu.Divider />
      
      <Menu.SubMenu 
        key="change-type" 
        title={
          <>
            <MenuIcon><RefreshCw size={16} /></MenuIcon>
            Change Type
          </>
        }
        popupClassName="change-type-submenu"
      >
        {getChangeTypeItems()}
      </Menu.SubMenu>
      
      <Menu.SubMenu 
        key="export" 
        title={
          <>
            <MenuIcon><Download size={16} /></MenuIcon>
            Export
          </>
        }
      >
        <Menu.Item key="export-json" onClick={() => onExport?.('json')}>
          Export as JSON
        </Menu.Item>
        <Menu.Item key="export-csv" onClick={() => onExport?.('csv')}>
          Export as CSV
        </Menu.Item>
        <Menu.Item key="export-pdf" onClick={() => onExport?.('pdf')}>
          Export as PDF
        </Menu.Item>
        <Menu.Item key="export-word" onClick={() => onExport?.('word')}>
          Export as Word
        </Menu.Item>
      </Menu.SubMenu>
      
      <Menu.Divider />
      
      <Menu.Item key="delete" danger onClick={handleDelete}>
        <MenuIcon><Trash2 size={16} /></MenuIcon>
        Delete Issue
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
      <MoreHorizontal 
        size={20} 
        style={{ cursor: 'pointer' }} 
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  );
};
