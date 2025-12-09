import React from 'react';
import { Card, Timeline, Tag, Typography } from 'antd';
import { SafetyOutlined, LinkOutlined } from '@ant-design/icons';
import { isFeatureEnabled } from '../../config/features';

const { Text } = Typography;

const auditTrail = [
  { time: '2024-01-15 10:30', action: 'Issue Created', hash: '0x1a2b3c...', verified: true },
  { time: '2024-01-15 11:15', action: 'Status Changed', hash: '0x4d5e6f...', verified: true },
  { time: '2024-01-15 14:20', action: 'Assignee Updated', hash: '0x7g8h9i...', verified: true }
];

export const BlockchainAudit: React.FC = () => {
  if (!isFeatureEnabled('BLOCKCHAIN')) return null;

  return (
    <Card 
      title={<><SafetyOutlined /> Blockchain Audit Trail</>} 
      size="small"
    >
      <Timeline size="small">
        {auditTrail.map((entry, i) => (
          <Timeline.Item key={i}>
            <div>
              <Text strong>{entry.action}</Text>
              <br />
              <Text type="secondary">{entry.time}</Text>
              <br />
              <Tag color="green" icon={<LinkOutlined />}>
                {entry.hash}
              </Tag>
              {entry.verified && <Tag color="blue">✓ Verified</Tag>}
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};