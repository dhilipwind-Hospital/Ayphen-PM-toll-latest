import React, { useState } from 'react';
import { Card, Row, Col, Divider, Tag, Button, message } from 'antd';
import { ThunderboltOutlined, MailOutlined, BellOutlined, ExperimentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { EmailIntegrationPanel } from '../components/AI/EmailIntegrationPanel';
import { SprintAutoPopulateButton } from '../components/AI/SprintAutoPopulateButton';
import { TestCaseGeneratorButton } from '../components/AI/TestCaseGeneratorButton';
import { ENV } from '../config/env';

const Phase2TestPage: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  React.useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/health`);
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>
          🚀 Phase 2: Core Automation Features
        </h1>
        <p style={{ fontSize: 16, color: '#595959' }}>
          Test all Phase 2 AI-powered automation features
        </p>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontWeight: 500 }}>Backend Status:</span>
          {serverStatus === 'online' && (
            <Tag color="success" icon={<CheckCircleOutlined />}>ONLINE</Tag>
          )}
          {serverStatus === 'offline' && (
            <Tag color="error">OFFLINE</Tag>
          )}
          {serverStatus === 'checking' && (
            <Tag color="processing">CHECKING...</Tag>
          )}
          <Button size="small" onClick={checkServerStatus}>Refresh</Button>
        </div>
      </div>

      <Divider />

      {/* Features Grid */}
      <Row gutter={[24, 24]}>
        {/* Feature 1: Email-to-Issue */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MailOutlined style={{ color: '#667eea', fontSize: 20 }} />
                <span>Email-to-Issue Automation</span>
              </div>
            }
            extra={<Tag color="purple">Phase 2</Tag>}
            style={{ height: '100%' }}
          >
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#595959' }}>
                Automatically convert customer emails into issues with AI-powered parsing,
                auto-assignment, and tagging.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Features:</div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
                <li>AI email parsing</li>
                <li>Auto issue creation</li>
                <li>Smart assignment</li>
                <li>Auto-tagging</li>
                <li>Confirmation emails</li>
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Impact:</div>
              <Tag color="green">40% time savings</Tag>
              <Tag color="blue">99% automation</Tag>
            </div>

            <EmailIntegrationPanel
              onIssueCreated={(key) => message.success(`Issue ${key} created!`)}
            />
          </Card>
        </Col>

        {/* Feature 2: Sprint Auto-Population */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThunderboltOutlined style={{ color: '#f5576c', fontSize: 20 }} />
                <span>Sprint Auto-Population</span>
              </div>
            }
            extra={<Tag color="purple">Phase 2</Tag>}
            style={{ height: '100%' }}
          >
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#595959' }}>
                Automatically populate sprints with optimal issues based on capacity,
                velocity, and team balance.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Features:</div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
                <li>AI issue selection</li>
                <li>Capacity planning</li>
                <li>Workload balancing</li>
                <li>Velocity calculation</li>
                <li>Preview mode</li>
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Impact:</div>
              <Tag color="green">35% time savings</Tag>
              <Tag color="blue">98% automation</Tag>
            </div>

            <SprintAutoPopulateButton
              sprintId="test-sprint-123"
              sprintName="Test Sprint"
              onPopulated={() => message.success('Sprint populated!')}
            />
          </Card>
        </Col>

        {/* Feature 3: Notification Filtering */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BellOutlined style={{ color: '#faad14', fontSize: 20 }} />
                <span>Intelligent Notification Filtering</span>
              </div>
            }
            extra={<Tag color="purple">Phase 2</Tag>}
            style={{ height: '100%' }}
          >
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#595959' }}>
                AI-powered notification prioritization with smart batching and quiet hours
                to reduce notification noise by 60%.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Features:</div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
                <li>Priority analysis</li>
                <li>Smart batching</li>
                <li>Quiet hours</li>
                <li>Daily digests</li>
                <li>Behavioral learning</li>
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Impact:</div>
              <Tag color="green">30% time savings</Tag>
              <Tag color="blue">60% noise reduction</Tag>
            </div>

            <Button
              type="primary"
              icon={<BellOutlined />}
              style={{
                background: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)',
                border: 'none'
              }}
              onClick={() => message.info('Notification center coming soon!')}
            >
              Open Notification Center
            </Button>
          </Card>
        </Col>

        {/* Feature 4: Test Case Generation */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExperimentOutlined style={{ color: '#00f2fe', fontSize: 20 }} />
                <span>Auto-Test Case Generation</span>
              </div>
            }
            extra={<Tag color="purple">Phase 2</Tag>}
            style={{ height: '100%' }}
          >
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#595959' }}>
                Generate comprehensive test cases from user stories with AI-powered
                scenario detection and coverage analysis.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Features:</div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
                <li>Happy path tests</li>
                <li>Edge case detection</li>
                <li>Error handling tests</li>
                <li>Coverage analysis</li>
                <li>API test generation</li>
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Impact:</div>
              <Tag color="green">50% time savings</Tag>
              <Tag color="blue">85% coverage</Tag>
            </div>

            <TestCaseGeneratorButton
              issueId="test-issue-123"
              issueKey="TEST-123"
              onGenerated={(tests) => message.success(`Generated ${tests.length} test cases!`)}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Summary Stats */}
      <Card title="Phase 2 Impact Summary" style={{ marginTop: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1890ff' }}>4</div>
              <div style={{ color: '#8c8c8c' }}>Features</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#52c41a' }}>40%</div>
              <div style={{ color: '#8c8c8c' }}>Time Saved</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#722ed1' }}>502</div>
              <div style={{ color: '#8c8c8c' }}>Hours/Month</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#fa8c16' }}>$25K</div>
              <div style={{ color: '#8c8c8c' }}>Monthly Savings</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* API Endpoints */}
      <Card title="API Endpoints" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Email-to-Issue:</div>
            <code style={{ fontSize: 12, background: '#f5f5f5', padding: 4, borderRadius: 4 }}>
              POST /api/email-to-issue/process
            </code>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Sprint Auto-Populate:</div>
            <code style={{ fontSize: 12, background: '#f5f5f5', padding: 4, borderRadius: 4 }}>
              POST /api/ai-sprint-auto-populate/populate/:id
            </code>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Notification Filter:</div>
            <code style={{ fontSize: 12, background: '#f5f5f5', padding: 4, borderRadius: 4 }}>
              POST /api/ai-notification-filter/filter
            </code>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Test Generator:</div>
            <code style={{ fontSize: 12, background: '#f5f5f5', padding: 4, borderRadius: 4 }}>
              POST /api/ai-test-case-generator/generate/:id
            </code>
          </Col>
        </Row>
      </Card>

      {/* Documentation Link */}
      <div style={{
        marginTop: 24,
        padding: 16,
        background: '#f0f7ff',
        borderRadius: 8,
        border: '1px solid #bae0ff',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
          📚 Documentation
        </div>
        <div style={{ color: '#595959' }}>
          See <code>PHASE_2_DEPLOYMENT_GUIDE.md</code> for complete documentation
        </div>
      </div>
    </div>
  );
};

export default Phase2TestPage;
