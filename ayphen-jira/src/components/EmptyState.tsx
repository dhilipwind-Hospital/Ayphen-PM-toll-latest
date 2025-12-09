import React from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import { 
  Inbox, 
  FileText, 
  Users, 
  Calendar, 
  FolderOpen,
  Search,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 400px;
`;

const IconWrapper = styled.div<{ $color?: string }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.$color || '#f0f0f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  svg {
    color: ${props => props.$color ? '#fff' : '#999'};
  }
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 12px 0;
`;

const Description = styled.p`
  font-size: 14px;
  color: #8c8c8c;
  margin: 0 0 24px 0;
  max-width: 400px;
  line-height: 1.6;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`;

const Illustration = styled.div`
  margin-bottom: 24px;
  opacity: 0.6;
`;

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  iconColor,
}) => {
  return (
    <EmptyContainer>
      <IconWrapper $color={iconColor}>
        <Icon size={40} />
      </IconWrapper>
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {(actionLabel || secondaryActionLabel) && (
        <Actions>
          {actionLabel && onAction && (
            <Button type="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </Actions>
      )}
    </EmptyContainer>
  );
};

// Preset empty states
export const NoIssuesEmpty: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    icon={FileText}
    title="No issues yet"
    description="Create your first issue to get started with tracking work."
    actionLabel="Create Issue"
    onAction={onCreate}
    iconColor="#1890ff"
  />
);

export const NoResultsEmpty: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
  <EmptyState
    icon={Search}
    title="No results found"
    description="Try adjusting your search or filter to find what you're looking for."
    actionLabel="Clear Filters"
    onAction={onClear}
    iconColor="#faad14"
  />
);

export const NoSprintsEmpty: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    icon={Calendar}
    title="No sprints"
    description="Create a sprint to start planning and tracking your team's work."
    actionLabel="Create Sprint"
    onAction={onCreate}
    iconColor="#52c41a"
  />
);

export const NoTeamMembersEmpty: React.FC<{ onInvite?: () => void }> = ({ onInvite }) => (
  <EmptyState
    icon={Users}
    title="No team members"
    description="Invite team members to collaborate on this project."
    actionLabel="Invite Members"
    onAction={onInvite}
    iconColor="#722ed1"
  />
);

export const NoProjectsEmpty: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    icon={FolderOpen}
    title="No projects"
    description="Create a project to organize your work and collaborate with your team."
    actionLabel="Create Project"
    onAction={onCreate}
    iconColor="#1890ff"
  />
);

export const ErrorEmpty: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon={AlertCircle}
    title="Something went wrong"
    description="We couldn't load the data. Please try again."
    actionLabel="Retry"
    onAction={onRetry}
    iconColor="#ff4d4f"
  />
);

export const SuccessEmpty: React.FC<{ message?: string; onAction?: () => void; actionLabel?: string }> = ({ 
  message = "All done!", 
  onAction,
  actionLabel = "Go Back"
}) => (
  <EmptyState
    icon={CheckCircle}
    title="Success!"
    description={message}
    actionLabel={actionLabel}
    onAction={onAction}
    iconColor="#52c41a"
  />
);
