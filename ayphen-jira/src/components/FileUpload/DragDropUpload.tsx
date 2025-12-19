import React, { useState, useCallback } from 'react';
import { Upload, message, Progress } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const { Dragger } = Upload;

const UploadContainer = styled.div`
  .ant-upload-drag {
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s;
    
    &:hover {
      border-color: #1890ff;
      background: #e6f7ff;
    }
  }
`;

interface DragDropUploadProps {
  issueId: string;
  uploaderId: string;
  onUploadComplete?: (attachments: any[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  issueId,
  uploaderId,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 25,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = useCallback(async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      message.error(`File size must be less than ${maxSize}MB`);
      onError(new Error('File too large'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('issueId', issueId);
    formData.append('uploaderId', uploaderId);

    try {
      setUploading(true);
      const response = await axios.post(
        'https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
            onProgress({ percent: percentCompleted });
          },
        }
      );

      onSuccess(response.data);
      message.success(`${file.name} uploaded successfully`);

      if (onUploadComplete) {
        onUploadComplete([response.data]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(`${file.name} upload failed`);
      onError(error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [issueId, uploaderId, maxSize, onUploadComplete]);

  const handleMultipleUpload = useCallback(async (files: File[]) => {
    if (files.length > maxFiles) {
      message.error(`You can only upload up to ${maxFiles} files at once`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      message.error(`${oversizedFiles.length} file(s) exceed the ${maxSize}MB limit`);
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('issueId', issueId);
    formData.append('uploaderId', uploaderId);

    try {
      setUploading(true);
      const response = await axios.post(
        'https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/upload-multiple',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
          },
        }
      );

      message.success(`${files.length} files uploaded successfully`);

      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [issueId, uploaderId, maxFiles, onUploadComplete]);

  return (
    <UploadContainer>
      <Dragger
        name="file"
        multiple
        customRequest={handleUpload}
        showUploadList={false}
        disabled={uploading}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.tar,.gz"
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag files to upload</p>
        <p className="ant-upload-hint">
          Support for images, documents, and archives (max {maxSize}MB per file)
        </p>
      </Dragger>

      {uploading && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={progress} status="active" />
        </div>
      )}
    </UploadContainer>
  );
};
