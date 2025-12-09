import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Card, Select, Button, Drawer, Form, Input, DatePicker, Progress, Tag, message, Modal } from 'antd';
import { Calendar, Filter, Plus, Edit, Link as LinkIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import axios from 'axios';
import dayjs from 'dayjs';

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 56px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const TimelineContainer = styled(Card)`
  margin-bottom: 24px;
  overflow-x: auto;
`;

const Timeline = styled.div`
  position: relative;
  min-width: 1200px;
  padding: 20px 0;
`;

const TimelineHeader = styled.div`
  display: flex;
  border-bottom: 2px solid #e8e8e8;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const PeriodColumn = styled.div<{ width: number }>`
  flex: 0 0 ${props => props.width}px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: #666;
  border-right: 1px solid #f0f0f0;
`;

const EpicsContainer = styled.div`
  position: relative;
`;

const EpicRow = styled.div`
  position: relative;
  height: 60px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
`;

const EpicLabel = styled.div`
  position: absolute;
  left: 0;
  width: 200px;
  padding: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  
  &:hover {
    background: #f5f5f5;
    border-radius: 4px;
  }
`;

const EpicBar = styled.div<{ left: number; width: number; color: string; isDragging?: boolean }>`
  position: absolute;
  left: ${props => props.left + 220}px;
  width: ${props => props.width}px;
  height: 40px;
  background: ${props => props.color};
  border-radius: 6px;
  cursor: move;
  display: flex;
  align-items: center;
  padding: 0 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: ${props => props.isDragging ? 'none' : 'all 0.2s ease'};
  opacity: ${props => props.isDragging ? 0.7 : 1};
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
`;

const EpicBarContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  color: white;
  font-size: 12px;
  font-weight: 500;
`;

const ResizeHandle = styled.div<{ position: 'left' | 'right' }>`
  position: absolute;
  ${props => props.position}: 0;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: ${props => props.position === 'left' ? 'w-resize' : 'e-resize'};
  background: rgba(255,255,255,0.3);
  opacity: 0;
  transition: opacity 0.2s;
  
  ${EpicBar}:hover & {
    opacity: 1;
  }
`;

const DependencyLine = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`;

const SidePanel = styled.div`
  padding: 24px;
`;

const StatCard = styled.div`
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const API_URL = 'http://localhost:8500/api';

interface Epic {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  assignee: any;
  dependencies: string[];
  progress: number;
  pointsProgress: number;
  totalIssues: number;
  completedIssues: number;
  totalPoints: number;
  completedPoints: number;
  children: any[];
}

export const RoadmapView: React.FC = () => {
  const { currentProject, currentUser } = useStore();
  const [view, setView] = useState<'quarters' | 'months' | 'weeks'>('months');
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draggedEpic, setDraggedEpic] = useState<string | null>(null);
  const [resizingEpic, setResizingEpic] = useState<{ id: string; side: 'left' | 'right' } | null>(null);
  const [createEpicModalVisible, setCreateEpicModalVisible] = useState(false);
  const [createEpicForm] = Form.useForm();
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const projectId = currentProject?.id || 'default-project';
  
  useEffect(() => {
    if (currentProject) {
      loadRoadmap();
    }
  }, [projectId, currentProject]);
  
  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/roadmap/${projectId}`);
      setEpics(response.data);
    } catch (error) {
      console.error('Failed to load roadmap:', error);
      message.error('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateTimelineBounds = () => {
    if (epics.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 6, 0),
      };
    }
    
    const dates = epics
      .filter(e => e.startDate && e.endDate)
      .flatMap(e => [new Date(e.startDate), new Date(e.endDate)]);
    
    if (dates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 6, 0),
      };
    }
    
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    start.setMonth(start.getMonth() - 1);
    end.setMonth(end.getMonth() + 1);
    
    return { start, end };
  };
  
  const generatePeriods = () => {
    const { start, end } = calculateTimelineBounds();
    const periods = [];
    const current = new Date(start);
    
    if (view === 'quarters') {
      while (current <= end) {
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        const year = current.getFullYear();
        periods.push({
          label: `Q${quarter} ${year}`,
          start: new Date(year, (quarter - 1) * 3, 1),
          end: new Date(year, quarter * 3, 0),
        });
        current.setMonth(current.getMonth() + 3);
      }
    } else if (view === 'months') {
      while (current <= end) {
        const month = current.toLocaleString('default', { month: 'short' });
        const year = current.getFullYear();
        periods.push({
          label: `${month} ${year}`,
          start: new Date(current.getFullYear(), current.getMonth(), 1),
          end: new Date(current.getFullYear(), current.getMonth() + 1, 0),
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      while (current <= end) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        periods.push({
          label: `Week ${Math.ceil(current.getDate() / 7)}`,
          start: weekStart,
          end: weekEnd,
        });
        current.setDate(current.getDate() + 7);
      }
    }
    
    return periods;
  };
  
  const calculateEpicPosition = (epic: Epic) => {
    if (!epic.startDate || !epic.endDate) return { left: 0, width: 0 };
    
    const { start: timelineStart } = calculateTimelineBounds();
    const periods = generatePeriods();
    const totalWidth = periods.length * 150; // 150px per period
    
    const timelineStartTime = timelineStart.getTime();
    const timelineEndTime = new Date(periods[periods.length - 1].end).getTime();
    const timelineRange = timelineEndTime - timelineStartTime;
    
    const epicStart = new Date(epic.startDate).getTime();
    const epicEnd = new Date(epic.endDate).getTime();
    
    const left = ((epicStart - timelineStartTime) / timelineRange) * totalWidth;
    const width = ((epicEnd - epicStart) / timelineRange) * totalWidth;
    
    return { left: Math.max(0, left), width: Math.max(50, width) };
  };
  
  const getEpicColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'todo': '#8884d8',
      'in-progress': '#1890ff',
      'in-review': '#faad14',
      'done': '#52c41a',
      'backlog': '#d9d9d9',
    };
    return colorMap[status] || '#8884d8';
  };
  
  const handleEpicClick = (epic: Epic) => {
    setSelectedEpic(epic);
    setDrawerVisible(true);
  };
  
  const handleUpdateEpic = async (values: any) => {
    if (!selectedEpic) return;
    
    try {
      await axios.put(`${API_URL}/roadmap/${selectedEpic.id}/dates`, {
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      });
      message.success('Epic updated successfully');
      loadRoadmap();
      setDrawerVisible(false);
    } catch (error) {
      message.error('Failed to update epic');
    }
  };

  const handleCreateEpic = async (values: any) => {
    if (!currentProject) {
      message.error('No project selected');
      return;
    }
    
    try {
      // Create epic via issues API (backend will generate key)
      await axios.post(`${API_URL}/issues`, {
        summary: values.summary,
        description: values.description || '',
        type: 'epic',
        status: 'todo',
        priority: values.priority || 'medium',
        projectId: currentProject.id,
        reporterId: currentUser?.id,
        assigneeId: null,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
        labels: [],
        components: [],
        fixVersions: [],
      });
      
      message.success('Epic created successfully!');
      createEpicForm.resetFields();
      setCreateEpicModalVisible(false);
      loadRoadmap();
    } catch (error: any) {
      console.error('Failed to create epic:', error);
      message.error(error.response?.data?.error || 'Failed to create epic');
    }
  };
  
  const periods = generatePeriods();
  
  if (!currentProject) {
    return (
      <Container>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '60vh',
          gap: '16px'
        }}>
          <h2>No Project Selected</h2>
          <p>Please select a project from the dropdown in the header to view the roadmap.</p>
          <Button type="primary" onClick={() => window.location.href = '/projects'}>
            Go to Projects
          </Button>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <Title>
          <Calendar size={28} color="#1890ff" />
          Roadmap - {currentProject.name}
        </Title>
        <Controls>
          <Select value={view} onChange={setView} style={{ width: 150 }}>
            <Select.Option value="quarters">Quarters</Select.Option>
            <Select.Option value="months">Months</Select.Option>
            <Select.Option value="weeks">Weeks</Select.Option>
          </Select>
          <Button icon={<Filter size={16} />}>Filters</Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateEpicModalVisible(true)}>
            Create Epic
          </Button>
        </Controls>
      </Header>
      
      <TimelineContainer loading={loading}>
        {epics.length > 0 ? (
          <Timeline ref={timelineRef}>
            <TimelineHeader>
              <div style={{ width: 200 }} /> {/* Space for epic labels */}
              {periods.map((period, index) => (
                <PeriodColumn key={index} width={150}>
                  {period.label}
                </PeriodColumn>
              ))}
            </TimelineHeader>
            
            <EpicsContainer>
              {/* Dependency lines */}
              <DependencyLine>
                {epics.map(epic => {
                  if (!epic.dependencies || epic.dependencies.length === 0) return null;
                  
                  return epic.dependencies.map(depId => {
                    const depEpic = epics.find(e => e.id === depId);
                    if (!depEpic) return null;
                    
                    const epicPos = calculateEpicPosition(epic);
                    const depPos = calculateEpicPosition(depEpic);
                    const epicIndex = epics.indexOf(epic);
                    const depIndex = epics.indexOf(depEpic);
                    
                    const y1 = depIndex * 76 + 30;
                    const y2 = epicIndex * 76 + 30;
                    const x1 = depPos.left + depPos.width + 220;
                    const x2 = epicPos.left + 220;
                    
                    return (
                      <line
                        key={`${epic.id}-${depId}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#1890ff"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  });
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#1890ff" />
                  </marker>
                </defs>
              </DependencyLine>
              
              {/* Epic bars */}
              {epics.map((epic, index) => {
                const { left, width } = calculateEpicPosition(epic);
                
                return (
                  <EpicRow key={epic.id}>
                    <EpicLabel onClick={() => handleEpicClick(epic)}>
                      {epic.key} - {epic.summary}
                    </EpicLabel>
                    <EpicBar
                      left={left}
                      width={width}
                      color={getEpicColor(epic.status)}
                      isDragging={draggedEpic === epic.id}
                      onClick={() => handleEpicClick(epic)}
                    >
                      <ResizeHandle position="left" />
                      <EpicBarContent>
                        <span>{epic.summary.substring(0, 20)}...</span>
                        <span>{epic.progress}%</span>
                      </EpicBarContent>
                      <ResizeHandle position="right" />
                    </EpicBar>
                  </EpicRow>
                );
              })}
            </EpicsContainer>
          </Timeline>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <Calendar size={48} style={{ marginBottom: 16 }} />
            <h3>No epics on the roadmap</h3>
            <p>Create epics with start and end dates to see them on the roadmap</p>
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateEpicModalVisible(true)}>
              Create Epic
            </Button>
          </div>
        )}
      </TimelineContainer>
      
      {/* Epic Details Drawer */}
      <Drawer
        title={selectedEpic ? `${selectedEpic.key} - ${selectedEpic.summary}` : 'Epic Details'}
        placement="right"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedEpic && (
          <SidePanel>
            <StatCard>
              <h4>Progress</h4>
              <Progress percent={selectedEpic.progress} status="active" />
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{selectedEpic.completedIssues} / {selectedEpic.totalIssues} issues</span>
                <span>{selectedEpic.completedPoints} / {selectedEpic.totalPoints} points</span>
              </div>
            </StatCard>
            
            <StatCard>
              <h4>Details</h4>
              <div style={{ marginBottom: 8 }}>
                <strong>Status:</strong> <Tag color={getEpicColor(selectedEpic.status)}>{selectedEpic.status}</Tag>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Start Date:</strong> {selectedEpic.startDate ? dayjs(selectedEpic.startDate).format('MMM DD, YYYY') : 'Not set'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>End Date:</strong> {selectedEpic.endDate ? dayjs(selectedEpic.endDate).format('MMM DD, YYYY') : 'Not set'}
              </div>
              <div>
                <strong>Assignee:</strong> {selectedEpic.assignee?.name || 'Unassigned'}
              </div>
            </StatCard>
            
            <Form
              layout="vertical"
              initialValues={{
                startDate: selectedEpic.startDate ? dayjs(selectedEpic.startDate) : null,
                endDate: selectedEpic.endDate ? dayjs(selectedEpic.endDate) : null,
              }}
              onFinish={handleUpdateEpic}
            >
              <Form.Item label="Start Date" name="startDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="End Date" name="endDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Dates
              </Button>
            </Form>
            
            {selectedEpic.children && selectedEpic.children.length > 0 && (
              <StatCard style={{ marginTop: 16 }}>
                <h4>Child Issues ({selectedEpic.children.length})</h4>
                {selectedEpic.children.map((child: any) => (
                  <div key={child.id} style={{ marginBottom: 8, padding: 8, background: 'white', borderRadius: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{child.key}</span>
                      <Tag>{child.status}</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{child.summary}</div>
                  </div>
                ))}
              </StatCard>
            )}
          </SidePanel>
        )}
      </Drawer>

      {/* Create Epic Modal */}
      <Modal
        title="Create Epic"
        open={createEpicModalVisible}
        onCancel={() => {
          setCreateEpicModalVisible(false);
          createEpicForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createEpicForm}
          layout="vertical"
          onFinish={handleCreateEpic}
        >
          <Form.Item
            name="summary"
            label="Epic Name"
            rules={[{ required: true, message: 'Please enter epic name' }]}
          >
            <Input placeholder="Enter epic name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} placeholder="Describe the epic..." />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue="medium"
          >
            <Select>
              <Select.Option value="highest">Highest</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="lowest">Lowest</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Start Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="End Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Create Epic
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};
