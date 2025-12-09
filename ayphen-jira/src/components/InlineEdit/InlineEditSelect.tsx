import React, { useState } from 'react';
import { Select, message } from 'antd';
import styled from 'styled-components';

interface Option {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}

interface InlineEditSelectProps {
  value: string;
  options: Option[];
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  renderValue?: (option: Option) => React.ReactNode;
}

const InlineEditSelect: React.FC<InlineEditSelectProps> = ({
  value,
  options,
  onSave,
  placeholder = 'Select...',
  className,
  renderValue
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  const handleChange = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);

    try {
      await onSave(newValue);
      setIsEditing(false);
      message.success('Updated successfully');
    } catch (err: any) {
      message.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <ViewMode onClick={() => setIsEditing(true)} className={className}>
        {selectedOption ? (
          renderValue ? (
            renderValue(selectedOption)
          ) : (
            <OptionDisplay>
              {selectedOption.icon && <IconWrapper>{selectedOption.icon}</IconWrapper>}
              <span>{selectedOption.label}</span>
            </OptionDisplay>
          )
        ) : (
          <Placeholder>{placeholder}</Placeholder>
        )}
      </ViewMode>
    );
  }

  return (
    <EditMode className={className}>
      <StyledSelect
        value={value}
        onChange={handleChange}
        onBlur={() => !saving && setIsEditing(false)}
        options={options.map(opt => ({
          label: (
            <OptionDisplay>
              {opt.icon && <IconWrapper>{opt.icon}</IconWrapper>}
              <span>{opt.label}</span>
            </OptionDisplay>
          ),
          value: opt.value
        }))}
        open={isEditing}
        autoFocus
        loading={saving}
        disabled={saving}
        style={{ width: '100%' }}
      />
    </EditMode>
  );
};

const ViewMode = styled.div`
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 32px;
  display: flex;
  align-items: center;

  &:hover {
    background: #fafafa;
    border-color: #d9d9d9;
  }
`;

const EditMode = styled.div`
  position: relative;
`;

const StyledSelect = styled(Select)`
  width: 100%;
`;

const OptionDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
`;

const Placeholder = styled.span`
  color: #bfbfbf;
  font-style: italic;
`;

export default InlineEditSelect;
