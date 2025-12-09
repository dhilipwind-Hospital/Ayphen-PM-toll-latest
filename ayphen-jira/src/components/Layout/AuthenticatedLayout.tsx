import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Spin, FloatButton } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { TopNavigation } from './TopNavigation';
import { ProjectSidebar } from './ProjectSidebar';
import { QuickActionsFAB } from '../QuickActions/QuickActionsFAB';
import { ShortcutsPanel } from '../KeyboardShortcuts/ShortcutsPanel';
import { ArrowUp } from 'lucide-react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { AIGlobalWrapper } from '../AI/AIGlobalWrapper';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: transparent; /* Let body gradient show through */
`;

const MainLayout = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  margin-top: 96px; /* 16px top + 64px header + 16px gap */
  height: calc(100vh - 96px);
`;

const StyledContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background: transparent;
  padding: 16px; /* Added padding for content breathing room */
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f5f5;
`;

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [shortcutsVisible, setShortcutsVisible] = useState(false);
  
  // Initialize keyboard shortcuts (must be inside Router context)
  useKeyboardShortcuts();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        setShortcutsVisible(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" tip="Loading..." />
      </LoadingContainer>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <AIGlobalWrapper>
      <AppContainer>
        <TopNavigation />
        <MainLayout>
          <ProjectSidebar />
          <StyledContent>
            {children}
          </StyledContent>
        </MainLayout>
        <QuickActionsFAB />
        <FloatButton.BackTop icon={<ArrowUp size={16} />} />
        <ShortcutsPanel visible={shortcutsVisible} onClose={() => setShortcutsVisible(false)} />
      </AppContainer>
    </AIGlobalWrapper>
  );
};
