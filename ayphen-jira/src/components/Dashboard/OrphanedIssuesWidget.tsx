import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Spin } from 'antd';
import { WarningOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { issuesApi } from '../../services/api';
import { useStore } from '../../store/useStore';

const WidgetCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  .ant-card-head {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border-bottom: 1px solid #FCD34D;
    
    .ant-card-head-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #92400E;
    }
  }
`;

const IssueItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #FAFAFA;
  margin-bottom: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: #F5F5F5;
    transform: translateX(4px);
  }
`;

const IssueInfo = styled.div`
  flex: 1;
  cursor: pointer;
`;

const IssueKey = styled.span`
  font-weight: 600;
  color: #1F2937;
  margin-right: 8px;
`;

const IssueSummary = styled.span`
  color: #6B7280;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding: 12px;
  background: #FEF3C7;
  border-radius: 8px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .label {
    font-size: 12px;
    color: #92400E;
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 20px;
    font-weight: 700;
    color: #B45309;
  }
`;

export const OrphanedIssuesWidget: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useStore();
  const [orphanedIssues, setOrphanedIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    stories: 0,
    bugs: 0,
    tasks: 0,
  });

  useEffect(() => {
    if (currentProject) {
      loadOrphanedIssues();
    }
  }, [currentProject]);

  const loadOrphanedIssues = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const response = await issuesApi.getAll({ 
        projectId: currentProject?.id 
      });
      
      const allIssues = response.data || [];
      
      // Filter orphaned issues:
      // - Not an Epic itself
      // - Has no epicLink (except for subtasks)
      // - Has no parentId (for subtasks without parent)
      const orphaned = allIssues.filter((issue: any) => {
        // Epics are never orphaned
        if (issue.type === 'epic') return false;
        
        // Subtasks MUST have parentId
        if (issue.type === 'subtask' && !issue.parentId) return true;
        
        // Stories, Bugs, Tasks should have epicLink
        if (['story', 'bug', 'task'].includes(issue.type) && !issue.epicLink && !issue.epicKey) {
            // Check both epicLink and epicKey just to be sure, though typically one is used.
            // If API returns both or one.
            return true;
        }
        
        return false;
      });

      // Calculate stats
      const stats = {
        total: orphaned.length,
        stories: orphaned.filter((i: any) => i.type === 'story').length,
        bugs: orphaned.filter((i: any) => i.type === 'bug').length,
        tasks: orphaned.filter((i: any) => i.type === 'task').length,
      };

      setOrphanedIssues(orphaned.slice(0, 5)); // Show top 5
      setStats(stats);
    } catch (error) {
      console.error('Failed to load orphaned issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIssuePriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'blue',
    };
    return colors[priority?.toLowerCase()] || 'default';
  };

  if (loading) {
    return (
      <WidgetCard title={<><WarningOutlined /> Orphaned Issues</>}>
        <Spin />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard 
      title={
        <>
          <WarningOutlined /> 
          Orphaned Issues ({stats.total})
        </>
      }
      extra={
        stats.total > 5 && (
          <Button 
            type="link" 
            size="small"
            onClick={() => navigate('/backlog?filter=orphaned')}
          >
            View All
          </Button>
        )
      }
    >
      {orphanedIssues.length === 0 ? (
        <Empty
          description="No orphaned issues! 🎉"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <List
            dataSource={orphanedIssues}
            renderItem={(issue: any) => (
              <IssueItem>
                <IssueInfo onClick={() => navigate(`/issue/${issue.key}`)}>
                  <IssueKey>{issue.key}</IssueKey>
                  <Tag color={getIssuePriorityColor(issue.priority)}>
                    {issue.type}
                  </Tag>
                  <IssueSummary>{issue.summary}</IssueSummary>
                </IssueInfo>
                <Button
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() => navigate(`/issue/${issue.key}`)}
                >
                  Link
                </Button>
              </IssueItem>
            )}
          />

          <StatsRow>
            <StatItem>
              <div className="label">Stories</div>
              <div className="value">{stats.stories}</div>
            </StatItem>
            <StatItem>
              <div className="label">Bugs</div>
              <div className="value">{stats.bugs}</div>
            </StatItem>
            <StatItem>
              <div className="label">Tasks</div>
              <div className="value">{stats.tasks}</div>
            </StatItem>
          </StatsRow>
        </>
      )}
    </WidgetCard>
  );
};
