import React, { useState, useEffect } from 'react';
import { Select, Button, Tooltip, message } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Template {
  id: string;
  name: string;
  type: string;
  defaultFields: any;
}

interface TemplateSelectorProps {
  projectId?: string;
  onSelect: (fields: any) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ projectId, onSelect }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [projectId]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = projectId ? { projectId } : {};
      const { data } = await axios.get('https://ayphen-pm-toll-latest.onrender.com/api/issue-templates', { params });
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onSelect(template.defaultFields);
      message.success(`Template "${template.name}" applied`);
    }
  };

  if (templates.length === 0) return null;

  return (
    <Tooltip title="Apply a template to prefill fields">
      <Select
        placeholder={<><FileTextOutlined /> Use Template</>}
        style={{ width: 200 }}
        onChange={handleSelect}
        loading={loading}
        allowClear
      >
        {templates.map(template => (
          <Select.Option key={template.id} value={template.id}>
            {template.name} ({template.type})
          </Select.Option>
        ))}
      </Select>
    </Tooltip>
  );
};
