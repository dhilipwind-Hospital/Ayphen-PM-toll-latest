import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Tag, Avatar, Button, Select, message, Dropdown, Space, Badge } from 'antd';
import { Plus, Filter, Star, Settings, MoreHorizontal, Users, Flag, Grid } from 'lucide-react';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, type DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { issuesApi, workflowsApi } from '../services/api';
import { colors } from '../theme/colors';

const Container = styled.div`
  padding: 24px;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const QuickFilters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterChip = styled(Button)<{ active?: boolean }>`
  border-radius: 16px;
  background: ${props => props.active ? colors.primary[500] : 'white'};
  color: ${props => props.active ? 'white' : colors.text.primary};
  border-color: ${props => props.active ? colors.primary[500] : colors.border.light};
  
  &:hover {
    background: ${props => props.active ? colors.primary[600] : colors.background.sidebar};
    color: ${props => props.active ? 'white' : colors.text.primary};
    border-color: ${props => props.active ? colors.primary[600] : colors.primary[300]};
  }
`;

const BoardContainer = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
`;

const Column = styled.div`
  min-width: 300px;
  background: ${colors.background.sidebar};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 280px);
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${colors.border.light};
`;

const ColumnTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IssueCount = styled.span`
  background: ${colors.neutral[300]};
  color: ${colors.text.secondary};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const WIPLimit = styled.span<{ exceeded?: boolean }>`
  color: ${props => props.exceeded ? colors.status.error.main : colors.text.secondary};
  font-size: 11px;
  margin-left: 4px;
`;

const IssuesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const IssueCard = styled(Card)`
  cursor: grab;
  border: 1px solid ${colors.border.light};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: ${colors.primary[300]};
  }

  &:active {
    cursor: grabbing;
  }

  .ant-card-body {
    padding: 12px;
  }
`;

const IssueKey = styled.span`
  font-size: 12px;
  color: ${colors.text.secondary};
  font-weight: 500;
`;

const IssueSummary = styled.div`
  font-size: 14px;
  color: ${colors.text.primary};
  margin: 8px 0;
  line-height: 1.4;
`;

const IssueFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const IssueMeta = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PriorityBadge = styled.div<{ priority: string }>`
  width: 20px;
  height: 20px;
  border-radius: 3px;
  background: ${props => {
    switch (props.priority) {
      case 'highest': return colors.priority.highest;
      case 'high': return colors.priority.high;
      case 'medium': return colors.priority.medium;
      case 'low': return colors.priority.low;
      case 'lowest': return colors.priority.lowest;
      default: return colors.neutral[400];
    }
  }};
