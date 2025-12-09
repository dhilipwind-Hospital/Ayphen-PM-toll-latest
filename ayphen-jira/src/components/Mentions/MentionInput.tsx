import React, { useState, useRef } from 'react';
import { Input, List, Avatar, Popover } from 'antd';
import styled from 'styled-components';
import { useStore } from '../../store/useStore';

const { TextArea } = Input;

const MentionList = styled(List)`
  max-height: 200px;
  overflow-y: auto;
  width: 250px;
`;

interface MentionInputProps {
  value?: string;
  onChange?: (value: string, mentions: string[]) => void;
  placeholder?: string;
  rows?: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Type @ to mention someone...',
  rows = 4
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<any>(null);
  const { users } = useStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      setCursorPosition(cursorPos);
    } else {
      setShowMentions(false);
    }

    const mentions = (newValue.match(/@\w+/g) || []).map(m => m.substring(1));
    
    if (onChange) {
      onChange(newValue, mentions);
    }
  };

  const handleMentionSelect = (user: any) => {
    const textBeforeMention = value.substring(0, cursorPosition - mentionQuery.length - 1);
    const textAfterCursor = value.substring(cursorPosition);
    const newValue = `${textBeforeMention}@${user.name} ${textAfterCursor}`;
    
    const mentions = (newValue.match(/@\w+/g) || []).map(m => m.substring(1));
    
    if (onChange) {
      onChange(newValue, mentions);
    }
    
    setShowMentions(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  const mentionsList = (
    <MentionList
      dataSource={filteredUsers}
      renderItem={(user: any) => (
        <List.Item 
          onClick={() => handleMentionSelect(user)}
          style={{ cursor: 'pointer', padding: '8px 12px' }}
        >
          <List.Item.Meta
            avatar={<Avatar size="small">{user.name[0]}</Avatar>}
            title={user.name}
            description={user.email}
          />
        </List.Item>
      )}
    />
  );

  return (
    <Popover
      content={mentionsList}
      open={showMentions && filteredUsers.length > 0}
      placement="bottomLeft"
      trigger="manual"
    >
      <TextArea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        rows={rows}
      />
    </Popover>
  );
};