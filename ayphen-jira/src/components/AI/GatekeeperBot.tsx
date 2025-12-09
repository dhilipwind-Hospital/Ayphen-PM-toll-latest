import React, { useState } from 'react';
import { Modal, Button, Typography, Space, Progress, Card } from 'antd';
import { RobotOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;

const BotContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  text-align: center;
`;

const BotAvatar = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);
  
  svg {
    font-size: 40px;
    color: white;
  }
`;

interface GatekeeperBotProps {
    open: boolean;
    onClose: () => void;
    onOverride: () => void;
    duplicateIssue: {
        key: string;
        summary: string;
        status: string;
        similarity: number;
    };
}

export const GatekeeperBot: React.FC<GatekeeperBotProps> = ({
    open,
    onClose,
    onOverride,
    duplicateIssue
}) => {
    const [step, setStep] = useState<'analyzing' | 'result'>('result');

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={500}
            centered
            closable={false}
            maskClosable={false}
        >
            <BotContainer>
                <BotAvatar>
                    <RobotOutlined />
                </BotAvatar>

                <Title level={3} style={{ marginBottom: 8 }}>
                    Gatekeeper Bot
                </Title>

                <Text type="secondary" style={{ marginBottom: 24 }}>
                    I've analyzed your issue and found a potential conflict.
                </Text>

                <Card
                    style={{ width: '100%', marginBottom: 24, borderColor: '#ffccc7', background: '#fff2f0' }}
                    bodyStyle={{ padding: 16 }}
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                <WarningOutlined style={{ color: '#ff4d4f' }} />
                                <Text strong type="danger">High Similarity Detected</Text>
                            </Space>
                            <Text strong>{duplicateIssue.similarity}% Match</Text>
                        </div>

                        <Progress
                            percent={duplicateIssue.similarity}
                            status="exception"
                            showInfo={false}
                            strokeColor="#ff4d4f"
                        />

                        <div style={{ textAlign: 'left', marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>SIMILAR ISSUE</Text>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong style={{ fontSize: 16 }}>{duplicateIssue.key}</Text>
                                <Text code>{duplicateIssue.status}</Text>
                            </div>
                            <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                                {duplicateIssue.summary}
                            </Paragraph>
                        </div>
                    </Space>
                </Card>

                <Paragraph style={{ marginBottom: 24 }}>
                    To maintain a clean backlog, I recommend updating the existing issue instead of creating a duplicate.
                </Paragraph>

                <Space size="middle">
                    <Button size="large" onClick={onClose}>
                        Cancel Creation
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        danger
                        onClick={onOverride}
                    >
                        Create Anyway
                    </Button>
                </Space>
            </BotContainer>
        </Modal>
    );
};
