import React, { useState } from 'react';
import styled from 'styled-components';
import { Check, X, Edit2, AlertTriangle } from 'lucide-react';
import { ConfidenceBar } from './ConfidenceBar';

const PreviewContainer = styled.div`
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const CommandText = styled.div<{ isEditing: boolean }>`
  background: ${props => props.isEditing ? '#F9FAFB' : '#F0F9FF'};
  border: 1px solid ${props => props.isEditing ? '#D1D5DB' : '#7DD3FC'};
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #1F2937;
  margin-bottom: 12px;
  min-height: 40px;
  outline: none;
  
  &:focus {
    border-color: #0EA5E9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }
`;

const ParsedAction = styled.div`
  background: #F0FDF4;
  border: 1px solid #86EFAC;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
`;

const ActionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #065F46;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ActionDetails = styled.div`
  font-size: 14px;
  color: #047857;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
`;

const ActionKey = styled.span`
  font-weight: 600;
  min-width: 80px;
`;

const ActionValue = styled.span`
  color: #059669;
`;

const WarningBox = styled.div`
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const WarningText = styled.div`
  font-size: 13px;
  color: #92400E;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  border: none;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #0EA5E9, #38BDF8);
          color: white;
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
          }
        `;
      case 'secondary':
        return `
          background: white;
          color: #6B7280;
          border: 1px solid #D1D5DB;
          &:hover {
            background: #F9FAFB;
          }
        `;
      case 'danger':
        return `
          background: white;
          color: #EF4444;
          border: 1px solid #FCA5A5;
          &:hover {
            background: #FEF2F2;
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface ParsedAction {
  intent: string;
  entities: Record<string, any>;
  description: string;
}

interface CommandPreviewProps {
  command: string;
  parsedAction?: ParsedAction;
  confidence?: number;
  onConfirm: () => void;
  onEdit: (newCommand: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const CommandPreview: React.FC<CommandPreviewProps> = ({
  command,
  parsedAction,
  confidence = 0,
  onConfirm,
  onEdit,
  onCancel,
  isProcessing = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCommand, setEditedCommand] = useState(command);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit(editedCommand);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedCommand(command);
  };

  const showWarning = confidence > 0 && confidence < 0.7;

  return (
    <PreviewContainer>
      <Header>
        <Title>Command Preview</Title>
        {!isEditing && (
          <Button variant="secondary" onClick={handleEdit}>
            <Edit2 size={14} />
            Edit
          </Button>
        )}
      </Header>

      {isEditing ? (
        <>
          <CommandText
            as="textarea"
            isEditing={isEditing}
            value={editedCommand}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedCommand(e.target.value)}
            autoFocus
            rows={2}
          />
          <ButtonGroup>
            <Button variant="secondary" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              <Check size={14} />
              Save
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <CommandText isEditing={false}>
            "{command}"
          </CommandText>

          {confidence > 0 && (
            <ConfidenceBar
              confidence={confidence}
              threshold={0.7}
              showPercentage={true}
              showLabel={true}
            />
          )}

          {showWarning && (
            <WarningBox>
              <AlertTriangle size={16} color="#F59E0B" />
              <WarningText>
                Low confidence detected. Please review the command or try speaking more clearly.
              </WarningText>
            </WarningBox>
          )}

          {parsedAction && (
            <ParsedAction>
              <ActionLabel>Parsed Action</ActionLabel>
              <ActionDetails>
                <ActionItem>
                  <ActionKey>Intent:</ActionKey>
                  <ActionValue>{parsedAction.intent}</ActionValue>
                </ActionItem>
                {Object.entries(parsedAction.entities).map(([key, value]) => (
                  <ActionItem key={key}>
                    <ActionKey>{key}:</ActionKey>
                    <ActionValue>{String(value)}</ActionValue>
                  </ActionItem>
                ))}
                {parsedAction.description && (
                  <ActionItem>
                    <ActionValue style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      {parsedAction.description}
                    </ActionValue>
                  </ActionItem>
                )}
              </ActionDetails>
            </ParsedAction>
          )}

          <ButtonGroup>
            <Button variant="danger" onClick={onCancel} disabled={isProcessing}>
              <X size={14} />
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm} disabled={isProcessing}>
              <Check size={14} />
              {isProcessing ? 'Processing...' : 'Confirm & Execute'}
            </Button>
          </ButtonGroup>
        </>
      )}
    </PreviewContainer>
  );
};
