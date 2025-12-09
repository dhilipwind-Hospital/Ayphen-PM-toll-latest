import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
`;

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <ErrorContainer>
                    <Result
                        status="500"
                        title="Something went wrong"
                        subTitle="Sorry, an unexpected error occurred."
                        extra={
                            <Button type="primary" onClick={() => window.location.reload()}>
                                Reload Page
                            </Button>
                        }
                    >
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 600, overflow: 'auto', maxHeight: 200, background: '#fff', padding: 10 }}>
                                <pre style={{ color: 'red' }}>{this.state.error.toString()}</pre>
                            </div>
                        )}
                    </Result>
                </ErrorContainer>
            );
        }

        return this.props.children;
    }
}
