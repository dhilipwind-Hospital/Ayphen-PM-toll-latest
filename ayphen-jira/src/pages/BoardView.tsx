import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Tag, message, Avatar, Modal } from 'antd';
import { FileText, Bug, Layers, Plus, Star, Settings, Paperclip, MessageSquare, Link2 } from 'lucide-react';
import { ContextMenu } from '../components/ContextMenu';
import { QuickFilters } from '../components/QuickFilters';
import { BulkActionsToolbar } from '../components/BulkActionsToolbar';
import { SavedViewsDropdown } from '../components/SavedViewsDropdown';
import { bulkOperationsApi, boardViewsApi, sprintsApi } from '../services/api';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, type DragEndEvent, pointerWithin, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import axios from 'axios';
import { FilterBar } from '../components/FilterBar';
import { BoardSettings } from '../components/BoardSettings';
import type { IssueStatus } from '../types';
import { GlassCard } from '../components/common/GlassPanel';

const Container = styled.div`
  padding: 24px;
  min-height: calc(100vh - 56px);
`;

const BoardContainer = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
  }
`;

const Column = styled.div<{ isOver?: boolean }>`
  min-width: 280px;
  max-width: 280px;
  background: ${props => props.isOver ? 'rgba(14, 165, 233, 0.05)' : 'transparent'};
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
  transition: all 0.3s ease;
  border: 2px solid ${props => props.isOver ? colors.primary[200] : 'transparent'};
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  margin-bottom: 12px;
`;

const ColumnHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusDot = styled.div<{ status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.status === 'backlog') return '#8993A4';
    if (props.status === 'todo') return '#42526E';
    if (props.status === 'in-progress') return '#0052CC';
    if (props.status === 'in-review') return '#FF991F';
    if (props.status === 'done') return '#00875A';
    return '#8993A4';
  }};
`;

const AddButton = styled(Button)`
  padding: 0;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  
  &:hover {
    background: rgba(0,0,0,0.05);
    color: ${colors.primary[600]};
  }
`;

const ColumnTitle = styled.div`
  font-weight: 600;
  font-size: 12px;
  color: ${colors.text.secondary};
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
`;

const IssueCount = styled.span<{ isNearLimit?: boolean; isOverLimit?: boolean }>`
  background: ${props => props.isOverLimit ? '#FFEBE6' : props.isNearLimit ? '#FFF0B3' : 'rgba(0,0,0,0.05)'};
  color: ${props => props.isOverLimit ? '#DE350B' : props.isNearLimit ? '#FF991F' : colors.text.secondary};
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
`;

const IssueList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
`;

const StyledIssueCard = styled(GlassCard) <{ isDragging?: boolean; type: string; isStarred?: boolean; isSelected?: boolean }>`
  margin-bottom: 0;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  opacity: ${props => props.isDragging ? 0.8 : 1};
  border: ${props => props.isSelected ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.glass.border}`};
  border-left: 3px solid ${props => props.type === 'epic' ? '#6554C0' :
    props.type === 'story' ? '#0052CC' :
      props.type === 'bug' ? '#DE350B' : '#0052CC'
  };
  background: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  padding: 8px 10px;
  position: relative;
  border-radius: 6px;
  z-index: ${props => props.isDragging ? 999 : 1};
  
  &:hover {
    border-color: ${colors.primary[300]};
    box-shadow: 0 2px 4px rgba(0,0,0,0.12);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2px;
`;

const StarIcon = styled(Star) <{ isStarred: boolean }>`
  width: 14px;
  height: 14px;
  cursor: pointer;
  color: ${props => props.isStarred ? '#FFAB00' : '#8993A4'};
  fill: ${props => props.isStarred ? '#FFAB00' : 'none'};
  transition: all 0.2s;
  
  &:hover {
    color: #FFAB00;
    transform: scale(1.1);
  }
`;

const PriorityDot = styled.div<{ priority: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => {
    if (props.priority === 'highest' || props.priority === 'critical') return '#FF5630';
    if (props.priority === 'high') return '#FF991F';
    if (props.priority === 'medium') return '#0052CC';
    return '#00875A';
  }};
  margin-right: 4px;
