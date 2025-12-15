import React, { useState } from 'react';
import styled from 'styled-components';
import { colors } from '../../../theme/colors';
import { DetailsSection } from './DetailsSection';
import { PeopleSection } from './PeopleSection';
import { DatesSection } from './DatesSection';
import { TimeTrackingSection } from './TimeTrackingSection';
import { Button, Modal, message, Spin, Card, Tag } from 'antd';
import { Sparkles, Wand2, Target, Clock, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { aiActionsApi } from '../../../services/ai-actions-api';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 0 16px;
  border-left: 1px solid ${colors.border.light};
  background: white;
  min-width: 300px;
  max-width: 350px;
`;

const TopActions = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${colors.border.light};
  display: flex;
  gap: 8px;
`;

const AIActionCard = styled.div`
  padding: 16px;
  border: 1px solid ${colors.border.light};
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #E91E63;
    background: rgba(233, 30, 99, 0.05);
  }
`;

const AIActionTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const AIActionDesc = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const ResultCard = styled(Card)`
  margin-top: 16px;
  .ant-card-head {
    background: #F9FAFB;
  }
`;

interface IssueRightSidebarProps {
    issue: any;
    users: any[];
    onUpdate: (field: string, value: any) => Promise<void>;
    onAIAction?: (action: string) => void;
}

export const IssueRightSidebar: React.FC<IssueRightSidebarProps> = ({
    issue,
    users,
    onUpdate,
    onAIAction
}) => {
    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const handleAIAction = async (action: string) => {
        setLoading(true);
        setActiveAction(action);
        setAiResult(null);

        try {
            let result;
            switch (action) {
                case 'smart-priority':
                    result = await aiActionsApi.analyzePriority(issue.id);
                    setAiResult({
                        type: 'priority',
                        ...result
                    });
                    break;

                case 'generate-description':
                    result = await aiActionsApi.quickGenerateDescription({
                        issueType: issue.type,
                        issueSummary: issue.summary,
                        userInput: issue.description || issue.summary
                    });
                    setAiResult({
                        type: 'description',
                        ...result
                    });
                    break;

                case 'acceptance-criteria':
                    result = await aiActionsApi.generateAcceptanceCriteria(
                        issue.summary,
                        issue.description || ''
                    );
                    setAiResult({
                        type: 'criteria',
                        ...result
                    });
                    break;

                case 'predict-completion':
                    result = await aiActionsApi.predictCompletion(issue.id);
                    setAiResult({
                        type: 'prediction',
                        ...result
                    });
                    break;

                default:
                    message.info('Action not implemented');
            }
        } catch (error: any) {
            console.error('AI Action error:', error);
            message.error(error.response?.data?.error || 'AI action failed. Please try again.');
            setAiResult({
                type: 'error',
                error: error.response?.data?.error || error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const applyPriority = async () => {
        if (aiResult?.data?.suggestedPriority) {
            try {
                setLoading(true);
                await aiActionsApi.applySmartPriority(issue.id, true);
                await onUpdate('priority', aiResult.data.suggestedPriority);
                message.success(`Priority updated to ${aiResult.data.suggestedPriority}`);
                setAiModalVisible(false);
            } catch (error: any) {
                message.error('Failed to apply priority');
            } finally {
                setLoading(false);
            }
        }
    };

    const applyDescription = async () => {
        if (aiResult?.description) {
            try {
                await onUpdate('description', aiResult.description);
                message.success('Description updated');
                setAiModalVisible(false);
            } catch (error) {
                message.error('Failed to apply description');
            }
        }
    };

    const renderAIResult = () => {
        if (!aiResult) return null;

        if (aiResult.type === 'error') {
            return (
                <ResultCard title={<span style={{ color: '#EF4444' }}><AlertTriangle size={16} /> Error</span>}>
                    <p>{aiResult.error}</p>
                </ResultCard>
            );
        }

        if (aiResult.type === 'priority' && aiResult.data) {
            return (
                <ResultCard title={<span><Target size={16} style={{ marginRight: 8 }} />Priority Analysis</span>}>
                    <div style={{ marginBottom: 12 }}>
                        <strong>Current:</strong> <Tag>{aiResult.data.currentPriority || issue.priority}</Tag>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <strong>Suggested:</strong> <Tag color="#E91E63">{aiResult.data.suggestedPriority}</Tag>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <strong>Confidence:</strong> {Math.round(aiResult.data.confidence)}%
                    </div>
                    {aiResult.data.reasoning && (
                        <div style={{ marginBottom: 16, fontSize: 13, color: colors.text.secondary }}>
                            <strong>Reasoning:</strong> {aiResult.data.reasoning}
                        </div>
                    )}
                    <Button 
                        type="primary" 
                        onClick={applyPriority} 
                        loading={loading}
                        style={{ background: '#E91E63', borderColor: '#E91E63' }}
                    >
                        Apply Suggested Priority
                    </Button>
                </ResultCard>
            );
        }

        if (aiResult.type === 'description' && aiResult.description) {
            return (
                <ResultCard title={<span><FileText size={16} style={{ marginRight: 8 }} />Generated Description</span>}>
                    <div style={{ 
                        background: '#F9FAFB', 
                        padding: 12, 
                        borderRadius: 8, 
                        marginBottom: 16,
                        maxHeight: 200,
                        overflowY: 'auto',
                        fontSize: 13,
                        whiteSpace: 'pre-wrap'
                    }}>
                        {aiResult.description}
                    </div>
                    <Button 
                        type="primary" 
                        onClick={applyDescription}
                        style={{ background: '#E91E63', borderColor: '#E91E63' }}
                    >
                        Apply Description
                    </Button>
                </ResultCard>
            );
        }

        if (aiResult.type === 'criteria' && aiResult.criteria) {
            return (
                <ResultCard title={<span><CheckCircle size={16} style={{ marginRight: 8 }} />Acceptance Criteria</span>}>
                    <div style={{ 
                        background: '#F9FAFB', 
                        padding: 12, 
                        borderRadius: 8,
                        maxHeight: 250,
                        overflowY: 'auto',
                        fontSize: 13,
                        whiteSpace: 'pre-wrap'
                    }}>
                        {aiResult.criteria}
                    </div>
                </ResultCard>
            );
        }

        if (aiResult.type === 'prediction') {
            return (
                <ResultCard title={<span><Clock size={16} style={{ marginRight: 8 }} />Completion Prediction</span>}>
                    {aiResult.estimatedDays && (
                        <div style={{ marginBottom: 8 }}>
                            <strong>Estimated Days:</strong> {aiResult.estimatedDays}
                        </div>
                    )}
                    {aiResult.confidence && (
                        <div style={{ marginBottom: 8 }}>
                            <strong>Confidence:</strong> {Math.round(aiResult.confidence)}%
                        </div>
                    )}
                    {aiResult.factors && (
                        <div style={{ fontSize: 13, color: colors.text.secondary }}>
                            {aiResult.factors}
                        </div>
                    )}
                </ResultCard>
            );
        }

        return null;
    };

    return (
        <Container>
            <TopActions>
                <Button
                    icon={<Sparkles size={16} />}
                    type="primary"
                    block
                    style={{
                        background: '#E91E63',
                        border: 'none',
                        fontWeight: 600
                    }}
                    onClick={() => {
                        setAiModalVisible(true);
                        setAiResult(null);
                        setActiveAction(null);
                    }}
                >
                    AI Actions
                </Button>
            </TopActions>

            <PeopleSection issue={issue} users={users} onUpdate={onUpdate} onAIAction={(action) => {
                setAiModalVisible(true);
                handleAIAction(action);
            }} />
            <DetailsSection issue={issue} onUpdate={onUpdate} onAIAction={(action) => {
                setAiModalVisible(true);
                handleAIAction(action);
            }} />
            <DatesSection issue={issue} onUpdate={onUpdate} />
            <TimeTrackingSection issue={issue} onUpdate={onUpdate} />

            <Modal
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={20} color="#E91E63" /> AI Actions</span>}
                open={aiModalVisible}
                onCancel={() => setAiModalVisible(false)}
                footer={null}
                width={500}
            >
                <div style={{ marginTop: 16 }}>
                    <AIActionCard onClick={() => handleAIAction('smart-priority')}>
                        <AIActionTitle>
                            <Target size={18} color="#E91E63" />
                            Smart Priority
                        </AIActionTitle>
                        <AIActionDesc>Analyze issue and suggest optimal priority based on context</AIActionDesc>
                    </AIActionCard>

                    <AIActionCard onClick={() => handleAIAction('generate-description')}>
                        <AIActionTitle>
                            <Wand2 size={18} color="#E91E63" />
                            Generate Description
                        </AIActionTitle>
                        <AIActionDesc>Auto-generate a detailed description using AI</AIActionDesc>
                    </AIActionCard>

                    <AIActionCard onClick={() => handleAIAction('acceptance-criteria')}>
                        <AIActionTitle>
                            <CheckCircle size={18} color="#E91E63" />
                            Generate Acceptance Criteria
                        </AIActionTitle>
                        <AIActionDesc>Create acceptance criteria based on summary and description</AIActionDesc>
                    </AIActionCard>

                    <AIActionCard onClick={() => handleAIAction('predict-completion')}>
                        <AIActionTitle>
                            <Clock size={18} color="#E91E63" />
                            Predict Completion Time
                        </AIActionTitle>
                        <AIActionDesc>Estimate when this issue will be completed</AIActionDesc>
                    </AIActionCard>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 12, color: colors.text.secondary }}>
                            Processing AI action...
                        </div>
                    </div>
                )}

                {renderAIResult()}
            </Modal>
        </Container>
    );
};
