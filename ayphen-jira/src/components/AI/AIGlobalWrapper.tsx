import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoiceCommandModal } from '../VoiceCommand/VoiceCommandButton';
import { PredictiveAlertsWidget } from '../PredictiveAlerts/PredictiveAlertsWidget';
import { useStore } from '../../store/useStore';

interface AIGlobalWrapperProps {
    children: React.ReactNode;
}

export const AIGlobalWrapper: React.FC<AIGlobalWrapperProps> = ({ children }) => {
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const { currentProject } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Add keyboard shortcut for voice command (Cmd+K or Ctrl+K)
        const handleKeyShortcut = (e: KeyboardEvent) => {
            // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsVoiceModalOpen(true);
            }

            // ESC to close
            if (e.key === 'Escape' && isVoiceModalOpen) {
                setIsVoiceModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyShortcut);
        return () => window.removeEventListener('keydown', handleKeyShortcut);
    }, [isVoiceModalOpen]);

    return (
        <>
            {children}

            {/* Voice Command Modal with Keyboard Shortcut */}
            <VoiceCommandModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                projectId={currentProject?.id}
            />

            {/* Predictive Alerts Widget */}
            {currentProject && (
                <PredictiveAlertsWidget
                    projectId={currentProject.id}
                    onNavigate={(route: string) => navigate(route)}
                />
            )}
        </>
    );
};
