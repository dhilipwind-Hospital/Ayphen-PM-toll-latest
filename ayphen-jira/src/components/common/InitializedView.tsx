import React from 'react';
import { Spin } from 'antd';
import { useStore } from '../../store/useStore';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
`;

interface InitializedViewProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that shows loading spinner until store is initialized
 * Prevents flash of "No Project" messages on page load
 */
export const InitializedView: React.FC<InitializedViewProps> = ({ children }) => {
  const { isInitialized } = useStore();

  if (!isInitialized) {
    return (
      <Container>
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      </Container>
    );
  }

  return <>{children}</>;
};
