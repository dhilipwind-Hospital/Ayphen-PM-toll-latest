import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, List, Typography } from 'antd';
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { TextArea } = Input;
const { Title, Text } = Typography;

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const CardActions = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
`;

export default function TestSuites() {
  const [suites, setSuites] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [open, setOpen] = useState(false);
  const [addTestOpen, setAddTestOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadSuites();
    loadTestCases();
  }, []);

  const loadSuites = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.get('/test-suites', {
        params: { userId }
      });
      setSuites(res.data || []);
    } catch (error) {
      console.error('Failed to load suites:', error);
      setSuites([]);
    }
  };

  const loadTestCases = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.get('/manual-test-cases', {
        params: { userId }
      });
      setTestCases(res.data || []);
    } catch (error) {
      console.error('Failed to load test cases:', error);
      setTestCases([]);
    }
  };

  const handleCreate = async () => {
    try {
      const userId = localStorage.getItem('userId');
      await api.post('/test-suites', { ...form, userId });
      setOpen(false);
      setForm({ name: '', description: '' });
      loadSuites();
    } catch (error) {
      console.error('Failed to create suite:', error);
    }
  };

  const handleAddTest = async (testCaseId: number) => {
    try {
      await api.post(`/test-suites/${selectedSuite}/test-cases`, { testCaseId });
      setAddTestOpen(false);
      loadSuites();
    } catch (error) {
      console.error('Failed to add test to suite:', error);
    }
  };

  const handleRun = async (suiteId: number) => {
    try {
      const userId = localStorage.getItem('userId');
      await api.post(`/test-suites/${suiteId}/run`, { userId });
      // Navigate to test runs list instead of specific run (route may not exist)
      navigate('/test-runs');
    } catch (error) {
      console.error('Failed to run suite:', error);
    }
  };

  return (
    <Container>
      <Header>
        <Title level={1}>Test Suites</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Create Suite
        </Button>
      </Header>

      <GridContainer>
        {suites.length === 0 ? (
          <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
            <Text type="secondary">No test suites yet. Create one to get started!</Text>
          </Card>
        ) : (
          suites.map((suite: any) => (
            <Card key={suite.id} title={suite.name}>
              <Text type="secondary">{suite.description}</Text>
              <CardActions>
                <Button size="small" icon={<PlusOutlined />} onClick={() => { setSelectedSuite(suite.id); setAddTestOpen(true); }}>
                  Add Test
                </Button>
                <Button size="small" icon={<PlayCircleOutlined />} onClick={() => handleRun(suite.id)}>
                  Run Suite
                </Button>
              </CardActions>
            </Card>
          ))
        )}
      </GridContainer>

      <Modal
        title="Create Test Suite"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleCreate}
        okText="Create"
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Suite Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ marginBottom: 16 }}
          />
          <TextArea
            rows={3}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        title="Add Test Case"
        open={addTestOpen}
        onCancel={() => setAddTestOpen(false)}
        footer={null}
      >
        <List
          dataSource={testCases}
          renderItem={(tc: any) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => handleAddTest(tc.id)}
            >
              <List.Item.Meta
                title={tc.title}
                description={tc.description}
              />
            </List.Item>
          )}
        />
      </Modal>
    </Container>
  );
}
