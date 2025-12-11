import React, { useState, useEffect } from 'react';
import { Card, Select, Input, InputNumber, Button, Progress, Tag, message, Modal } from 'antd';
import { Users, Clock, Target, TrendingUp, GripVertical, Play } from 'lucide-react';
import styled from 'styled-components';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { sprintsApi, issuesApi } from '../services/api';
import { colors } from '../theme/colors';
import { SprintAutoPopulateButton } from '../components/AI/SprintAutoPopulateButton';

const Container = styled.div`
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
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
  margin: 0;
  color: ${colors.text.primary};
`;

const CapacityCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const CapacityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

const CapacityItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 12px;
  color: ${colors.text.secondary};
  font-weight: 600;
  text-transform: uppercase;
`;

const CommitmentCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const CommitmentBar = styled.div`
  margin: 16px 0;
`;

const DraggableListContainer = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  min-height: 200px;
  border: 1px dashed #e5e7eb;
`;

const IssueItem = styled.div<{ isDragging?: boolean }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${props => props.isDragging ? '0 10px 20px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)'};
  opacity: ${props => props.isDragging ? 0.5 : 1};
  cursor: grab;
  transition: all 0.2s;

  &:hover {
    border-color: ${colors.primary};
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }
`;

const IssueContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const IssueKey = styled.span`
  font-weight: 600;
  color: ${colors.text.secondary};
  min-width: 60px;
`;

const IssueSummary = styled.span`
  font-weight: 500;
  color: ${colors.text.primary};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IssueMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

interface SortableIssueItemProps {
  issue: any;
  onEstimate: (id: string, points: number) => void;
}

const SortableIssueItem: React.FC<SortableIssueItemProps> = ({ issue, onEstimate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id, data: { issue } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <IssueItem ref={setNodeRef} style={style} isDragging={isDragging} {...attributes} {...listeners}>
      <IssueContent>
        <GripVertical size={16} color="#9ca3af" />
        <IssueKey>{issue.key}</IssueKey>
        <Tag color={issue.type === 'bug' ? 'red' : 'blue'}>{issue.type}</Tag>
        <IssueSummary>{issue.summary}</IssueSummary>
      </IssueContent>
      <IssueMeta>
        <div onPointerDown={(e) => e.stopPropagation()}>
          <InputNumber
            size="small"
            min={0}
            max={100}
            value={issue.storyPoints}
            onChange={(val) => onEstimate(issue.id, val || 0)}
            placeholder="Pts"
            style={{ width: 60 }}
          />
        </div>
        <Avatar issue={issue} />
      </IssueMeta>
    </IssueItem>
  );
};

const Avatar = ({ issue }: { issue: any }) => {
  if (!issue.assignee) return <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e5e7eb' }} />;
  return (
    <div style={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: '#EC4899',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 'bold'
    }}>
      {issue.assignee.name[0]}
    </div>
  );
};

