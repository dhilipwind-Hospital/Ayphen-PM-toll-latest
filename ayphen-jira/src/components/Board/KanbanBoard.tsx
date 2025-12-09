import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, Avatar, Tag, Button, Modal, Form, Input, Select, message } from 'antd';
import { Plus, MoreHorizontal, Flag } from 'lucide-react';
import styled from 'styled-components';
import { useStore } from '../../store/useStore';
import { issuesApi } from '../../services/api';

const BoardContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 24px;
  overflow-x: auto;
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%);
`;

const Column = styled.div`
  min-width: 300px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.1);
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #FCE7F3;
`;

const IssueCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid rgba(244, 114, 182, 0.1);
  
  &:hover {
    box-shadow: 0 4px 12px rgba(244, 114, 182, 0.15);
    transform: translateY(-2px);
    transition: all 0.2s ease;
  }
`;

const AddButton = styled(Button)`
  width: 100%;
  border: 2px dashed rgba(244, 114, 182, 0.3);
  color: #EC4899;
  
  &:hover {
    border-color: #EC4899;
    background: rgba(244, 114, 182, 0.05);
  }
`;

interface Issue {
  id: string;
  title: string;
  type: 'story' | 'bug' | 'task';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  storyPoints: number;
  labels: string[];
}

interface Column {
  id: string;
  title: string;
  issues: Issue[];
}

