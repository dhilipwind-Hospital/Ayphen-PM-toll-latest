import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../../theme/colors';
import { AlertTriangle, TrendingDown, Users, Calendar, Bug, X } from 'lucide-react';
import axios from 'axios';

const AlertsContainer = styled.div`
  position: fixed;
  top: 70px;
  right: 20px;
  width: 400px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Alert = styled.div<{ severity: 'info' | 'warning' | 'critical' }>`
  background: ${colors.background.paper};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-left: 4px solid ${props => {
        if (props.severity === 'critical') return '#f44336';
        if (props.severity === 'warning') return '#ff9800';
        return '#2196f3';
    }};
  animation: slideIn 0.3s ease;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const AlertHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const AlertTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${colors.text.primary};
`;

const AlertIcon = styled.div<{ severity: string }>`
  color: ${props => {
        if (props.severity === 'critical') return '#f44336';
        if (props.severity === 'warning') return '#ff9800';
        return '#2196f3';
    }};
  display: flex;
  align-items: center;
`;

const DismissButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.text.secondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: ${colors.text.primary};
  }
`;

const AlertMessage = styled.div`
  font-size: 13px;
  color: ${colors.text.secondary};
  line-height: 1.5;
  margin-bottom: 12px;
`;

const AlertAction = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const CategoryBadge = styled.span<{ category: string }>`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${props => {
        switch (props.category) {
            case 'velocity': return 'rgba(33, 150, 243, 0.1)';
            case 'workload': return 'rgba(156, 39, 176, 0.1)';
            case 'deadline': return 'rgba(244, 67, 54, 0.1)';
            case 'quality': return 'rgba(255, 152, 0, 0.1)';
            default: return 'rgba(158, 158, 158, 0.1)';
        }
    }};
  color: ${props => {
        switch (props.category) {
            case 'velocity': return '#2196f3';
            case 'workload': return '#9c27b0';
            case 'deadline': return '#f44336';
            case 'quality': return '#ff9800';
            default: return '#9e9e9e';
        }
    }};
  margin-left: 8px;
`;

interface AlertData {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    action?: {
        label: string;
        route?: string;
        handler?: string;
    };
    category: 'velocity' | 'workload' | 'deadline' | 'quality' | 'collaboration';
}

interface PredictiveAlertsWidgetProps {
    projectId: string;
    onNavigate?: (route: string) => void;
}

export const PredictiveAlertsWidget: React.FC<PredictiveAlertsWidgetProps> = ({ projectId, onNavigate }) => {
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [projectId]);

    const fetchAlerts = async () => {
        try {
            const response = await axios.get(`http://localhost:8500/api/predictive-alerts/${projectId}`);
            if (response.data.success) {
                setAlerts(response.data.alerts.filter((a: AlertData) => !dismissedAlerts.has(a.id)));
            }
        } catch (error) {
            console.error('Failed to fetch predictive alerts:', error);
        }
    };

    const handleDismiss = async (alertId: string) => {
        setDismissedAlerts(prev => new Set(prev).add(alertId));
        setAlerts(prev => prev.filter(a => a.id !== alertId));

        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`http://localhost:8500/api/predictive-alerts/dismiss/${alertId}`, { userId });
        } catch (error) {
            console.error('Failed to dismiss alert:', error);
        }
    };

    const handleAction = (alert: AlertData) => {
        if (alert.action?.route && onNavigate) {
            onNavigate(alert.action.route);
        }
        // You can add custom handlers here for specific actions
    };

    const getIcon = (category: string, severity: string) => {
        const size = 18;
        switch (category) {
            case 'velocity':
                return <TrendingDown size={size} />;
            case 'workload':
                return <Users size={size} />;
            case 'deadline':
                return <Calendar size={size} />;
            case 'quality':
                return <Bug size={size} />;
            default:
                return <AlertTriangle size={size} />;
        }
    };

    if (alerts.length === 0) return null;

    return (
        <AlertsContainer>
            {alerts.map(alert => (
                <Alert key={alert.id} severity={alert.severity}>
                    <AlertHeader>
                        <AlertTitle>
                            <AlertIcon severity={alert.severity}>
                                {getIcon(alert.category, alert.severity)}
                            </AlertIcon>
                            {alert.title}
                            <CategoryBadge category={alert.category}>
                                {alert.category}
                            </CategoryBadge>
                        </AlertTitle>
                        <DismissButton onClick={() => handleDismiss(alert.id)}>
                            <X size={16} />
                        </DismissButton>
                    </AlertHeader>
                    <AlertMessage>{alert.message}</AlertMessage>
                    {alert.action && (
                        <AlertAction onClick={() => handleAction(alert)}>
                            {alert.action.label}
                        </AlertAction>
                    )}
                </Alert>
            ))}
        </AlertsContainer>
    );
};
