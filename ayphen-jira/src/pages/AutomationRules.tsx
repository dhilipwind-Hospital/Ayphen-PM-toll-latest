import { useState, useEffect } from 'react';
import { Card, Button, Switch, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const RuleCard = styled(Card)`
  margin-bottom: 16px;
`;

export default function AutomationRules() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const res = await api.get('/automation/rules');
      setRules(res.data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const toggleRule = async (id: number, enabled: boolean) => {
    try {
      await api.put(`/automation/rules/${id}`, { enabled: !enabled });
      loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  return (
    <Container>
      <Header>
        <h1>Automation Rules</h1>
        <Button type="primary" icon={<PlusOutlined />}>Create Rule</Button>
      </Header>

      {rules.map((rule: any) => (
        <RuleCard key={rule.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{rule.name}</h3>
              <p style={{ color: '#666' }}>{rule.trigger}</p>
            </div>
            <Space>
              <Switch checked={rule.enabled} onChange={() => toggleRule(rule.id, rule.enabled)} />
              <Button icon={<EditOutlined />} />
              <Button icon={<DeleteOutlined />} danger />
            </Space>
          </div>
        </RuleCard>
      ))}
    </Container>
  );
}
