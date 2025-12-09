import React from 'react';
import { Card, Badge, Avatar, List, Progress } from 'antd';
import { TrophyOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
import { isFeatureEnabled } from '../../config/features';

const achievements = [
  { id: 1, name: 'Sprint Hero', icon: '🏆', progress: 80, total: 100 },
  { id: 2, name: 'Bug Crusher', icon: '🐛', progress: 45, total: 50 },
  { id: 3, name: 'Code Reviewer', icon: '👀', progress: 23, total: 30 }
];

export const AchievementSystem: React.FC = () => {
  if (!isFeatureEnabled('GAMIFICATION')) return null;

  return (
    <Card title="🎮 Achievements" size="small">
      <div style={{ marginBottom: 16 }}>
        <Badge count={1250} style={{ backgroundColor: '#52c41a' }}>
          <Avatar icon={<StarOutlined />} />
        </Badge>
        <span style={{ marginLeft: 8 }}>Total Points</span>
      </div>
      
      <List
        size="small"
        dataSource={achievements}
        renderItem={item => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ marginRight: 8 }}>{item.icon}</span>
                <span>{item.name}</span>
              </div>
              <Progress 
                percent={Math.round((item.progress / item.total) * 100)} 
                size="small"
                format={() => `${item.progress}/${item.total}`}
              />
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};