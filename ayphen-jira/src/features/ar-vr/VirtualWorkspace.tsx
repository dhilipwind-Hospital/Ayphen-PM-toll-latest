import React, { useState } from 'react';
import { Card, Button, Space, Alert } from 'antd';
import { EyeOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { isFeatureEnabled } from '../../config/features';

export const VirtualWorkspace: React.FC = () => {
  const [vrActive, setVrActive] = useState(false);

  if (!isFeatureEnabled('AR_VR')) return null;

  const enterVR = () => {
    setVrActive(true);
    // Simulate VR initialization
    setTimeout(() => setVrActive(false), 3000);
  };

  return (
    <Card title="🥽 Virtual Workspace" size="small">
      {vrActive ? (
        <Alert
          message="VR Mode Active"
          description="You are now in the virtual workspace. Use hand gestures to interact with issues."
          type="info"
          showIcon
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={enterVR}
            block
          >
            Enter VR Workspace
          </Button>
          <Button 
            icon={<VideoCameraOutlined />}
            block
          >
            Start AR Board View
          </Button>
        </Space>
      )}
    </Card>
  );
};