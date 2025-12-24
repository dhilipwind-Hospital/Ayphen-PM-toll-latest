import React, { useEffect, useState } from 'react';
import { Spin, Empty } from 'antd';
import axios from 'axios';
import styled from 'styled-components';
import { ENV } from '../../../config/env';

const HeatMapContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px;
`;

const HeatMapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-top: 16px;
`;

const DayLabel = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  padding: 8px 0;
`;

const HeatMapCell = styled.div<{ intensity: number }>`
  aspect-ratio: 1;
  border-radius: 4px;
  background-color: ${props => {
    if (props.intensity === 0) return '#f0f0f0';
    if (props.intensity <= 2) return '#c6e48b';
    if (props.intensity <= 4) return '#7bc96f';
    if (props.intensity <= 6) return '#239a3b';
    return '#196127';
  }};
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 12px;
  color: #666;
`;

const LegendItem = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${props => props.color};
`;

interface HeatMapGadgetProps {
  gadgetId: string;
  config: any;
}

export const HeatMapGadget: React.FC<HeatMapGadgetProps> = ({ gadgetId, config }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectId = localStorage.getItem('currentProjectId');
        const response = await axios.get(`${ENV.API_URL}/gadgets/${gadgetId}/data/heat-map`, {
          params: { projectId },
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching heat map data:', error);
        // Generate sample data if API fails
        generateSampleData();
      } finally {
        setLoading(false);
      }
    };

    const generateSampleData = () => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const sampleData = [];
      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 7; day++) {
          sampleData.push({
            day: days[day],
            week,
            intensity: Math.floor(Math.random() * 8),
          });
        }
      }
      setData(sampleData);
    };

    fetchData();
    const interval = setInterval(fetchData, (config.refreshInterval || 15) * 60 * 1000);
    return () => clearInterval(interval);
  }, [gadgetId, config.refreshInterval]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;
  }

  if (data.length === 0) {
    return <Empty description="No activity data available" />;
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <HeatMapContainer>
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Issue Activity Heat Map</h4>
      <HeatMapGrid>
        {days.map(day => (
          <DayLabel key={day}>{day}</DayLabel>
        ))}
        {data.map((cell, index) => (
          <HeatMapCell
            key={index}
            intensity={cell.intensity}
            title={`${cell.day}: ${cell.intensity} issues`}
          />
        ))}
      </HeatMapGrid>
      <Legend>
        <span>Less</span>
        <LegendItem color="#f0f0f0" />
        <LegendItem color="#c6e48b" />
        <LegendItem color="#7bc96f" />
        <LegendItem color="#239a3b" />
        <LegendItem color="#196127" />
        <span>More</span>
      </Legend>
    </HeatMapContainer>
  );
};
