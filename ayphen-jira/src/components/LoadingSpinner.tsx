import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Spin } from 'antd';
import { Loader2 } from 'lucide-react';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div<{ $fullscreen?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  ${props => props.$fullscreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  `}
  ${props => !props.$fullscreen && `
    padding: 40px;
    min-height: 200px;
  `}
`;

const SpinnerIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
  color: #1890ff;
`;

const LoadingText = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

interface LoadingSpinnerProps {
  text?: string;
  fullscreen?: boolean;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
  fullscreen = false,
  size = 48,
}) => {
  return (
    <SpinnerContainer $fullscreen={fullscreen}>
      <SpinnerIcon size={size} />
      {text && <LoadingText>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

// Inline loading for buttons
export const InlineLoader = styled(Spin)`
  margin-right: 8px;
`;

// Skeleton loading for lists
export const SkeletonCard = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${keyframes`
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  `} 1.5s ease-in-out infinite;
  border-radius: 8px;
  height: 120px;
  margin-bottom: 16px;
`;

export const SkeletonLine = styled.div<{ width?: string }>`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${keyframes`
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  `} 1.5s ease-in-out infinite;
  border-radius: 4px;
  height: 16px;
  width: ${props => props.width || '100%'};
  margin-bottom: 12px;
`;
