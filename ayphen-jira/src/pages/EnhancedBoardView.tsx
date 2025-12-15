import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Tag, Avatar, Button, Select, message, Dropdown, Space, Badge, Empty, Spin, Tooltip } from 'antd';
import { Plus, Filter, Star, Settings, MoreHorizontal, Users, Flag, Grid, List, Zap, Bug, BookOpen, CheckSquare } from 'lucide-react';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, type DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { BoardSettingsModal } from '../components/Board/BoardSettingsModal';
import { issuesApi, workflowsApi, sprintsApi } from '../services/api';
import { colors } from '../theme/colors';

// --- Styled Components --- (Reused for consistency)
const Container = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const BoardGrid = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns}, 1fr);
  gap: 16px;
  height: 100%;
  overflow-x: auto;
  align-items: start;
`;

const Column = styled.div`
  background: ${colors.background.light};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  min-width: 280px;
`;

const ColumnHeader = styled.div`
  padding: 16px;
  font-weight: 600;
  color: ${colors.text.secondary};
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const IssueList = styled.div`
  padding: 8px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
`;

// --- Item Component ---
const BoardIssueCard = ({ issue, onClick }: { issue: any, onClick: () => void }) => {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        hoverable
        onClick={onClick}
        style={{ cursor: 'grab', borderRadius: 6, boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)' }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: colors.text.primary, lineHeight: 1.4 }}>{issue.summary}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Type Icon */}
            {issue.type === 'bug' && <Bug size={14} color={colors.status.high} />}
            {issue.type === 'story' && <BookOpen size={14} color={colors.status.medium} />}
            <span style={{ color: colors.text.secondary, fontSize: 12, fontWeight: 500 }}>{issue.key}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {issue.priority === 'high' && <Flag size={12} color="red" fill="red" />}
            <Avatar size={20} src={issue.assignee?.avatar} style={{ fontSize: 10, background: '#6366f1' }}>{issue.assignee?.name?.[0]}</Avatar>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- Column Component ---
const BoardColumn = ({ id, title, issues, onCardClick }: { id: string, title: string, issues: any[], onCardClick: (key: string) => void }) => {
  const { setNodeRef } = useDroppable({ id, data: { type: 'column', status: id } });

  return (
    <Column ref={setNodeRef}>
      <ColumnHeader>
        {title} <Badge count={issues.length} style={{ backgroundColor: '#e2e8f0', color: '#64748b' }} />
      </ColumnHeader>
      <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <IssueList>
          {issues.map(issue => (
            <BoardIssueCard key={issue.id} issue={issue} onClick={() => onCardClick(issue.key)} />
          ))}
        </IssueList>
      </SortableContext>
    </Column>
  );
};

// --- Main View ---
export const EnhancedBoardView: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, sprints, issues, fetchIssues, fetchSprints } = useStore();
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    try {
      if (!currentProject) return;

      // 1. Fetch Sprints (needed for Scrum)
      await fetchSprints(currentProject.id);
      // 2. Fetch Issues
      await fetchIssues(currentProject.id);

    } finally {
      setLoading(false);
    }
  };

  // Determine the Active Sprint (for Scrum)
  useEffect(() => {
    if (currentProject?.type === 'scrum' && sprints.length > 0) {
      const active = sprints.find(s => s.status === 'active');
      setActiveSprint(active || null);
    }
  }, [sprints, currentProject]);

  // --- Columns Logic ---
  const columns = useMemo(() => {
    return [
      { id: 'todo', title: 'To Do' },
      { id: 'in_progress', title: 'In Progress' },
      { id: 'done', title: 'Done' }
    ];
  }, []);

  // --- Filtering Logic ---
  const boardIssues = useMemo(() => {
    if (!currentProject) return [];
    let filtered = issues;

    if (currentProject.type === 'scrum') {
      // SCRUM: Show only active sprint issues
      if (activeSprint) {
        filtered = issues.filter(i => i.sprintId === activeSprint.id);
      } else {
        return []; // No active sprint = Empty Board
      }
    } else {
      // KANBAN: Show all except backlog (unless mapped)
      filtered = issues.filter(i => i.status !== 'backlog');
    }
    return filtered;
  }, [issues, currentProject, activeSprint]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id as string;
    const newStatus = over.id as string;

    // Check if over.id is a column
    const columnIds = columns.map(c => c.id);
    const isColumn = columnIds.includes(newStatus);

    const finalStatus = isColumn ? newStatus : (boardIssues.find(i => i.id === newStatus)?.status || newStatus);

    if (active.id !== over.id) {
      await issuesApi.update(issueId, { status: finalStatus });
      message.success('Status updated');
      loadData();
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><Spin size="large" /></div>;

  if (currentProject?.type === 'scrum' && !activeSprint) {
    return (
      <Container>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ textAlign: 'center' }}>
              <h3>No Active Sprint</h3>
              <p>You need to start a sprint in the Backlog to see issues here.</p>
              <Button type="primary" onClick={() => navigate('/project/backlog')}>Go to Backlog</Button>
            </div>
          }
        />
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>
          {currentProject?.type === 'scrum' ? `${activeSprint?.name}` : 'Kanban Board'}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<Filter size={16} />}>Filter</Button>
          <Button icon={<Settings size={16} />}>Settings</Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <BoardGrid columns={columns.length}>
          {columns.map(col => (
            <BoardColumn
              key={col.id}
              id={col.id}
              title={col.title}
              issues={boardIssues.filter(i => i.status === col.id)}
              onCardClick={(key) => navigate(`/issue/${key}`)}
            />
          ))}
        </BoardGrid>
        <DragOverlay />
      </DndContext>
    </Container>
  );
};
