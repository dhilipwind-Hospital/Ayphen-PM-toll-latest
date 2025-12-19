import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, InputNumber, Switch, Space, message } from 'antd';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import styled from 'styled-components';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AVAILABLE_STATUSES = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'In Review', value: 'in-review' },
  { label: 'Done', value: 'done' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Canceled', value: 'canceled' }
];
const ColumnItem = styled.div<{ isDragging?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-bottom: 8px;
  opacity: ${props => props.isDragging ? 0.5 : 1};
  cursor: move;
  
  &:hover {
    border-color: #40a9ff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const DragHandle = styled.div`
  cursor: grab;
  color: #8c8c8c;
  
  &:active {
    cursor: grabbing;
  }
`;

const ColumnContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ColumnHeaderRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

interface Column {
  id: string;
  title: string;
  statuses: string[];
  wipLimit?: number;
  color?: string;
}

interface BoardSettingsProps {
  visible: boolean;
  onClose: () => void;
  columns: Column[];
  boardName: string;
  showEmptyColumns: boolean;
  onSave: (settings: { columns: Column[]; boardName: string; showEmptyColumns: boolean }) => void;
}

interface SortableColumnItemProps {
  column: Column;
  onUpdate: (id: string, updates: Partial<Column>) => void;
  onDelete: (id: string) => void;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({ column, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ColumnItem ref={setNodeRef} style={style} isDragging={isDragging}>
      <DragHandle {...attributes} {...listeners}>
        <GripVertical size={16} />
      </DragHandle>
      <ColumnContent>
        <ColumnHeaderRow>
          <Input
            value={column.title}
            onChange={(e) => onUpdate(column.id, { title: e.target.value })}
            placeholder="Column name"
            style={{ width: 150 }}
          />
          <InputNumber
            value={column.wipLimit}
            onChange={(value) => onUpdate(column.id, { wipLimit: value || undefined })}
            placeholder="WIP Limit"
            min={0}
            style={{ width: 100 }}
          />
          <Select
            value={column.color}
            onChange={(value) => onUpdate(column.id, { color: value })}
            placeholder="Color"
            style={{ width: 120 }}
            options={[
              { label: 'Blue', value: '#1890ff' },
              { label: 'Green', value: '#52c41a' },
              { label: 'Orange', value: '#fa8c16' },
              { label: 'Red', value: '#f5222d' },
              { label: 'Purple', value: '#722ed1' },
              { label: 'Gray', value: '#8c8c8c' },
            ]}
          />
        </ColumnHeaderRow>
        <div style={{ marginTop: 4 }}>
          <Select
            mode="multiple"
            placeholder="Map Statuses (e.g. To Do)"
            value={column.statuses}
            onChange={(values) => onUpdate(column.id, { statuses: values })}
            style={{ width: '100%' }}
            options={AVAILABLE_STATUSES}
            maxTagCount="responsive"
          />
        </div>
      </ColumnContent>
      <Button
        type="text"
        danger
        icon={<Trash2 size={16} />}
        onClick={() => onDelete(column.id)}
      />
    </ColumnItem>
  );
};

export const BoardSettings: React.FC<BoardSettingsProps> = ({
  visible,
  onClose,
  columns: initialColumns,
  boardName: initialBoardName,
  showEmptyColumns: initialShowEmptyColumns,
  onSave
}) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [boardName, setBoardName] = useState(initialBoardName);
  const [showEmptyColumns, setShowEmptyColumns] = useState(initialShowEmptyColumns);

  // Update local state when props change
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    setBoardName(initialBoardName);
  }, [initialBoardName]);

  useEffect(() => {
    setShowEmptyColumns(initialShowEmptyColumns);
  }, [initialShowEmptyColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: 'New Column',
      statuses: [],
      wipLimit: undefined,
      color: '#1890ff',
    };
    setColumns([...columns, newColumn]);
  };

  const handleUpdateColumn = (id: string, updates: Partial<Column>) => {
    setColumns(columns.map(col => col.id === id ? { ...col, ...updates } : col));
  };

  const handleDeleteColumn = (id: string) => {
    if (columns.length <= 1) {
      message.warning('Board must have at least one column');
      return;
    }
    setColumns(columns.filter(col => col.id !== id));
  };

  const handleSave = () => {
    // Validate
    const hasEmptyNames = columns.some(col => !col.title.trim());
    if (hasEmptyNames) {
      message.error('All columns must have a name');
      return;
    }

    onSave({ columns, boardName, showEmptyColumns });
    onClose();
  };

  return (
    <Modal
      title="Board Settings"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save Settings
        </Button>,
      ]}
    >
      <Form layout="vertical">
        <Form.Item label="Board Name">
          <Input
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="Enter board name"
          />
        </Form.Item>

        <Form.Item label="Show Empty Columns">
          <Switch
            checked={showEmptyColumns}
            onChange={setShowEmptyColumns}
          />
          <span style={{ marginLeft: 8, color: '#8c8c8c' }}>
            Display columns even when they have no issues
          </span>
        </Form.Item>

        <Form.Item label="Columns">
          <div style={{ marginBottom: 12 }}>
            <Button
              type="dashed"
              icon={<Plus size={16} />}
              onClick={handleAddColumn}
              block
            >
              Add Column
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {columns.map((column) => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  onUpdate={handleUpdateColumn}
                  onDelete={handleDeleteColumn}
                />
              ))}
            </SortableContext>
          </DndContext>
        </Form.Item>

        <div style={{
          padding: 12,
          background: '#f0f0f0',
          borderRadius: 4,
          fontSize: 12,
          color: '#595959'
        }}>
          <strong>Tips:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Drag columns to reorder them</li>
            <li>Set WIP limits to restrict the number of issues in a column</li>
            <li>Choose colors to visually distinguish columns</li>
            <li>You can add or remove columns as needed</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};
