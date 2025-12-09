/**
 * Feedback Widget Component
 * Phase 9-10: Analytics & Learning
 * 
 * Allows users to provide feedback on voice commands
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import { message as antMessage } from 'antd';
import axios from 'axios';

const Widget = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const FeedbackButton = styled.button<{ active?: boolean; variant?: 'positive' | 'negative' }>`
  padding: 8px;
  border: none;
  background: ${props => {
    if (props.active && props.variant === 'positive') return '#10B981';
    if (props.active && props.variant === 'negative') return '#EF4444';
    return '#F3F4F6';
  }};
  color: ${props => props.active ? 'white' : '#6B7280'};
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => {
      if (props.variant === 'positive') return '#10B981';
      if (props.variant === 'negative') return '#EF4444';
      return '#E5E7EB';
    }};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CommentButton = styled(FeedbackButton)`
  &:hover {
    background: #3B82F6;
  }
`;

const CommentBox = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  width: 300px;
  z-index: 1000;
`;

const CommentInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 2px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: #3B82F6;
  }
`;

const CommentActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const SendButton = styled.button`
  padding: 6px 12px;
  border: none;
  background: #3B82F6;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;

  &:hover {
    background: #2563EB;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Container = styled.div`
  position: relative;
`;

interface FeedbackWidgetProps {
  commandId: string;
  transcript: string;
  onFeedbackSubmitted?: () => void;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  commandId,
  transcript,
  onFeedbackSubmitted
}) => {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = async (isPositive: boolean) => {
    const newRating = isPositive ? 'positive' : 'negative';
    setRating(newRating);

    try {
      const userId = localStorage.getItem('userId');
      
      await axios.post('/api/voice-learning/feedback/rating', {
        userId,
        commandId,
        isPositive
      });

      antMessage.success(isPositive ? '👍 Thanks for the feedback!' : '👎 Feedback recorded');
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      antMessage.error('Failed to submit feedback');
      setRating(null);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;

    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem('userId');
      
      await axios.post('/api/voice-learning/feedback/comment', {
        userId,
        commandId,
        comment: comment.trim(),
        transcript
      });

      antMessage.success('Comment submitted!');
      setComment('');
      setShowComment(false);
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      antMessage.error('Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Widget>
        <FeedbackButton
          active={rating === 'positive'}
          variant="positive"
          onClick={() => handleRating(true)}
          disabled={rating !== null}
          title="This worked well"
        >
          <ThumbsUp size={16} />
        </FeedbackButton>

        <FeedbackButton
          active={rating === 'negative'}
          variant="negative"
          onClick={() => handleRating(false)}
          disabled={rating !== null}
          title="This didn't work"
        >
          <ThumbsDown size={16} />
        </FeedbackButton>

        <CommentButton
          onClick={() => setShowComment(!showComment)}
          title="Add comment"
        >
          <MessageSquare size={16} />
        </CommentButton>
      </Widget>

      {showComment && (
        <CommentBox>
          <CommentInput
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            autoFocus
          />
          <CommentActions>
            <SendButton
              onClick={handleCommentSubmit}
              disabled={!comment.trim() || isSubmitting}
            >
              <Send size={14} />
              Send
            </SendButton>
          </CommentActions>
        </CommentBox>
      )}
    </Container>
  );
};
