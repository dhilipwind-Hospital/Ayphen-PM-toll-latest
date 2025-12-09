import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  background: #f5f5f5;
`;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <Result
            status="error"
            title="Something went wrong"
            subTitle="The application encountered an error. Please try logging in again."
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                Go to Login
              </Button>,
              <Button key="refresh" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>,
            ]}
          />
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}
