import React, { useState, useEffect } from 'react';
import { List, Tag, Button, Space, Typography, Tooltip, Collapse, message, Badge } from 'antd';
import { FlaskConical, CheckCircle, XCircle, Clock, Plus, Play, RotateCw } from 'lucide-react';
import axios from 'axios';

const { Text } = Typography;
const { Panel } = Collapse;

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  type: string;
  priority: string;
  status: string;
  automated: boolean;
}

interface TestCaseListProps {
  issueId: string;
  refreshTrigger?: number;
}

export const TestCaseList: React.FC<TestCaseListProps> = ({ issueId, refreshTrigger }) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTestCases();
  }, [issueId, refreshTrigger]);

  const fetchTestCases = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8500/api/test-cases/issue/${issueId}`);
      if (response.data.success) {
        setTestCases(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`http://localhost:8500/api/test-cases/${id}/status`, { status });
      message.success(`Test case marked as ${status}`);
      fetchTestCases();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Badge count={testCases.length} style={{ backgroundColor: '#52c41a' }}>
            <Text strong style={{ fontSize: 16 }}>Test Scenarios</Text>
          </Badge>
        </Space>
        <Button 
            type="text" 
            icon={<RotateCw size={14} />} 
            onClick={fetchTestCases} 
            loading={loading}
            title="Refresh List"
        />
      </div>

      <List
        loading={loading}
        dataSource={testCases}
        locale={{ emptyText: 'No test cases generated yet. Use the AI Generator to create them.' }}
        renderItem={(item) => (
          <Collapse 
            style={{ marginBottom: 12, background: 'white' }} 
            size="small"
            expandIconPosition="end"
          >
            <Panel
              key={item.id}
              header={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Space>
                    <Tag color={item.type === 'api' ? 'purple' : 'blue'}>
                        {item.type ? item.type.toUpperCase() : 'TEST'}
                    </Tag>
                    {item.priority && (
                        <Tag color={item.priority === 'critical' ? 'red' : item.priority === 'high' ? 'orange' : 'blue'}>
                            {item.priority.toUpperCase()}
                        </Tag>
                    )}
                    <Text strong delete={item.status === 'fail'}>{item.title}</Text>
                  </Space>
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Mark Passed">
                      <Button 
                        type={item.status === 'pass' ? 'primary' : 'text'} 
                        shape="circle" 
                        icon={<CheckCircle size={16} />} 
                        onClick={() => updateStatus(item.id, 'pass')}
                        style={{ color: item.status === 'pass' ? undefined : '#52c41a' }}
                      />
                    </Tooltip>
                    <Tooltip title="Mark Failed">
                      <Button 
                        type={item.status === 'fail' ? 'primary' : 'text'} 
                        shape="circle" 
                        icon={<XCircle size={16} />} 
                        onClick={() => updateStatus(item.id, 'fail')}
                        danger
                      />
                    </Tooltip>
                  </Space>
                </div>
              }
            >
              <div style={{ padding: '0 12px' }}>
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary">{item.description || 'No description available'}</Text>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Steps:</Text>
                  <ol style={{ paddingLeft: 20, marginTop: 4 }}>
                    {item.steps?.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <Text strong>Expected Result:</Text>
                  <div style={{ marginTop: 4, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                    {item.expectedResult || 'No expected result specified'}
                  </div>
                </div>
              </div>
            </Panel>
          </Collapse>
        )}
      />
    </div>
  );
};
