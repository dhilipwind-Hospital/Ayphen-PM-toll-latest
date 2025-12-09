import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, Radio, Space, Tag, Alert, Collapse, Statistic, Row, Col, Divider, message, Select, Button, Tooltip } from 'antd';
import { FileText, Code, Layout, Target, Clock, CheckCircle, Upload } from 'lucide-react';
import axios from 'axios';
import { aiStoriesApi, aiGenerationApi } from '../../services/ai-test-automation-api';
import { colors } from '../../theme/colors';
import { AcceptanceCriteria } from '../../components/AcceptanceCriteria';
import type { AcceptanceCriterion } from '../../components/AcceptanceCriteria';
import { syncAIStoryToIssue, syncAllAIStories } from '../../services/story-sync';
import { useStore } from '../../store/useStore';

const { Panel } = Collapse;

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

const StoryCard = styled(Card)<{ $borderColor?: string }>`
  margin-bottom: 16px;
  border-left: 4px solid ${(props) => props.$borderColor || colors.primary};
  
  .ant-card-head {
    background: #f5f5f5;
  }
`;

const StoryGroup = styled.div`
  margin-bottom: 32px;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

const PointsCard = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  
  .label {
    font-size: 12px;
    color: ${colors.text.secondary};
  }
  
  .value {
    font-size: 16px;
    font-weight: 600;
    color: #1890ff;
  }
`;

// Helper to calculate story points
function calculateStoryPoints(story: any) {
  const complexity = story.acceptanceCriteria?.length || 3;
  const basePoints = story.type === 'ui' ? 5 : 3;
  return Math.min(basePoints + complexity, 13);
}

function distributePoints(totalPoints: number) {
  const devPoints = Math.ceil(totalPoints * 0.6);
  const qaPoints = Math.ceil(totalPoints * 0.25);
  const reviewPoints = Math.ceil(totalPoints * 0.15);
  return { devPoints, qaPoints, reviewPoints };
}

