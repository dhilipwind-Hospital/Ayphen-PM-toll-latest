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
    // Client-side AI Simulation with Keyword Matching
    const text = input.toLowerCase();

    setTimeout(() => {
      const newSuggestions: string[] = [];

      if (text.includes('urgent') || text.includes('critical') || text.includes('crash') || text.includes('blocker')) {
        newSuggestions.push('Recommendation: Set Priority to "Highest" due to severity terms.');
      }
      if (text.includes('ui') || text.includes('css') || text.includes('style') || text.includes('layout')) {
        newSuggestions.push('Recommendation: Assign to Frontend Team.');
        newSuggestions.push('Suggestion: Add "UI" label.');
      }
      if (text.includes('api') || text.includes('database') || text.includes('server') || text.includes('500')) {
        newSuggestions.push('Recommendation: Assign to Backend Team.');
        newSuggestions.push('Suggestion: Add "Backend" label.');
      }
      if (text.includes('test') || text.includes('qa') || text.includes('repo')) {
        newSuggestions.push('Recommendation: Assign to QA for verification.');
      }

      if (newSuggestions.length === 0) {
        newSuggestions.push('No specific context detected. consider adding more keywords like "UI", "API", or "Urgent".');
        newSuggestions.push('General: Check similar issues in "My Open Issues".');
      }

      setSuggestions(newSuggestions);
      setLoading(false);
    }, 800);
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