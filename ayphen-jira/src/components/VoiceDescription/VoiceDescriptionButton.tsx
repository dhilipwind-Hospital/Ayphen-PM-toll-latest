import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { Mic } from 'lucide-react';
import styled from 'styled-components';
import { VoiceDescriptionModal } from './VoiceDescriptionModal';

const VoiceButton = styled(Button)<{ $isRecording?: boolean }>`
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.$isRecording ? '#0EA5E9' : '#d9d9d9'};
  background: ${props => props.$isRecording ? '#F0F9FF' : 'white'};
  transition: all 0.3s ease;

  &:hover {
    border-color: #0EA5E9;
    background: #F0F9FF;
    transform: scale(1.05);
  }

  svg {
    color: ${props => props.$isRecording ? '#0EA5E9' : '#666'};
  }

  ${props => props.$isRecording && `
    animation: pulse 1.5s ease-in-out infinite;
  `}

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(14, 165, 233, 0);
    }
  }
`;

interface VoiceDescriptionButtonProps {
  issueType: 'story' | 'bug' | 'task' | 'epic' | 'subtask';
  issueSummary?: string;
  projectId?: string;
  epicId?: string;
  parentIssueId?: string;
  currentDescription?: string;
  onTextGenerated: (text: string) => void;
  disabled?: boolean;
}

export const VoiceDescriptionButton: React.FC<VoiceDescriptionButtonProps> = ({
  issueType,
  issueSummary,
  projectId,
  epicId,
  parentIssueId,
  currentDescription,
  onTextGenerated,
  disabled = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (!disabled) {
      setModalOpen(true);
    }
  };

  const handleTextGenerated = (text: string) => {
    onTextGenerated(text);
    setModalOpen(false);
  };

  return (
    <>
      <Tooltip title="Use AI Voice Assistant to write description">
        <VoiceButton
          icon={<Mic size={18} />}
          onClick={handleOpenModal}
          disabled={disabled}
          type="text"
        />
      </Tooltip>

      <VoiceDescriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        issueType={issueType}
        issueSummary={issueSummary || ''}
        projectId={projectId}
        epicId={epicId}
        parentIssueId={parentIssueId}
        currentDescription={currentDescription}
        onTextGenerated={handleTextGenerated}
      />
    </>
  );
};
