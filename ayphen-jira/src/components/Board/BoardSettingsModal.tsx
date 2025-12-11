import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, List, Space, Tag } from 'antd';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useStore } from '../../store/useStore';

interface BoardSettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: string;
}

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({ 
  open, 
  onClose,
  initialTab = 'columns' 
}) => {
  const { currentBoard, updateBoard } = useStore();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && currentBoard) {
      setColumns(currentBoard.columns || []);
      setActiveTab(initialTab);
    }
  }, [open, currentBoard, initialTab]);

  const handleSaveColumns = async () => {
    if (!currentBoard) return;
    setLoading(true);
    try {
      // Simulate API call
      updateBoard(currentBoard.id, { columns });
      onClose();
    } catch (error) {
      console.error('Failed to save columns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setColumns(items);
  };

  const handleAddColumn = () => {
    const newColumn = {
      id: `col-${Date.now()}`,
      name: 'New Column',
      status: ['todo'], // Default status mapping
      wipLimit: 0
    };
    setColumns([...columns, newColumn]);
  };

  const handleRemoveColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
  };

  const handleUpdateColumn = (id: string, field: string, value: any) => {
    setColumns(columns.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  return (
    <Modal
      title="Board Settings"
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSaveColumns}>
          Save Changes
        </Button>
      ]}
    >
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar */}
        <div style={{ width: 160, borderRight: '1px solid #f0f0f0' }}>
          <List
            size="small"
            dataSource={[
              { id: 'columns', label: 'Columns' },
              { id: 'wip-limits', label: 'WIP Limits' },
              { id: 'swimlanes', label: 'Swimlanes' },
            ]}
            renderItem={item => (
              <List.Item 
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: activeTab === item.id ? '#e6f7ff' : 'transparent',
                  borderRight: activeTab === item.id ? '2px solid #1890ff' : 'none',
                  paddingLeft: 12
                }}
                onClick={() => setActiveTab(item.id)}
              >
                {item.label}
              </List.Item>
            )}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'columns' && (
            <div>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <span>Drag to reorder columns</span>
                <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={handleAddColumn}>
                  Add Column
                </Button>
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="columns">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {columns.map((column, index) => (
                        <Draggable key={column.id} draggableId={column.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                padding: 12,
                                marginBottom: 8,
                                background: '#fafafa',
                                border: '1px solid #d9d9d9',
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12
                              }}
                            >
                              <div {...provided.dragHandleProps} style={{ cursor: 'grab', color: '#999' }}>
                                <GripVertical size={16} />
                              </div>
                              <Input 
                                value={column.name} 
                                onChange={(e) => handleUpdateColumn(column.id, 'name', e.target.value)}
                                style={{ width: 150 }}
                              />
                              <Select
                                mode="multiple"
                                style={{ flex: 1 }}
                                placeholder="Map Statuses"
                                value={column.status}
                                onChange={(val) => handleUpdateColumn(column.id, 'status', val)}
                              >
                                <Select.Option value="todo">To Do</Select.Option>
                                <Select.Option value="in-progress">In Progress</Select.Option>
                                <Select.Option value="in-review">In Review</Select.Option>
                                <Select.Option value="done">Done</Select.Option>
                              </Select>
                              <Button 
                                type="text" 
                                danger 
                                icon={<Trash2 size={16} />} 
                                onClick={() => handleRemoveColumn(column.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}

          {activeTab === 'wip-limits' && (
            <div>
              <p style={{ color: '#666', marginBottom: 16 }}>
                Set minimum and maximum issue limits for each column to constrain work in progress.
              </p>
              <List
                dataSource={columns}
                renderItem={(column: any) => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
                      <span style={{ width: 150, fontWeight: 500 }}>{column.name}</span>
                      <InputNumber 
                        min={0} 
                        placeholder="Max" 
                        value={column.wipLimit} 
                        onChange={(val) => handleUpdateColumn(column.id, 'wipLimit', val)}
                      />
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}

          {activeTab === 'swimlanes' && (
            <div>
              <p>Configure swimlanes (Coming Soon)</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
