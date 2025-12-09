import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
`;

const ToastItem = styled.div<{ $type: ToastType; $exiting: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid ${props => {
    switch (props.$type) {
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info': return '#1890ff';
      default: return '#d9d9d9';
    }
  }};
  animation: ${props => props.$exiting ? slideOut : slideIn} 0.3s ease-out;
  min-width: 300px;
`;

const IconWrapper = styled.div<{ $type: ToastType }>`
  flex-shrink: 0;
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info': return '#1890ff';
      default: return '#d9d9d9';
    }
  }};
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
`;

const Message = styled.div`
  font-size: 13px;
  color: #595959;
  line-height: 1.5;
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #8c8c8c;
  transition: color 0.2s;
  
  &:hover {
    color: #262626;
  }
`;

const ActionButton = styled.button`
  margin-top: 8px;
  padding: 4px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #e0e0e0;
  }
`;

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { ...toast, id, exiting: false };
    
    setToasts(prev => [...prev, newToast]);

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', message, title: title || 'Success' });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', message, title: title || 'Error' });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', message, title: title || 'Warning' });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', message, title: title || 'Info' });
  }, [showToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <XCircle size={20} />;
      case 'warning': return <AlertCircle size={20} />;
      case 'info': return <Info size={20} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <ToastItem key={toast.id} $type={toast.type} $exiting={toast.exiting || false}>
            <IconWrapper $type={toast.type}>
              {getIcon(toast.type)}
            </IconWrapper>
            <Content>
              {toast.title && <Title>{toast.title}</Title>}
              <Message>{toast.message}</Message>
              {toast.action && (
                <ActionButton onClick={toast.action.onClick}>
                  {toast.action.label}
                </ActionButton>
              )}
            </Content>
            <CloseButton onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </CloseButton>
          </ToastItem>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};
