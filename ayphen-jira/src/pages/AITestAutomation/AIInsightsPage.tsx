import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Input, List, Tag, Spin, Progress, Collapse, message, Select, Tabs } from 'antd';
import { Brain, MessageCircle, Send, Lightbulb, TrendingUp, Target, Zap, AlertTriangle } from 'lucide-react';
import styled from 'styled-components';
import { aiInsightsApi } from '../../services/ai-insights-api';
import { testReportsApi } from '../../services/test-reports-api';
import { aiTestCasesApi } from '../../services/ai-test-automation-api';
import { useStore } from '../../store/useStore';

const { TextArea } = Input;
const { Panel } = Collapse;
const { Option } = Select;
const { TabPane } = Tabs;

const Container = styled.div`
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  color: #8c8c8c;
  margin: 0;
`;

const ChatContainer = styled.div`
  height: 500px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
`;

const ChatMessage = styled.div<{ isUser?: boolean }>`
  margin-bottom: 16px;
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div<{ isUser?: boolean }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  background: ${props => props.isUser ? '#1890ff' : 'white'};
  color: ${props => props.isUser ? 'white' : '#262626'};
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
`;

const ChatInput = styled.div`
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
`;

const InsightCard = styled(Card)`
  margin-bottom: 16px;
  
  .ant-card-head {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    .ant-card-head-title {
      color: white;
    }
  }
`;

