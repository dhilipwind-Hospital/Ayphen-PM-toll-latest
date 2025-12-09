import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spin, Tag, Typography } from 'antd';
import { Zap, Bookmark, CheckSquare, List, ChevronRight, ChevronDown } from 'lucide-react';
import styled from 'styled-components';
import { issuesApi } from '../../services/api';
import axios from 'axios';

const { Text } = Typography;

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TreeNode = styled.div<{ $active?: boolean; $level: number }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  padding-left: ${props => props.$level * 20 + 8}px;
  background-color: ${props => props.$active ? '#E6FFFA' : 'transparent'};
  border-radius: 4px;
  border-left: ${props => props.$active ? '3px solid #38B2AC' : '3px solid transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$active ? '#E6FFFA' : '#F7FAFC'};
  }
`;

const IconWrapper = styled.div<{ $color: string }>`
  color: ${props => props.$color};
  display: flex;
  align-items: center;
`;

interface HierarchyTreeProps {
  issue: any;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ issue }) => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);

  useEffect(() => {
    if (issue) {
      buildHierarchy();
    }
  }, [issue]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'epic': return <Zap size={14} />;
      case 'story': return <Bookmark size={14} />;
      case 'task': return <CheckSquare size={14} />;
      case 'bug': return <List size={14} />; // Using List as placeholder for bug
      case 'subtask': return <List size={14} />; // Using List for subtask
      default: return <List size={14} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'epic': return '#805AD5'; // Purple
      case 'story': return '#3182CE'; // Blue
      case 'task': return '#319795'; // Teal
      case 'bug': return '#E53E3E'; // Red
      case 'subtask': return '#718096'; // Gray
      default: return '#718096';
    }
  };

  const fetchIssue = async (id: string) => {
    try {
      const res = await issuesApi.getById(id);
      return res.data;
    } catch (e) {
      return null;
    }
  };

  const fetchSubtasks = async (parentId: string) => {
    try {
      const res = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/subtasks/parent/${parentId}`);
      return res.data || [];
    } catch (e) {
      return [];
    }
  };

  const buildHierarchy = async () => {
    setLoading(true);
    const nodes: any[] = [];

    try {
      // 1. If current issue is Subtask
      if (issue.type === 'subtask' && issue.parentId) {
        const parent = await fetchIssue(issue.parentId);
        if (parent) {
          // Check if parent has epic
          if (parent.epicId) {
            const epic = await fetchIssue(parent.epicId);
            if (epic) nodes.push({ ...epic, level: 0 });
          }
          nodes.push({ ...parent, level: 1 });
          
          // Get siblings (subtasks of parent)
          const siblings = await fetchSubtasks(parent.id);
          siblings.forEach((sub: any) => {
            nodes.push({ ...sub, level: 2 });
          });
        } else {
            // Orphaned subtask?
            nodes.push({ ...issue, level: 0 });
        }
      } 
      // 2. If current issue is Story/Task/Bug
      else if (['story', 'task', 'bug'].includes(issue.type)) {
        // Check for Epic
        if (issue.epicId) {
          const epic = await fetchIssue(issue.epicId);
          if (epic) nodes.push({ ...epic, level: 0 });
        }
        
        nodes.push({ ...issue, level: 1 });
        
        // Get subtasks
        const subtasks = await fetchSubtasks(issue.id);
        subtasks.forEach((sub: any) => {
          nodes.push({ ...sub, level: 2 });
        });
      }
      // 3. If current issue is Epic
      else if (issue.type === 'epic') {
        nodes.push({ ...issue, level: 0 });
        
        // Get child stories
        try {
            const res = await issuesApi.getAll({ epicLink: issue.id });
            const children = res.data || [];
            children.forEach((child: any) => {
                nodes.push({ ...child, level: 1 });
                // Note: We don't fetch subtasks of all children to avoid performance hit
            });
        } catch (e) {
            console.error('Failed to fetch epic children');
        }
      } else {
        nodes.push({ ...issue, level: 0 });
      }

      setTreeData(nodes);
    } catch (error) {
      console.error('Failed to build hierarchy', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin size="small" />;
  if (treeData.length === 0) return null;

  return (
    <TreeContainer>
      {treeData.map((node) => (
        <Link to={`/board?issue=${node.key}`} key={node.id} style={{ textDecoration: 'none' }}>
          <TreeNode $active={node.id === issue.id} $level={node.level || 0}>
            {node.level > 0 && <ChevronDown size={12} color="#CBD5E0" style={{ marginRight: -4 }} />}
            <IconWrapper $color={getColor(node.type)}>
              {getIcon(node.type)}
            </IconWrapper>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ fontSize: 13, fontWeight: node.id === issue.id ? 600 : 400, color: '#2D3748' }}>
                    {node.key}
                </Text>
                <Text ellipsis style={{ fontSize: 12, color: '#718096', maxWidth: 200 }}>
                    {node.summary}
                </Text>
            </div>
          </TreeNode>
        </Link>
      ))}
    </TreeContainer>
  );
};
