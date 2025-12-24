import React, { useState } from 'react';
import { Button, Dropdown, Menu, message } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import { exportApi } from '../../services/api';
import { useStore } from '../../store/useStore';

interface ExportButtonProps {
  projectId?: string;
  selectedIssueIds?: string[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ projectId, selectedIssueIds }) => {
  const [loading, setLoading] = useState(false);
  const { currentProject } = useStore();

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(true);
    try {
      const params = {
        projectId: projectId || currentProject?.id
      };

      const response = format === 'csv' 
        ? await exportApi.toCSV(params)
        : await exportApi.toJSON(params);

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `issues-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Issues exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      message.error('Failed to export issues');
    } finally {
      setLoading(false);
    }
  };

  const menu = (
    <Menu>
      <Menu.Item 
        key="csv" 
        icon={<FileExcelOutlined />}
        onClick={() => handleExport('csv')}
      >
        Export as CSV
      </Menu.Item>
      <Menu.Item 
        key="json" 
        icon={<FileTextOutlined />}
        onClick={() => handleExport('json')}
      >
        Export as JSON
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button icon={<DownloadOutlined />} loading={loading}>
        Export
      </Button>
    </Dropdown>
  );
};
