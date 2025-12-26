import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Tag, Avatar, Badge, Tooltip, message, Dropdown, Modal, Empty, Spin } from 'antd';
import { Plus, MoreHorizontal, GripVertical, Bug, BookOpen, CheckSquare, Zap, X } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { sprintsApi, issuesApi, api } from '../services/api';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { StartSprintModal } from '../components/Sprint/StartSprintModal';
import { CreateSprintModal } from '../components/Sprint/CreateSprintModal';
import { CompleteSprintModal } from '../components/Sprint/CompleteSprintModal';
import { IssueDetailPanel } from '../components/IssueDetail/IssueDetailPanel';


// --- Styled Components ---

const Container = styled.div`
  display: flex;
  height: calc(100vh - 64px); 
  overflow: hidden;

  @media (max-width: 768px) {
    height: auto;
    overflow: visible;
    flex-direction: column;
  }
`;

const BacklogColumn = styled.div<{ isSplit?: boolean }>`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  border-right: ${props => props.isSplit ? `1px solid ${colors.border.light}` : 'none'};
  transition: width 0.3s;
  background: #f4f5f7;
  
  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const DetailColumn = styled.div`
  width: 60%; 
  background: white;
  border-left: 1px solid ${colors.border.light};
  overflow-y: hidden;
  box-shadow: -4px 0 16px rgba(0,0,0,0.05);
  z-index: 10;
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    width: 100%;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2000;
  }
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
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const SprintCard = styled(Card)`
  margin-bottom: 16px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  .ant-card-head {
    background: transparent;
    border-bottom: 1px solid ${colors.border.light};
    padding: 0 16px;
    min-height: 48px;
  }
  
  .ant-card-body {
    padding: 8px;
    background: ${colors.background.light};
  }
`;

const SprintHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const SprintInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const SprintName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const SprintMeta = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const IssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 40px;
`;

const IssueItemContainer = styled.div<{ isDragging?: boolean; isSelected?: boolean }>`
  padding: 10px 12px;
  background: ${props => props.isSelected ? '#e6f7ff' : 'white'};
  border-left: 3px solid ${props => props.isSelected ? '#1890ff' : 'transparent'};
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: ${props => props.isDragging ? 0.5 : 1};
  
  &:hover {
    background: ${props => props.isSelected ? '#e6f7ff' : '#fafafa'};
  }