`;

const LabelTag = styled(Tag)`
  font-size: 10px;
  padding: 0 6px;
  margin: 0 4px 4px 0;
  border-radius: 3px;
  border: none;
`;

const IssueKey = styled.div`
  font-size: 10px;
  color: #5E6C84;
  font-weight: 600;
  margin-bottom: 2px;
`;

const IssueSummary = styled.div`
  font-size: 13px;
  color: #172B4D;
  margin-bottom: 6px;
  line-height: 1.3;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 2.6em;
  
  &:hover {
    color: #0052CC;
  }
`;

const IssueFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const IssueMeta = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const TypeIcon = styled.div<{ type: string }>`
  width: 20px;
  height: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    if (props.type === 'epic') return '#722ed1';
    if (props.type === 'story') return '#52c41a';
    if (props.type === 'bug') return '#ff4d4f';
    return '#1890ff';
  }};
  color: white;
  font-size: 10px;
`;

const CountBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #5E6C84;
  
  svg {
    width: 12px;
    height: 12px;
  }
  
  &:hover {
    color: #172B4D;
  }
`;

const API_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

interface SortableIssueProps {
  issue: any;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent, issue: any) => void;
  isSelected?: boolean;
}

// --- Memoized Components ---

const SortableIssue = React.memo<SortableIssueProps>(({ issue, onClick, onContextMenu, isSelected = false }) => {
  const [isStarred, setIsStarred] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTypeIcon = (type: string) => {
    if (type === 'epic') return <Layers size={12} />;
    if (type === 'story') return <FileText size={12} />;
    if (type === 'bug') return <Bug size={12} />;
    return <FileText size={12} />;
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStarred(!isStarred);
  };

  return (
    <StyledIssueCard
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      type={issue.type}
      isStarred={isStarred}
      isSelected={isSelected}
      onClick={(e: any) => {
        // Only trigger onClick if not dragging
        if (!isDragging && e.button === 0) {
          onClick(e);
        }
      }}
      onContextMenu={(e) => onContextMenu?.(e, issue)}
      hover
      interactive
      {...attributes}
      {...listeners}
    >
      <div>
        <CardHeader>
          <IssueKey>{issue.key}</IssueKey>
          <StarIcon isStarred={isStarred} onClick={handleStarClick} />
        </CardHeader>
        <IssueSummary>
          {issue.summary}
        </IssueSummary>
        {issue.labels && issue.labels.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {issue.labels.map((label: string) => (
              <LabelTag key={label} color="blue">
                {label}
              </LabelTag>
            ))}
          </div>
        )}
        <IssueFooter>
          <IssueMeta>
            <PriorityDot priority={issue.priority || 'medium'} />
            <TypeIcon type={issue.type}>
              {getTypeIcon(issue.type)}
            </TypeIcon>
            {issue.storyPoints && (
              <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', margin: 0, marginLeft: 4 }}>
                {issue.storyPoints} pts
              </Tag>
            )}
            {(issue.attachmentCount || 0) > 0 && (
              <CountBadge title={`${issue.attachmentCount} attachment(s)`}>
                <Paperclip />
                {issue.attachmentCount}
              </CountBadge>
            )}
            {(issue.commentCount || 0) > 0 && (
              <CountBadge title={`${issue.commentCount} comment(s)`}>
                <MessageSquare />
                {issue.commentCount}
              </CountBadge>
            )}
            {(issue.linkCount || 0) > 0 && (
              <CountBadge title={`${issue.linkCount} linked issue(s)`}>
                <Link2 />
                {issue.linkCount}
              </CountBadge>
            )}
          </IssueMeta>
          {issue.assignee && (
            <Avatar size={24} style={{ background: '#0052CC', fontSize: 11 }}>
              {issue.assignee.name?.charAt(0) || 'U'}
            </Avatar>
          )}
        </IssueFooter>
      </div>
    </StyledIssueCard>
  );
}, (prev, next) => {
  return prev.issue.id === next.issue.id &&
    prev.issue.status === next.issue.status &&
    prev.isSelected === next.isSelected &&
    JSON.stringify(prev.issue) === JSON.stringify(next.issue); // Deep check if needed, or stick to shallow
});

