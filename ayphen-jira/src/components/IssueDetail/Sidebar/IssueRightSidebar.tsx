import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../../../theme/colors';
import { DetailsSection } from './DetailsSection';
import { PeopleSection } from './PeopleSection';
import { DatesSection } from './DatesSection';
import { TimeTrackingSection } from './TimeTrackingSection';
import { Button, Modal, message, Spin, Card, Tag, Tooltip, Dropdown, Divider } from 'antd';
import { Sparkles, Wand2, Target, Clock, FileText, CheckCircle, AlertTriangle, Flag, Eye, EyeOff, ThumbsUp, Link2, Copy, MoreHorizontal, GitBranch, Printer, Download, Share2, Trash2 } from 'lucide-react';
import { aiActionsApi } from '../../../services/ai-actions-api';
import { api, workflowsApi, issuesApi, watchersApi, votesApi } from '../../../services/api';

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

  @media (max-width: 1024px) {
    min-width: 100%;
    max-width: none;
    border-left: none;
    border-top: 1px solid ${colors.border.light};
    height: auto;
    overflow-y: visible;
  }
`;

const TopActions = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${colors.border.light};
  display: flex;
  gap: 8px;
`;

const QuickActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid ${colors.border.light};
`;

const QuickActionButton = styled.button<{ $active?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid ${props => props.$active ? (props.$danger ? '#ff4d4f' : colors.primary[500]) : colors.border.light};
  border-radius: 6px;
  background: ${props => props.$active ? (props.$danger ? '#fff1f0' : colors.primary[50]) : 'white'};
  color: ${props => props.$active ? (props.$danger ? '#ff4d4f' : colors.primary[600]) : colors.text.secondary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${props => props.$danger ? '#ff4d4f' : colors.primary[500]};
    color: ${props => props.$danger ? '#ff4d4f' : colors.primary[600]};
    background: ${props => props.$danger ? '#fff1f0' : colors.primary[50]};
  }
`;

const FlagBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #cf1322;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 12px;
`;

const AIActionCard = styled.div`
  padding: 16px;
  border: 1px solid ${colors.border.light};
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #0EA5E9;
    background: rgba(14, 165, 233, 0.05);
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
    epics?: any[];
    sprints?: any[];
    onUpdate: (field: string, value: any) => Promise<void>;
    onAIAction?: (action: string) => void;
    onLinkIssue?: () => void;
    onLogWork?: () => void;
    onDelete?: () => void;
}