export const StoriesPage: React.FC = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'ui' | 'api'>('all');
  const [groupBy, setGroupBy] = useState<'type' | 'requirement'>('type');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { currentProject, currentUser } = useStore();

  const loadStories = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // VALIDATE project exists
      if (!currentProject) {
        setStories([]);
        setLoading(false);
        return;
      }
      
      const res = await aiStoriesApi.getAll();
      // FILTER by current project only
      const filtered = (res.data || []).filter((story: any) => story.projectId === currentProject.id);
      setStories(filtered);
    } catch (error: any) {
      console.error('Failed to load stories:', error);
      setError(error.message || 'Failed to load stories');
      message.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadStories();
  }, [loadStories, currentProject]);

  const handleGenerateTests = async (storyId: string, storyTitle: string) => {
    const hide = message.loading(`Generating test cases for: ${storyTitle}...`, 0);
    
    try {
      const res = await aiGenerationApi.generateTestCases(storyId);
      hide();
      message.success(`Generated ${res.data.total} test cases for ${storyTitle}!`);
      loadStories();
    } catch (error) {
      hide();
      message.error('Failed to generate test cases');
    }
  };

  const handleSyncStory = async (story: any) => {
    if (!currentProject) {
      message.error('No project selected');
      return;
    }
    if (!currentUser) {
      message.error('No user logged in');
      return;
    }

    try {
      setSyncing(true);
      await syncAIStoryToIssue(story, currentProject.id, currentUser.id);
      message.success(`✅ Synced "${story.title}" to backlog!`);
      loadStories(); // Refresh to show sync status
    } catch (error) {
      message.error('Failed to sync story');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAllStories = async () => {
    if (!currentProject) {
      message.error('No project selected');
      return;
    }
    if (!currentUser) {
      message.error('No user logged in');
      return;
    }

    try {
      setSyncing(true);
      await syncAllAIStories(currentProject.id, currentUser.id);
      loadStories(); // Refresh to show sync status
    } catch (error) {
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  // Group stories
  const groupedStories = React.useMemo(() => {
    let filtered = stories;
    if (filter !== 'all') {
      filtered = stories.filter(s => s.type === filter);
    }

    if (groupBy === 'type') {
      return {
        'UI Stories': filtered.filter(s => s.type === 'ui'),
        'API Stories': filtered.filter(s => s.type === 'api'),
      };
    } else {
      // Group by requirement
      const groups: any = {};
      filtered.forEach(story => {
        const key = story.requirementId || 'Ungrouped';
        if (!groups[key]) groups[key] = [];
        groups[key].push(story);
      });
      return groups;
    }
  }, [stories, filter, groupBy]);

  // Calculate totals
  const totalStoryPoints = stories.reduce((sum, s) => sum + calculateStoryPoints(s), 0);
  const uiStories = stories.filter(s => s.type === 'ui');
  const apiStories = stories.filter(s => s.type === 'api');

  const filteredStories = stories.filter(s => 
    filter === 'all' || s.type === filter
  );

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 18, color: '#8c8c8c' }}>Loading stories...</div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert
          message="Error Loading Stories"
          description={error}
          type="error"
          showIcon
          action={
            <button onClick={loadStories} style={{ padding: '4px 15px', cursor: 'pointer' }}>
              Retry
            </button>
          }
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📖 Generated User Stories</Title>
        <Space>
          <Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)}>
            <Radio.Button value="all">All ({stories.length})</Radio.Button>
            <Radio.Button value="ui">UI ({uiStories.length})</Radio.Button>
            <Radio.Button value="api">API ({apiStories.length})</Radio.Button>
          </Radio.Group>
          <Radio.Group value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <Radio.Button value="type">Group by Type</Radio.Button>
            <Radio.Button value="requirement">Group by Epic</Radio.Button>
          </Radio.Group>
          <Tooltip title="Sync all stories to Backlog and All Issues">
            <Button
              type="primary"
              icon={<Upload size={16} />}
              onClick={handleSyncAllStories}
              loading={syncing}
            >
              Sync All to Backlog
            </Button>
          </Tooltip>
        </Space>
      </Header>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Stories" 
              value={stories.length} 
              prefix={<FileText size={20} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Story Points" 
              value={totalStoryPoints} 
              prefix={<Target size={20} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="UI Stories" 
              value={uiStories.length} 
              prefix={<Layout size={20} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="API Stories" 
              value={apiStories.length} 
              prefix={<Code size={20} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {filteredStories.length === 0 ? (
        <Alert
          message="No stories generated yet"
          description="Go to Requirements page and click 'Generate Stories' to create user stories from your epic requirements."
          type="info"
          showIcon
        />
      ) : (
        Object.entries(groupedStories).map(([groupName, groupStories]: [string, any]) => {
          if (groupStories.length === 0) return null;
          
          const groupPoints = groupStories.reduce((sum: number, s: any) => sum + calculateStoryPoints(s), 0);
          const groupIcon = groupName.includes('UI') ? <Layout size={20} /> : <Code size={20} />;
          const borderColor = groupName.includes('UI') ? '#1890ff' : '#52c41a';
          
          return (
            <StoryGroup key={groupName}>
              <GroupHeader>
                {groupIcon}
                <h3>{groupName}</h3>
                <Tag color={groupName.includes('UI') ? 'blue' : 'green'}>
                  {groupStories.length} stories
                </Tag>
                <Tag color="purple">{groupPoints} points</Tag>
              </GroupHeader>
              
              {groupStories.map((story: any) => {
                const storyPoints = calculateStoryPoints(story);
                const { devPoints, qaPoints, reviewPoints } = distributePoints(storyPoints);
                
                return (
                  <StoryCard key={story.id} $borderColor={borderColor}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          {story.type === 'ui' ? <Layout size={20} color="#1890ff" /> : <Code size={20} color="#52c41a" />}
                          <div>
                            <div>
                              {story.storyKey && (
                                <Tag color="blue" style={{ marginRight: 8 }}>
                                  {story.storyKey}
                                </Tag>
                              )}
                              {story.epicKey && (
                                <Tag color="purple" style={{ marginRight: 8 }}>
                                  Epic: {story.epicKey}
                                </Tag>
                              )}
                            </div>
                            <h3 style={{ margin: 0 }}>{story.title}</h3>
                          </div>
                        </Space>
                        <Space>
                          <Tag color={story.type === 'ui' ? 'blue' : 'green'}>
                            {story.type.toUpperCase()}
                          </Tag>
                          {story.syncStatus === 'synced' ? (
                            <Tag color="green" icon={<CheckCircle size={12} />}>SYNCED</Tag>
                          ) : (
                            <Tooltip title="Sync this story to Backlog">
                              <Button
                                size="small"
                                icon={<Upload size={14} />}
                                onClick={() => handleSyncStory(story)}
                                loading={syncing}
                              >
                                Sync
                              </Button>
                            </Tooltip>
                          )}
                        </Space>
                      </div>
                      
                      <p style={{ color: colors.text.secondary, margin: '8px 0' }}>
                        {story.description}
                      </p>
                      
                      <Row gutter={8}>
                        <Col>
                          <PointsCard>
                            <Target size={16} color="#1890ff" />
                            <div>
                              <div className="label">Story Points</div>
                              <div className="value">{storyPoints}</div>
                            </div>
                          </PointsCard>
                        </Col>
                        <Col>
                          <PointsCard>
                            <Code size={16} color="#1890ff" />
                            <div>
                              <div className="label">Dev</div>
                              <div className="value">{devPoints}</div>
                            </div>
                          </PointsCard>
                        </Col>
                        <Col>
                          <PointsCard>
                            <CheckCircle size={16} color="#52c41a" />
                            <div>
                              <div className="label">QA</div>
                              <div className="value">{qaPoints}</div>
                            </div>
                          </PointsCard>
                        </Col>
                        <Col>
                          <PointsCard>
                            <Clock size={16} color="#faad14" />
                            <div>
                              <div className="label">Review</div>
                              <div className="value">{reviewPoints}</div>
                            </div>
                          </PointsCard>
                        </Col>
                      </Row>
                      
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <AcceptanceCriteria
                        storyId={story.id}
                        criteria={story.acceptanceCriteria.map((text: string, index: number) => ({
                          id: `${story.id}-ac-${index}`,
                          text,
                          completed: false,
                          order: index,
                        }))}
                        onUpdate={async (updatedCriteria: AcceptanceCriterion[]) => {
                          // Update the story with new acceptance criteria
                          try {
                            await aiStoriesApi.update(story.id, {
                              acceptanceCriteria: updatedCriteria.map(ac => ac.text),
                            });
                            message.success('Acceptance criteria updated');
                            // Refresh stories
                            loadStories();
                          } catch (error) {
                            message.error('Failed to update acceptance criteria');
                            console.error(error);
                          }
                        }}
                      />
                    </Space>
                  </StoryCard>
                );
              })}
            </StoryGroup>
          );
        })
      )}
    </Container>
  );
};