interface DroppableColumnProps {
  status: string;
  title: string;
  issues: any[];
  onIssueClick: (issue: any) => void;
  onCardSelect: (e: React.MouseEvent, issueId: string) => void;
  selectedIssues: string[];
  onContextMenu?: (e: React.MouseEvent, issue: any) => void;
  wipLimit?: number;
}

const DroppableColumn = React.memo<DroppableColumnProps>(({ status, title, issues, onIssueClick, onCardSelect, selectedIssues, onContextMenu, wipLimit }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const issueCount = issues.length;
  const isNearLimit = wipLimit ? issueCount >= wipLimit * 0.8 : false;
  const isOverLimit = wipLimit ? issueCount > wipLimit : false;

  return (
    <Column ref={setNodeRef} isOver={isOver}>
      <ColumnHeader>
        <ColumnHeaderLeft>
          <StatusDot status={status} />
          <ColumnTitle>{title}</ColumnTitle>
          <IssueCount
            isNearLimit={isNearLimit}
            isOverLimit={isOverLimit}
            title={wipLimit ? `${issueCount}/${wipLimit} (WIP limit ${wipLimit})` : `${issueCount} issues`}
          >
            {wipLimit ? `${issueCount}/${wipLimit}` : issueCount}
          </IssueCount>
        </ColumnHeaderLeft>
        <AddButton type="text" size="small" icon={<Plus size={14} />} />
      </ColumnHeader>
      <IssueList>
        <SortableContext
          items={issues.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <SortableIssue
              key={issue.id}
              issue={issue}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  onCardSelect(e, issue.id);
                } else {
                  onIssueClick(issue);
                }
              }}
              onContextMenu={onContextMenu}
              isSelected={selectedIssues.includes(issue.id)}
            />
          ))}
        </SortableContext>
      </IssueList>
    </Column>
  );
});