export const IssueRightSidebar: React.FC<IssueRightSidebarProps> = ({
    issue,
    users,
    epics = [],
    sprints = [],
    onUpdate,
    onAIAction,
    onLinkIssue,
    onLogWork,
    onDelete
}) => {
    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);
    const [isWatching, setIsWatching] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteCount, setVoteCount] = useState(0);
    const [watcherCount, setWatcherCount] = useState(0);
    const currentUserId = localStorage.getItem('userId') || '';

    // Load watch/vote status on mount
    useEffect(() => {
        const loadWatchVoteStatus = async () => {
            if (!issue?.id || !currentUserId) return;
            try {
                // Check if user is watching
                const watchRes = await watchersApi.isWatching(issue.id, currentUserId);
                setIsWatching(watchRes.data?.isWatching || false);
                
                // Get watcher count
                const watchersRes = await watchersApi.getByIssue(issue.id);
                setWatcherCount(watchersRes.data?.length || 0);
                
                // Check if user has voted
                const voteRes = await votesApi.hasVoted(issue.id, currentUserId);
                setHasVoted(voteRes.data?.hasVoted || false);
                
                // Get vote count
                const votesRes = await votesApi.getByIssue(issue.id);
                setVoteCount(votesRes.data?.length || 0);
            } catch (e) {
                console.log('Watch/Vote status check failed (may not be implemented)');
            }
        };
        loadWatchVoteStatus();
    }, [issue?.id, currentUserId]);

    useEffect(() => {
        const fetchWorkflow = async () => {
            if (issue?.projectId) {
                try {
                    const projectRes = await api.get(`/projects/${issue.projectId}`);
                    const workflowId = projectRes.data.workflowId || 'workflow-1';
                    const workflowRes = await workflowsApi.getById(workflowId);
                    setWorkflowStatuses(workflowRes.data.statuses || []);
                } catch (e) {
                    console.error('Failed to fetch workflow:', e);
                }
            }
        };
        fetchWorkflow();
    }, [issue?.projectId]);

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
                        <strong>Suggested:</strong> <Tag color="#0EA5E9">{aiResult.data.suggestedPriority}</Tag>
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
                        style={{ background: '#0EA5E9', borderColor: '#0EA5E9' }}
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
                        style={{ background: '#0EA5E9', borderColor: '#0EA5E9' }}
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

    const handleFlag = async () => {
        try {
            const newFlagStatus = !issue.isFlagged;
            await onUpdate('isFlagged', newFlagStatus);
            message.success(newFlagStatus ? 'Issue flagged as impediment' : 'Flag removed');
        } catch (error) {
            message.error('Failed to update flag status');
        }
    };

    const handleWatch = async () => {
        try {
            if (isWatching) {
                await watchersApi.unwatch(issue.id, currentUserId);
                setIsWatching(false);
                setWatcherCount(prev => Math.max(0, prev - 1));
                message.success('Stopped watching this issue');
            } else {
                await watchersApi.watch(issue.id, currentUserId);
                setIsWatching(true);
                setWatcherCount(prev => prev + 1);
                message.success('Now watching this issue');
            }
        } catch (error) {
            console.error('Watch error:', error);
            message.error('Failed to update watch status');
        }
    };

    const handleVote = async () => {
        try {
            if (hasVoted) {
                await votesApi.unvote(issue.id, currentUserId);
                setHasVoted(false);
                setVoteCount(prev => Math.max(0, prev - 1));
                message.success('Vote removed');
            } else {
                await votesApi.vote(issue.id, currentUserId);
                setHasVoted(true);
                setVoteCount(prev => prev + 1);
                message.success('Voted for this issue');
            }
        } catch (error) {
            console.error('Vote error:', error);
            message.error('Failed to update vote');
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        message.success('Link copied to clipboard');
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${issue.key}: ${issue.summary}`,
                url: window.location.href
            });
        } else {
            handleCopyLink();
        }
    };

    const moreActionsItems = [
        {
            key: 'link',
            label: 'Link Issue',
            icon: <Link2 size={14} />,
            onClick: onLinkIssue
        },
        {
            key: 'log-work',
            label: 'Log Work',
            icon: <Clock size={14} />,
            onClick: onLogWork
        },
        { type: 'divider' as const },
        {
            key: 'copy-link',
            label: 'Copy Link',
            icon: <Copy size={14} />,
            onClick: handleCopyLink
        },
        {
            key: 'share',
            label: 'Share',
            icon: <Share2 size={14} />,
            onClick: handleShare
        },
        { type: 'divider' as const },
        {
            key: 'print',
            label: 'Print',
            icon: <Printer size={14} />,
            onClick: () => window.print()
        },
        {
            key: 'export',
            label: 'Export as JSON',
            icon: <Download size={14} />,
            onClick: () => {
                const blob = new Blob([JSON.stringify(issue, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${issue.key}.json`;
                a.click();
                URL.revokeObjectURL(url);
                message.success('Issue exported');
            }
        },
        { type: 'divider' as const },
        {
            key: 'delete',
            label: 'Delete Issue',
            icon: <Trash2 size={14} />,
            danger: true,
            onClick: onDelete
        }
    ];

    return (
        <Container>
            {/* Flag Banner - Show when flagged */}
            {issue.isFlagged && (
                <FlagBanner>
                    <Flag size={16} fill="#cf1322" />
                    Flagged as Impediment
                </FlagBanner>
            )}

            {/* Quick Actions Row */}
            <QuickActionsRow>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Tooltip title={issue.isFlagged ? 'Remove flag' : 'Flag as impediment'}>
                        <QuickActionButton $active={issue.isFlagged} $danger onClick={handleFlag}>
                            <Flag size={14} fill={issue.isFlagged ? '#ff4d4f' : 'none'} />
                            Flag
                        </QuickActionButton>
                    </Tooltip>
                    
                    <Tooltip title={isWatching ? 'Stop watching' : 'Watch this issue'}>
                        <QuickActionButton $active={isWatching} onClick={handleWatch}>
                            {isWatching ? <EyeOff size={14} /> : <Eye size={14} />}
                            {watcherCount > 0 ? watcherCount : ''}
                        </QuickActionButton>
                    </Tooltip>
                    
                    <Tooltip title={hasVoted ? 'Remove vote' : 'Vote for this issue'}>
                        <QuickActionButton $active={hasVoted} onClick={handleVote}>
                            <ThumbsUp size={14} fill={hasVoted ? colors.primary[500] : 'none'} />
                            {voteCount > 0 ? voteCount : ''}
                        </QuickActionButton>
                    </Tooltip>
                </div>
                
                <Dropdown menu={{ items: moreActionsItems }} trigger={['click']} placement="bottomRight">
                    <Tooltip title="More actions">
                        <QuickActionButton>
                            <MoreHorizontal size={14} />
                        </QuickActionButton>
                    </Tooltip>
                </Dropdown>
            </QuickActionsRow>

            <TopActions>
                <Button
                    icon={<Sparkles size={16} />}
                    type="primary"
                    block
                    style={{
                        background: '#0EA5E9',
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
            <DetailsSection issue={issue} epics={epics} statuses={workflowStatuses} sprints={sprints} onUpdate={onUpdate} onAIAction={(action) => {
                setAiModalVisible(true);
                handleAIAction(action);
            }} />
            <DatesSection issue={issue} onUpdate={onUpdate} />
            <TimeTrackingSection issue={issue} onUpdate={onUpdate} />

            <Modal
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={20} color="#0EA5E9" /> AI Actions</span>}
                open={aiModalVisible}
                onCancel={() => setAiModalVisible(false)}
                footer={null}
                width={500}
            >
                <div style={{ marginTop: 16 }}>
                    <AIActionCard onClick={() => handleAIAction('smart-priority')}>
                        <AIActionTitle>
                            <Target size={18} color="#0EA5E9" />
                            Smart Priority
                        </AIActionTitle>
                        <AIActionDesc>Analyze issue and suggest optimal priority based on context</AIActionDesc>
                    </AIActionCard>

                    <AIActionCard onClick={() => handleAIAction('generate-description')}>
                        <AIActionTitle>
                            <Wand2 size={18} color="#0EA5E9" />
                            Generate Description
                        </AIActionTitle>
                        <AIActionDesc>Auto-generate a detailed description using AI</AIActionDesc>
                    </AIActionCard>

                    <AIActionCard onClick={() => handleAIAction('acceptance-criteria')}>
                        <AIActionTitle>
                            <CheckCircle size={18} color="#0EA5E9" />
                            Generate Acceptance Criteria
                        </AIActionTitle>
                        <AIActionDesc>Create acceptance criteria based on summary and description</AIActionDesc>
                    </AIActionCard>

                    <AIActionCard onClick={() => handleAIAction('predict-completion')}>
                        <AIActionTitle>
                            <Clock size={18} color="#0EA5E9" />
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
