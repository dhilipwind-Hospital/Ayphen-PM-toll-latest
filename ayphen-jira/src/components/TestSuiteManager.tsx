import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Modal, Input, Select, Tag, Tooltip } from 'antd';
import { Plus, X, Play, Edit2, Trash2, GripVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const SuiteCard = styled.div`
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const SuiteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const SuiteInfo = styled.div`
  flex: 1;
`;

const SuiteName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 4px 0;
`;

const SuiteDescription = styled.p`
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
`;

const SuiteStats = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #595959;
`;

const SuiteActions = styled.div`
  display: flex;
  gap: 8px;
`;

const TestCasesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
`;

const TestCaseItem = styled.div<{ $isDragging?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$isDragging ? '#f0f0f0' : '#fafafa'};
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background: #f5f5f5;
    border-color: #bfbfbf;
  }
`;

const DragHandle = styled.div`
  cursor: grab;
  color: #8c8c8c;
  
  &:active {
    cursor: grabbing;
  }
`;

const TestCaseInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TestCaseKey = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #1890ff;
  margin-right: 8px;
`;

const TestCaseName = styled.span`
  font-size: 14px;
  color: #262626;
`;

const TestCaseActions = styled.div`
  display: flex;
  gap: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
  font-size: 14px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TestCaseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
`;

const TestCaseOption = styled.div<{ $selected?: boolean }>`
  padding: 12px;
  border: 2px solid ${props => props.$selected ? '#1890ff' : '#d9d9d9'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$selected ? '#e6f7ff' : 'white'};
  
  &:hover {
    border-color: #1890ff;
    background: #f0f9ff;
  }
`;

const SearchInput = styled(Input.Search)`
  margin-bottom: 16px;
`;

export interface TestCase {
  id: string;
  key: string;
  name: string;
  status?: 'passed' | 'failed' | 'pending';
  order: number;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  testCases: TestCase[];
  status?: 'draft' | 'active' | 'archived';
}

interface TestSuiteManagerProps {
  projectId: string;
  suites: TestSuite[];
  availableTestCases: TestCase[];
  onUpdate: (suites: TestSuite[]) => Promise<void>;
}

interface SortableTestCaseProps {
  testCase: TestCase;
  onRemove: () => void;
  onRun: () => void;
  onEdit: () => void;
}

