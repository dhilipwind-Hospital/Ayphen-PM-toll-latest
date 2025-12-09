import React, { useEffect, useState } from 'react';
import { Spin, Empty } from 'antd';
import axios from 'axios';
import styled from 'styled-components';

const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px;
`;

const BarChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 200px;
  margin-top: 20px;
`;

const Bar = styled.div<{ height: number; color: string }>`
  flex: 1;
  height: ${props => props.height}%;
  background-color: ${props => props.color};
  border-radius: 4px 4px 0 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 4px;
  transition: all 0.3s;
  
  &:hover {
    opacity: 0.8;
    transform: translateY(-4px);
  }
`;

const BarLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

const SprintLabel = styled.div`
  text-align: center;
  font-size: 11px;
  color: #666;
  margin-top: 8px;
`;

interface VelocityChartGadgetProps {
  gadgetId: string;
  config: any;
}

export const VelocityChartGadget: React.FC<VelocityChartGadgetProps> = ({ gadgetId, config }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectId = localStorage.getItem('currentProjectId');
        const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/gadgets/${gadgetId}/data/velocity`, {
          params: { projectId },
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching velocity data:', error);
        // Generate sample data
        const sampleData = [
          { sprint: 'Sprint 1', committed: 25, completed: 22 },
          { sprint: 'Sprint 2', committed: 30, completed: 28 },
          { sprint: 'Sprint 3', committed: 28, completed: 26 },
          { sprint: 'Sprint 4', committed: 32, completed: 30 },
          { sprint: 'Sprint 5', committed: 35, completed: 33 },
        ];
        setData(sampleData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, (config.refreshInterval || 15) * 60 * 1000);
    return () => clearInterval(interval);
  }, [gadgetId, config.refreshInterval]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;
  }

  if (data.length === 0) {
    return <Empty description="No velocity data available" />;
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.committed, d.completed)));

  return (
    <ChartContainer>
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Team Velocity</h4>
      <BarChart>
        {data.map((sprint, index) => (
          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 200 }}>
              <Bar height={(sprint.committed / maxValue) * 100} color="#1890ff" title={`Committed: ${sprint.committed}`}>
                <BarLabel>{sprint.committed}</BarLabel>
              </Bar>
              <Bar height={(sprint.completed / maxValue) * 100} color="#52c41a" title={`Completed: ${sprint.completed}`}>
                <BarLabel>{sprint.completed}</BarLabel>
              </Bar>
            </div>
            <SprintLabel>{sprint.sprint}</SprintLabel>
          </div>
        ))}
      </BarChart>
      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#1890ff', borderRadius: 2 }} />
          <span>Committed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#52c41a', borderRadius: 2 }} />
          <span>Completed</span>
        </div>
      </div>
    </ChartContainer>
  );
};
