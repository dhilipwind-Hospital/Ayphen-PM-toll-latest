import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, Button, Alert, Tag, Space, message } from 'antd';
import { RefreshCw, Zap } from 'lucide-react';
import { aiRequirementsApi, aiSyncApi } from '../../services/ai-test-automation-api';
import { colors } from '../../theme/colors';
import { useStore } from '../../store/useStore';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
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
  color: ${colors.text.primary};
  margin: 0;
`;

const SyncCard = styled(Card)`
  margin-bottom: 16px;
`;

export const SyncDashboard: React.FC = () => {
  const { currentProject } = useStore();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [changes, setChanges] = useState<any>({});

  useEffect(() => {
    if (currentProject) {
      loadRequirements();
    }
  }, [currentProject]);

  const loadRequirements = async () => {
    if (!currentProject) {
      message.warning('Please select a project first');
      return;
    }

    try {
      const res = await aiRequirementsApi.getAll();
      // ✅ CRITICAL FIX: Filter by current project
      const projectRequirements = res.data.filter((req: any) => req.projectId === currentProject.id);
      setRequirements(projectRequirements);
      
      // Check changes for each
      for (const req of projectRequirements) {
        checkChanges(req.id);
      }
    } catch (error) {
      message.error('Failed to load requirements');
    }
  };

  const checkChanges = async (requirementId: string) => {
    try {
      const res = await aiSyncApi.getChanges(requirementId);
      setChanges(prev => ({ ...prev, [requirementId]: res.data }));
    } catch (error) {
      console.error('Failed to check changes:', error);
    }
  };

  const handleSync = async (requirementId: string) => {
    const hide = message.loading('Syncing changes...', 0);
    
    try {
      const res = await aiSyncApi.syncRequirement(requirementId);
      hide();
      
      if (res.data.synced) {
        message.success(`Synced! ${res.data.impactedStories} stories updated`);
        checkChanges(requirementId);
      } else {
        message.info(res.data.reason || 'No changes to sync');
      }
    } catch (error) {
      hide();
      message.error('Sync failed');
    }
  };

  return (
    <Container>
      <Header>
        <Title>🔄 Sync Status</Title>
        <Button 
          icon={<RefreshCw size={16} />}
          onClick={loadRequirements}
        >
          Refresh All
        </Button>
      </Header>

      {requirements.map((req) => (
        <SyncCard key={req.id}>
          <h3>{req.title}</h3>
          
          {changes[req.id]?.hasChanges ? (
            <>
              <Alert
                type="warning"
                message={`Changes detected - ${changes[req.id].changes?.length || 0} modifications`}
                description={
                  <div style={{ marginTop: 12 }}>
                    <p><strong>Impacted areas:</strong></p>
                    <Space wrap>
                      {changes[req.id].impactedAreas?.map((area: string) => (
                        <Tag key={area} color="orange">{area}</Tag>
                      ))}
                    </Space>
                    
                    {changes[req.id].changes?.map((change: any, i: number) => (
                      <div key={i} style={{ marginTop: 8 }}>
                        <Tag color={
                          change.impact === 'high' ? 'red' :
                          change.impact === 'medium' ? 'orange' : 'blue'
                        }>
                          {change.impact?.toUpperCase()}
                        </Tag>
                        <span>{change.description}</span>
                      </div>
                    ))}
                  </div>
                }
                style={{ marginBottom: 16 }}
              />
              
              <Button 
                type="primary" 
                danger
                icon={<Zap size={16} />}
                onClick={() => handleSync(req.id)}
              >
                Sync Now
              </Button>
            </>
          ) : (
            <Tag color="green">✓ Up to date</Tag>
          )}
        </SyncCard>
      ))}
    </Container>
  );
};
