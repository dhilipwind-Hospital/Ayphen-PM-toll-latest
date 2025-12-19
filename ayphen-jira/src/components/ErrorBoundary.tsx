import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, Result } from "antd";

interface Props {
  children?: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: '#fff', borderRadius: 8, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            status="warning"
            title={this.props.title || "Widget Error"}
            subTitle="This component failed to load."
            extra={
              <Button type="primary" size="small" onClick={() => this.setState({ hasError: false })}>
                Retry
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
