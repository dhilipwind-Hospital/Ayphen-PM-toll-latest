import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../../theme/colors';
import { Bot, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { ENV } from '../../config/env';

const DashboardCard = styled.div`
  background: ${colors.background.paper};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BotIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: ${colors.background.default};
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid ${(props: { color: string }) => props.color};
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${colors.text.primary};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ActivityList = styled.div`
  margin-top: 20px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: ${colors.background.default};
  transition: all 0.2s;
  
  &:hover {
    background: ${colors.background.paper};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const ActivityIcon = styled.div<{ type: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => {
        if (props.type === 'assignment') return 'rgba(76, 175, 80, 0.1)';
        if (props.type === 'stale') return 'rgba(255, 152, 0, 0.1)';
        if (props.type === 'triage') return 'rgba(33, 150, 243, 0.1)';
        return 'rgba(158, 158, 158, 0.1)';
    }};
  color: ${props => {
        if (props.type === 'assignment') return '#4caf50';
        if (props.type === 'stale') return '#ff9800';
        if (props.type === 'triage') return '#2196f3';
        return '#9e9e9e';
    }};
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text.primary};
  margin-bottom: 4px;
`;

const ActivityMeta = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${colors.text.secondary};
`;

interface PMBotActivity {
    type: 'assignment' | 'stale' | 'triage';
    message: string;
    timestamp: string;
    issueKey?: string;
}

interface PMBotDashboardProps {
    projectId: string;
}

export const PMBotDashboard: React.FC<PMBotDashboardProps> = ({ projectId }) => {
    const [stats, setStats] = useState({
        assignmentsToday: 0,
        staleIssuesDetected: 0,
        triagesPerformed: 0
    });
    const [activities, setActivities] = useState<PMBotActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPMBotData();
    }, [projectId]);

    const fetchPMBotData = async () => {
        try {
            const response = await axios.get(`${ENV.API_URL}/pmbot/activity/${projectId}?days=7`);
            if (response.data.success) {
                setStats(response.data.summary);
            }

            // Mock activities - in real implementation, fetch from backend
            setActivities([
                {
                    type: 'assignment',
                    message: 'Assigned PROJ-123 to John Doe based on expertise match',
                    timestamp: '2 minutes ago',
                    issueKey: 'PROJ-123'
                },
                {
                    type: 'stale',
                    message: 'Detected 3 stale issues and posted reminders',
                    timestamp: '1 hour ago'
                },
                {
                    type: 'triage',
                    message: 'Auto-triaged PROJ-124 with labels: frontend, security',
                    timestamp: '3 hours ago',
                    issueKey: 'PROJ-124'
                },
                {
                    type: 'assignment',
                    message: 'Assigned PROJ-125 to Sarah Smith (low workload)',
                    timestamp: '5 hours ago',
                    issueKey: 'PROJ-125'
                }
            ]);

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch PMBot data:', error);
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'assignment':
                return <CheckCircle size={16} />;
            case 'stale':
                return <AlertCircle size={16} />;
            case 'triage':
                return <TrendingUp size={16} />;
            default:
                return <Clock size={16} />;
        }
    };

    if (loading) {
        return (
            <DashboardCard>
                <EmptyState>Loading PMBot activity...</EmptyState>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard>
            <Header>
                <BotIcon>
                    <Bot size={22} />
                </BotIcon>
                <div>
                    <Title>PMBot Activity</Title>
                    <div style={{ fontSize: '12px', color: colors.text.secondary }}>
                        Autonomous project management assistant
                    </div>
                </div>
            </Header>

            <StatsGrid>
                <StatCard color="#4caf50">
                    <StatValue>{stats.assignmentsToday}</StatValue>
                    <StatLabel>
                        <CheckCircle size={16} />
                        Auto-Assignments This Week
                    </StatLabel>
                </StatCard>

                <StatCard color="#ff9800">
                    <StatValue>{stats.staleIssuesDetected}</StatValue>
                    <StatLabel>
                        <AlertCircle size={16} />
                        Stale Issues Detected
                    </StatLabel>
                </StatCard>

                <StatCard color="#2196f3">
                    <StatValue>{stats.triagesPerformed}</StatValue>
                    <StatLabel>
                        <TrendingUp size={16} />
                        Issues Triaged
                    </StatLabel>
                </StatCard>
            </StatsGrid>

            <ActivityList>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.text.secondary,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Recent Activity
                </div>

                {activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <ActivityItem key={index}>
                            <ActivityIcon type={activity.type}>
                                {getActivityIcon(activity.type)}
                            </ActivityIcon>
                            <ActivityContent>
                                <ActivityTitle>{activity.message}</ActivityTitle>
                                <ActivityMeta>
                                    {activity.timestamp}
                                    {activity.issueKey && ` • ${activity.issueKey}`}
                                </ActivityMeta>
                            </ActivityContent>
                        </ActivityItem>
                    ))
                ) : (
                    <EmptyState>No recent PMBot activity</EmptyState>
                )}
            </ActivityList>
        </DashboardCard>
    );
};
