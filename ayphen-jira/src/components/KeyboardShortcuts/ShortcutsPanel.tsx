import React from 'react';
import { Modal, Table, Tag } from 'antd';
import styled from 'styled-components';

const ShortcutKey = styled(Tag)`
  font-family: monospace;
  font-weight: bold;
  padding: 4px 8px;
  margin: 0 4px;
`;

interface ShortcutsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ visible, onClose }) => {
  const shortcuts = [
    { category: 'Navigation', key: 'g + b', description: 'Go to Board' },
    { category: 'Navigation', key: 'g + d', description: 'Go to Dashboard' },
    { category: 'Navigation', key: 'g + p', description: 'Go to Projects' },
    { category: 'Navigation', key: 'g + r', description: 'Go to Reports' },
    { category: 'Actions', key: 'c', description: 'Create Issue' },
    { category: 'Actions', key: '/', description: 'Focus Search' },
    { category: 'Actions', key: 'Ctrl + K', description: 'Command Palette' },
    { category: 'Issue', key: 'e', description: 'Edit Issue' },
    { category: 'Issue', key: 'a', description: 'Assign to Me' },
    { category: 'Issue', key: 'm', description: 'Add Comment' },
    { category: 'Board', key: '1-5', description: 'Move to Column' },
    { category: 'Board', key: 'Shift + Click', description: 'Multi-select' },
  ];

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: 'Shortcut',
      dataIndex: 'key',
      key: 'key',
      width: 150,
      render: (key: string) => (
        <div>
          {key.split(' + ').map((k, i) => (
            <ShortcutKey key={i} color="blue">{k}</ShortcutKey>
          ))}
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <Modal
      title="⌨️ Keyboard Shortcuts"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Table
        dataSource={shortcuts}
        columns={columns}
        pagination={false}
        size="small"
        rowKey={(record) => `${record.category}-${record.key}`}
      />
    </Modal>
  );
};
