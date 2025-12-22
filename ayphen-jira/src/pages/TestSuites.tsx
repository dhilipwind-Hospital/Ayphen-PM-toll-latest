import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, List, Typography, message, Checkbox } from 'antd';
import { PlusOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useStore } from '../store/useStore';

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
  const { currentProject } = useStore(); // Get current project
  const [suites, setSuites] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [open, setOpen] = useState(false);
  const [addTestOpen, setAddTestOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedTestCases, setSelectedTestCases] = useState<number[]>([]);
  const [existingTestIds, setExistingTestIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (currentProject) {
      loadSuites();
      loadTestCases();
    }
  }, [currentProject?.id]); // Re-load when project changes

  const loadSuites = async () => {
    if (!currentProject) return;
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.get('/test-suites', {
        params: { userId, projectId: currentProject.id } // Pass projectId
      });
      setSuites(res.data || []);
    } catch (error) {
      console.error('Failed to load suites:', error);
      setSuites([]);
    }
  };

  const loadTestCases = async () => {
    // ... (existing logic, maybe filter by project if API supports it, but keeping as is for now)
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.get('/manual-test-cases', {
        params: { userId, projectId: currentProject?.id } // Pass projectId just in case
      });
      setTestCases(res.data || []);
    } catch (error) {
      console.error('Failed to load test cases:', error);
      setTestCases([]);
    }
  };

  const handleCreate = async () => {
    if (!currentProject) {
      message.error("No project selected");
      return;
    }
    try {
      const userId = localStorage.getItem('userId');
      await api.post('/test-suites', {
        ...form,
        userId,
        projectId: currentProject.id  // Pass projectId
      });
      setOpen(false);
      setForm({ name: '', description: '' });
      loadSuites();
      message.success("Test Suite created");
    } catch (error) {
      console.error('Failed to create suite:', error);
      message.error("Failed to create suite");
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedSuite || selectedTestCases.length === 0) return;

    try {
      // Loop to add multiple. Better to have bulk API, but this works for now.
      for (const testCaseId of selectedTestCases) {
        await api.post(`/test-suites/${selectedSuite}/test-cases`, { testCaseId });
      }

      message.success(`Added ${selectedTestCases.length} test cases to suite`);
      setAddTestOpen(false);
      setSelectedTestCases([]);
      loadSuites();
    } catch (error) {
      console.error('Failed to add tests to suite:', error);
      message.error('Failed to add test cases');
    }
  };

  const onOpenAddTestModal = async (suiteId: number) => {
    setSelectedSuite(suiteId);
    setSelectedTestCases([]);

    // Refresh available test cases
    loadTestCases();

    try {
      // Fetch suite details to see what's already added
      const res = await api.get(`/test-suites/${suiteId}`); // Ensure backend returns testCases
      if (res.data && res.data.testCases) {
        const ids = new Set<number>(res.data.testCases.map((tc: any) => tc.id));
        setExistingTestIds(ids);
      } else {
        setExistingTestIds(new Set());
      }
    } catch (e) {
      console.error("Failed to load suite details", e);
      setExistingTestIds(new Set());
    }

    setAddTestOpen(true);
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
                <Button size="small" icon={<PlusOutlined />} onClick={() => onOpenAddTestModal(suite.id)}>
                  Add Test
                </Button>
                <Button size="small" icon={<PlayCircleOutlined />} onClick={() => handleRun(suite.id)}>
                  Run Suite
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Test Suite',
                      content: 'Are you sure you want to delete this test suite? This cannot be undone.',
                      okText: 'Delete',
                      okType: 'danger',
                      onOk: async () => {
                        try {
                          const userId = localStorage.getItem('userId');
                          await api.delete(`/test-suites/${suite.id}`, { params: { userId } });
                          loadSuites();
                          message.success('Test suite deleted');
                        } catch (error) {
                          message.error('Failed to delete suite');
                        }
                      }
                    });
                  }}
                />
              </CardActions>
            </Card>
          ))
        )}
      </GridContainer>

      <Modal
        title="Add Test Cases"
        open={addTestOpen}
        onCancel={() => {
          setAddTestOpen(false);
          setSelectedTestCases([]);
        }}
        onOk={handleBulkAdd}
        okText={`Add Selected (${selectedTestCases.length})`}
        okButtonProps={{ disabled: selectedTestCases.length === 0 }}
      >
        <List
          dataSource={testCases.filter((tc: any) => !existingTestIds.has(tc.id))}
          locale={{ emptyText: "No available test cases to add." }}
          renderItem={(tc: any) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const newSelected = selectedTestCases.includes(tc.id)
                  ? selectedTestCases.filter(id => id !== tc.id)
                  : [...selectedTestCases, tc.id];
                setSelectedTestCases(newSelected);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: 12, width: '100%' }}>
                <Checkbox
                  checked={selectedTestCases.includes(tc.id)}
                  style={{ marginTop: 4 }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>{tc.title}</div>
                  <div style={{ color: '#888', fontSize: 13 }}>{tc.description}</div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Modal>
    </Container>
  );
}
