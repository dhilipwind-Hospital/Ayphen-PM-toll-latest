import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Tag, List, Select, Input, message, Modal, Divider, Empty, Spin } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const StatusBadge = styled(Tag)`
  padding: 4px 8px;
  font-size: 14px;
`;

const TestCaseCard = styled(Card) <{ status?: string }>`
  margin-bottom: 16px;
  border-left: 4px solid ${props => {
        switch (props.status) {
            case 'Passed': return '#52c41a';
            case 'Failed': return '#ff4d4f';
            case 'Blocked': return '#faad14';
            default: return '#d9d9d9';
        }
    }};
`;

const StepSection = styled.div`
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  margin-top: 12px;
`;

export default function TestRunExecution() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [run, setRun] = useState<any>(null);
    const [suite, setSuite] = useState<any>(null);
    const [testCases, setTestCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<Record<number, any>>({});
    const [notes, setNotes] = useState<Record<number, string>>({});

    useEffect(() => {
        loadRunDetails();
    }, [id]);

    const loadRunDetails = async () => {
        try {
            setLoading(true);
            // 1. Fetch Run Details (includes results from backend if any)
            const runRes = await api.get(`/test-runs/${id}`);
            setRun(runRes.data);

            // Map existing results for easy lookup
            const resultsMap: Record<number, any> = {};
            const notesMap: Record<number, string> = {};
            if (runRes.data.results) {
                runRes.data.results.forEach((r: any) => {
                    // Assuming backend returns latest result per test case
                    resultsMap[r.test_case_id] = r.status;
                    notesMap[r.test_case_id] = r.notes;
                });
            }
            setResults(resultsMap);
            setNotes(notesMap);

            // 2. Fetch Suite Details (to get list of test cases)
            if (runRes.data.suite_id) {
                const suiteRes = await api.get(`/test-suites/${runRes.data.suite_id}`);
                setSuite(suiteRes.data);

                // Backend returns testCases array in suite detail
                setTestCases(suiteRes.data.testCases || []);
            }

        } catch (error) {
            console.error('Failed to load test run:', error);
            message.error('Failed to load test run details');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (testCaseId: number, status: string) => {
        try {
            // Optimistic update
            setResults(prev => ({ ...prev, [testCaseId]: status }));

            await api.post(`/test-runs/${id}/results`, {
                testCaseId,
                status,
                notes: notes[testCaseId] || ''
            });
            message.success(`Marked as ${status}`);
        } catch (error) {
            message.error('Failed to save result');
            // Revert on failure could be added here
        }
    };

    const handleNoteChange = (testCaseId: number, value: string) => {
        setNotes(prev => ({ ...prev, [testCaseId]: value }));
    };

    const saveNote = async (testCaseId: number) => {
        // Just re-send the current status with new note
        const currentStatus = results[testCaseId];
        if (!currentStatus) return; // Don't save note without status? Or allow it.

        try {
            await api.post(`/test-runs/${id}/results`, {
                testCaseId,
                status: currentStatus,
                notes: notes[testCaseId]
            });
            message.success('Note saved');
        } catch (e) {
            message.error('Failed to save note');
        }
    }

    const handleCompleteRun = async () => {
        Modal.confirm({
            title: 'Complete Test Run',
            content: 'Are you sure you want to complete this run? This will lock the results.',
            onOk: async () => {
                try {
                    await api.put(`/test-runs/${id}/complete`);
                    message.success('Test run completed');
                    navigate('/test-runs');
                } catch (e) {
                    message.error('Failed to complete run');
                }
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Passed': return 'success';
            case 'Failed': return 'error';
            case 'Blocked': return 'warning';
            default: return 'default';
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}><Spin size="large" /></div>;
    if (!run) return <Empty description="Test Run not found" />;

    const completedCount = Object.keys(results).length;
    const progress = Math.round((completedCount / testCases.length) * 100) || 0;

    return (
        <Container>
            <Header>
                <div>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/test-runs')}>Back to Runs</Button>
                    <Title level={2} style={{ marginTop: 8 }}>
                        {run.suite_name || (suite ? suite.name : 'Test Run')}
                        <StatusBadge color={run.status === 'Completed' ? 'blue' : 'orange'}>{run.status}</StatusBadge>
                    </Title>
                    <Text type="secondary">Started on {new Date(run.started_at).toLocaleString()}</Text>
                </div>
                <div>
                    <div style={{ marginRight: 16, display: 'inline-block', textAlign: 'right' }}>
                        <Text strong>{progress}% Done</Text>
                        <div>{completedCount} / {testCases.length} executed</div>
                    </div>
                    {run.status !== 'Completed' && (
                        <Button type="primary" onClick={handleCompleteRun}>Complete Run</Button>
                    )}
                </div>
            </Header>

            <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={testCases}
                renderItem={(tc: any) => {
                    const currentStatus = results[tc.id];

                    return (
                        <TestCaseCard status={currentStatus}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <Title level={4} style={{ margin: 0 }}>{tc.title}</Title>
                                    <Paragraph type="secondary" style={{ marginTop: 4 }}>{tc.description}</Paragraph>

                                    <StepSection>
                                        <Text strong>Preconditions/Steps:</Text>
                                        <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{tc.steps}</div>
                                    </StepSection>

                                    {tc.expected_result && (
                                        <div style={{ marginTop: 8 }}>
                                            <Text strong>Expected Result: </Text>
                                            <Text>{tc.expected_result}</Text>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginLeft: 24, width: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Button
                                            type={currentStatus === 'Passed' ? 'primary' : 'default'}
                                            style={currentStatus === 'Passed' ? { background: '#52c41a', borderColor: '#52c41a' } : {}}
                                            icon={<CheckCircleOutlined />}
                                            onClick={() => handleStatusChange(tc.id, 'Passed')}
                                            disabled={run.status === 'Completed'}
                                        >Pass</Button>
                                        <Button
                                            type={currentStatus === 'Failed' ? 'primary' : 'default'}
                                            danger
                                            icon={<CloseCircleOutlined />}
                                            onClick={() => handleStatusChange(tc.id, 'Failed')}
                                            disabled={run.status === 'Completed'}
                                        >Fail</Button>
                                        <Button
                                            type={currentStatus === 'Blocked' ? 'primary' : 'default'} // Changed from 'ghost' which isn't valid type for primary-like styling
                                            icon={<PauseCircleOutlined />}
                                            onClick={() => handleStatusChange(tc.id, 'Blocked')}
                                            disabled={run.status === 'Completed'}
                                            style={currentStatus === 'Blocked' ? { background: '#faad14', borderColor: '#faad14', color: 'white' } : {}}
                                        >Block</Button>
                                    </div>

                                    <TextArea
                                        placeholder="Add result notes..."
                                        rows={2}
                                        value={notes[tc.id] || ''}
                                        onChange={(e) => handleNoteChange(tc.id, e.target.value)}
                                        onBlur={() => saveNote(tc.id)}
                                        disabled={run.status === 'Completed'}
                                    />
                                </div>
                            </div>
                        </TestCaseCard>
                    );
                }}
            />
        </Container>
    );
}
