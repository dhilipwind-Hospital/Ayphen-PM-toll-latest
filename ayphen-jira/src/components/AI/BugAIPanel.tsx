import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../../theme/colors';
import { Spin, Tag, Button, Collapse, Alert, List, Progress } from 'antd';
import {
    BugOutlined,
    ThunderboltOutlined,
    ExperimentOutlined,
    WarningOutlined,
    CodeOutlined,
    LinkOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Panel } = Collapse;

interface BugClassification {
    severity: string;
    tags: string[];
    priority: string;
    impact: string;
    estimatedUsers: number;
    confidence: number;
    reasoning: string;
}

interface SimilarBug {
    issueKey: string;
    title: string;
    similarity: number;
    resolution?: string;
}

interface RootCauseAnalysis {
    likelyFile: string;
    likelyFunction: string;
    confidence: number;
    reasoning: string;
}

interface BugAIAnalysis {
    classification: BugClassification;
    similarBugs: SimilarBug[];
    rootCause: RootCauseAnalysis;
    testCases: string[];
    impact: {
        userImpact: number;
        businessImpact: string;
        recommendedTimeframe: string;
        reasoning: string;
    };
}

interface Props {
    issueId: string;
    issueKey: string;
}

const PanelContainer = styled.div`
  background: ${colors.background.paper};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${colors.text.primary};
  }
`;

const AIBadge = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const Section = styled.div`
  margin-bottom: 16px;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: ${colors.text.primary};
    margin-bottom: 8px;
  }
`;

const ConfidenceBar = styled.div`
  margin-top: 8px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const BugAIPanel: React.FC<Props> = ({ issueId, issueKey }) => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<BugAIAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `https://ayphen-pm-toll-latest.onrender.com/api/bug-ai/full-analysis/${issueId}`
            );

            if (response.data.success) {
                setAnalysis(response.data.analysis);
            } else {
                setError('Analysis failed');
            }
        } catch (err: any) {
            console.error('Bug AI analysis error:', err);
            setError(err.response?.data?.error || 'Failed to run AI analysis');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Auto-run analysis when component mounts
        runAnalysis();
    }, [issueId]);

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'gold';
            case 'low': return 'blue';
            default: return 'default';
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact?.toLowerCase()) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'gold';
            case 'low': return 'green';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <PanelContainer>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16 }}>AI is analyzing this bug...</p>
                </div>
            </PanelContainer>
        );
    }

    if (error) {
        return (
            <PanelContainer>
                <Alert
                    message="AI Analysis Failed"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" onClick={runAnalysis}>
                            Retry
                        </Button>
                    }
                />
            </PanelContainer>
        );
    }

    if (!analysis) {
        return (
            <PanelContainer>
                <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={runAnalysis}
                    block
                >
                    Run AI Analysis
                </Button>
            </PanelContainer>
        );
    }

    const { classification, similarBugs, rootCause, testCases, impact } = analysis;

    return (
        <PanelContainer>
            <Header>
                <BugOutlined style={{ fontSize: 24, color: colors.primary[500] }} />
                <h3>AI Bug Analysis</h3>
                <AIBadge>POWERED BY GEMINI</AIBadge>
            </Header>

            {/* Classification Section */}
            <Section>
                <h4>📊 Classification</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color={getSeverityColor(classification.severity)}>
                        Severity: {classification.severity}
                    </Tag>
                    <Tag color={classification.priority === 'Highest' ? 'red' : 'orange'}>
                        Priority: {classification.priority}
                    </Tag>
                    <Tag color="blue">
                        ~{classification.estimatedUsers} users affected
                    </Tag>
                </div>

                <TagsContainer>
                    {classification.tags.map(tag => (
                        <Tag key={tag} color="purple">#{tag}</Tag>
                    ))}
                </TagsContainer>

                <p style={{ marginTop: 12, fontSize: 14, color: colors.text.secondary }}>
                    <strong>Impact:</strong> {classification.impact}
                </p>

                <ConfidenceBar>
                    <Progress
                        percent={Math.round(classification.confidence * 100)}
                        strokeColor={colors.primary[500]}
                        format={percent => `${percent}% confident`}
                    />
                </ConfidenceBar>

                <Alert
                    message={classification.reasoning}
                    type="info"
                    style={{ marginTop: 12 }}
                    showIcon
                />
            </Section>

            {/* Similar Bugs */}
            {similarBugs.length > 0 && (
                <Section>
                    <h4>🔗 Similar Bugs ({similarBugs.length})</h4>
                    <List
                        size="small"
                        dataSource={similarBugs}
                        renderItem={bug => (
                            <List.Item>
                                <List.Item.Meta
                                    title={
                                        <span>
                                            <LinkOutlined /> {bug.issueKey}: {bug.title}
                                            <Tag color="purple" style={{ marginLeft: 8 }}>
                                                {Math.round(bug.similarity * 100)}% similar
                                            </Tag>
                                        </span>
                                    }
                                    description={bug.resolution || 'Unresolved'}
                                />
                            </List.Item>
                        )}
                    />
                </Section>
            )}

            {/* Detailed Analysis (Collapsible) */}
            <Collapse ghost>
                <Panel
                    header={<span><CodeOutlined /> Root Cause Analysis</span>}
                    key="1"
                >
                    <Alert
                        message={`File: ${rootCause.likelyFile}`}
                        description={
                            <div>
                                <p><strong>Function:</strong> {rootCause.likelyFunction}</p>
                                <p>{rootCause.reasoning}</p>
                                <Progress
                                    percent={Math.round(rootCause.confidence * 100)}
                                    strokeColor={colors.success[500]}
                                    format={percent => `${percent}% confidence`}
                                />
                            </div>
                        }
                        type="warning"
                        showIcon
                    />
                </Panel>

                <Panel
                    header={<span><ExperimentOutlined /> Test Cases ({testCases.length})</span>}
                    key="2"
                >
                    <List
                        size="small"
                        dataSource={testCases}
                        renderItem={(test, index) => (
                            <List.Item>
                                <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                    {index + 1}. {test}
                                </span>
                            </List.Item>
                        )}
                    />
                </Panel>

                <Panel
                    header={<span><WarningOutlined /> Business Impact</span>}
                    key="3"
                >
                    <div>
                        <Tag color={getImpactColor(impact.businessImpact)}>
                            {impact.businessImpact} Business Impact
                        </Tag>
                        <Tag color="cyan">
                            {impact.userImpact}% of users affected
                        </Tag>
                        <Tag color="green">
                            Fix by: {impact.recommendedTimeframe}
                        </Tag>
                        <p style={{ marginTop: 12 }}>{impact.reasoning}</p>
                    </div>
                </Panel>
            </Collapse>

            <Button
                type="dashed"
                icon={<ThunderboltOutlined />}
                onClick={runAnalysis}
                block
                style={{ marginTop: 16 }}
            >
                Re-run Analysis
            </Button>
        </PanelContainer>
    );
};
