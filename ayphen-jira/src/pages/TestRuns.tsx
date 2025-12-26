import { useState, useEffect } from 'react';
import { Table, Tag, Spin } from 'antd';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function TestRuns() {
  const [runs, setRuns] = useState([]);
  const navigate = useNavigate();
  const { currentProject, isInitialized } = useStore();

  useEffect(() => {
    if (currentProject) {
      loadRuns();
    }
  }, [currentProject?.id]);

  const loadRuns = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.get('/test-runs', {
        params: { userId, projectId: currentProject?.id }
      });
      setRuns(res.data || []);
    } catch (error) {
      console.error('Failed to load test runs:', error);
      setRuns([]);
    }
  };

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const columns = [
    { title: 'Suite', dataIndex: 'suite_name', key: 'suite_name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Completed' ? 'success' : 'warning'}>{status}</Tag>
      )
    },
    {
      title: 'Started',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Completed',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>Test Runs</h1>
      <Table
        columns={columns}
        dataSource={runs}
        rowKey="id"
        locale={{ emptyText: 'No test runs yet. Run a test suite to see results here.' }}
        onRow={(record: any) => ({
          onClick: () => {
            navigate(`/test-runs/${record.id}`);
          },
          style: { cursor: 'pointer' }
        })}
      />
    </div>
  );
}
