import React, { useState, useRef, useEffect } from 'react';
import { Input, message } from 'antd';
import styled from 'styled-components';

interface InlineEditTextProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  validation?: (value: string) => string | null;
  multiline?: boolean;
  className?: string;
}

const InlineEditText: React.FC<InlineEditTextProps> = ({
  value,
  onSave,
  placeholder = 'Click to edit',
  validation,
  multiline = false,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.resizableTextArea) {
        inputRef.current.resizableTextArea.textArea.select();
      } else {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    // Validation
    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Don't save if value hasn't changed
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(editValue);
      setIsEditing(false);
      message.success('Updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
      message.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <ViewMode
        onClick={() => setIsEditing(true)}
        className={className}
        $empty={!value}
      >
        {value || placeholder}
      </ViewMode>
    );
  }

  return (
    <EditMode className={className}>
      {multiline ? (
        <StyledTextArea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoSize={{ minRows: 2, maxRows: 10 }}
          status={error ? 'error' : ''}
          disabled={saving}
        />
      ) : (
        <StyledInput
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          status={error ? 'error' : ''}
          disabled={saving}
        />
      )}
      {error && <ErrorText>{error}</ErrorText>}
      <Hint>Press Enter to save, Esc to cancel</Hint>
    </EditMode>
  );
};

const ViewMode = styled.div<{ $empty: boolean }>`
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: text;
  transition: all 0.2s;
  min-height: 38px;
  display: flex;
  align-items: center;
  color: ${props => props.$empty ? '#bfbfbf' : '#262626'};
  font-style: ${props => props.$empty ? 'italic' : 'normal'};

  &:hover {
    background: #fafafa;
    border-color: #d9d9d9;
  }
`;

const EditMode = styled.div`
  position: relative;
`;

const StyledInput = styled(Input)`
  font-size: 14px;
`;

const StyledTextArea = styled(Input.TextArea)`
  font-size: 14px;
`;

const ErrorText = styled.div`
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
`;

const Hint = styled.div`
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 4px;
`;

export default InlineEditText;
