import React, { useState } from 'react';
import { Button, Input, Card, Typography } from 'antd';
import { RobotOutlined, SendOutlined } from '@ant-design/icons';
import { isFeatureEnabled } from '../../config/features';

const { TextArea } = Input;
const { Text } = Typography;

export const AIAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isFeatureEnabled('AI_ASSISTANT')) return null;

  const getSuggestions = async () => {
    setLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      setSuggestions([
        'Assign to frontend team based on React label',
        'Set priority to High due to user impact',
        'Link to Epic PROJ-123 for better tracking'
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <Card size="small" title={<><RobotOutlined /> AI Assistant</>}>
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your issue..."
        rows={3}
      />
      <Button 
        type="primary" 
        icon={<SendOutlined />}
        loading={loading}
        onClick={getSuggestions}
        style={{ marginTop: 8 }}
      >
        Get AI Suggestions
      </Button>
      {suggestions.map((suggestion, i) => (
        <div key={i} style={{ marginTop: 8 }}>
          <Text type="secondary">💡 {suggestion}</Text>
        </div>
      ))}
    </Card>
  );
};