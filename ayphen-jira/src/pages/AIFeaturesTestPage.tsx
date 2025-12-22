import React, { useState } from 'react';
import { Card, Space, Button, Input, message, Divider, Tag, Spin, Alert } from 'antd';
import { RobotOutlined, ThunderboltOutlined, TagsOutlined, UserAddOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { AutoAssignButton } from '../components/AI/AutoAssignButton';
import { SmartPrioritySelector } from '../components/AI/SmartPrioritySelector';
import { AutoTagButton } from '../components/AI/AutoTagButton';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
`;

const TestSection = styled(Card)`
  margin-bottom: 24px;
  
  .ant-card-head {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    .ant-card-head-title {
      color: white;
    }
  }
`;

const ResultBox = styled.div`
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
  
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
`;

const StatusBadge = styled(Tag)`
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 12px;
`;

export const AIFeaturesTestPage: React.FC = () => {
  const [testIssueId, setTestIssueId] = useState('');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check server status on mount
  React.useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      await axios.get(`${API_URL.replace('/api', '')}/health`);
      setServerStatus('online');
      message.success('Backend server is online!');
    } catch (error) {
      setServerStatus('offline');
      message.error('Backend server is offline. Please start it first.');
    }
  };

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const setResult = (key: string, value: any) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  // Test 1: Auto-Assignment
  const testAutoAssignment = async () => {
    if (!testIssueId) {
      message.warning('Please enter an Issue ID');
      return;
    }

    setLoadingState('assignment', true);
    try {
      const response = await axios.post(`${API_URL}/ai-auto-assignment/suggest/${testIssueId}`);
      setResult('assignment', response.data);
      message.success('Auto-assignment test successful!');
    } catch (error: any) {
      setResult('assignment', { error: error.response?.data || error.message });
      message.error('Auto-assignment test failed');
    } finally {
      setLoadingState('assignment', false);
    }
  };

  // Test 2: Smart Prioritization
  const testPrioritization = async () => {
    if (!testIssueId) {
      message.warning('Please enter an Issue ID');
      return;
    }

    setLoadingState('prioritization', true);
    try {
      const response = await axios.post(`${API_URL}/ai-smart-prioritization/analyze/${testIssueId}`);
      setResult('prioritization', response.data);
      message.success('Prioritization test successful!');
    } catch (error: any) {
      setResult('prioritization', { error: error.response?.data || error.message });
      message.error('Prioritization test failed');
    } finally {
      setLoadingState('prioritization', false);
    }
  };

  // Test 3: Auto-Tagging
  const testAutoTagging = async () => {
    if (!testIssueId) {
      message.warning('Please enter an Issue ID');
      return;
    }

    setLoadingState('tagging', true);
    try {
      const response = await axios.post(`${API_URL}/ai-auto-tagging/suggest/${testIssueId}`);
      setResult('tagging', response.data);
      message.success('Auto-tagging test successful!');
    } catch (error: any) {
      setResult('tagging', { error: error.response?.data || error.message });
      message.error('Auto-tagging test failed');
    } finally {
      setLoadingState('tagging', false);
    }
  };

  // Test 4: Create Test Issue
  const createTestIssue = async () => {
    setLoadingState('create', true);
    try {
      const response = await axios.post(`${API_URL}/issues`, {
        summary: 'Fix React component rendering bug in user dashboard',
        description: 'The user dashboard component is not rendering correctly when users have more than 100 notifications. This is a critical bug affecting customer experience and needs urgent attention.',
        type: 'bug',
        priority: 'medium',
        projectId: 'test-project',
        reporterId: 'test-user',
        status: 'todo',
        labels: []
      });

      const issueId = response.data.id;
      setTestIssueId(issueId);
      setResult('create', response.data);
      message.success(`Test issue created! ID: ${issueId}`);
    } catch (error: any) {
      setResult('create', { error: error.response?.data || error.message });
      message.error('Failed to create test issue');
    } finally {
      setLoadingState('create', false);
    }
  };

  // Test All Features
  const testAllFeatures = async () => {
    if (!testIssueId) {
      message.warning('Please enter an Issue ID or create a test issue first');
      return;
    }

    message.info('Running all tests...');
    await testAutoAssignment();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testPrioritization();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testAutoTagging();
    message.success('All tests completed!');
  };

  return (
    <Container>
      <h1 style={{ marginBottom: 24 }}>
        <RobotOutlined /> AI Features Test Dashboard
      </h1>

      {/* Server Status */}
      <Alert
        message={
          <Space>
            <strong>Backend Server Status:</strong>
            {serverStatus === 'checking' && <Spin size="small" />}
            {serverStatus === 'online' && <StatusBadge color="success">ONLINE</StatusBadge>}
            {serverStatus === 'offline' && <StatusBadge color="error">OFFLINE</StatusBadge>}
            <Button size="small" onClick={checkServerStatus}>Refresh</Button>
          </Space>
        }
        type={serverStatus === 'online' ? 'success' : serverStatus === 'offline' ? 'error' : 'info'}
        style={{ marginBottom: 24 }}
      />

      {/* Test Issue Input */}
      <TestSection title="Test Configuration">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>Issue ID for Testing:</strong>
            <Input
              placeholder="Enter existing issue ID or create a test issue"
              value={testIssueId}
              onChange={(e) => setTestIssueId(e.target.value)}
              style={{ marginTop: 8 }}
              size="large"
            />
          </div>

          <Space>
            <Button
              type="primary"
              onClick={createTestIssue}
              loading={loading.create}
              icon={<RobotOutlined />}
            >
              Create Test Issue
            </Button>
            <Button
              type="default"
              onClick={testAllFeatures}
              disabled={!testIssueId}
            >
              Run All Tests
            </Button>
          </Space>

          {results.create && (
            <ResultBox>
              <strong>Created Issue:</strong>
              <pre>{JSON.stringify(results.create, null, 2)}</pre>
            </ResultBox>
          )}
        </Space>
      </TestSection>

      {/* Test 1: Auto-Assignment */}
      <TestSection
        title={
          <Space>
            <UserAddOutlined />
            Test 1: AI Auto-Assignment
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            Tests the AI-powered automatic assignment feature. Analyzes team member expertise,
            workload, and availability to suggest the best assignee.
          </p>

          <Space>
            <Button
              type="primary"
              onClick={testAutoAssignment}
              loading={loading.assignment}
              disabled={!testIssueId}
            >
              Test Auto-Assignment API
            </Button>

            {testIssueId && (
              <AutoAssignButton
                issueId={testIssueId}
                onAssigned={(userId, userName) => {
                  message.success(`Assigned to ${userName}`);
                }}
              />
            )}
          </Space>

          {results.assignment && (
            <ResultBox>
              <strong>API Response:</strong>
              <pre>{JSON.stringify(results.assignment, null, 2)}</pre>
            </ResultBox>
          )}
        </Space>
      </TestSection>

      {/* Test 2: Smart Prioritization */}
      <TestSection
        title={
          <Space>
            <ThunderboltOutlined />
            Test 2: Smart Prioritization
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            Tests the AI-powered priority analysis. Evaluates urgency, impact, and business
            value to suggest optimal priority level.
          </p>

          <Space>
            <Button
              type="primary"
              onClick={testPrioritization}
              loading={loading.prioritization}
              disabled={!testIssueId}
            >
              Test Prioritization API
            </Button>

            {testIssueId && (
              <SmartPrioritySelector
                issueId={testIssueId}
                onPriorityChanged={(priority) => {
                  message.success(`Priority changed to ${priority}`);
                }}
              />
            )}
          </Space>

          {results.prioritization && (
            <ResultBox>
              <strong>API Response:</strong>
              <pre>{JSON.stringify(results.prioritization, null, 2)}</pre>
            </ResultBox>
          )}
        </Space>
      </TestSection>

      {/* Test 3: Auto-Tagging */}
      <TestSection
        title={
          <Space>
            <TagsOutlined />
            Test 3: Auto-Tagging
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            Tests the AI-powered tag suggestion feature. Analyzes issue content to suggest
            relevant tags across technical, functional, and priority categories.
          </p>

          <Space>
            <Button
              type="primary"
              onClick={testAutoTagging}
              loading={loading.tagging}
              disabled={!testIssueId}
            >
              Test Auto-Tagging API
            </Button>

            {testIssueId && (
              <AutoTagButton
                issueId={testIssueId}
                onTagsChanged={(tags) => {
                  message.success(`Tags updated: ${tags.join(', ')}`);
                }}
              />
            )}
          </Space>

          {results.tagging && (
            <ResultBox>
              <strong>API Response:</strong>
              <pre>{JSON.stringify(results.tagging, null, 2)}</pre>
            </ResultBox>
          )}
        </Space>
      </TestSection>

      {/* Summary */}
      <Card title="Test Summary">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>Tests Run:</strong> {Object.keys(results).length}
          </div>
          <div>
            <strong>Backend Status:</strong> {serverStatus}
          </div>
          <div>
            <strong>Current Issue ID:</strong> {testIssueId || 'None'}
          </div>

          <Divider />

          <Alert
            message="Testing Tips"
            description={
              <ul>
                <li>Make sure backend server is running (usually port 3001)</li>
                <li>Create a test issue first or use an existing issue ID</li>
                <li>Each test can be run individually or all together</li>
                <li>Check the API responses in the result boxes below each test</li>
                <li>Use the UI buttons to test the actual components</li>
              </ul>
            }
            type="info"
          />
        </Space>
      </Card>
    </Container>
  );
};

export default AIFeaturesTestPage;