`;

const TypeIcon = styled.div<{ type: string }>`
  width: 20px;
  height: 20px;
  border-radius: 3px;
  background: ${props => {
    switch (props.type) {
      case 'epic': return colors.issueType.epic;
      case 'story': return colors.issueType.story;
      case 'task': return colors.issueType.task;
      case 'bug': return colors.issueType.bug;
      case 'subtask': return colors.issueType.subtask;
      default: return colors.neutral[400];
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
`;

const Swimlane = styled.div`
  margin-bottom: 24px;
`;

const SwimlaneHeader = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: ${colors.text.primary};
  padding: 12px 16px;
  background: ${colors.background.sidebar};
  border-radius: 6px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface SortableCardProps {
  issue: any;
  onClick: () => void;
}

const SortableCard: React.FC<SortableCardProps> = ({ issue, onClick }) => {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <IssueCard
      ref={setNodeRef}
      style={style}
      size="small"
      {...attributes}
      {...listeners}
    >
      <div>
        <IssueKey>{issue.key}</IssueKey>
        <IssueSummary onClick={onClick}>
          {issue.summary}
        </IssueSummary>
        <IssueFooter>
          <IssueMeta>
            <TypeIcon type={issue.type}>
              {issue.type.charAt(0).toUpperCase()}
            </TypeIcon>
            <PriorityBadge priority={issue.priority} />
            {issue.storyPoints && (
              <Tag color="blue">{issue.storyPoints} pts</Tag>
            )}
          </IssueMeta>
          {issue.assignee && (
            <Avatar size="small" style={{ background: '#1890ff' }}>
              {issue.assignee.name.charAt(0)}
            </Avatar>
          )}
        </IssueFooter>
      </div>
    </IssueCard>
  );
};

interface DroppableColumnProps {
  status: string;
  children: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ status, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div ref={setNodeRef} style={{ minHeight: '200px', background: isOver ? '#f0f5ff' : 'transparent', borderRadius: '8px', padding: '8px', transition: 'all 0.2s' }}>
      {children}
    </div>
  );
};

export const EnhancedBoardView: React.FC = () => {
  const navigate = useNavigate();
  const { issues, currentBoard, updateIssue } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [groupBy, setGroupBy] = useState<string>('none');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [wipLimits, setWIPLimits] = useState<Record<string, number>>({});
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadDefaultWorkflow();
  }, []);

  const loadDefaultWorkflow = async () => {
    try {
      const response = await workflowsApi.getAll();
      const defaultWorkflow = response.data.find((w: any) => w.isDefault);
      if (defaultWorkflow) {
        setWorkflow(defaultWorkflow);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const quickFilters = [
    { id: 'my-issues', label: 'My Issues', icon: <Users size={14} /> },
    { id: 'high-priority', label: 'High Priority', icon: <Flag size={14} /> },
    { id: 'bugs', label: 'Bugs Only', icon: <span>🐛</span> },
    { id: 'unassigned', label: 'Unassigned', icon: <span>👤</span> },
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const filteredIssues = useMemo(() => {
    let filtered = issues;

    if (activeFilters.includes('my-issues')) {
      filtered = filtered.filter(i => i.assignee?.id === 'current-user');
    }
    if (activeFilters.includes('high-priority')) {
      filtered = filtered.filter(i => i.priority === 'high' || i.priority === 'highest');
    }
    if (activeFilters.includes('bugs')) {
      filtered = filtered.filter(i => i.type === 'bug');
    }
    if (activeFilters.includes('unassigned')) {
      filtered = filtered.filter(i => !i.assignee);
    }

    return filtered;
  }, [issues, activeFilters]);

  const groupedIssues = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Issues': filteredIssues };
    }

    return filteredIssues.reduce((acc, issue) => {
      let key = 'Unassigned';
      
      if (groupBy === 'assignee') {
        key = issue.assignee?.name || 'Unassigned';
      } else if (groupBy === 'priority') {
        key = issue.priority || 'No Priority';
      } else if (groupBy === 'epic') {
        key = issue.epicLink || 'No Epic';
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(issue);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredIssues, groupBy]);

  const columns = workflow?.statuses || [
    { id: 'todo', name: 'To Do', category: 'TODO' },
    { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS' },
    { id: 'in-review', name: 'In Review', category: 'IN_PROGRESS' },
    { id: 'done', name: 'Done', category: 'DONE' },
  ];

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const issueId = active.id as string;
    const newStatus = over.id as string;
    
    const issue = issues.find(i => i.id === issueId);
    if (!issue || issue.status === newStatus) return;
    
    try {
      await issuesApi.update(issueId, { status: newStatus as any });
      updateIssue(issueId, { status: newStatus as any });
      message.success('Issue moved successfully');
    } catch (error) {
      console.error('Failed to update issue:', error);
      message.error('Failed to move issue');
    }
  };

  const getIssuesByStatus = (statusId: string, swimlaneIssues: any[]) => {
    return swimlaneIssues.filter(issue => issue.status === statusId);
  };

  const activeIssue = activeId ? issues.find(i => i.id === activeId) : null;

  const boardSettingsMenu = {
    items: [
      { key: 'columns', label: 'Configure Columns' },
      { key: 'swimlanes', label: 'Configure Swimlanes' },
      { key: 'card-layout', label: 'Card Layout' },
      { key: 'wip-limits', label: 'WIP Limits' },
    ],
  };

  return (
    <Container>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Header>
          <Title>
            {currentBoard?.name || 'Ayphen Platform Board'}
            <Star size={20} style={{ cursor: 'pointer', color: '#faad14' }} />
          </Title>
          <Controls>
            <Select
              placeholder="Group by"
              style={{ width: 150 }}
              value={groupBy}
              onChange={setGroupBy}
              options={[
                { label: 'None', value: 'none' },
                { label: 'Assignee', value: 'assignee' },
                { label: 'Priority', value: 'priority' },
                { label: 'Epic', value: 'epic' },
              ]}
            />
            <Button icon={<Filter size={16} />}>Filters</Button>
            <Dropdown menu={boardSettingsMenu}>
              <Button icon={<Settings size={16} />}>Board settings</Button>
            </Dropdown>
            <Button icon={<MoreHorizontal size={16} />} />
          </Controls>
        </Header>

        <QuickFilters>
          {quickFilters.map(filter => (
            <FilterChip
              key={filter.id}
              size="small"
              active={activeFilters.includes(filter.id)}
              onClick={() => toggleFilter(filter.id)}
              icon={filter.icon}
            >
              {filter.label}
            </FilterChip>
          ))}
          {activeFilters.length > 0 && (
            <Button size="small" type="link" onClick={() => setActiveFilters([])}>
              Clear all
            </Button>
          )}
        </QuickFilters>

        {Object.entries(groupedIssues).map(([swimlaneName, swimlaneIssues]) => (
          <Swimlane key={swimlaneName}>
            {groupBy !== 'none' && (
              <SwimlaneHeader>
                <Grid size={16} />
                {swimlaneName}
                <Badge count={swimlaneIssues.length} style={{ backgroundColor: colors.primary[500] }} />
              </SwimlaneHeader>
            )}
            
            <BoardContainer>
              {columns.map((column: any) => {
                const columnIssues = getIssuesByStatus(column.id, swimlaneIssues);
                const wipLimit = wipLimits[column.id];
                const exceededWIP = wipLimit && columnIssues.length > wipLimit;
                
                return (
                  <Column key={column.id}>
                    <ColumnHeader>
                      <ColumnTitle>
                        {column.name}
                        <IssueCount>{columnIssues.length}</IssueCount>
                        {wipLimit && (
                          <WIPLimit exceeded={exceededWIP}>
                            / {wipLimit}
                          </WIPLimit>
                        )}
                      </ColumnTitle>
                      <Button type="text" size="small" icon={<Plus size={16} />} />
                    </ColumnHeader>
                    <DroppableColumn status={column.id}>
                      <SortableContext
                        items={columnIssues.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <IssuesContainer>
                          {columnIssues.map(issue => (
                            <SortableCard
                              key={issue.id}
                              issue={issue}
                              onClick={() => navigate(`/issue/${issue.key}`)}
                            />
                          ))}
                        </IssuesContainer>
                      </SortableContext>
                    </DroppableColumn>
                  </Column>
                );
              })}
            </BoardContainer>
          </Swimlane>
        ))}

        <DragOverlay>
          {activeIssue ? (
            <IssueCard size="small" style={{ cursor: 'grabbing', opacity: 0.8 }}>
              <div>
                <IssueKey>{activeIssue.key}</IssueKey>
                <IssueSummary>{activeIssue.summary}</IssueSummary>
                <IssueFooter>
                  <IssueMeta>
                    <TypeIcon type={activeIssue.type}>
                      {activeIssue.type.charAt(0).toUpperCase()}
                    </TypeIcon>
                    <PriorityBadge priority={activeIssue.priority} />
                    {activeIssue.storyPoints && (
                      <Tag color="blue">{activeIssue.storyPoints} pts</Tag>
                    )}
                  </IssueMeta>
                </IssueFooter>
              </div>
            </IssueCard>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Container>
  );
};
