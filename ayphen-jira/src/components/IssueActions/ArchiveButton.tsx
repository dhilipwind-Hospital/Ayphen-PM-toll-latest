import React from 'react';
import { Button, Modal, message } from 'antd';
import { FolderOpenOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';

interface ArchiveButtonProps {
  issueId: string;
  issueKey: string;
  isArchived: boolean;
  onArchiveChange: () => void;
}

export const ArchiveButton: React.FC<ArchiveButtonProps> = ({
  issueId,
  issueKey,
  isArchived,
  onArchiveChange,
}) => {
  const handleArchive = () => {
    Modal.confirm({
      title: 'Archive Issue',
      content: `Are you sure you want to archive ${issueKey}? It will be hidden from most views.`,
      okText: 'Archive',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.post(`http://localhost:8500/api/issues/${issueId}/archive`, {
            userId: localStorage.getItem('userId'),
          });
          message.success('Issue archived successfully');
          onArchiveChange();
        } catch (error) {
          message.error('Failed to archive issue');
        }
      },
    });
  };

  const handleUnarchive = async () => {
    try {
      await axios.post(`http://localhost:8500/api/issues/${issueId}/unarchive`);
      message.success('Issue restored successfully');
      onArchiveChange();
    } catch (error) {
      message.error('Failed to restore issue');
    }
  };

  return isArchived ? (
    <Button
      icon={<InboxOutlined />}
      onClick={handleUnarchive}
    >
      Restore
    </Button>
  ) : (
    <Button
      icon={<FolderOpenOutlined />}
      onClick={handleArchive}
    >
      Archive
    </Button>
  );
};
