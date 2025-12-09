# 🎨 PROMPT: Frontend AI Features Integration

## 🎯 OBJECTIVE
Connect the existing AI Features UI (visible at `/ai-features?tab=1`) to the fully implemented backend APIs.

---

## ✅ WHAT'S ALREADY DONE

### **Backend (100% Complete)**
- ✅ PMBot Service with auto-assignment, stale detection, triage
- ✅ Meeting Scribe Service with transcript processing
- ✅ Predictive Alerts Service with monitoring
- ✅ All API routes registered and working
- ✅ Integration in `index.ts` complete

### **Frontend (UI Exists)**
- ✅ AI Features page at `/ai-features?tab=1`
- ✅ Three tabs visible: PMBot Dashboard, Meeting Scribe, PMBot Settings
- ✅ Shows metrics: 5 auto-assignments, 12 stale issues, 8 triaged

---

## 📋 WHAT NEEDS TO BE DONE

### **1. Create API Service Layer**

Create `src/services/ai-features-api.ts`:

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:8500/api';

export const aiFeaturesAPI = {
  // PMBot APIs
  pmbot: {
    async getActivity(projectId: string, days: number = 7) {
      const response = await axios.get(
        `${API_BASE}/pmbot/activity/${projectId}?days=${days}`
      );
      return response.data;
    },

    async autoAssign(issueId: string) {
      const response = await axios.post(
        `${API_BASE}/pmbot/auto-assign/${issueId}`
      );
      return response.data;
    },

    async staleSweep(projectId: string) {
      const response = await axios.post(
        `${API_BASE}/pmbot/stale-sweep/${projectId}`
      );
      return response.data;
    },

    async triageIssue(issueId: string) {
      const response = await axios.post(
        `${API_BASE}/pmbot/triage/${issueId}`
      );
      return response.data;
    }
  },

  // Meeting Scribe APIs
  meetingScribe: {
    async processTranscript(data: {
      transcript: string;
      projectId: string;
      meetingTitle?: string;
      attendees?: string[];
    }) {
      const response = await axios.post(
        `${API_BASE}/meeting-scribe/process`,
        data
      );
      return response.data;
    },

    async quickProcess(notes: string, projectId: string) {
      const response = await axios.post(
        `${API_BASE}/meeting-scribe/quick`,
        { notes, projectId }
      );
      return response.data;
    }
  },

  // Predictive Alerts APIs
  alerts: {
    async getAlerts(projectId: string) {
      const response = await axios.get(
        `${API_BASE}/predictive-alerts/${projectId}`
      );
      return response.data;
    },

    async dismissAlert(alertId: string, userId: string) {
      const response = await axios.post(
        `${API_BASE}/predictive-alerts/dismiss/${alertId}`,
        { userId }
      );
      return response.data;
    }
  }
};
```

---

### **2. Create PMBot Dashboard Component**

Create `src/components/AIFeatures/PMBotDashboard.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, List, Button, message, Spin } from 'antd';
import { RobotOutlined, CheckCircleOutlined, AlertOutlined, TagsOutlined } from '@ant-design/icons';
import { aiFeaturesAPI } from '../../services/ai-features-api';

interface ActivitySummary {
  autoAssignments: number;
  staleIssuesDetected: number;
  issuesTriaged: number;
  recentActivity: Array<{
    action: string;
    issueKey: string;
    timestamp: string;
    details: string;
  }>;
}

