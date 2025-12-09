import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Input, Select, DatePicker } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import { Check, X, Edit2 } from 'lucide-react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const Container = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
`;

const DisplayValue = styled.div<{ $editable?: boolean; $empty?: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  cursor: ${props => props.$editable ? 'pointer' : 'default'};
  transition: all 0.2s;
  color: ${props => props.$empty ? '#8c8c8c' : '#262626'};
  font-style: ${props => props.$empty ? 'italic' : 'normal'};
  min-height: 32px;
  display: flex;
  align-items: center;
  
  ${props => props.$editable && `
    &:hover {
      background: #f5f5f5;
      
      .edit-icon {
        opacity: 1;
      }
    }
  `}
`;

const EditIcon = styled(Edit2)`
  opacity: 0;
  margin-left: 8px;
  transition: opacity 0.2s;
  flex-shrink: 0;
`;

const EditContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
`;

const InputWrapper = styled.div`
  flex: 1;
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

const ActionButton = styled.button<{ $type?: 'save' | 'cancel' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$type === 'save' ? '#1890ff' : '#f0f0f0'};
  color: ${props => props.$type === 'save' ? 'white' : '#595959'};
  
  &:hover {
    background: ${props => props.$type === 'save' ? '#40a9ff' : '#e0e0e0'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

type EditType = 'text' | 'textarea' | 'number' | 'select' | 'date';

interface InlineEditProps {
  value: any;
  onSave: (value: any) => Promise<void> | void;
  type?: EditType;
  placeholder?: string;
  options?: { label: string; value: any }[];
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  format?: (value: any) => string;
  validate?: (value: any) => boolean | string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  type = 'text',
  placeholder = 'Click to edit',
  options = [],
  disabled = false,
  required = false,
  multiline = false,
  rows = 3,
  format,
  validate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      if (type === 'textarea') {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      } else if (inputRef.current.focus) {
        inputRef.current.focus();
      }
    }
  }, [isEditing, type]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    // Validation
    if (required && !editValue) {
      setError('This field is required');
      return;
    }

    if (validate) {
      const validationResult = validate(editValue);
      if (validationResult !== true) {
        setError(typeof validationResult === 'string' ? validationResult : 'Invalid value');
        return;
      }
    }

    // Save
    setIsSaving(true);
    setError(null);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && !e.shiftKey && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    }
  };

  const formatDisplayValue = () => {
    if (!value && value !== 0) {
      return placeholder;
    }

    if (format) {
      return format(value);
    }

    if (type === 'select') {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    }

    if (type === 'date' && value) {
      return dayjs(value).format('MMM DD, YYYY');
    }

    return String(value);
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Input.TextArea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={rows}
            placeholder={placeholder}
            status={error ? 'error' : undefined}
            autoSize={{ minRows: rows, maxRows: 10 }}
          />
        );

      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            status={error ? 'error' : undefined}
          />
        );

      case 'select':
        return (
          <Select
            ref={inputRef}
            value={editValue}
            onChange={setEditValue}
            options={options}
            placeholder={placeholder}
            style={{ width: '100%' }}
            status={error ? 'error' : undefined}
          />
        );

      case 'date':
        return (
          <DatePicker
            ref={inputRef}
            value={editValue ? dayjs(editValue) : null}
            onChange={(date: Dayjs | null) => setEditValue(date ? date.toISOString() : null)}
            placeholder={placeholder}
            style={{ width: '100%' }}
            status={error ? 'error' : undefined}
          />
        );

      default:
        return (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            status={error ? 'error' : undefined}
          />
        );
    }
  };

  if (isEditing) {
    return (
      <Container>
        <EditContainer>
          <InputWrapper>
            {renderInput()}
            {error && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {error}
              </div>
            )}
          </InputWrapper>
          <Actions>
            <ActionButton
              $type="save"
              onClick={handleSave}
              disabled={isSaving}
              title="Save (Enter)"
            >
              <Check size={14} />
            </ActionButton>
            <ActionButton
              $type="cancel"
              onClick={handleCancel}
              disabled={isSaving}
              title="Cancel (Esc)"
            >
              <X size={14} />
            </ActionButton>
          </Actions>
        </EditContainer>
      </Container>
    );
  }

  return (
    <Container>
      <DisplayValue
        $editable={!disabled}
        $empty={!value && value !== 0}
        onClick={handleEdit}
      >
        {formatDisplayValue()}
        {!disabled && <EditIcon size={14} className="edit-icon" />}
      </DisplayValue>
    </Container>
  );
};

// Specialized inline edit components
export const InlineTextEdit: React.FC<Omit<InlineEditProps, 'type'>> = (props) => (
  <InlineEdit {...props} type="text" />
);

export const InlineTextAreaEdit: React.FC<Omit<InlineEditProps, 'type' | 'multiline'>> = (props) => (
  <InlineEdit {...props} type="textarea" multiline />
);

export const InlineNumberEdit: React.FC<Omit<InlineEditProps, 'type'>> = (props) => (
  <InlineEdit {...props} type="number" />
);

export const InlineSelectEdit: React.FC<Omit<InlineEditProps, 'type'> & { options: { label: string; value: any }[] }> = (props) => (
  <InlineEdit {...props} type="select" />
);

export const InlineDateEdit: React.FC<Omit<InlineEditProps, 'type'>> = (props) => (
  <InlineEdit {...props} type="date" />
);
