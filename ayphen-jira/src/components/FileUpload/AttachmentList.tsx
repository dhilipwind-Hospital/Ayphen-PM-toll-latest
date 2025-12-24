import React, { useState } from 'react';
import { Button, message, Modal } from 'antd';
import { Download, Eye, Trash2, Paperclip } from 'lucide-react';
import styled from 'styled-components';
import axios from 'axios';
import { FilePreviewModal } from './FilePreviewModal';
import { ENV } from '../../config/env';

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.3s;

  &:hover {
    background: #f5f5f5;
    border-color: #1890ff;
  }
`;

const AttachmentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;
`;

const AttachmentIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #e6f7ff;
  border-radius: 4px;
  color: #1890ff;
`;

const AttachmentDetails = styled.div`
  flex: 1;
`;

const AttachmentName = styled.div`
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
`;

const AttachmentMeta = styled.div`
  font-size: 12px;
  color: #8c8c8c;
`;

const AttachmentActions = styled.div`
  display: flex;
  gap: 8px;
`;

interface AttachmentListProps {
  attachments: any[];
  onRefresh?: () => void;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onRefresh,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handlePreview = (attachment: any) => {
    setSelectedAttachment(attachment);
    setPreviewVisible(true);
  };

  const handleDownload = async (attachment: any) => {
    try {
      const response = await axios.get(
        `${ENV.API_URL}/attachments-v2/download/${attachment.id}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download file');
    }
  };

  const handleDelete = async (e: React.MouseEvent, attachment: any) => {
    e.stopPropagation(); // Prevent event bubbling
    
    Modal.confirm({
      title: 'Delete Attachment',
      content: `Are you sure you want to delete "${attachment.originalName}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          
          const response = await axios.delete(
            `${ENV.API_URL}/attachments-v2/${attachment.id}`
          );
          
          message.success('Attachment deleted successfully');
          
          // Refresh the list
          if (onRefresh) {
            await onRefresh();
          } else {
            console.warn('⚠️ No onRefresh function provided');
          }
        } catch (error: any) {
          console.error('❌ Delete failed:', error);
          console.error('❌ Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          message.error(`Failed to delete: ${error.response?.data?.error || error.message}`);
        }
      },
    });
  };


  if (!attachments || attachments.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
        <Paperclip size={32} style={{ opacity: 0.3 }} />
        <div style={{ marginTop: '8px' }}>No attachments yet</div>
      </div>
    );
  }

  return (
    <>
      {attachments.map((attachment) => (
        <AttachmentItem key={attachment.id}>
          <AttachmentInfo onClick={() => handlePreview(attachment)}>
            <AttachmentIcon>
              <Paperclip size={20} />
            </AttachmentIcon>
            <AttachmentDetails>
              <AttachmentName>{attachment.originalName}</AttachmentName>
              <AttachmentMeta>
                {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
              </AttachmentMeta>
            </AttachmentDetails>
          </AttachmentInfo>
          <AttachmentActions>
            <Button
              size="small"
              icon={<Eye size={14} />}
              onClick={() => handlePreview(attachment)}
            >
              Preview
            </Button>
            <Button
              size="small"
              icon={<Download size={14} />}
              onClick={() => handleDownload(attachment)}
            >
              Download
            </Button>
            <Button
              size="small"
              danger
              icon={<Trash2 size={14} />}
              onClick={(e) => handleDelete(e, attachment)}
            >
              Delete
            </Button>
          </AttachmentActions>
        </AttachmentItem>
      ))}

      <FilePreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        attachment={selectedAttachment}
      />
    </>
  );
};
