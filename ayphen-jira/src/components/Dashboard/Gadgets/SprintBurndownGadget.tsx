import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Spin } from 'antd';
import axios from 'axios';

interface SprintBurndownGadgetProps {
  gadgetId: string;
  config: any;
}

export const SprintBurndownGadget: React.FC<SprintBurndownGadgetProps> = ({ gadgetId, config }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/gadgets/${gadgetId}/data/sprint-burndown`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching sprint burndown data:', error);
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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="ideal" stroke="#cccccc" strokeDasharray="5 5" name="Ideal" />
        <Line type="monotone" dataKey="actual" stroke="#0052CC" name="Actual" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};
