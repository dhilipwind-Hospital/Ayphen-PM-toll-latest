import { useState, useEffect } from 'react';
import { Table, Tag } from 'antd';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function TestRuns() {
  const [runs, setRuns] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.get('/test-runs', {
        params: { userId }
      });
      setRuns(res.data || []);
    } catch (error) {
      console.error('Failed to load test runs:', error);
      setRuns([]);
    }
  };

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
          // Fix: navigate to suite details or handle non-existent route
          // Since /test-runs/:id doesn't exist, we'll just show a message or prevent navigation for now
          // Ideally, we should have a TestRunDetail page
          onClick: () => {
            // For now, just show a message since the page doesn't exist
            // navigate(`/test-runs/${record.id}`) 
            console.log('Test run details not implemented yet');
          },
          style: { cursor: 'default' }
        })}
      />
    </div>
  );
}
