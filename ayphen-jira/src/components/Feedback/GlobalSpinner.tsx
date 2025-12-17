import React from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '../../theme/colors';

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
`;

const SpinnerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 9999;
  backdrop-filter: blur(8px);
`;

const LogoWrapper = styled.div`
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LoadingText = styled.div`
  margin-top: 24px;
  color: ${colors.text.secondary};
  font-weight: 500;
  font-size: 16px;
`;

interface GlobalSpinnerProps {
  isLoading: boolean;
  text?: string;
}

export const GlobalSpinner: React.FC<GlobalSpinnerProps> = ({ isLoading, text = 'Loading application...' }) => {
  if (!isLoading) return null;

  return (
    <SpinnerContainer>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <LogoWrapper>
          <img
            src="/ayphen-logo-new.png"
            alt="Ayphen Technologies"
            style={{ width: '200px', display: 'block' }}
          />
        </LogoWrapper>
        <LoadingText>{text}</LoadingText>
      </div>
    </SpinnerContainer>
  );
};
