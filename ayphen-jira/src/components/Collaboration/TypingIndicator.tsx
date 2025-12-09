import React from 'react';
import styled, { keyframes } from 'styled-components';

interface TypingUser {
  userId: string;
  userName: string;
  field: string;
  color: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
  field: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users, field }) => {
  const typingInField = users.filter(u => u.field === field);

  if (typingInField.length === 0) {
    return null;
  }

  const names = typingInField.map(u => u.userName).join(', ');
  const verb = typingInField.length === 1 ? 'is' : 'are';

  return (
    <Container>
      <DotsContainer>
        <Dot delay={0} color={typingInField[0].color} />
        <Dot delay={0.2} color={typingInField[0].color} />
        <Dot delay={0.4} color={typingInField[0].color} />
      </DotsContainer>
      <Text>
        <strong>{names}</strong> {verb} typing...
      </Text>
    </Container>
  );
};

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
  color: #595959;
  margin-top: 4px;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 3px;
`;

const Dot = styled.div<{ delay: number; color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.color};
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
`;

const Text = styled.span`
  strong {
    color: #262626;
  }
`;

export default TypingIndicator;
