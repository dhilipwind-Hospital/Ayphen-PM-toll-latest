import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { FileText } from 'lucide-react';
import { TemplateSelector } from './TemplateSelector';

interface TemplateButtonProps {
  issueType: string;
  issueSummary: string;
  onTemplateSelected: (description: string) => void;
  projectId?: string;
  epicId?: string;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
}

/**
 * Template Button Component
 * Triggers the template selector modal
 */
export const TemplateButton: React.FC<TemplateButtonProps> = ({
  issueType,
  issueSummary,
  onTemplateSelected,
  projectId,
  epicId,
  disabled = false,
  size = 'middle',
  block = false
}) => {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  return (
    <>
      <Tooltip title="Use a pre-built template with AI auto-fill">
        <Button
          icon={<FileText size={16} />}
          onClick={() => setShowTemplateSelector(true)}
          disabled={disabled}
          size={size}
          block={block}
        >
          Use Template
        </Button>
      </Tooltip>

      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        issueType={issueType}
        issueSummary={issueSummary}
        onTemplateSelected={(description) => {
          onTemplateSelected(description);
          setShowTemplateSelector(false);
        }}
        projectId={projectId}
        epicId={epicId}
      />
    </>
  );
};
