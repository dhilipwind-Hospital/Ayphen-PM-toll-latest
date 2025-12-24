import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Spin } from 'antd';
import axios from 'axios';
import { ENV } from '../../../config/env';

interface CreatedVsResolvedGadgetProps {
  gadgetId: string;
  config: any;
}

export const CreatedVsResolvedGadget: React.FC<CreatedVsResolvedGadgetProps> = ({ gadgetId, config }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${ENV.API_URL}/gadgets/${gadgetId}/data/created-vs-resolved`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching created vs resolved data:', error);
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
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="created" stroke="#8884d8" name="Created" />
        <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved" />
      </LineChart>
    </ResponsiveContainer>
  );
};
