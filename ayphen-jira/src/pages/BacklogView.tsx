import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Tag, Avatar, Input, Select, Modal, Form, DatePicker, message, Badge, Drawer, Dropdown, Popconfirm } from 'antd';
import { Plus, MoreHorizontal, GripVertical, Filter, X, Trash2 } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { sprintsApi, issuesApi } from '../services/api';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { StartSprintModal } from '../components/Sprint/StartSprintModal';
import { CompleteSprintModal } from '../components/Sprint/CompleteSprintModal';

const Container = styled.div`
  padding: 24px;
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

const FilterButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActiveFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const SprintCard = styled(Card)`
  margin-bottom: 16px;
  border: 2px solid ${colors.border.light};

  .ant-card-head {
    background: ${colors.background.sidebar};
    border-bottom: 1px solid ${colors.border.light};
  }
`;

const SprintHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SprintInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SprintName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const SprintMeta = styled.div`
  font-size: 13px;
  color: ${colors.text.secondary};
`;

const IssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const IssueItem = styled.div<{ isDragging?: boolean }>`
  padding: 12px;
  background: ${colors.background.paper};
  border: 1px solid ${colors.border.light};
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  transition: all 0.2s;
  opacity: ${props => props.isDragging ? 0.5 : 1};

  &:hover {
    border-color: ${colors.primary[400]};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const IssueKey = styled.span`
  font-size: 13px;
  color: ${colors.text.secondary};
  font-weight: 500;
  min-width: 80px;
`;

const IssueSummary = styled.div`
  flex: 1;
  font-size: 14px;
  color: ${colors.text.primary};
`;

const BacklogSection = styled.div`
  margin-top: 24px;
`;

const SectionTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 16px;
  padding: 12px;
  background: ${colors.background.sidebar};
  border-radius: 4px;
`;

const DropZone = styled.div<{ isOver?: boolean }>`
  min-height: 100px;
  padding: 16px;
  border: 2px dashed ${props => props.isOver ? colors.primary[500] : colors.border.light};
  border-radius: 8px;
  background: ${props => props.isOver ? colors.primary[50] : 'transparent'};
  transition: all 0.2s;
`;

interface SortableIssueProps {
  issue: any;
  onIssueClick: (issue: any) => void;
  onDelete: (issueId: string) => void;
}

const SortableIssue: React.FC<SortableIssueProps> = ({ issue, onIssueClick, onDelete }) => {
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

  return (
    <IssueItem
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} style={{ color: colors.text.secondary }} />
      <IssueKey>{issue.key}</IssueKey>
      <IssueSummary onClick={() => onIssueClick(issue)}>{issue.summary}</IssueSummary>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Popconfirm
          title="Delete Issue"
          description="Are you sure you want to delete this issue?"
          onConfirm={(e) => {
            e?.stopPropagation();
            onDelete(issue.id);
          }}
          onCancel={(e) => e?.stopPropagation()}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            size="small"
            icon={<Trash2 size={14} />}
            danger
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
        <Tag color={
          issue.priority === 'highest' ? 'red' :
            issue.priority === 'high' ? 'orange' :
              issue.priority === 'medium' ? 'blue' :
                'green'
        }>
          {issue.priority}
        </Tag>
        {issue.storyPoints && (
          <Tag color="blue">{issue.storyPoints} pts</Tag>
        )}
        {issue.assignee && (
          <Avatar size="small" style={{ background: colors.primary[500] }}>
            {issue.assignee.name.charAt(0)}
          </Avatar>
        )}
      </div>
    </IssueItem>
  );
};

interface DroppableSprintProps {
  sprintId: string;
  children: React.ReactNode;
}

const DroppableSprint: React.FC<DroppableSprintProps> = ({ sprintId, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: sprintId,
  });

  return (
    <div ref={setNodeRef}>
      <DropZone isOver={isOver}>
        {children}
      </DropZone>
    </div>
  );
};

export const BacklogView: React.FC = () => {
  const navigate = useNavigate();
  const { sprints, issues, setSprints, setIssues, updateIssue, currentProject, currentUser } = useStore();
  const [createSprintModalVisible, setCreateSprintModalVisible] = useState(false);
  const [createIssueModalVisible, setCreateIssueModalVisible] = useState(false);
  const [startSprintModalVisible, setStartSprintModalVisible] = useState(false);
  const [completeSprintModalVisible, setCompleteSprintModalVisible] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sprintForm] = Form.useForm();
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    assignee: [] as string[],
    type: [] as string[],
    priority: [] as string[],
    status: [] as string[],
    specialFilter: 'all',
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.assignee.length > 0) count++;
    if (filters.type.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.specialFilter !== 'all') count++;
    return count;
  }, [filters]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load issues and sprints from API
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
      console.error('Failed to load backlog data:', error);
    }
  };

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject, currentUser]);

  const getSprintIssues = (sprintId: string) => {
    const projectIssues = currentProject
      ? issues.filter(issue => issue.projectId === currentProject.id)
      : issues;
    return projectIssues.filter(issue => issue.sprintId === sprintId);
  };

  const backlogIssues = useMemo(() => {
    let result = currentProject
      ? issues.filter(issue =>
        issue.projectId === currentProject.id &&
        !issue.sprintId
      )
      : issues.filter(issue => !issue.sprintId);

    // Apply special filter
    if (filters.specialFilter === 'orphaned') {
      result = result.filter(i => 
        i.type !== 'epic' && 
        !i.epicLink && 
        (i.type !== 'subtask' || !i.parentId)
      );
    } else if (filters.specialFilter === 'with-epic') {
      result = result.filter(i => i.epicLink);
    } else if (filters.specialFilter === 'no-assignee') {
      result = result.filter(i => !i.assignee);
    }

    return result;
  }, [issues, currentProject, filters.specialFilter]);

  const handleCreateSprint = async (values: any) => {
    if (loading) return;
    
    // Check for duplicate sprint names (case-insensitive, trimmed)
    const trimmedName = values.name?.trim();
    if (!trimmedName) {
      message.error('Sprint name cannot be empty');
      return;
    }
    
    const duplicate = sprints.find(s => 
      s.name.trim().toLowerCase() === trimmedName.toLowerCase() && 
      s.projectId === currentProject?.id
    );
    
    if (duplicate) {
      message.error(`A sprint named "${duplicate.name}" already exists in this project.`);
      return;
    }
    
    setLoading(true);
    try {
      const sprintData: any = {
        name: trimmedName,
        goal: values.goal || '',
        status: 'future',
        projectId: currentProject?.id || 'default-project',
      };

      // Only add dates if they exist
      if (values.dates?.[0]) {
        sprintData.startDate = values.dates[0].toISOString();
      }
      if (values.dates?.[1]) {
        sprintData.endDate = values.dates[1].toISOString();
      }

      const response = await sprintsApi.create(sprintData);
      setSprints([...sprints, response.data]);
      message.success('Sprint created successfully');
      setCreateSprintModalVisible(false);
      sprintForm.resetFields();
    } catch (error) {
      console.error('Failed to create sprint:', error);
      message.error('Failed to create sprint');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    try {
      await sprintsApi.delete(sprintId);
      setSprints(sprints.filter(s => s.id !== sprintId));
      message.success('Sprint deleted successfully');
    } catch (error) {
      message.error('Failed to delete sprint');
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    try {
      await issuesApi.delete(issueId);
      setIssues(issues.filter(i => i.id !== issueId));
      message.success('Issue deleted successfully');
    } catch (error) {
      message.error('Failed to delete issue');
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIssue = issues.find(i => i.id === active.id);
    if (!activeIssue) return;

    // Determine target sprint ID from the droppable container
    const targetSprintId = over.id === 'backlog' ? undefined : over.id as string;

    // Only update if the sprint changed
    if (activeIssue.sprintId !== targetSprintId) {
      try {
        if (targetSprintId) {
          const targetSprint = sprints.find(s => s.id === targetSprintId);
          if (targetSprint?.status === 'active') {
            message.warning('Scope change: Issue added to active sprint');
          }
        }
        await issuesApi.update(activeIssue.id, { sprintId: targetSprintId });
        updateIssue(activeIssue.id, { sprintId: targetSprintId });
        message.success(`Issue moved to ${targetSprintId ? 'sprint' : 'backlog'}`);
      } catch (error) {
        message.error('Failed to move issue');
      }
    }
  };

  const handleIssueClick = (issue: any) => {
    // Navigate to issue detail
    navigate(`/issue/${issue.key}`);
  };

  const activeIssue = activeId ? issues.find(i => i.id === activeId) : null;

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
          <p>Please select a project from the dropdown in the header to view the backlog.</p>
          <Button type="primary" onClick={() => navigate('/projects')}>
            Go to Projects
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Header>
          <Title>Backlog - {currentProject.name}</Title>
          <Controls>
            <Badge count={activeFilterCount} offset={[10, 0]}>
              <FilterButton icon={<Filter size={16} />} onClick={() => setFilterDrawerVisible(true)}>
                Filters
              </FilterButton>
            </Badge>
            <Select 
              value={filters.specialFilter}
              style={{ width: 150 }}
              onChange={(value) => setFilters({ ...filters, specialFilter: value })}
              options={[
                { value: 'all', label: 'All Issues' },
                { value: 'orphaned', label: '⚠️ Orphaned' },
                { value: 'with-epic', label: 'With Epic' },
                { value: 'no-assignee', label: 'Unassigned' },
              ]}
            />
            <Button icon={<Plus size={16} />} onClick={() => setCreateIssueModalVisible(true)}>
              Create Issue
            </Button>
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateSprintModalVisible(true)}>
              Create Sprint
            </Button>
          </Controls>
        </Header>

        {activeFilterCount > 0 && (
          <ActiveFilters>
            {filters.search && (
              <Tag closable onClose={() => setFilters({ ...filters, search: '' })}>
                Search: {filters.search}
              </Tag>
            )}
            {filters.assignee.map(a => (
              <Tag key={a} closable onClose={() => setFilters({ ...filters, assignee: filters.assignee.filter(x => x !== a) })}>
                Assignee: {a}
              </Tag>
            ))}
            {filters.type.map(t => (
              <Tag key={t} closable onClose={() => setFilters({ ...filters, type: filters.type.filter(x => x !== t) })}>
                Type: {t}
              </Tag>
            ))}
            {filters.priority.map(p => (
              <Tag key={p} closable onClose={() => setFilters({ ...filters, priority: filters.priority.filter(x => x !== p) })}>
                Priority: {p}
              </Tag>
            ))}
            <Button type="link" size="small" onClick={() => setFilters({ search: '', assignee: [], type: [], priority: [], status: [], specialFilter: 'all' })}>
              Clear all
            </Button>
          </ActiveFilters>
        )}

        {[...sprints].sort((a, b) => { const statusOrder = { active: 0, future: 1, closed: 2 }; return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99); }).map(sprint => {
          const sprintIssues = getSprintIssues(sprint.id);
          const totalPoints = sprintIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);

          return (
            <SprintCard
              key={sprint.id}
              title={
                <SprintHeader>
                  <SprintInfo>
                    <SprintName>{sprint.name}</SprintName>
                    <SprintMeta>
                      {sprint.startDate && sprint.endDate && (
                        <>
                          {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                        </>
                      )}
                      {' • '}
                      {sprintIssues.length} issues • {totalPoints} points
                    </SprintMeta>
                  </SprintInfo>
                  <div>
                    {sprint.status === 'active' && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          setSelectedSprint(sprint);
                          setCompleteSprintModalVisible(true);
                        }}
                      >
                        Complete Sprint
                      </Button>
                    )}
                    {sprint.status === 'future' && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          const activeSprint = sprints.find(s => s.status === 'active' && s.projectId === currentProject?.id);
                          if (activeSprint) {
                            message.warning('There is already an active sprint. Please complete it first.');
                            return;
                          }
                          setSelectedSprint(sprint);
                          setStartSprintModalVisible(true);
                        }}
                      >
                        Start Sprint
                      </Button>
                    )}
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'delete',
                            label: 'Delete Sprint',
                            icon: <Trash2 size={16} />,
                            danger: true,
                            onClick: () => {
                              Modal.confirm({
                                title: 'Delete Sprint',
                                content: 'Are you sure you want to delete this sprint? All issues will be moved to the backlog.',
                                okText: 'Delete',
                                okType: 'danger',
                                onOk: () => handleDeleteSprint(sprint.id),
                              });
                            },
                          },
                        ],
                      }}
                      trigger={['click']}
                    >
                      <Button size="small" icon={<MoreHorizontal size={16} />} style={{ marginLeft: 8 }} />
                    </Dropdown>
                  </div>
                </SprintHeader>
              }
            >
              <DroppableSprint sprintId={sprint.id}>
                <SortableContext
                  items={sprintIssues.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <IssueList>
                    {sprintIssues.length > 0 ? (
                      sprintIssues.map(issue => (
                        <SortableIssue key={issue.id} issue={issue} onIssueClick={handleIssueClick} onDelete={handleDeleteIssue} />
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: colors.text.secondary, padding: '20px' }}>
                        Drag issues here
                      </div>
                    )}
                  </IssueList>
                </SortableContext>
              </DroppableSprint>
            </SprintCard>
          );
        })}

        <BacklogSection>
          <SectionTitle>
            Backlog ({backlogIssues.length} issues)
          </SectionTitle>
          <DroppableSprint sprintId="backlog">
            <SortableContext
              items={backlogIssues.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <IssueList>
                {backlogIssues.length > 0 ? (
                  backlogIssues.map(issue => (
                    <SortableIssue key={issue.id} issue={issue} onIssueClick={handleIssueClick} onDelete={handleDeleteIssue} />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: colors.text.secondary, padding: '20px' }}>
                    No issues in backlog
                  </div>
                )}
              </IssueList>
            </SortableContext>
          </DroppableSprint>
        </BacklogSection>

        <DragOverlay>
          {activeIssue ? (
            <IssueItem style={{ cursor: 'grabbing', opacity: 0.8 }}>
              <GripVertical size={16} style={{ color: colors.text.secondary }} />
              <IssueKey>{activeIssue.key}</IssueKey>
              <IssueSummary>{activeIssue.summary}</IssueSummary>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag color={
                  activeIssue.priority === 'highest' ? 'red' :
                    activeIssue.priority === 'high' ? 'orange' :
                      activeIssue.priority === 'medium' ? 'blue' :
                        'green'
                }>
                  {activeIssue.priority}
                </Tag>
                {activeIssue.storyPoints && (
                  <Tag color="blue">{activeIssue.storyPoints} pts</Tag>
                )}
              </div>
            </IssueItem>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Sprint Modal */}
      <Modal
        title="Create Sprint"
        open={createSprintModalVisible}
        onCancel={() => setCreateSprintModalVisible(false)}
        footer={null}
      >
        <Form form={sprintForm} onFinish={handleCreateSprint} layout="vertical">
          <Form.Item label="Sprint Name" name="name" rules={[{ required: true, message: 'Please enter sprint name' }]}>
            <Input placeholder="e.g., Sprint 1" />
          </Form.Item>
          <Form.Item label="Sprint Goal" name="goal">
            <Input.TextArea rows={3} placeholder="What is the goal of this sprint?" />
          </Form.Item>
          <Form.Item label="Duration" name="dates">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Sprint
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Issue Modal */}
      <CreateIssueModal
        open={createIssueModalVisible}
        onClose={() => setCreateIssueModalVisible(false)}
        onSuccess={() => {
          setCreateIssueModalVisible(false);
          message.success('Issue created successfully');
        }}
      />

      {/* Start Sprint Modal */}
      <StartSprintModal
        visible={startSprintModalVisible}
        sprint={selectedSprint}
        onClose={() => setStartSprintModalVisible(false)}
        onSuccess={() => {
          loadData();
          message.success('Sprint started successfully!');
          navigate('/board');
        }}
      />

      {/* Complete Sprint Modal */}
      <CompleteSprintModal
        visible={completeSprintModalVisible}
        sprint={selectedSprint}
        issues={issues}
        sprints={sprints}
        onClose={() => setCompleteSprintModalVisible(false)}
        onSuccess={() => {
          loadData();
          message.success('Sprint completed successfully!');
        }}
      />
    </Container>
  );
};