export const AIInsightsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI Test Assistant. Ask me anything about your tests, coverage, or test automation best practices!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [flakyTests, setFlakyTests] = useState<any[]>([]);
  const [coverageGaps, setCoverageGaps] = useState<any>(null);
  const [smartSelection, setSmartSelection] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testCases, setTestCases] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const { currentProject } = useStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [currentProject]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadData = async () => {
    try {
      const [flakyRes, testCasesRes] = await Promise.all([
        testReportsApi.getFlakyTests({ projectId: currentProject?.id }),
        aiTestCasesApi.getAll(),
      ]);
      
      setFlakyTests(flakyRes.data || []);
      setTestCases(testCasesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    try {
      const context = {
        totalTests: testCases.length,
        flakyTests: flakyTests.length,
        projectId: currentProject?.id,
      };

      const response = await aiInsightsApi.chat(chatInput, context);
      const assistantMessage = { role: 'assistant', content: response.data.answer };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      message.error('Failed to get response');
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeFlakyTest = async (testCaseId: string) => {
    setLoading(true);
    try {
      const response = await aiInsightsApi.analyzeFlakyTest(testCaseId);
      setAnalysisResult(response.data);
      message.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing test:', error);
      message.error('Failed to analyze test');
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifyCoverageGaps = async () => {
    setLoading(true);
    try {
      const response = await aiInsightsApi.identifyCoverageGaps(currentProject?.id);
      setCoverageGaps(response.data);
      message.success('Coverage analysis complete!');
    } catch (error) {
      console.error('Error identifying gaps:', error);
      message.error('Failed to analyze coverage');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartTestSelection = async () => {
    setLoading(true);
    try {
      const response = await aiInsightsApi.smartTestSelection([], currentProject?.id);
      setSmartSelection(response.data);
      message.success('Smart selection complete!');
    } catch (error) {
      console.error('Error in smart selection:', error);
      message.error('Failed to select tests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <Brain size={32} color="#667eea" />
          AI-Powered Test Insights
        </Title>
        <Subtitle>Intelligent analysis, predictions, and recommendations for your test automation</Subtitle>
      </Header>

      <Tabs defaultActiveKey="1">
        {/* Chat Assistant Tab */}
        <TabPane tab={<span><MessageCircle size={16} style={{ marginRight: 8 }} />AI Assistant</span>} key="1">
          <Row gutter={16}>
            <Col span={24}>
              <Card title="AI Test Assistant" extra={<Tag color="purple">Powered by AI</Tag>}>
                <ChatContainer>
                  <ChatMessages>
                    {chatMessages.map((msg, idx) => (
                      <ChatMessage key={idx} isUser={msg.role === 'user'}>
                        <MessageBubble isUser={msg.role === 'user'}>
                          {msg.content}
                        </MessageBubble>
                      </ChatMessage>
                    ))}
                    {loading && (
                      <ChatMessage>
                        <MessageBubble>
                          <Spin size="small" /> Thinking...
                        </MessageBubble>
                      </ChatMessage>
                    )}
                    <div ref={chatEndRef} />
                  </ChatMessages>
                  <ChatInput>
                    <Input
                      placeholder="Ask me anything about your tests..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onPressEnter={handleSendMessage}
                      disabled={loading}
                    />
                    <Button
                      type="primary"
                      icon={<Send size={16} />}
                      onClick={handleSendMessage}
                      loading={loading}
                    >
                      Send
                    </Button>
                  </ChatInput>
                </ChatContainer>
                
                <div style={{ marginTop: 16 }}>
                  <p style={{ color: '#8c8c8c', fontSize: 12 }}>
                    <strong>Try asking:</strong> "Why are my tests failing?", "How can I improve test coverage?", 
                    "What tests should I run first?", "How do I fix flaky tests?"
                  </p>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Flaky Test Analysis Tab */}
        <TabPane tab={<span><AlertTriangle size={16} style={{ marginRight: 8 }} />Flaky Tests</span>} key="2">
          <Row gutter={16}>
            <Col span={24}>
              <InsightCard title={<span><AlertTriangle size={16} style={{ marginRight: 8 }} />Flaky Test Analysis</span>}>
                <div style={{ marginBottom: 16 }}>
                  <Select
                    style={{ width: '100%', marginBottom: 16 }}
                    placeholder="Select a flaky test to analyze"
                    value={selectedTest}
                    onChange={setSelectedTest}
                  >
                    {flakyTests.map(test => (
                      <Option key={test.testCaseId} value={test.testCaseId}>
                        {test.testCaseKey} - {test.title} (Flakiness: {test.flakinessScore}%)
                      </Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    icon={<Brain size={16} />}
                    onClick={() => selectedTest && handleAnalyzeFlakyTest(selectedTest)}
                    loading={loading}
                    disabled={!selectedTest}
                  >
                    Analyze with AI
                  </Button>
                </div>

                {analysisResult && (
                  <Collapse defaultActiveKey={['1']}>
                    <Panel header="Root Cause" key="1">
                      <p>{analysisResult.rootCause}</p>
                    </Panel>
                    <Panel header="Recommendations" key="2">
                      <List
                        dataSource={analysisResult.recommendations}
                        renderItem={(item: string) => (
                          <List.Item>
                            <Lightbulb size={16} color="#faad14" style={{ marginRight: 8 }} />
                            {item}
                          </List.Item>
                        )}
                      />
                    </Panel>
                    <Panel header="Details" key="3">
                      <p><strong>Priority:</strong> <Tag color={analysisResult.priority === 'high' ? 'red' : 'orange'}>{analysisResult.priority}</Tag></p>
                      <p><strong>Estimated Effort:</strong> {analysisResult.estimatedEffort} hours</p>
                      <p><strong>Prevention Tips:</strong></p>
                      <ul>
                        {analysisResult.preventionTips?.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </Panel>
                  </Collapse>
                )}
              </InsightCard>
            </Col>
          </Row>
        </TabPane>

        {/* Coverage Gaps Tab */}
        <TabPane tab={<span><Target size={16} style={{ marginRight: 8 }} />Coverage Gaps</span>} key="3">
          <Row gutter={16}>
            <Col span={24}>
              <InsightCard title={<span><Target size={16} style={{ marginRight: 8 }} />Test Coverage Analysis</span>}>
                <Button
                  type="primary"
                  icon={<Brain size={16} />}
                  onClick={handleIdentifyCoverageGaps}
                  loading={loading}
                  style={{ marginBottom: 16 }}
                >
                  Analyze Coverage Gaps
                </Button>

                {coverageGaps && (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <h3>Coverage Score</h3>
                      <Progress
                        percent={coverageGaps.coverageScore}
                        status={coverageGaps.coverageScore >= 80 ? 'success' : coverageGaps.coverageScore >= 60 ? 'normal' : 'exception'}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    </div>

                    <Collapse defaultActiveKey={['1']}>
                      <Panel header="Missing Areas" key="1">
                        <List
                          dataSource={coverageGaps.missingAreas}
                          renderItem={(item: string) => (
                            <List.Item>
                              <Tag color="red">{item}</Tag>
                            </List.Item>
                          )}
                        />
                      </Panel>
                      <Panel header="Suggested Tests" key="2">
                        <List
                          dataSource={coverageGaps.suggestedTests}
                          renderItem={(item: any) => (
                            <List.Item>
                              <List.Item.Meta
                                title={<span><Tag color="blue">{item.type}</Tag> {item.title}</span>}
                                description={item.description}
                              />
                              <Tag color={item.priority === 'high' ? 'red' : 'orange'}>{item.priority}</Tag>
                            </List.Item>
                          )}
                        />
                      </Panel>
                      <Panel header="Critical Gaps" key="3">
                        <List
                          dataSource={coverageGaps.criticalGaps}
                          renderItem={(item: string) => (
                            <List.Item>
                              <AlertTriangle size={16} color="#ff4d4f" style={{ marginRight: 8 }} />
                              {item}
                            </List.Item>
                          )}
                        />
                      </Panel>
                    </Collapse>
                  </>
                )}
              </InsightCard>
            </Col>
          </Row>
        </TabPane>

        {/* Smart Test Selection Tab */}
        <TabPane tab={<span><Zap size={16} style={{ marginRight: 8 }} />Smart Selection</span>} key="4">
          <Row gutter={16}>
            <Col span={24}>
              <InsightCard title={<span><Zap size={16} style={{ marginRight: 8 }} />Smart Test Selection</span>}>
                <p style={{ marginBottom: 16 }}>
                  AI-powered test selection prioritizes the most important tests based on recent failures, 
                  test categories, and execution patterns.
                </p>
                
                <Button
                  type="primary"
                  icon={<Brain size={16} />}
                  onClick={handleSmartTestSelection}
                  loading={loading}
                  style={{ marginBottom: 16 }}
                >
                  Generate Smart Selection
                </Button>

                {smartSelection && (
                  <>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={8}>
                        <Card>
                          <p style={{ margin: 0, color: '#8c8c8c' }}>Total Tests</p>
                          <h2 style={{ margin: 0 }}>{smartSelection.totalTests}</h2>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <p style={{ margin: 0, color: '#8c8c8c' }}>Selected</p>
                          <h2 style={{ margin: 0, color: '#1890ff' }}>{smartSelection.selectedCount}</h2>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <p style={{ margin: 0, color: '#8c8c8c' }}>Est. Time</p>
                          <h2 style={{ margin: 0, color: '#52c41a' }}>{Math.round(smartSelection.estimatedTime / 60)}m</h2>
                        </Card>
                      </Col>
                    </Row>

                    <List
                      dataSource={smartSelection.recommendedTests}
                      renderItem={(item: any) => (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <span>
                                <Tag color="cyan">{item.testCaseKey}</Tag>
                                <Tag color={item.type === 'ui' ? 'green' : 'purple'}>{item.type}</Tag>
                                {item.title}
                              </span>
                            }
                            description={item.reason}
                          />
                          <Tag color={item.priority === 3 ? 'red' : item.priority === 2 ? 'orange' : 'default'}>
                            Priority: {item.priority}
                          </Tag>
                        </List.Item>
                      )}
                    />
                  </>
                )}
              </InsightCard>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Container>
  );
};
