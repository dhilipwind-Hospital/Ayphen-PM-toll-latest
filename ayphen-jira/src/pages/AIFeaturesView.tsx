import React from 'react';
import styled from 'styled-components';
import { colors } from '../theme/colors';
import { MeetingScribeForm } from '../components/MeetingScribe/MeetingScribeForm';
import { PMBotSettings } from '../components/PMBot/PMBotSettings';
import { PMBotDashboard } from '../components/PMBot/PMBotDashboard';
import { Tabs } from 'antd';
import { Bot, FileText, Settings, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.div`
  font-size: 16px;
  color: ${colors.text.secondary};
`;

const IconGradient = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-flex;
`;

export const AIFeaturesView: React.FC = () => {
    const { currentProject } = useStore();

    const items = [
        {
            key: '1',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={16} />
                    PMBot Dashboard
                </span>
            ),
            children: currentProject ? <PMBotDashboard projectId={currentProject.id} /> : <div>Please select a project</div>
        },
        {
            key: '2',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} />
                    Meeting Scribe
                </span>
            ),
            children: currentProject ? <MeetingScribeForm projectId={currentProject.id} /> : <div>Please select a project</div>
        },
        {
            key: '3',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={16} />
                    PMBot Settings
                </span>
            ),
            children: <PMBotSettings projectId={currentProject?.id} />
        }
    ];

    return (
        <Container>
            <Header>
                <Title>
                    <IconGradient>
                        <Bot size={36} />
                    </IconGradient>
                    AI Features
                </Title>
                <Subtitle>
                    Autonomous PM assistant, meeting scribe, and intelligent automation
                </Subtitle>
            </Header>

            <Tabs defaultActiveKey="1" items={items} size="large" />
        </Container>
    );
};
