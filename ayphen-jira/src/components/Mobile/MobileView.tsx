import React from 'react';
import { Drawer, List, Avatar, Tag, Button } from 'antd';
import { Menu, Plus, Search, Bell } from 'lucide-react';
import styled from 'styled-components';
import { useStore } from '../../store/useStore';

const MobileContainer = styled.div`
  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #1890ff;
  color: white;
`;

export const MobileView: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const { issues, currentProject } = useStore();

  return (
    <MobileContainer>
      <MobileHeader>
        <Menu size={24} onClick={() => setDrawerVisible(true)} />
        <h2 style={{ margin: 0, color: 'white' }}>{currentProject?.name || 'Ayphen'}</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <Search size={20} />
          <Bell size={20} />
        </div>
      </MobileHeader>

      <div style={{ padding: 16 }}>
        <Button type="primary" icon={<Plus size={16} />} block style={{ marginBottom: 16 }}>
          Create Issue
        </Button>

        <List
          dataSource={issues}
          renderItem={(issue: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{issue.type?.[0]?.toUpperCase()}</Avatar>}
                title={issue.title}
                description={
                  <div>
                    <Tag>{issue.status}</Tag>
                    <Tag color={issue.priority === 'high' ? 'red' : 'blue'}>{issue.priority}</Tag>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>

      <Drawer title="Menu" placement="left" onClose={() => setDrawerVisible(false)} open={drawerVisible}>
        <List>
          <List.Item>Dashboard</List.Item>
          <List.Item>Projects</List.Item>
          <List.Item>Board</List.Item>
          <List.Item>Backlog</List.Item>
          <List.Item>Reports</List.Item>
          <List.Item>Settings</List.Item>
        </List>
      </Drawer>
    </MobileContainer>
  );
};