export const BoardView: React.FC = () => {
  const navigate = useNavigate();
  const { issues, setIssues, updateIssue, currentProject, currentUser } = useStore();
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    issue: any;
  }>({ visible: false, x: 0, y: 0, issue: null });

  // Quick filters state
  const [quickFilters, setQuickFilters] = useState<string[]>([]);

  // Bulk operations state
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  // Swimlanes state
  const [groupBy, setGroupBy] = useState<'none' | 'epic' | 'assignee' | 'priority'>('none');

  // Saved views state
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<any>(null);
  const [activeSprint, setActiveSprint] = useState<any>(null);

  const [columns, setColumns] = useState([
    { id: 'backlog', title: 'Backlog', statuses: ['backlog'], wipLimit: undefined, color: '#8c8c8c' },
    { id: 'todo', title: 'To Do', statuses: ['todo'], wipLimit: undefined, color: '#1890ff' },
    { id: 'in-progress', title: 'In Progress', statuses: ['in-progress'], wipLimit: 3, color: '#fa8c16' },
    { id: 'in-review', title: 'In Review', statuses: ['in-review'], wipLimit: 2, color: '#722ed1' },
    { id: 'done', title: 'Done', statuses: ['done'], wipLimit: undefined, color: '#52c41a' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (currentProject) {
      loadIssues();
      loadActiveSprint();
    }
  }, [currentProject]);

  const loadActiveSprint = async () => {
    try {
      const res = await sprintsApi.getAll(currentProject?.id);
      const active = res.data.find((s: any) => s.status === 'active');
      setActiveSprint(active);
    } catch (e) { console.error('Failed to load sprints', e); }
  };

  const loadIssues = async () => {
    if (!currentProject) {
      setIssues([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/issues`, {
        params: {
          projectId: currentProject.id,
          userId: currentUser?.id || localStorage.getItem('userId')
        }
      });
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to load issues:', error);
      message.error('Failed to load issues');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const issueId = active.id as string;
    const newStatus = over.id as IssueStatus;

    const issue = issues.find(i => i.id === issueId);
    if (!issue || issue.status === newStatus) return;

    // Optimistic update
    const previousStatus = issue.status;
    updateIssue(issueId, { status: newStatus });

    try {
      await axios.put(`${API_URL}/issues/${issueId}`, {
        ...issue,
        status: newStatus
      });
      message.success(`Moved to ${newStatus.replace('-', ' ')}`);
    } catch (error) {
      // Rollback on error
      updateIssue(issueId, { status: previousStatus });
      console.error('Failed to update issue:', error);
      message.error('Failed to update issue status');
    }
  };

  const handleIssueClick = (issue: any) => {
    if (issue.type === 'epic') {
      navigate(`/epic/${issue.id}`);
    } else {
      navigate(`/issue/${issue.key}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, issue: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      issue,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({ visible: false, x: 0, y: 0, issue: null });
  };

  const handleContextEdit = () => {
    if (contextMenu.issue) {
      navigate(`/issue/${contextMenu.issue.key}`);
    }
  };

  const handleContextAssignToMe = async () => {
    if (!contextMenu.issue || !currentUser) return;
    try {
      await axios.put(`${API_URL}/issues/${contextMenu.issue.id}`, {
        ...contextMenu.issue,
        assigneeId: currentUser.id
      });
      message.success('Assigned to you');
      loadIssues();
    } catch (error) {
      console.error('Failed to assign:', error);
      message.error('Failed to assign issue');
    }
  };

  const handleContextLinkIssue = () => {
    // Open link modal (implement later)
    message.info('Link issue feature coming soon');
  };

  const handleContextClone = async () => {
    if (!contextMenu.issue) return;
    try {
      const { id, key, ...issueData } = contextMenu.issue;
      await axios.post(`${API_URL}/issues`, {
        ...issueData,
        summary: `Copy of ${issueData.summary}`
      });
      message.success('Issue cloned successfully');
      loadIssues();
    } catch (error) {
      console.error('Failed to clone:', error);
      message.error('Failed to clone issue');
    }
  };

  const handleContextDelete = async () => {
    if (!contextMenu.issue) return;
    Modal.confirm({
      title: 'Delete Issue',
      content: `Are you sure you want to delete ${contextMenu.issue.key}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/issues/${contextMenu.issue.id}`);
          message.success('Issue deleted');
          loadIssues();
        } catch (error) {
          console.error('Failed to delete:', error);
          message.error('Failed to delete issue');
        }
      }
    });
  };

  const handleContextChangePriority = async (priority: string) => {
    if (!contextMenu.issue) return;
    try {
      await axios.put(`${API_URL}/issues/${contextMenu.issue.id}`, {
        ...contextMenu.issue,
        priority
      });
      message.success(`Priority changed to ${priority}`);
      loadIssues();
    } catch (error) {
      console.error('Failed to change priority:', error);
      message.error('Failed to change priority');
    }
  };

  const handleContextChangeStatus = async (status: string) => {
    if (!contextMenu.issue) return;
    try {
      await axios.put(`${API_URL}/issues/${contextMenu.issue.id}`, {
        ...contextMenu.issue,
        status
      });
      message.success(`Status changed to ${status.replace('-', ' ')}`);
      loadIssues();
    } catch (error) {
      console.error('Failed to change status:', error);
      message.error('Failed to change status');
    }
  };

  // Multi-select handler
  const handleCardSelect = (e: React.MouseEvent, issueId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  // Quick filter logic - MUST be defined before getFilteredIssues
  const applyQuickFilters = (issuesList: any[]) => {
    let filtered = issuesList;

    if (quickFilters.includes('my-issues') && currentUser) {
      filtered = filtered.filter(i => i.assigneeId === currentUser.id);
    }

    if (quickFilters.includes('blocked')) {
      filtered = filtered.filter(i =>
        i.status === 'blocked' || i.labels?.includes('blocked')
      );
    }

    if (quickFilters.includes('overdue')) {
      const today = new Date();
      filtered = filtered.filter(i =>
        i.dueDate && new Date(i.dueDate) < today
      );
    }

    if (quickFilters.includes('unassigned')) {
      filtered = filtered.filter(i => !i.assigneeId);
    }

    if (quickFilters.includes('high-priority')) {
      filtered = filtered.filter(i =>
        i.priority === 'high' || i.priority === 'highest'
      );
    }

    return filtered;
  };

  const getFilteredIssues = () => {
    let filtered = issues;

    // If we are in a Scrum project, only show issues from the Active Sprint.
    if (currentProject?.type === 'scrum') {
      if (activeSprint) {
        filtered = filtered.filter(i => i.sprintId === activeSprint.id);
      } else {
        // Explicitly return a special flag or empty, handled in UI
        return [];
      }
    }

    if (filterType.length > 0) {
      filtered = filtered.filter(i => filterType.includes(i.type.toLowerCase()));
    }

    if (filterAssignee.length > 0) {
      filtered = filtered.filter(i => i.assignee && filterAssignee.includes(i.assignee.id));
    }

    if (filterPriority.length > 0) {
      filtered = filtered.filter(i => i.priority && filterPriority.includes(i.priority.toLowerCase()));
    }

    // Apply quick filters
    filtered = applyQuickFilters(filtered);

    return filtered;
  };

  const filteredIssues = getFilteredIssues();

  const getIssuesByStatus = (columnStatuses: string[]) => {
    return filteredIssues.filter(issue =>
      columnStatuses.includes(issue.status)
    );
  };

  const handleSaveSettings = (newColumns: any[]) => {
    setColumns(newColumns);
    message.success('Board settings saved!');
  };

  // Load saved views on mount
  useEffect(() => {
    if (currentUser) {
      boardViewsApi.getAll(currentUser.id).then(res => {
        setSavedViews(res.data);
        const defaultView = res.data.find((v: any) => v.isDefault);
        if (defaultView) {
          handleLoadView(defaultView);
        }
      }).catch(error => {
        console.error('Failed to load views:', error);
      });
    }
  }, [currentUser]);

  // Bulk operations handlers
  const handleBulkAssign = async (userId: string) => {
    try {
      await bulkOperationsApi.bulkUpdate(selectedIssues, { assigneeId: userId });
      message.success(`Assigned ${selectedIssues.length} issues`);
      setSelectedIssues([]);
      loadIssues();
    } catch (error) {
      console.error('Bulk assign failed:', error);
      message.error('Failed to assign issues');
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    try {
      await bulkOperationsApi.bulkUpdate(selectedIssues, { status });
      message.success(`Updated status for ${selectedIssues.length} issues`);
      setSelectedIssues([]);
      loadIssues();
    } catch (error) {
      console.error('Bulk status update failed:', error);
      message.error('Failed to update status');
    }
  };

  const handleBulkDelete = async () => {
    Modal.confirm({
      title: 'Bulk Delete Issues',
      content: `Are you sure you want to delete ${selectedIssues.length} issues?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          // Implement bulk delete API
          await Promise.all(selectedIssues.map(id => axios.delete(`${API_URL}/issues/${id}`)));
          message.success('Issues deleted');
          setSelectedIssues([]);
          loadIssues();
        } catch (error) {
          message.error('Failed to delete issues');
        }
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedIssues([]);
  };

  const handleSaveView = async (name: string) => {
    try {
      if (currentUser) {
        await boardViewsApi.create({
          name,
          userId: currentUser.id,
          config: {
            groupBy,
            filterType,
            filterPriority,
            settings: columns
          }
        });
        message.success('View saved');
        // Reload views
        const res = await boardViewsApi.getAll(currentUser.id);
        setSavedViews(res.data);
      }
    } catch (error) {
      message.error('Failed to save view');
    }
  };

  const handleLoadView = (view: any) => {
    setCurrentView(view);
    if (view.config) {
      if (view.config.groupBy) setGroupBy(view.config.groupBy);
      if (view.config.filterType) setFilterType(view.config.filterType);
      if (view.config.filterPriority) setFilterPriority(view.config.filterPriority);
      if (view.config.settings) setColumns(view.config.settings);
    }
  };

  const handleDeleteView = async (id: string) => {
    try {
      await boardViewsApi.delete(id);
      setSavedViews(savedViews.filter(v => v.id !== id));
      if (currentView?.id === id) setCurrentView(null);
      message.success('View deleted');
    } catch (error) {
      message.error('Failed to delete view');
    }
  };

  const handleSetDefaultView = async (id: string) => {
    try {
      await boardViewsApi.update(id, { isDefault: true });
      setSavedViews(savedViews.map((v: any) => ({
        ...v,
        isDefault: v.id === id,
      })));
      message.success('Set as default view');
    } catch (error) {
      console.error('Failed to set default:', error);
      message.error('Failed to set default view');
    }
  };

  if (!currentProject) {
    return (
      <Container>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: '16px'
        }}>
          <h2>No Project Selected</h2>
          <p>Please select a project from the dropdown in the header to view the board.</p>
          <Button type="primary" onClick={() => navigate('/projects')}>
            Go to Projects
          </Button>
        </div>
      </Container>
    );
  }

  // Get unique assignees for filter
  const uniqueAssignees = Array.from(
    new Set(issues.map(i => i.assignee?.id).filter(Boolean))
  ).map(id => {
    const issue = issues.find(i => i.assignee?.id === id);
    return issue?.assignee ? { id: issue.assignee.id, name: issue.assignee.name } : null;
  }).filter(Boolean) as { id: string; name: string }[];

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <SavedViewsDropdown
            views={savedViews}
            currentView={currentView}
            onLoadView={handleLoadView}
            onSaveView={handleSaveView}
            onDeleteView={handleDeleteView}
            onSetDefault={handleSetDefaultView}
          />
          <FilterBar
            project={currentProject}
            selectedPriority={filterPriority}
            selectedType={filterType}
            selectedAssignee={filterAssignee}
            onPriorityChange={(value) => setFilterPriority(value as string[])}
            onTypeChange={(value) => setFilterType(value as string[])}
            onAssigneeChange={(value) => setFilterAssignee(value as string[])}
            assignees={uniqueAssignees}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
        <Button
          icon={<Settings size={16} />}
          onClick={() => setSettingsVisible(true)}
          style={{ marginLeft: 16 }}
        >
          Board Settings
        </Button>
      </div>

      <QuickFilters
        activeFilters={quickFilters}
        onFilterChange={setQuickFilters}
        currentUserId={currentUser?.id}
      />

      {currentProject?.type === 'scrum' && !activeSprint ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          width: '100%',
          color: colors.text.secondary
        }}>
          <Layers size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>No Active Sprint</h2>
          <p>Start a sprint in the Backlog to see issues on the board.</p>
          <Button type="primary" onClick={() => navigate('/backlog')} style={{ marginTop: 16 }}>
            Go to Backlog
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragEnd={handleDragEnd}
        >
          <BoardContainer>
            {columns.map(col => (
              <DroppableColumn
                key={col.id}
                status={col.id}
                title={col.title}
                issues={getIssuesByStatus(col.statuses)}
                onIssueClick={handleIssueClick}
                onCardSelect={handleCardSelect}
                selectedIssues={selectedIssues}
                onContextMenu={handleContextMenu}
                wipLimit={col.wipLimit}
              />
            ))}
          </BoardContainer>
          <DragOverlay>
          </DragOverlay>
        </DndContext>
      )}

      <BoardSettings
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        columns={columns}
        onSave={handleSaveSettings}
      />

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={handleContextMenuClose}
        onEdit={handleContextEdit}
        onAssignToMe={handleContextAssignToMe}
        onLinkIssue={handleContextLinkIssue}
        onClone={handleContextClone}
        onDelete={handleContextDelete}
        onChangePriority={handleContextChangePriority}
        onChangeStatus={handleContextChangeStatus}
      />

      <BulkActionsToolbar
        selectedCount={selectedIssues.length}
        users={uniqueAssignees}
        onAssign={handleBulkAssign}
        onChangeStatus={handleBulkStatusChange}
        onDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
      />
    </Container>
  );
};