`;

// --- Sortable Components ---

// --- Memoized Components ---

const SortableIssueItem = React.memo(({ issue, onClick, isSelected, workflowStatuses }: { issue: any, onClick: () => void, isSelected?: boolean, workflowStatuses: any[] }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id, data: { ...issue, type: 'issue' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: string) => {
    const matched = workflowStatuses.find(s => s.id === status);
    if (matched) {
      if (matched.category === 'DONE') return 'green';
      if (matched.category === 'IN_PROGRESS') return 'blue';
      return 'default';
    }
    if (status === 'done') return 'green';
    if (status === 'in-progress' || status === 'in-review') return 'blue';
    return 'default';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <IssueItemContainer
        isDragging={isDragging}
        isSelected={isSelected}
        onClick={onClick}
      >
        <div {...listeners} style={{ cursor: 'grab', color: colors.text.tertiary, display: 'flex', alignItems: 'center' }}>
          <GripVertical size={14} />
        </div>

        <Tooltip title={issue.type}>
          {issue.type === 'bug' && <Bug size={16} color={colors.status.high} />}
          {issue.type === 'story' && <BookOpen size={16} color={colors.status.medium} />}
          {issue.type === 'task' && <CheckSquare size={16} color={colors.primary[500]} />}
          {issue.type === 'epic' && <Zap size={16} color={colors.primary[700]} />}
        </Tooltip>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500, color: colors.text.secondary, fontSize: 11, minWidth: 45 }}>{issue.key}</span>
            <span style={{ fontSize: 13, color: colors.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.summary}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={getStatusColor(issue.status)} style={{ fontSize: '10px', lineHeight: '16px', borderRadius: '10px' }}>
            {issue.status?.toUpperCase()}
          </Tag>

          {/* Priority Tag - Simplified visual */}
          {issue.priority === 'high' || issue.priority === 'highest' ? <Badge color="red" /> : <Badge color="blue" />}

          {/* Sprint Points */}
          {issue.storyPoints && <Badge count={issue.storyPoints} style={{ backgroundColor: '#f0f0f0', color: '#666', boxShadow: 'none' }} />}

          {/* Assignee */}
          <Avatar src={issue.assignee?.avatar} size="small" style={{ backgroundColor: colors.primary[500], width: 22, height: 22, fontSize: 10 }}>
            {issue.assignee?.name?.[0]}
          </Avatar>
        </div>
      </IssueItemContainer>
    </div>
  );
}, (prev, next) => {
  return prev.issue.id === next.issue.id &&
    prev.isSelected === next.isSelected &&
    prev.issue.listPosition === next.issue.listPosition &&
    prev.workflowStatuses === next.workflowStatuses &&
    prev.issue.status === next.issue.status &&
    prev.issue.sprintId === next.issue.sprintId;
});

const DroppableSprint = React.memo(({ sprintId, issues, selectedIssueId, onIssueClick, workflowStatuses }: { sprintId: string, issues: any[], selectedIssueId: string | null, onIssueClick: (key: string) => void, workflowStatuses: any[] }) => {
  const { setNodeRef } = useDroppable({
    id: sprintId,
    data: { type: 'sprint', sprintId }
  });

  return (
    <div ref={setNodeRef}>
      <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <IssueList>
          {issues.map((issue) => (
            <SortableIssueItem
              key={issue.id}
              issue={issue}
              isSelected={selectedIssueId === issue.key}
              onClick={() => onIssueClick(issue.key)}
              workflowStatuses={workflowStatuses}
            />
          ))}
          {issues.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.text.tertiary, border: '1px dashed #e0e0e0', borderRadius: 4, background: 'white', margin: 8 }}>
              Plan a sprint by dragging issues here
            </div>
          )}
        </IssueList>
      </SortableContext>
    </div>
  );
});

export const BacklogView: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, isInitialized } = useStore();

  // Use LOCAL state for sprints to ensure re-rendering
  const [localSprints, setLocalSprints] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);
  const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);
  const [backlogLoading, setBacklogLoading] = useState(true);

  // States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStartSprintModalOpen, setIsStartSprintModalOpen] = useState(false);
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [isCompleteSprintModalOpen, setIsCompleteSprintModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load data when project changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentProject) {
        return;
      }

      setBacklogLoading(true);
      try {

        // Fetch sprints
        const userId = localStorage.getItem('userId') || undefined;
        const sprintRes = await sprintsApi.getAll(currentProject.id, userId);


        // Handle ALL possible response formats
        let sprintData: any[] = [];
        if (Array.isArray(sprintRes.data)) {
          sprintData = sprintRes.data;
        } else if (sprintRes.data && Array.isArray(sprintRes.data.sprints)) {
          sprintData = sprintRes.data.sprints;
        } else if (sprintRes.data && Array.isArray(sprintRes.data.data)) {
          sprintData = sprintRes.data.data;
        } else if (Array.isArray(sprintRes)) {
          // In case interceptor unwaps it
          sprintData = sprintRes as any;
        }


        setLocalSprints(sprintData);

        // Fetch issues
        const res = await issuesApi.getByProject(currentProject.id);
        const sortedIssues = res.data.sort((a: any, b: any) => (a.listPosition || 0) - (b.listPosition || 0));
        setIssues(sortedIssues);

        // Fetch workflow
        const wfId = currentProject.workflowId || 'workflow-1';
        const wfRes = await api.get(`/workflows/${wfId}`);
        setWorkflowStatuses(wfRes.data.statuses || []);

      } catch (e) {
        console.error('[BacklogView] Failed to load backlog:', e);
        message.error('Failed to load backlog');
      } finally {
        setBacklogLoading(false);
      }
    };

    fetchData();
  }, [currentProject]);

  // Function for refreshing data
  const loadData = async () => {
    if (!currentProject) return;
    try {

      const userId = localStorage.getItem('userId') || undefined;
      const sprintRes = await sprintsApi.getAll(currentProject.id, userId);
      let sprintData: any[] = [];
      if (Array.isArray(sprintRes.data)) sprintData = sprintRes.data;
      else if (sprintRes.data?.sprints) sprintData = sprintRes.data.sprints;


      setLocalSprints(sprintData);

      const res = await issuesApi.getByProject(currentProject.id);
      setIssues(res.data.sort((a: any, b: any) => (a.listPosition || 0) - (b.listPosition || 0)));
      message.success('Refreshed');
    } catch (e) {
      console.error('[BacklogView] Failed to refresh:', e);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination containers (sprint IDs or 'backlog')
    const activeIssue = issues.find(i => i.id === activeId);
    if (!activeIssue) return;

    let newSprintId = activeIssue.sprintId;
    const overIssue = issues.find(i => i.id === overId);

    // Determine target container
    // If overId is a container (sprint or 'backlog')
    if (overId === 'backlog') newSprintId = null;
    else if (localSprints.find(s => s.id === overId)) newSprintId = overId;
    else if (overIssue) newSprintId = overIssue.sprintId; // Dropped on an issue

    // Optimistic Update
    const oldIndex = issues.findIndex(i => i.id === activeId);
    const newIndex = issues.findIndex(i => i.id === overId);

    let newIssues = [...issues];

    // Update Sprint ID first
    if (activeIssue.sprintId !== newSprintId) {
      newIssues = newIssues.map(i => i.id === activeId ? { ...i, sprintId: newSprintId } : i);
    }

    // If reordering (moved to different position)
    if (activeId !== overId && overIssue) {
      newIssues = arrayMove(newIssues, oldIndex, newIndex);
    }

    // Calculate new position
    // Get all issues in the destination container (sorted by current displayed order in newIssues)
    const destIssues = newIssues.filter(i => (newSprintId ? i.sprintId === newSprintId : !i.sprintId));
    const movedIssueIndex = destIssues.findIndex(i => i.id === activeId);

    let newListPosition = 0;
    const prevIssue = destIssues[movedIssueIndex - 1];
    const nextIssue = destIssues[movedIssueIndex + 1];

    if (!prevIssue && !nextIssue) {
      newListPosition = 10000;
    } else if (!prevIssue) {
      newListPosition = (nextIssue.listPosition || 0) / 2;
    } else if (!nextIssue) {
      newListPosition = (prevIssue.listPosition || 0) + 10000;
    } else {
      newListPosition = ((prevIssue.listPosition || 0) + (nextIssue.listPosition || 0)) / 2;
    }

    // Update state with final position
    newIssues = newIssues.map(i => i.id === activeId ? { ...i, listPosition: newListPosition } : i);

    setIssues(newIssues);

    // Persist
    try {
      await issuesApi.update(activeId, { sprintId: newSprintId, listPosition: newListPosition });
    } catch (e) {
      message.error('Failed to move issue');
      loadData(); // Revert on error
    }
  };

  const activeSprints = localSprints.filter(s => s.status === 'active');
  const futureSprints = localSprints.filter(s => s.status === 'future');

  // Debug logging

  // Filter out epics - they are containers, not work items for sprints/backlog
  const backlogIssues = issues.filter(i => !i.sprintId && i.type !== 'epic');

  const handleCreateSprint = async () => {
    if (!currentProject) {
      message.warning('Please select a project first');
      return;
    }
    try {
      // Basic next name logic
      const nextNum = localSprints.length + 1;
      const name = `${currentProject.key} Sprint ${nextNum}`;

      // Optimistic update - add sprint immediately to UI
      const tempId = `temp-${Date.now()}`;
      const optimisticSprint = {
        id: tempId,
        name,
        projectId: currentProject.id,
        status: 'future',
        startDate: null,
        endDate: null,
        goal: '',
        createdAt: new Date().toISOString()
      };
      setLocalSprints(prev => [...prev, optimisticSprint]);

      const createRes = await sprintsApi.create({
        name,
        projectId: currentProject.id,
        status: 'future'
      });

      message.success('Sprint created successfully!');

      // Replace optimistic sprint with real data from server
      const createdSprint = createRes.data;
      setLocalSprints(prev => prev.map(s => s.id === tempId ? createdSprint : s));

    } catch (e: any) {
      console.error('Failed to create sprint:', e);
      // Remove optimistic sprint on error
      setLocalSprints(prev => prev.filter(s => !s.id.startsWith('temp-')));
      message.error(e?.response?.data?.message || 'Failed to create sprint');
    }
  };

  const handleCompleteSprint = (sprint: any) => {
    setSelectedSprint(sprint);
    setIsCompleteSprintModalOpen(true);
  };

  if (!currentProject || backlogLoading) {
    return (
      <Container>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh'
        }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <BacklogColumn isSplit={!!selectedIssueKey}>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <Header>
            <Title>Backlog</Title>
            <Controls>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Issue
              </Button>
            </Controls>
          </Header>

          {/* Sprints */}
          {[...activeSprints, ...futureSprints].length > 0 ? (
            [...activeSprints, ...futureSprints].map(sprint => (
              <SprintCard key={sprint.id} title={
                <SprintHeader>
                  <SprintInfo>
                    <SprintName>{sprint.name}</SprintName>
                    <SprintMeta>{sprint.status === 'active' ? 'Active • ' : ''}{sprint.goal || `${issues.filter(i => i.sprintId === sprint.id && i.type !== 'epic').length} issues`}</SprintMeta>
                  </SprintInfo>
                  {sprint.status === 'future' && <Button size="small" onClick={() => { setSelectedSprint(sprint); setIsStartSprintModalOpen(true); }}>Start Sprint</Button>}
                  {sprint.status === 'active' && <Button size="small" type="primary" ghost onClick={() => handleCompleteSprint(sprint)}>Complete Sprint</Button>}
                </SprintHeader>
              }>
                <DroppableSprint
                  sprintId={sprint.id}
                  issues={issues.filter(i => i.sprintId === sprint.id && i.type !== 'epic')}
                  selectedIssueId={selectedIssueKey}
                  onIssueClick={(key) => setSelectedIssueKey(key)}
                  workflowStatuses={workflowStatuses}
                />
              </SprintCard>
            ))
          ) : (
            <div style={{ padding: '32px', background: '#fff', borderRadius: 8, marginBottom: 16, border: `1px dashed ${colors.border.light}` }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: colors.text.secondary }}>
                    There are no active or future sprints.
                  </span>
                }
              >
                <Button type="primary" onClick={() => setIsCreateSprintModalOpen(true)}>Create Sprint</Button>
              </Empty>
            </div>
          )}

          {/* Backlog */}
          <SprintCard title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 600 }}>Backlog ({backlogIssues.length} issues)</span>
            <Tooltip title="Create a new sprint container">
              <Button size="small" type="primary" onClick={() => setIsCreateSprintModalOpen(true)}>+ Create Sprint</Button>
            </Tooltip>
          </div>}>
            <DroppableSprint
              sprintId="backlog"
              issues={backlogIssues}
              selectedIssueId={selectedIssueKey}
              onIssueClick={(key) => setSelectedIssueKey(key)}
              workflowStatuses={workflowStatuses}
            />
          </SprintCard>

          <DragOverlay />
        </DndContext>
      </BacklogColumn>

      {/* Split View Detail Panel */}
      {selectedIssueKey && (
        <DetailColumn>
          <div style={{ padding: '8px 16px', borderBottom: `1px solid ${colors.border.light}`, display: 'flex', justifyContent: 'flex-end', background: '#f9fafb' }}>
            <Button type="text" icon={<X size={16} />} onClick={() => setSelectedIssueKey(null)} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Embedd the detailed view - We wrap it to remove its own header if needed, but it has a sticky one */}
            <IssueDetailPanel issueKey={selectedIssueKey} />
          </div>
        </DetailColumn>
      )}

      {/* Modals */}
      <CreateIssueModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={loadData} />
      <StartSprintModal visible={isStartSprintModalOpen} onClose={() => setIsStartSprintModalOpen(false)} sprint={selectedSprint} onSuccess={loadData} />
      {currentProject && (
        <CreateSprintModal
          visible={isCreateSprintModalOpen}
          onClose={() => setIsCreateSprintModalOpen(false)}
          projectId={currentProject.id}
          projectKey={currentProject.key}
          existingSprintCount={localSprints.length}
          onSuccess={loadData}
        />
      )}
      <CompleteSprintModal
        visible={isCompleteSprintModalOpen}
        onClose={() => setIsCompleteSprintModalOpen(false)}
        sprint={selectedSprint}
        issues={issues}
        sprints={localSprints}
        onSuccess={loadData}
      />

    </Container>
  );
};