const SortableTestCase: React.FC<SortableTestCaseProps> = ({ testCase, onRemove, onRun, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: testCase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusIcon = () => {
    switch (testCase.status) {
      case 'passed': return <CheckCircle size={16} color="#52c41a" />;
      case 'failed': return <XCircle size={16} color="#ff4d4f" />;
      case 'pending': return <Clock size={16} color="#faad14" />;
      default: return <Clock size={16} color="#d9d9d9" />;
    }
  };

  const getStatusTag = () => {
    switch (testCase.status) {
      case 'passed': return <Tag color="success">Passed</Tag>;
      case 'failed': return <Tag color="error">Failed</Tag>;
      case 'pending': return <Tag color="warning">Pending</Tag>;
      default: return <Tag>Not Run</Tag>;
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TestCaseItem $isDragging={isDragging}>
        <DragHandle {...attributes} {...listeners}>
          <GripVertical size={16} />
        </DragHandle>
        {getStatusIcon()}
        <TestCaseInfo>
          <div>
            <TestCaseKey>{testCase.key}</TestCaseKey>
            <TestCaseName>{testCase.name}</TestCaseName>
          </div>
        </TestCaseInfo>
        {getStatusTag()}
        <TestCaseActions>
          <Tooltip title="Run test">
            <Button
              type="text"
              size="small"
              icon={<Play size={14} />}
              onClick={onRun}
            />
          </Tooltip>
          <Tooltip title="Edit test case">
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={14} />}
              onClick={onEdit}
            />
          </Tooltip>
          <Tooltip title="Remove from suite">
            <Button
              type="text"
              size="small"
              danger
              icon={<X size={14} />}
              onClick={onRemove}
            />
          </Tooltip>
        </TestCaseActions>
      </TestCaseItem>
    </div>
  );
};

export const TestSuiteManager: React.FC<TestSuiteManagerProps> = ({
  projectId,
  suites: initialSuites,
  availableTestCases,
  onUpdate,
}) => {
  const [suites, setSuites] = useState<TestSuite[]>(initialSuites);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTestCaseModalVisible, setEditTestCaseModalVisible] = useState(false);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', category: '' });
  const [testCaseEditForm, setTestCaseEditForm] = useState({ key: '', name: '', status: '' });
  const { success, error } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSuites(initialSuites);
  }, [initialSuites]);

  const saveSuites = async (updatedSuites: TestSuite[]) => {
    try {
      await onUpdate(updatedSuites);
      setSuites(updatedSuites);
      success('Test suite updated');
    } catch (err) {
      error('Failed to update test suite');
      console.error(err);
    }
  };

  const handleAddTestCases = async () => {
    if (!selectedSuiteId || selectedTestCases.length === 0) {
      error('Please select at least one test case');
      return;
    }

    const suite = suites.find(s => s.id === selectedSuiteId);
    if (!suite) return;

    const newTestCases = selectedTestCases
      .map(id => availableTestCases.find(tc => tc.id === id))
      .filter(Boolean) as TestCase[];

    const existingIds = new Set(suite.testCases.map(tc => tc.id));
    const uniqueNewCases = newTestCases.filter(tc => !existingIds.has(tc.id));

    if (uniqueNewCases.length === 0) {
      error('All selected test cases are already in this suite');
      return;
    }

    const updatedSuite = {
      ...suite,
      testCases: [
        ...suite.testCases,
        ...uniqueNewCases.map((tc, index) => ({
          ...tc,
          order: suite.testCases.length + index,
        })),
      ],
    };

    const updatedSuites = suites.map(s => s.id === selectedSuiteId ? updatedSuite : s);
    await saveSuites(updatedSuites);

    setAddModalVisible(false);
    setSelectedTestCases([]);
    setSearchQuery('');
  };

  const handleEditSuite = (suite: TestSuite) => {
    setEditingSuite(suite);
    setEditForm({
      name: suite.name,
      description: suite.description || '',
      category: suite.status || 'active',
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSuite || !editForm.name.trim()) {
      error('Suite name is required');
      return;
    }

    const updatedSuite = {
      ...editingSuite,
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      status: editForm.category as 'draft' | 'active' | 'archived',
    };

    const updatedSuites = suites.map(s => s.id === editingSuite.id ? updatedSuite : s);
    await saveSuites(updatedSuites);

    setEditModalVisible(false);
    setEditingSuite(null);
    setEditForm({ name: '', description: '', category: '' });
  };

  const handleRemoveTestCase = async (suiteId: string, testCaseId: string) => {
    const suite = suites.find(s => s.id === suiteId);
    if (!suite) return;

    const updatedTestCases = suite.testCases
      .filter(tc => tc.id !== testCaseId)
      .map((tc, index) => ({ ...tc, order: index }));

    const updatedSuite = { ...suite, testCases: updatedTestCases };
    const updatedSuites = suites.map(s => s.id === suiteId ? updatedSuite : s);

    await saveSuites(updatedSuites);
  };

  const handleDragEnd = async (suiteId: string, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const suite = suites.find(s => s.id === suiteId);
    if (!suite) return;

    const oldIndex = suite.testCases.findIndex(tc => tc.id === active.id);
    const newIndex = suite.testCases.findIndex(tc => tc.id === over.id);

    const reordered = arrayMove(suite.testCases, oldIndex, newIndex).map((tc, index) => ({
      ...tc,
      order: index,
    }));

    const updatedSuite = { ...suite, testCases: reordered };
    const updatedSuites = suites.map(s => s.id === suiteId ? updatedSuite : s);

    await saveSuites(updatedSuites);
  };

  const handleRunTest = async (testCaseId: string) => {
    // Simulate running test
    success(`Running test ${testCaseId}...`);
    // In real implementation, call API to run test
  };

  const handleRunAllTests = async (suiteId: string) => {
    const suite = suites.find(s => s.id === suiteId);
    if (!suite) return;

    success(`Running all ${suite.testCases.length} tests in ${suite.name}...`);
    // In real implementation, call API to run all tests
  };

  const handleEditTestCase = (suiteId: string, testCase: TestCase) => {
    setSelectedSuiteId(suiteId);
    setEditingTestCase(testCase);
    setTestCaseEditForm({
      key: testCase.key,
      name: testCase.name,
      status: testCase.status || '',
    });
    setEditTestCaseModalVisible(true);
  };

  const handleSaveTestCaseEdit = async () => {
    if (!editingTestCase || !selectedSuiteId || !testCaseEditForm.name.trim()) {
      error('Test case name is required');
      return;
    }

    const suite = suites.find(s => s.id === selectedSuiteId);
    if (!suite) return;

    const updatedTestCases = suite.testCases.map(tc =>
      tc.id === editingTestCase.id
        ? {
            ...tc,
            key: testCaseEditForm.key.trim(),
            name: testCaseEditForm.name.trim(),
            status: testCaseEditForm.status as 'passed' | 'failed' | 'pending' | undefined,
          }
        : tc
    );

    const updatedSuite = { ...suite, testCases: updatedTestCases };
    const updatedSuites = suites.map(s => s.id === selectedSuiteId ? updatedSuite : s);
    await saveSuites(updatedSuites);

    setEditTestCaseModalVisible(false);
    setEditingTestCase(null);
    setTestCaseEditForm({ key: '', name: '', status: '' });
  };

  const filteredAvailableTests = availableTestCases.filter(tc =>
    tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tc.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPassedCount = (suite: TestSuite) =>
    suite.testCases.filter(tc => tc.status === 'passed').length;

  const getFailedCount = (suite: TestSuite) =>
    suite.testCases.filter(tc => tc.status === 'failed').length;

  return (
    <Container>
      <Header>
        <Title>Test Suites</Title>
        <HeaderActions>
          <Button type="primary" icon={<Plus size={16} />}>
            Create Suite
          </Button>
        </HeaderActions>
      </Header>

      {suites.length === 0 ? (
        <EmptyState>
          No test suites yet. Create your first test suite to organize your test cases.
        </EmptyState>
      ) : (
        suites.map(suite => (
          <SuiteCard key={suite.id}>
            <SuiteHeader>
              <SuiteInfo>
                <SuiteName>{suite.name}</SuiteName>
                {suite.description && <SuiteDescription>{suite.description}</SuiteDescription>}
              </SuiteInfo>
              <SuiteStats>
                <StatItem>
                  <CheckCircle size={16} color="#52c41a" />
                  {getPassedCount(suite)} passed
                </StatItem>
                <StatItem>
                  <XCircle size={16} color="#ff4d4f" />
                  {getFailedCount(suite)} failed
                </StatItem>
                <StatItem>
                  {suite.testCases.length} total
                </StatItem>
              </SuiteStats>
              <SuiteActions>
                <Button
                  icon={<Play size={16} />}
                  onClick={() => handleRunAllTests(suite.id)}
                >
                  Run All
                </Button>
                <Button
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setSelectedSuiteId(suite.id);
                    setAddModalVisible(true);
                  }}
                >
                  Add Tests
                </Button>
                <Button icon={<Edit2 size={16} />} onClick={() => handleEditSuite(suite)} />
                <Button danger icon={<Trash2 size={16} />} />
              </SuiteActions>
            </SuiteHeader>

            {suite.testCases.length === 0 ? (
              <EmptyState>
                No test cases in this suite. Click "Add Tests" to add test cases.
              </EmptyState>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(suite.id, event)}
              >
                <SortableContext
                  items={suite.testCases.map(tc => tc.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <TestCasesList>
                    {suite.testCases.map(testCase => (
                      <SortableTestCase
                        key={testCase.id}
                        testCase={testCase}
                        onRemove={() => handleRemoveTestCase(suite.id, testCase.id)}
                        onRun={() => handleRunTest(testCase.id)}
                        onEdit={() => handleEditTestCase(suite.id, testCase)}
                      />
                    ))}
                  </TestCasesList>
                </SortableContext>
              </DndContext>
            )}
          </SuiteCard>
        ))
      )}

      <Modal
        title="Add Test Cases"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setSelectedTestCases([]);
          setSearchQuery('');
        }}
        onOk={handleAddTestCases}
        okText="Add Selected"
        okButtonProps={{ disabled: selectedTestCases.length === 0 }}
        width={800}
      >
        <ModalContent>
          <SearchInput
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
          <TestCaseGrid>
            {filteredAvailableTests.map(testCase => (
              <TestCaseOption
                key={testCase.id}
                $selected={selectedTestCases.includes(testCase.id)}
                onClick={() => {
                  setSelectedTestCases(prev =>
                    prev.includes(testCase.id)
                      ? prev.filter(id => id !== testCase.id)
                      : [...prev, testCase.id]
                  );
                }}
              >
                <TestCaseKey>{testCase.key}</TestCaseKey>
                <TestCaseName>{testCase.name}</TestCaseName>
              </TestCaseOption>
            ))}
          </TestCaseGrid>
          {selectedTestCases.length > 0 && (
            <div style={{ marginTop: 8, color: '#1890ff' }}>
              {selectedTestCases.length} test case(s) selected
            </div>
          )}
        </ModalContent>
      </Modal>

      <Modal
        title="Edit Test Suite"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingSuite(null);
          setEditForm({ name: '', description: '', category: '' });
        }}
        onOk={handleSaveEdit}
        okText="Save"
        okButtonProps={{ disabled: !editForm.name.trim() }}
      >
        <ModalContent>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Suite Name <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Enter suite name"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Description
            </label>
            <Input.TextArea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Enter description"
              rows={3}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Category
            </label>
            <Input
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              placeholder="Enter category"
            />
          </div>
        </ModalContent>
      </Modal>

      <Modal
        title="Edit Test Case"
        open={editTestCaseModalVisible}
        onCancel={() => {
          setEditTestCaseModalVisible(false);
          setEditingTestCase(null);
          setTestCaseEditForm({ key: '', name: '', status: '' });
        }}
        onOk={handleSaveTestCaseEdit}
        okText="Save"
        okButtonProps={{ disabled: !testCaseEditForm.name.trim() }}
      >
        <ModalContent>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Test Case Key <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Input
              value={testCaseEditForm.key}
              onChange={(e) => setTestCaseEditForm({ ...testCaseEditForm, key: e.target.value })}
              placeholder="e.g., TC-LOGIN-001"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Test Case Name <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Input
              value={testCaseEditForm.name}
              onChange={(e) => setTestCaseEditForm({ ...testCaseEditForm, name: e.target.value })}
              placeholder="Enter test case name"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Status
            </label>
            <Input
              value={testCaseEditForm.status}
              onChange={(e) => setTestCaseEditForm({ ...testCaseEditForm, status: e.target.value })}
              placeholder="passed, failed, pending"
            />
          </div>
        </ModalContent>
      </Modal>
    </Container>
  );
};
