import React from 'react';
import styled from 'styled-components';
import { Card, Row, Col, Button, Tag } from 'antd';
import { Package, Download } from 'lucide-react';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

export const AppsPage: React.FC = () => {
  const apps = [
    { name: 'Slack Integration', status: 'Installed', category: 'Communication' },
    { name: 'GitHub', status: 'Available', category: 'Development' },
    { name: 'Confluence', status: 'Available', category: 'Documentation' },
  ];

  return (
    <Container>
      <Header>
        <Title>Apps</Title>
        <Button type="primary">Explore Marketplace</Button>
      </Header>

      <Row gutter={[16, 16]}>
        {apps.map((app, idx) => (
          <Col key={idx} xs={24} sm={12} lg={8}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={20} />
                  {app.name}
                </div>
              }
              extra={
                <Tag color={app.status === 'Installed' ? 'green' : 'blue'}>
                  {app.status}
                </Tag>
              }
            >
              <p>Category: {app.category}</p>
              <Button icon={<Download size={16} />}>
                {app.status === 'Installed' ? 'Manage' : 'Install'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};
