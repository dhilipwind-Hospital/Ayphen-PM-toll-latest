import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Tag, Avatar, Badge, Tooltip, message, Dropdown } from 'antd';
import { Plus, MoreHorizontal, GripVertical, Bug, BookOpen, CheckSquare, Zap, X } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { sprintsApi, issuesApi } from '../services/api';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { StartSprintModal } from '../components/Sprint/StartSprintModal';
import { IssueDetailPanel } from '../components/IssueDetail/IssueDetailPanel';

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  height: calc(100vh - 64px); 
  overflow: hidden;
`;

const BacklogColumn = styled.div<{ isSplit?: boolean }>`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  border-right: ${props => props.isSplit ? `1px solid ${colors.border.light}` : 'none'};
  transition: width 0.3s;
  background: #f4f5f7;
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

const SortableIssueItem = ({ issue, onClick, isSelected }: { issue: any, onClick: () => void, isSelected?: boolean }) => {
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
            <span style={{ fontWeight: 500, color: colors.text.secondary, fontSize: 12, minWidth: 60 }}>{issue.key}</span>
            <span style={{ fontSize: 14, color: colors.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.summary}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Priority Tag - Simplified visual */}
          {issue.priority === 'high' ? <Badge color="red" /> : <Badge color="blue" />}

          {/* Sprint Points */}
          {issue.storyPoints && <Badge count={issue.storyPoints} style={{ backgroundColor: '#f0f0f0', color: '#666' }} />}

          {/* Assignee */}
          <Avatar src={issue.assignee?.avatar} size="small" style={{ backgroundColor: colors.primary[500], width: 24, height: 24, fontSize: 12 }}>
            {issue.assignee?.name?.[0]}
          </Avatar>
        </div>
      </IssueItemContainer>
    </div>
  );
};

const DroppableSprint = ({ sprintId, issues, selectedIssueId, onIssueClick }: { sprintId: string, issues: any[], selectedIssueId: string | null, onIssueClick: (key: string) => void }) => {
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
};

export const BacklogView: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, sprints, setSprints } = useStore();
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);

  // States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStartSprintModalOpen, setIsStartSprintModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  const loadData = async () => {
    try {
      if (!currentProject) return;
      setSprints(currentProject.id);
      const res = await issuesApi.getByProject(currentProject.id);
      setIssues(res.data);
    } catch (e) { message.error('Failed to load backlog'); }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id as string;
    const targetId = over.id as string;

    if (active.id === over.id) return;

    let newSprintId = null;
    if (targetId !== 'backlog') {
      const sprint = sprints.find(s => s.id === targetId);
      if (sprint) newSprintId = sprint.id;
      else {
        const targetIssue = issues.find(i => i.id === targetId);
        if (targetIssue) newSprintId = targetIssue.sprintId;
      }
    }

    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, sprintId: newSprintId } : i));
    await issuesApi.update(issueId, { sprintId: newSprintId });
  };

  const activeSprints = sprints.filter(s => s.status === 'active');
  const futureSprints = sprints.filter(s => s.status === 'future');
  const backlogIssues = issues.filter(i => !i.sprintId);

  return (
    <Container>
      <BacklogColumn isSplit={!!selectedIssueKey}>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <Header>
            <Title>Backlog</Title>
            <Controls>
              <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
                Create Issue
              </Button>
            </Controls>
          </Header>

          {/* Sprints */}
          {[...activeSprints, ...futureSprints].map(sprint => (
            <SprintCard key={sprint.id} title={
              <SprintHeader>
                <SprintInfo>
                  <SprintName>{sprint.name}</SprintName>
                  <SprintMeta>{sprint.status === 'active' ? 'Active • ' : ''}{sprint.goal || Math.floor(Math.random() * 5) + ' issues'}</SprintMeta>
                </SprintInfo>
                {sprint.status === 'future' && <Button size="small" onClick={() => { setSelectedSprint(sprint); setIsStartSprintModalOpen(true); }}>Start Sprint</Button>}
                {sprint.status === 'active' && <Button size="small" type="primary" ghost>Complete Sprint</Button>}
              </SprintHeader>
            }>
              <DroppableSprint
                sprintId={sprint.id}
                issues={issues.filter(i => i.sprintId === sprint.id)}
                selectedIssueId={selectedIssueKey}
                onIssueClick={(key) => setSelectedIssueKey(key)}
              />
            </SprintCard>
          ))}

          {/* Backlog */}
          <SprintCard title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 600 }}>Backlog ({backlogIssues.length} issues)</span>
            <Button size="small" onClick={() => { /* Create Sprint Logic */ }}>Create Sprint</Button>
          </div>}>
            <DroppableSprint
              sprintId="backlog"
              issues={backlogIssues}
              selectedIssueId={selectedIssueKey}
              onIssueClick={(key) => setSelectedIssueKey(key)}
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

    </Container>
  );
};
