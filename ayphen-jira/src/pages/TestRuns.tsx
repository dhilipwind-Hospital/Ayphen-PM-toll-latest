import { useState, useEffect } from 'react';
import { Table, Tag } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function TestRuns() {
  const [runs, setRuns] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('https://ayphen-pm-toll-latest.onrender.com/api/test-runs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setRuns(res.data);
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
        onRow={(record) => ({
          onClick: () => navigate(`/test-runs/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </div>
  );
}
