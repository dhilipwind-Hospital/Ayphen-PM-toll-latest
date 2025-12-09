import React, { useState } from 'react';
import { Upload, message, Progress } from 'antd';
import { InboxOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import axios from 'axios';

const { Dragger } = Upload;

const UploadContainer = styled.div`
  .ant-upload-drag {
    border: 2px dashed #EC4899;
    border-radius: 8px;
    background: rgba(236, 72, 153, 0.02);
    
    &:hover {
      border-color: #F472B6;
      background: rgba(236, 72, 153, 0.05);
    }
  }
`;

interface DragDropUploadProps {
  onUploadComplete?: (files: any[]) => void;
  maxFiles?: number;
  maxSize?: number;
  issueId?: string;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10,
  issueId
}) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;

    if (file.size > maxSize * 1024 * 1024) {
      message.error(`File too large. Maximum size is ${maxSize}MB.`);
      onError(new Error('File too large'));
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (issueId) formData.append('issueId', issueId);

      const response = await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFileList(prev => [...prev, { ...file, status: 'done', response: response.data }]);
      onSuccess(response.data);
      message.success(`${file.name} uploaded successfully`);
      
      if (onUploadComplete) onUploadComplete([response.data]);
    } catch (error) {
      onError(error);
      message.error(`Failed to upload ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <UploadContainer>
      <Dragger
        customRequest={handleUpload}
        multiple
        showUploadList={false}
        beforeUpload={(file) => fileList.length < maxFiles}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag files to upload</p>
        <p className="ant-upload-hint">Maximum {maxFiles} files, {maxSize}MB each</p>
      </Dragger>
    </UploadContainer>
  );
};