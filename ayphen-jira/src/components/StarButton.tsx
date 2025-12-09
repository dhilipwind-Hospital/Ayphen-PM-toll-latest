import React, { useState } from 'react';
import styled from 'styled-components';
import { Star } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

const StyledButton = styled.button<{ $isStarred: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  color: ${props => props.$isStarred ? '#faad14' : '#8c8c8c'};
  
  &:hover {
    background: #f5f5f5;
    color: ${props => props.$isStarred ? '#d48806' : '#595959'};
  }
  
  svg {
    fill: ${props => props.$isStarred ? 'currentColor' : 'none'};
  }
`;

interface StarButtonProps {
  issueId: string;
  isStarred: boolean;
  onToggle?: (isStarred: boolean) => void;
  size?: number;
}

export const StarButton: React.FC<StarButtonProps> = ({
  issueId,
  isStarred: initialIsStarred,
  onToggle,
  size = 18,
}) => {
  const [isStarred, setIsStarred] = useState(initialIsStarred);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events

    if (isLoading) return;

    setIsLoading(true);
    const newStarredState = !isStarred;

    try {
      // Optimistic update
      setIsStarred(newStarredState);

      // API call
      if (newStarredState) {
        await axios.post(`/api/issues/${issueId}/star`);
        success('Added to starred issues');
      } else {
        await axios.delete(`/api/issues/${issueId}/star`);
        success('Removed from starred issues');
      }

      // Notify parent
      if (onToggle) {
        onToggle(newStarredState);
      }
    } catch (err) {
      // Revert on error
      setIsStarred(!newStarredState);
      error('Failed to update starred status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledButton
      $isStarred={isStarred}
      onClick={handleToggle}
      disabled={isLoading}
      title={isStarred ? 'Remove from starred' : 'Add to starred'}
    >
      <Star size={size} />
    </StyledButton>
  );
};
