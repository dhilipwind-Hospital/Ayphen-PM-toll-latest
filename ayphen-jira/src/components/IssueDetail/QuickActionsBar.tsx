import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { BugOutlined, FileTextOutlined, CheckSquareOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { CreateIssueModal } from '../CreateIssueModal';
import { colors } from '../../theme/colors';

const QuickButton = styled(Button)`
  border: 1px solid ${colors.glass.border};
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  padding: 4px 12px;
  height: 32px;
  font-size: 13px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(14, 165, 233, 0.1);
    border-color: ${colors.primary[600]};
    color: ${colors.primary[600]};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  .anticon {
    font-size: 14px;
  }
`;

interface QuickActionsBarProps {
  issue: any;
  onIssueCreated: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ issue, onIssueCreated }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string>('story');
  const [defaultValues, setDefaultValues] = useState<any>({});

  const handleQuickCreate = (type: string, values: Partial<any> = {}) => {
    setDefaultType(type);
    setDefaultValues({
      projectId: issue.projectId,
      ...values,
    });
    setCreateModalOpen(true);
  };

  // Determine which actions to show based on issue type
  const getAvailableActions = () => {
    const actions = [];

    switch (issue.type) {
      case 'epic':
        actions.push({
          key: 'story',
          label: 'Story',
          icon: <FileTextOutlined />,
          color: '#3B82F6',
          tooltip: 'Create a User Story under this Epic',
          onClick: () => handleQuickCreate('story', { 
            epicLink: issue.id,
            epicKey: issue.key 
          }),
        });
        actions.push({
          key: 'bug',
          label: 'Bug',
          icon: <BugOutlined />,
          color: '#EF4444',
          tooltip: 'Report a bug in this Epic',
          onClick: () => handleQuickCreate('bug', { 
            epicLink: issue.id,
            epicKey: issue.key 
          }),
        });
        break;

      case 'story':
      case 'task':
        actions.push({
          key: 'subtask',
          label: 'Subtask',
          icon: <CheckSquareOutlined />,
          color: '#10B981',
          tooltip: 'Break down this story into subtasks',
          onClick: () => handleQuickCreate('subtask', { 
            parentIssue: issue.id, // Using parentIssue to match form field
            parentKey: issue.key 
          }),
        });
        actions.push({
          key: 'bug',
          label: 'Bug',
          icon: <BugOutlined />,
          color: '#EF4444',
          tooltip: 'Report a bug found in this story',
          onClick: () => handleQuickCreate('bug', { 
            epicLink: issue.epicLink,
            relatedStory: issue.id 
          }),
        });
        break;

      case 'bug':
        actions.push({
          key: 'subtask',
          label: 'Subtask',
          icon: <CheckSquareOutlined />,
          color: '#10B981',
          tooltip: 'Create subtask to fix this bug',
          onClick: () => handleQuickCreate('subtask', { 
            parentIssue: issue.id // Using parentIssue to match form field
          }),
        });
        break;

      default:
        // Subtasks can't have children
        break;
    }

    return actions;
  };

  const actions = getAvailableActions();

  // Don't show if no actions available
  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      {actions.map(action => (
        <Tooltip key={action.key} title={action.tooltip}>
          <QuickButton
            icon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </QuickButton>
        </Tooltip>
      ))}

      <CreateIssueModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setDefaultValues({});
        }}
        onSuccess={() => {
          setCreateModalOpen(false);
          onIssueCreated();
        }}
        defaultType={defaultType}
        defaultValues={defaultValues}
      />
    </>
  );
};