export const SprintPlanningView: React.FC = () => {
  const { sprints, issues, currentProject, updateIssue } = useStore();
  const navigate = useNavigate();
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [teamSize, setTeamSize] = useState(4);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [sprintDays, setSprintDays] = useState(10);
  const [sprintGoal, setSprintGoal] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const futureSprints = sprints.filter(s =>
    s.status === 'future' && (currentProject ? s.projectId === currentProject.id : true)
  );

  const selectedSprint = sprints.find(s => s.id === selectedSprintId);

  const sprintIssues = issues.filter(i => i.sprintId === selectedSprintId);
  const backlogIssues = issues.filter(i =>
    !i.sprintId && (currentProject ? i.projectId === currentProject.id : true)
  );

  const totalCapacity = teamSize * hoursPerDay * sprintDays;
  const committedPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const estimatedHours = committedPoints * 2; // Rough estimate: 1 point = 2 hours
  const commitmentPercentage = totalCapacity > 0 ? (estimatedHours / totalCapacity) * 100 : 0;

  useEffect(() => {
    if (futureSprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(futureSprints[0].id);
    }
  }, [futureSprints, selectedSprintId]);

  useEffect(() => {
    if (selectedSprint) {
      setSprintGoal(selectedSprint.goal || '');
      if (selectedSprint.startDate && selectedSprint.endDate) {
        const days = Math.ceil(
          (new Date(selectedSprint.endDate).getTime() - new Date(selectedSprint.startDate).getTime())
          / (1000 * 60 * 60 * 24)
        );
        setSprintDays(days);
      }
    }
  }, [selectedSprint]);

  const handleEstimateIssue = async (issueId: string, points: number) => {
    try {
      await issuesApi.update(issueId, { storyPoints: points });
      updateIssue(issueId, { storyPoints: points });
      message.success('Story points updated');
    } catch (error) {
      message.error('Failed to update story points');
    }
  };

  const handleSaveGoal = async () => {
    if (!selectedSprintId) return;
    try {
      await sprintsApi.update(selectedSprintId, { goal: sprintGoal });
      message.success('Sprint goal updated');
    } catch (error) {
      message.error('Failed to update sprint goal');
    }
  };

  const handleStartSprint = async () => {
    if (!selectedSprintId) return;

    Modal.confirm({
      title: 'Start Sprint',
      content: `Are you sure you want to start ${selectedSprint?.name}? This will move the sprint to the active board.`,
      okText: 'Start Sprint',
      okType: 'primary',
      onOk: async () => {
        try {
          await sprintsApi.update(selectedSprintId, { status: 'active', startDate: new Date().toISOString() });
          message.success('Sprint started successfully!');
          navigate('/board');
          window.location.reload();
        } catch (error) {
          message.error('Failed to start sprint');
        }
      },
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const issueId = active.id as string;
    const overId = over.id as string;

    // Determine target container
    let targetSprintId: string | null = null;

    // If dropped on "sprint-container" or an item in the sprint list
    if (overId === 'sprint-container' || sprintIssues.find(i => i.id === overId)) {
      targetSprintId = selectedSprintId;
    }
    // If dropped on "backlog-container" or an item in the backlog list
    else if (overId === 'backlog-container' || backlogIssues.find(i => i.id === overId)) {
      targetSprintId = null;
    } else {
      return; // Dropped somewhere else
    }

    // Only update if the sprintId actually changed
    const issue = issues.find(i => i.id === issueId);
    if (issue && issue.sprintId !== (targetSprintId || undefined)) {
      try {
        // Optimistic update
        updateIssue(issueId, { sprintId: targetSprintId || undefined });

        // API call
        if (targetSprintId) {
          await issuesApi.update(issueId, { sprintId: targetSprintId });
        } else {
          await issuesApi.update(issueId, { sprintId: null as any }); // Hack to clear sprintId
        }
        message.success(targetSprintId ? 'Moved to Sprint' : 'Moved to Backlog');
      } catch (error) {
        message.error('Failed to move issue');
        // Revert would go here in a real app
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const activeIssue = activeDragId ? issues.find(i => i.id === activeDragId) : null;

  return (
    <Container>
      <Header>
        <Title>Sprint Planning</Title>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {selectedSprint && (
            <>
              <SprintAutoPopulateButton
                sprintId={selectedSprint.id}
                sprintName={selectedSprint.name}
                onPopulated={() => {
                  message.success('Sprint populated successfully');
                  window.location.reload();
                }}
              />
              <Button
                type="primary"
                icon={<Play size={16} />}
                onClick={handleStartSprint}
                style={{ background: '#10B981', borderColor: '#10B981' }}
              >
                Start Sprint
              </Button>
            </>
          )}
          <Select
            style={{ width: 250 }}
            placeholder="Select Sprint"
            value={selectedSprintId}
            onChange={setSelectedSprintId}
          >
            {futureSprints.map(sprint => (
              <Select.Option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Header>

      {selectedSprint ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          {/* Team Capacity */}
          <CapacityCard title={<><Users size={16} /> Team Capacity Calculator</>}>
            <CapacityGrid>
              <CapacityItem>
                <Label>Team Size</Label>
                <InputNumber min={1} max={20} value={teamSize} onChange={(v) => setTeamSize(v || 1)} style={{ width: '100%' }} />
              </CapacityItem>
              <CapacityItem>
                <Label>Hours per Day</Label>
                <InputNumber min={1} max={12} value={hoursPerDay} onChange={(v) => setHoursPerDay(v || 1)} style={{ width: '100%' }} />
              </CapacityItem>
              <CapacityItem>
                <Label>Sprint Days</Label>
                <InputNumber min={1} max={30} value={sprintDays} onChange={(v) => setSprintDays(v || 1)} style={{ width: '100%' }} />
              </CapacityItem>
              <CapacityItem>
                <Label>Total Capacity</Label>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                  <Clock size={20} style={{ marginRight: 8 }} />
                  {totalCapacity}h
                </div>
              </CapacityItem>
            </CapacityGrid>
          </CapacityCard>

          {/* Sprint Goal */}
          <CapacityCard title={<><Target size={16} /> Sprint Goal</>}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Input.TextArea
                rows={2}
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="What is the goal of this sprint?"
                style={{ flex: 1 }}
              />
              <Button type="primary" onClick={handleSaveGoal} style={{ height: 'auto' }}>Save</Button>
            </div>
          </CapacityCard>

          {/* Commitment Tracker */}
          <CommitmentCard title={<><TrendingUp size={16} /> Commitment Tracker</>}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Story Points: {committedPoints}</span>
              <span style={{ color: colors.text.secondary }}>Estimated: {estimatedHours}h / {totalCapacity}h</span>
            </div>
            <CommitmentBar>
              <Progress
                percent={Math.min(commitmentPercentage, 100)}
                status={commitmentPercentage > 100 ? 'exception' : commitmentPercentage > 80 ? 'normal' : 'active'}
                strokeColor={commitmentPercentage > 100 ? '#ff4d4f' : commitmentPercentage > 80 ? '#faad14' : '#52c41a'}
                showInfo={false}
              />
            </CommitmentBar>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </CommitmentCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Sprint Issues */}
            <Card title={`Sprint Issues (${sprintIssues.length})`} style={{ height: '100%' }}>
              <SortableContext items={sprintIssues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <DraggableListContainer id="sprint-container">
                  {sprintIssues.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>
                      Drag issues here from backlog
                    </div>
                  )}
                  {sprintIssues.map(issue => (
                    <SortableIssueItem key={issue.id} issue={issue} onEstimate={handleEstimateIssue} />
                  ))}
                </DraggableListContainer>
              </SortableContext>
            </Card>

            {/* Backlog Issues */}
            <Card title={`Backlog (${backlogIssues.length})`} style={{ height: '100%' }}>
              <SortableContext items={backlogIssues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <DraggableListContainer id="backlog-container">
                  {backlogIssues.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>
                      No issues in backlog
                    </div>
                  )}
                  {backlogIssues.map(issue => (
                    <SortableIssueItem key={issue.id} issue={issue} onEstimate={handleEstimateIssue} />
                  ))}
                </DraggableListContainer>
              </SortableContext>
            </Card>
          </div>

          <DragOverlay>
            {activeIssue ? (
              <IssueItem isDragging>
                <IssueContent>
                  <GripVertical size={16} color="#9ca3af" />
                  <IssueKey>{activeIssue.key}</IssueKey>
                  <Tag color={activeIssue.type === 'bug' ? 'red' : 'blue'}>{activeIssue.type}</Tag>
                  <IssueSummary>{activeIssue.summary}</IssueSummary>
                </IssueContent>
              </IssueItem>
            ) : null}
          </DragOverlay>

        </DndContext>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: colors.text.secondary }}>
            <p>No future sprints available.</p>
            <p>Create a sprint to start planning.</p>
          </div>
        </Card>
      )}
    </Container>
  );
};