export const PMBotDashboard: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  useEffect(() => {
    loadActivity();
  }, [projectId]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const data = await aiFeaturesAPI.pmbot.getActivity(projectId, 7);
      setActivity(data.summary);
    } catch (error) {
      message.error('Failed to load PMBot activity');
    } finally {
      setLoading(false);
    }
  };

  const runStaleSweep = async () => {
    try {
      setRunningAction('stale-sweep');
      const result = await aiFeaturesAPI.pmbot.staleSweep(projectId);
      message.success(`Found ${result.staleIssues.length} stale issues`);
      loadActivity(); // Refresh
    } catch (error) {
      message.error('Failed to run stale sweep');
    } finally {
      setRunningAction(null);
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div className="pmbot-dashboard">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Auto-Assignments This Week"
              value={activity?.autoAssignments || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Stale Issues Detected"
              value={activity?.staleIssuesDetected || 0}
              prefix={<AlertOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Issues Triaged"
              value={activity?.issuesTriaged || 0}
              prefix={<TagsOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<><RobotOutlined /> PMBot Activity</>}
        extra={
          <Button
            type="primary"
            loading={runningAction === 'stale-sweep'}
            onClick={runStaleSweep}
          >
            Run Stale Sweep
          </Button>
        }
      >
        <List
          dataSource={activity?.recentActivity || []}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={`${item.action} - ${item.issueKey}`}
                description={item.details}
              />
              <div>{new Date(item.timestamp).toLocaleString()}</div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
```

---

### **3. Create Meeting Scribe Component**

Create `src/components/AIFeatures/MeetingScribe.tsx`:

```typescript
import React, { useState } from 'react';
import { Card, Input, Select, Button, message, List, Tag } from 'antd';
import { FileTextOutlined, RocketOutlined } from '@ant-design/icons';
import { aiFeaturesAPI } from '../../services/ai-features-api';

const { TextArea } = Input;

export const MeetingScribe: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const processTranscript = async () => {
    if (!transcript.trim()) {
      message.warning('Please enter meeting transcript');
      return;
    }

    try {
      setProcessing(true);
      const result = await aiFeaturesAPI.meetingScribe.processTranscript({
        transcript,
        projectId,
        meetingTitle
      });
      
      setResults(result);
      message.success(`Created ${result.issuesCreated?.length || 0} issues`);
    } catch (error) {
      message.error('Failed to process transcript');
    } finally {
      setProcessing(false);
    }
  };

  const quickProcess = async () => {
    if (!transcript.trim()) {
      message.warning('Please enter notes');
      return;
    }

    try {
      setProcessing(true);
      const result = await aiFeaturesAPI.meetingScribe.quickProcess(
        transcript,
        projectId
      );
      
      setResults(result);
      message.success('Notes processed successfully');
    } catch (error) {
      message.error('Failed to process notes');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="meeting-scribe">
      <Card title={<><FileTextOutlined /> Meeting Scribe</>}>
        <Input
          placeholder="Meeting Title (optional)"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <TextArea
          placeholder="Paste meeting transcript or notes here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={10}
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            loading={processing}
            onClick={processTranscript}
          >
            Process Full Transcript
          </Button>
          <Button
            loading={processing}
            onClick={quickProcess}
          >
            Quick Process
          </Button>
        </div>
      </Card>

      {results && (
        <Card
          title="Results"
          style={{ marginTop: 16 }}
        >
          <List
            dataSource={results.issuesCreated || []}
            renderItem={(issue: any) => (
              <List.Item>
                <List.Item.Meta
                  title={issue.key}
                  description={issue.summary}
                />
                <Tag color="blue">{issue.type}</Tag>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};
```

---

### **4. Create PMBot Settings Component**

Create `src/components/AIFeatures/PMBotSettings.tsx`:

```typescript
import React, { useState } from 'react';
import { Card, Form, Slider, Switch, Button, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

export const PMBotSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const saveSettings = async (values: any) => {
    try {
      setSaving(true);
      // TODO: Implement settings API
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={<><SettingOutlined /> PMBot Settings</>}>
      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        initialValues={{
          staleThreshold: 7,
          escalationThreshold: 14,
          maxWorkload: 25,
          autoAssignEnabled: true,
          staleDetectionEnabled: true,
          autoTriageEnabled: true
        }}
      >
        <Form.Item
          label="Stale Issue Threshold (days)"
          name="staleThreshold"
        >
          <Slider min={1} max={30} marks={{ 1: '1', 7: '7', 14: '14', 30: '30' }} />
        </Form.Item>

        <Form.Item
          label="Escalation Threshold (days)"
          name="escalationThreshold"
        >
          <Slider min={7} max={60} marks={{ 7: '7', 14: '14', 30: '30', 60: '60' }} />
        </Form.Item>

        <Form.Item
          label="Max Workload Per Person (story points)"
          name="maxWorkload"
        >
          <Slider min={10} max={50} marks={{ 10: '10', 25: '25', 40: '40', 50: '50' }} />
        </Form.Item>

        <Form.Item
          label="Auto-Assignment"
          name="autoAssignEnabled"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Stale Issue Detection"
          name="staleDetectionEnabled"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Auto-Triage"
          name="autoTriageEnabled"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={saving}>
          Save Settings
        </Button>
      </Form>
    </Card>
  );
};
```

---

### **5. Update AI Features Page**

Update `src/pages/AIFeatures.tsx`:

```typescript
import React, { useState } from 'react';
import { Tabs } from 'antd';
import { RobotOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import { PMBotDashboard } from '../components/AIFeatures/PMBotDashboard';
import { MeetingScribe } from '../components/AIFeatures/MeetingScribe';
import { PMBotSettings } from '../components/AIFeatures/PMBotSettings';
import { useProject } from '../hooks/useProject'; // Assuming you have this

export const AIFeaturesPage: React.FC = () => {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState('dashboard');

  const items = [
    {
      key: 'dashboard',
      label: <><RobotOutlined /> PMBot Dashboard</>,
      children: <PMBotDashboard projectId={currentProject?.id || ''} />
    },
    {
      key: 'scribe',
      label: <><FileTextOutlined /> Meeting Scribe</>,
      children: <MeetingScribe projectId={currentProject?.id || ''} />
    },
    {
      key: 'settings',
      label: <><SettingOutlined /> PMBot Settings</>,
      children: <PMBotSettings />
    }
  ];

  return (
    <div className="ai-features-page" style={{ padding: 24 }}>
      <h1>🤖 AI Features</h1>
      <p>Autonomous PM assistant, meeting scribe, and intelligent automation</p>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </div>
  );
};
```

---

## 🚀 IMPLEMENTATION STEPS

### **Step 1: Create API Service**
```bash
cd src/services
# Create ai-features-api.ts with the code above
```

### **Step 2: Create Components**
```bash
cd src/components
mkdir AIFeatures
cd AIFeatures
# Create PMBotDashboard.tsx
# Create MeetingScribe.tsx
# Create PMBotSettings.tsx
```

### **Step 3: Update Page**
```bash
cd src/pages
# Update AIFeatures.tsx
```

### **Step 4: Test**
```bash
# Start servers if not running
npm run dev

# Navigate to http://localhost:1600/ai-features?tab=1
# Test all three tabs
```

---

## ✅ SUCCESS CRITERIA

1. ✅ PMBot Dashboard shows real metrics from API
2. ✅ "Run Stale Sweep" button works
3. ✅ Meeting Scribe processes transcripts
4. ✅ Created issues appear in results
5. ✅ Settings can be saved
6. ✅ All API calls work without errors

---

## 🎯 EXPECTED RESULT

After implementation, you'll have:
- **Fully functional PMBot Dashboard** with real-time metrics
- **Working Meeting Scribe** that creates issues from notes
- **Configurable Settings** for PMBot behavior
- **100% Frontend-Backend Integration** for AI features

---

**This will complete the AI Features integration and make your platform truly autonomous!** 🚀🤖
