import { useState, useEffect } from 'react';
import { Card, Button, Switch, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
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
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:8500/api/automation/rules', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setRules(res.data);
  };

  const toggleRule = async (id: number, enabled: boolean) => {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:8500/api/automation/rules/${id}`, 
      { enabled: !enabled },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    loadRules();
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
