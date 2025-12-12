import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Tag, Avatar, Button, Select, message, Dropdown, Space, Badge } from 'antd';
import { Plus, Filter, Star, Settings, MoreHorizontal, Users, Flag, Grid, List } from 'lucide-react';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, type DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { BoardSettingsModal } from '../components/Board/BoardSettingsModal';
import { issuesApi, workflowsApi, sprintsApi } from '../services/api';
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
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  border: 1px solid ${colors.border.light};
`;

const ProjectBadge = styled.div`
  width: 40px;
  height: 40px;
  background: #EC4899;
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  margin-right: 12px;
`;

const ProjectInfo = styled.div`
  display: flex;
  align-items: center;
  margin-right: 24px;
`;

const ProjectDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProjectName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${colors.text.primary};
`;

const ProjectType = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const ViewToggle = styled.div`
  display: flex;
  background: white;
  border: 1px solid ${colors.border.light};
  border-radius: 6px;
  padding: 2px;
  margin-left: 12px;
`;

const ViewButton = styled.button<{ active?: boolean }>`
  border: none;
  background: ${props => props.active ? '#EC4899' : 'transparent'};
  color: ${props => props.active ? 'white' : colors.text.secondary};
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#DB2777' : colors.background.sidebar};
    color: ${props => props.active ? 'white' : colors.text.primary};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const StyledSelect = styled(Select)`
  min-width: 140px;
  .ant-select-selector {
    border-radius: 6px !important;
  }
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
  min-width: 280px;
  max-width: 320px;
  flex: 1;
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
  min-height: 100px;
  max-height: 140px;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: ${colors.primary[300]};
  }

  &:active {
    cursor: grabbing;
  }

  .ant-card-body {
    padding: 12px;
    height: 100%;
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
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 2.8em;
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

// List View Styled Components
const ListView = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ListRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 1px solid ${colors.border.light};
  border-radius: 6px;
  gap: 16px;
  cursor: pointer;
  
  &:hover {
    background: ${colors.background.hover};
    border-color: ${colors.primary[300]};
  }
`;

const ListKey = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text.secondary};
  min-width: 80px;
`;

const ListSummary = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${colors.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ListStatus = styled.span<{ status: string }>`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: ${props => {
    switch (props.status) {
      case 'todo': return colors.status.todo;
      case 'in-progress': return colors.status.inProgress;
      case 'in-review': return colors.primary[400];
      case 'done': return colors.status.done;
      default: return colors.neutral[200];
    }
  }};
  color: white;
  font-weight: 500;
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
        
        {/* Render Labels */}
        {issue.labels && issue.labels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {issue.labels.map((label: string) => (
              <Tag key={label} style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>
                {label}
              </Tag>
            ))}
          </div>
        )}

        <IssueFooter>
          <IssueMeta>
            <TypeIcon type={issue.type}>
              {issue.type.charAt(0).toUpperCase()}
            </TypeIcon>
            <PriorityBadge priority={issue.priority} />
            {issue.storyPoints && (
              <span style={{ 
                background: '#EC4899', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                fontWeight: 600 
              }}>
                {issue.storyPoints} pts
              </span>
            )}
          </IssueMeta>
          {issue.assignee && (
            <Tooltip title={issue.assignee.name || 'Unknown'}>
              <Avatar size="small" style={{ background: '#EC4899', cursor: 'pointer' }}>
                {issue.assignee.name ? issue.assignee.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            </Tooltip>
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
    <div ref={setNodeRef} style={{ minHeight: '200px', background: isOver ? '#FCE7F3' : 'transparent', borderRadius: '8px', padding: '8px', transition: 'all 0.2s' }}>
      {children}
    </div>
  );
};

export const EnhancedBoardView: React.FC = () => {
  const navigate = useNavigate();
  const { issues, currentBoard, updateIssue, currentProject, sprints, setIssues, setSprints, currentUser } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [groupBy, setGroupBy] = useState<string>('none');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string[]>([]);
  const [wipLimits, setWIPLimits] = useState<Record<string, number>>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('columns');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  const loadData = async () => {
    if (!currentProject) return;

    try {
      const userId = currentUser?.id || localStorage.getItem('userId');
      const [issuesResponse, sprintsResponse] = await Promise.all([
        issuesApi.getAll({ projectId: currentProject.id, userId: userId || undefined }),
        sprintsApi.getAll(currentProject.id, userId || undefined)
      ]);
      setIssues(issuesResponse.data);
      setSprints(sprintsResponse.data);
    } catch (error) {
      console.error('Failed to load board data:', error);
    }
  };

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
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Filter by Project first
    if (currentProject) {
      filtered = filtered.filter(i => i.projectId === currentProject.id);
    }

    // Scrum Logic: Only show issues in active sprints
    if (currentProject?.type === 'scrum') {
      // Get ALL active sprints for this project
      const activeSprintIds = sprints
        .filter(s => s.status === 'active' && s.projectId === currentProject.id)
        .map(s => s.id);
      
      if (activeSprintIds.length > 0) {
        // Show issues from ANY active sprint
        filtered = filtered.filter(i => i.sprintId && activeSprintIds.includes(i.sprintId));
      } else {
        // If no active sprint, show nothing or empty state (technically board is empty)
        filtered = [];
      }
    } else {
      // Kanban Logic: Filter out 'backlog' status if needed, or keep all
      // Typically Kanban boards show everything except maybe backlog if it's a separate view
      // For now, let's exclude 'backlog' status from the main board to match Jira behavior
      filtered = filtered.filter(i => i.status !== 'backlog');
    }

    // Apply Dropdown Filters
    if (filterPriority.length > 0) {
      filtered = filtered.filter(i => filterPriority.includes(i.priority));
    }
    if (filterType.length > 0) {
      filtered = filtered.filter(i => filterType.includes(i.type));
    }
    // Assignee filter can be added similarly if we had a list of users


    if (activeFilters.includes('my-issues')) {
      filtered = filtered.filter(i => i.assignee?.id === currentUser.id);
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
  }, [issues, activeFilters, currentProject, sprints, filterPriority, filterType]);

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
    return swimlaneIssues.filter(issue => {
      // Map 'backlog' status to 'todo' column for board display
      // This ensures issues in active sprints appear on the board
      const issueStatus = issue.status === 'backlog' ? 'todo' : issue.status;
      return issueStatus === statusId;
    });
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
          <ProjectInfo>
            <ProjectBadge>
              {currentProject?.key?.substring(0, 3) || 'PRJ'}
            </ProjectBadge>
            <ProjectDetails>
              <ProjectName>{currentProject?.name || 'Project Board'}</ProjectName>
              <ProjectType>{currentProject?.type === 'scrum' ? 'Scrum Project' : 'Kanban Project'}</ProjectType>
            </ProjectDetails>
          </ProjectInfo>

          <FilterGroup>
            <StyledSelect
              placeholder="All Priority"
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              value={filterPriority}
              onChange={setFilterPriority}
            >
              <Select.Option value="highest">Highest</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="lowest">Lowest</Select.Option>
            </StyledSelect>

            <StyledSelect
              placeholder="All Types"
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              value={filterType}
              onChange={setFilterType}
            >
              <Select.Option value="epic">Epic</Select.Option>
              <Select.Option value="story">Story</Select.Option>
              <Select.Option value="task">Task</Select.Option>
              <Select.Option value="bug">Bug</Select.Option>
            </StyledSelect>

            <StyledSelect
              placeholder="All Assignees"
              mode="multiple"
              allowClear
              maxTagCount="responsive"
            >
              {/* Assignees will be populated dynamically */}
            </StyledSelect>

            <ViewToggle>
              <ViewButton active={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
                <Grid size={18} />
              </ViewButton>
              <ViewButton active={viewMode === 'list'} onClick={() => setViewMode('list')}>
                <List size={18} />
              </ViewButton>
            </ViewToggle>
          </FilterGroup>
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

        {viewMode === 'list' ? (
          <ListView>
            {filteredIssues.map(issue => (
              <ListRow key={issue.id} onClick={() => navigate(`/issue/${issue.key}`)}>
                <TypeIcon type={issue.type}>
                  {issue.type.charAt(0).toUpperCase()}
                </TypeIcon>
                <ListKey>{issue.key}</ListKey>
                <ListSummary title={issue.summary}>{issue.summary}</ListSummary>
                <PriorityBadge priority={issue.priority} />
                <ListStatus status={issue.status}>
                  {issue.status?.replace('-', ' ').toUpperCase() || 'TODO'}
                </ListStatus>
              </ListRow>
            ))}
          </ListView>
        ) : (
          Object.entries(groupedIssues).map(([swimlaneName, swimlaneIssues]) => (
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
        ))
        )}

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
                      <span style={{ 
                        background: '#EC4899', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 600 
                      }}>
                        {activeIssue.storyPoints} pts
                      </span>
                    )}
                  </IssueMeta>
                </IssueFooter>
              </div>
            </IssueCard>
          ) : null}
        </DragOverlay>
      </DndContext>

      <BoardSettingsModal 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />
    </Container>
  );
};
