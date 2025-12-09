import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Select, Modal, message } from 'antd';
import { User, Tag, Trash2, X } from 'lucide-react';
import { colors } from '../theme/colors';

const ToolbarContainer = styled.div<{ visible: boolean }>`
  position: fixed;
  bottom: ${props => props.visible ? '24px' : '-100px'};
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
  transition: bottom 0.3s ease;
  min-width: 600px;
`;

const SelectedCount = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
`;

export interface BulkActionsToolbarProps {
  selectedCount: number;
  users: Array<{ id: string; name: string }>;
  onAssign: (userId: string) => void;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  users,
  onAssign,
  onChangeStatus,
  onDelete,
  onClearSelection,
}) => {
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const handleAssign = (userId: string) => {
    onAssign(userId);
    setAssignModalVisible(false);
  };

  const handleChangeStatus = (status: string) => {
    onChangeStatus(status);
    setStatusModalVisible(false);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: `Delete ${selectedCount} issue${selectedCount > 1 ? 's' : ''}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        onDelete();
      },
    });
  };

  return (
    <>
      <ToolbarContainer visible={selectedCount > 0}>
        <SelectedCount>
          {selectedCount} selected
        </SelectedCount>
        <ButtonGroup>
          <Button
            icon={<User size={16} />}
            onClick={() => setAssignModalVisible(true)}
          >
            Assign
          </Button>
          <Button
            icon={<Tag size={16} />}
            onClick={() => setStatusModalVisible(true)}
          >
            Change Status
          </Button>
          <Button
            danger
            icon={<Trash2 size={16} />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </ButtonGroup>
        <Button
          icon={<X size={16} />}
          onClick={onClearSelection}
        >
          Clear
        </Button>
      </ToolbarContainer>

      <Modal
        title="Assign Issues"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select user"
          onChange={handleAssign}
          showSearch
          optionFilterProp="children"
        >
          {users.map(user => (
            <Select.Option key={user.id} value={user.id}>
              {user.name}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="Change Status"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select status"
          onChange={handleChangeStatus}
        >
          <Select.Option value="backlog">Backlog</Select.Option>
          <Select.Option value="todo">To Do</Select.Option>
          <Select.Option value="in-progress">In Progress</Select.Option>
          <Select.Option value="in-review">In Review</Select.Option>
          <Select.Option value="done">Done</Select.Option>
        </Select>
      </Modal>
    </>
  );
};
