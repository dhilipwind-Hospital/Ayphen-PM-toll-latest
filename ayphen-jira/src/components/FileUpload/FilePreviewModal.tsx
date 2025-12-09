import React from 'react';
import { Modal } from 'antd';
import { Download, X } from 'lucide-react';
import styled from 'styled-components';

const PreviewContainer = styled.div`
  max-width: 100%;
  max-height: 70vh;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
`;

const PreviewIframe = styled.iframe`
  width: 100%;
  height: 70vh;
  border: none;
`;

const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  
  &:hover {
    background: #40a9ff;
    color: white;
  }
`;

interface FilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  attachment: {
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    isImage: boolean;
    isDocument: boolean;
    filePath: string;
  } | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  visible,
  onClose,
  attachment,
}) => {
  if (!attachment) return null;

  const fileUrl = `http://localhost:8500/api/attachments-v2/file/${attachment.fileName}`;
  const downloadUrl = `http://localhost:8500/api/attachments-v2/download/${attachment.id}`;

  const renderPreview = () => {
    if (attachment.isImage) {
      return <PreviewImage src={fileUrl} alt={attachment.originalName} />;
    }

    if (attachment.mimeType === 'application/pdf') {
      return <PreviewIframe src={fileUrl} title={attachment.originalName} />;
    }

    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p>Preview not available for this file type</p>
        <DownloadButton href={downloadUrl} download={attachment.originalName}>
          <Download size={16} />
          Download {attachment.originalName}
        </DownloadButton>
      </div>
    );
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <DownloadButton key="download" href={downloadUrl} download={attachment.originalName}>
          <Download size={16} />
          Download
        </DownloadButton>,
      ]}
      width="80%"
      title={attachment.originalName}
      closeIcon={<X size={20} />}
    >
      <PreviewContainer>{renderPreview()}</PreviewContainer>
    </Modal>
  );
};
