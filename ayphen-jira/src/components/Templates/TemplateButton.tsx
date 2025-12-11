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
  hasContent?: boolean; // If true, shows "Template Applied" instead
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
  block = false,
  hasContent = false
}) => {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateUsed, setTemplateUsed] = useState(false);

  // Button is disabled if already used or has content
  const isDisabled = disabled || templateUsed || hasContent;

  return (
    <>
      <Tooltip title={isDisabled ? "Template already applied" : "Use a pre-built template with AI auto-fill"}>
        <Button
          icon={<FileText size={16} />}
          onClick={() => setShowTemplateSelector(true)}
          disabled={isDisabled}
          size={size}
          block={block}
          style={isDisabled ? { opacity: 0.6 } : undefined}
        >
          {templateUsed || hasContent ? 'Template Applied' : 'Use Template'}
        </Button>
      </Tooltip>

      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        issueType={issueType}
        issueSummary={issueSummary}
        onTemplateSelected={(description) => {
          onTemplateSelected(description);
          setTemplateUsed(true);
          setShowTemplateSelector(false);
        }}
        projectId={projectId}
        epicId={epicId}
      />
    </>
  );
};
