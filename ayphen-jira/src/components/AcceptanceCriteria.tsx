import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Checkbox, Input } from 'antd';
import { Plus, X, GripVertical, Check, Edit2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';
import { useToast } from '../contexts/ToastContext';

const Container = styled.div`
  margin: 24px 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0;
`;

const CriteriaList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CriteriaItem = styled.div<{ $isDragging?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$isDragging ? '#f0f0f0' : '#fafafa'};
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background: #f5f5f5;
    border-color: #bfbfbf;
  }
`;

const DragHandle = styled.div`
  cursor: grab;
  color: #8c8c8c;
  padding-top: 2px;
  
  &:active {
    cursor: grabbing;
  }
`;

const CheckboxWrapper = styled.div`
  padding-top: 2px;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const CriteriaText = styled.div<{ $completed?: boolean }>`
  font-size: 14px;
  color: ${props => props.$completed ? '#8c8c8c' : '#262626'};
  text-decoration: ${props => props.$completed ? 'line-through' : 'none'};
  cursor: pointer;
  word-break: break-word;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: #1890ff;
    
    .edit-icon {
      opacity: 1;
    }
  }
  
  .edit-icon {
    opacity: 0.5;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }
`;

const EditInput = styled(Input.TextArea)`
  font-size: 14px;
  
  .ant-input {
    min-height: 60px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
  padding-top: 2px;
`;

const ActionButton = styled(Button)`
  padding: 4px;
  height: auto;
  min-width: auto;
`;

const AddButton = styled(Button)`
  margin-top: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 32px;
  color: #8c8c8c;
  font-size: 14px;
`;

const Stats = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  margin-left: 8px;
`;

export interface AcceptanceCriterion {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

interface AcceptanceCriteriaProps {
  storyId: string;
  criteria: AcceptanceCriterion[];
  onUpdate: (criteria: AcceptanceCriterion[]) => Promise<void>;
  readOnly?: boolean;
}

interface SortableItemProps {
  criterion: AcceptanceCriterion;
  isEditing: boolean;
  editText: string;
  onToggle: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onTextChange: (text: string) => void;
  readOnly?: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({
  criterion,
  isEditing,
  editText,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onTextChange,
  readOnly,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: criterion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CriteriaItem $isDragging={isDragging}>
        {!readOnly && (
          <DragHandle {...attributes} {...listeners}>
            <GripVertical size={16} />
          </DragHandle>
        )}
        <CheckboxWrapper>
          <Checkbox checked={criterion.completed} onChange={onToggle} disabled={readOnly} />
        </CheckboxWrapper>
        <Content>
          {isEditing ? (
            <EditInput
              value={editText}
              onChange={(e) => onTextChange(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  onSave();
                }
              }}
              autoFocus
              placeholder="Enter acceptance criteria..."
            />
          ) : (
            <CriteriaText $completed={criterion.completed} onClick={readOnly ? undefined : onEdit}>
              <span>{criterion.text || 'Click to edit...'}</span>
              {!readOnly && <Edit2 size={14} className="edit-icon" />}
            </CriteriaText>
          )}
        </Content>
        {!readOnly && (
          <Actions>
            {isEditing ? (
              <>
                <ActionButton
                  type="text"
                  icon={<Check size={16} />}
                  onClick={onSave}
                  disabled={!editText.trim()}
                />
                <ActionButton
                  type="text"
                  icon={<X size={16} />}
                  onClick={onCancel}
                />
              </>
            ) : (
              <ActionButton
                type="text"
                danger
                icon={<X size={16} />}
                onClick={onDelete}
              />
            )}
          </Actions>
        )}
      </CriteriaItem>
    </div>
  );
};

export const AcceptanceCriteria: React.FC<AcceptanceCriteriaProps> = ({
  storyId,
  criteria: initialCriteria,
  onUpdate,
  readOnly = false,
}) => {
  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>(initialCriteria);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const { success, error } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setCriteria(initialCriteria);
  }, [initialCriteria]);

  const saveCriteria = async (updatedCriteria: AcceptanceCriterion[]) => {
    try {
      await onUpdate(updatedCriteria);
      setCriteria(updatedCriteria);
      success('Acceptance criteria updated');
    } catch (err) {
      error('Failed to update acceptance criteria');
      console.error(err);
    }
  };

  const handleAdd = () => {
    const newCriterion: AcceptanceCriterion = {
      id: `ac-${Date.now()}`,
      text: '',
      completed: false,
      order: criteria.length,
    };
    const updated = [...criteria, newCriterion];
    setCriteria(updated);
    setEditingId(newCriterion.id);
    setEditText('');
  };

  const handleToggle = async (id: string) => {
    const updated = criteria.map(c =>
      c.id === id ? { ...c, completed: !c.completed } : c
    );
    await saveCriteria(updated);
  };

  const handleEdit = (criterion: AcceptanceCriterion) => {
    setEditingId(criterion.id);
    setEditText(criterion.text);
  };

  const handleSave = async () => {
    if (!editText.trim()) return;

    const updated = criteria.map(c =>
      c.id === editingId ? { ...c, text: editText.trim() } : c
    );
    await saveCriteria(updated);
    setEditingId(null);
    setEditText('');
  };

  const handleCancel = () => {
    // If it's a new criterion with no text, remove it
    if (editingId && !criteria.find(c => c.id === editingId)?.text) {
      setCriteria(criteria.filter(c => c.id !== editingId));
    }
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (id: string) => {
    const updated = criteria.filter(c => c.id !== id).map((c, index) => ({
      ...c,
      order: index,
    }));
    await saveCriteria(updated);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = criteria.findIndex(c => c.id === active.id);
      const newIndex = criteria.findIndex(c => c.id === over.id);

      const reordered = arrayMove(criteria, oldIndex, newIndex).map((c, index) => ({
        ...c,
        order: index,
      }));

      await saveCriteria(reordered);
    }
  };

  const completedCount = criteria.filter(c => c.completed).length;
  const totalCount = criteria.length;

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title>Acceptance Criteria</Title>
          {totalCount > 0 && (
            <Stats>
              ({completedCount}/{totalCount} completed)
            </Stats>
          )}
        </div>
        {!readOnly && (
          <AddButton
            type="dashed"
            icon={<Plus size={16} />}
            onClick={handleAdd}
            size="small"
          >
            Add Criteria
          </AddButton>
        )}
      </Header>

      {criteria.length === 0 ? (
        <EmptyState>
          {readOnly 
            ? 'No acceptance criteria defined'
            : 'Click "Add Criteria" to define acceptance criteria for this story'
          }
        </EmptyState>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={criteria.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <CriteriaList>
              {criteria.map(criterion => (
                <SortableItem
                  key={criterion.id}
                  criterion={criterion}
                  isEditing={editingId === criterion.id}
                  editText={editText}
                  onToggle={() => handleToggle(criterion.id)}
                  onEdit={() => handleEdit(criterion)}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onDelete={() => handleDelete(criterion.id)}
                  onTextChange={setEditText}
                  readOnly={readOnly}
                />
              ))}
            </CriteriaList>
          </SortableContext>
        </DndContext>
      )}
    </Container>
  );
};