export const KanbanBoard: React.FC = () => {
  const { issues: storeIssues, currentProject, addIssue, updateIssue } = useStore();
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', issues: [] },
    { id: 'inprogress', title: 'In Progress', issues: [] },
    { id: 'review', title: 'In Review', issues: [] },
    { id: 'done', title: 'Done', issues: [] }
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadIssues();
  }, [storeIssues, currentProject]);

  const loadIssues = () => {
    const projectIssues = currentProject
      ? storeIssues.filter((i: any) => i.projectId === currentProject.id)
      : storeIssues;

    const newColumns = [
      {
        id: 'todo',
        title: 'To Do',
        issues: projectIssues
          .filter((i: any) => i.status === 'todo' || i.status === 'backlog')
          .map(mapIssue)
      },
      {
        id: 'inprogress',
        title: 'In Progress',
        issues: projectIssues
          .filter((i: any) => i.status === 'in-progress')
          .map(mapIssue)
      },
      {
        id: 'review',
        title: 'In Review',
        issues: projectIssues
          .filter((i: any) => i.status === 'in-review')
          .map(mapIssue)
      },
      {
        id: 'done',
        title: 'Done',
        issues: projectIssues
          .filter((i: any) => i.status === 'done')
          .map(mapIssue)
      }
    ];
    setColumns(newColumns);
  };

  const mapIssue = (issue: any): Issue => ({
    id: issue.id,
    title: issue.title || issue.summary,
    type: issue.type,
    priority: issue.priority,
    assignee: issue.assignee?.name || 'Unassigned',
    storyPoints: issue.storyPoints || 0,
    labels: issue.labels || []
  });

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newColumns = [...columns];
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (sourceColumn && destColumn) {
      const [movedIssue] = sourceColumn.issues.splice(source.index, 1);
      destColumn.issues.splice(destination.index, 0, movedIssue);
      setColumns(newColumns);

      // Update issue status in backend
      try {
        const statusMap: { [key: string]: string } = {
          'todo': 'todo',
          'inprogress': 'in-progress',
          'review': 'in-review',
          'done': 'done'
        };
        
        const newStatus = statusMap[destination.droppableId];
        if (newStatus) {
          await issuesApi.update(draggableId, { status: newStatus });
          updateIssue(draggableId, { status: newStatus });
          message.success('Issue moved successfully');
        }
      } catch (error) {
        console.error('Failed to update issue status:', error);
        message.error('Failed to move issue');
        // Revert the change
        const revertColumns = [...columns];
        const revertDestColumn = revertColumns.find(col => col.id === destination.droppableId);
        const revertSourceColumn = revertColumns.find(col => col.id === source.droppableId);
        if (revertDestColumn && revertSourceColumn) {
          const [revertIssue] = revertDestColumn.issues.splice(destination.index, 1);
          revertSourceColumn.issues.splice(source.index, 0, revertIssue);
          setColumns(revertColumns);
        }
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'story': return '📖';
      case 'bug': return '🐛';
      case 'task': return '✅';
      default: return '📝';
    }
  };

  const handleCreateIssue = async (values: any) => {
    try {
      const issueData = {
        title: values.title,
        type: values.type,
        priority: values.priority,
        assigneeId: values.assignee,
        storyPoints: values.storyPoints || 1,
        labels: values.labels || [],
        status: selectedColumn === 'todo' ? 'todo' : selectedColumn === 'inprogress' ? 'in-progress' : selectedColumn === 'review' ? 'in-review' : 'done',
        projectId: currentProject?.id
      };

      const response = await issuesApi.create(issueData);
      addIssue(response.data);
      
      const newIssue: Issue = {
        id: response.data.id,
        title: values.title,
        type: values.type,
        priority: values.priority,
        assignee: values.assignee,
        storyPoints: values.storyPoints || 1,
        labels: values.labels || []
      };

      const newColumns = [...columns];
      const targetColumn = newColumns.find(col => col.id === selectedColumn);
      if (targetColumn) {
        targetColumn.issues.push(newIssue);
        setColumns(newColumns);
      }

      message.success('Issue created successfully');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to create issue:', error);
      message.error('Failed to create issue');
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <BoardContainer>
          {columns.map((column) => (
            <Column key={column.id}>
              <ColumnHeader>
                <div>
                  <h3 style={{ margin: 0, color: '#EC4899' }}>{column.title}</h3>
                  <span style={{ color: '#6B7280', fontSize: '12px' }}>
                    {column.issues.length} issues
                  </span>
                </div>
                <Button
                  type="text"
                  icon={<MoreHorizontal size={16} />}
                  style={{ color: '#EC4899' }}
                />
              </ColumnHeader>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? 'rgba(244, 114, 182, 0.05)' : 'transparent',
                      minHeight: 200,
                      borderRadius: 8,
                      padding: 8
                    }}
                  >
                    {column.issues.map((issue, index) => (
                      <Draggable key={issue.id} draggableId={issue.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <IssueCard
                              size="small"
                              style={{
                                transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                                opacity: snapshot.isDragging ? 0.8 : 1
                              }}
                            >
                              <div style={{ marginBottom: 8 }}>
                                <span style={{ marginRight: 8 }}>{getTypeIcon(issue.type)}</span>
                                <Tag
                                  color={getPriorityColor(issue.priority)}
                                  style={{ fontSize: '10px', padding: '2px 6px' }}
                                >
                                  <Flag size={10} style={{ marginRight: 2 }} />
                                  {issue.priority}
                                </Tag>
                              </div>
                              
                              <h4 style={{ margin: '8px 0', fontSize: '14px' }}>{issue.title}</h4>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  {issue.labels.map(label => (
                                    <Tag key={label} color="pink">{label}</Tag>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                    {issue.storyPoints}pt
                                  </span>
                                  <Avatar size="small" style={{ backgroundColor: '#EC4899' }}>
                                    {issue.assignee[0]}
                                  </Avatar>
                                </div>
                              </div>
                            </IssueCard>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <AddButton
                icon={<Plus size={16} />}
                onClick={() => {
                  setSelectedColumn(column.id);
                  setIsModalVisible(true);
                }}
              >
                Add Issue
              </AddButton>
            </Column>
          ))}
        </BoardContainer>
      </DragDropContext>

      <Modal
        title="Create New Issue"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleCreateIssue} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Enter issue title" />
          </Form.Item>
          
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select placeholder="Select issue type">
              <Select.Option value="story">📖 Story</Select.Option>
              <Select.Option value="bug">🐛 Bug</Select.Option>
              <Select.Option value="task">✅ Task</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <Select placeholder="Select priority">
              <Select.Option value="low">🟢 Low</Select.Option>
              <Select.Option value="medium">🟡 Medium</Select.Option>
              <Select.Option value="high">🔴 High</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="assignee" label="Assignee">
            <Input placeholder="Assignee name" />
          </Form.Item>
          
          <Form.Item name="storyPoints" label="Story Points">
            <Select placeholder="Select story points">
              <Select.Option value={1}>1</Select.Option>
              <Select.Option value={2}>2</Select.Option>
              <Select.Option value={3}>3</Select.Option>
              <Select.Option value={5}>5</Select.Option>
              <Select.Option value={8}>8</Select.Option>
            </Select>
          </Form.Item>
          
          <Button type="primary" htmlType="submit" block style={{ background: '#EC4899' }}>
            Create Issue
          </Button>
        </Form>
      </Modal>
    </>
  );
};