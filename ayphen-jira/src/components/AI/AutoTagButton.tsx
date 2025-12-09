import React, { useState } from 'react';
import { Button, Tooltip, Modal, Tag, Space, Badge, message, Checkbox } from 'antd';
import { TagsOutlined, RobotOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const API_URL = 'http://localhost:8500/api';

interface AutoTagButtonProps {
  issueId: string;
  currentTags?: string[];
  onTagsChanged?: (tags: string[]) => void;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'text' | 'link';
  showText?: boolean;
}

interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
  category: string;
}

interface TaggingResult {
  suggestedTags: TagSuggestion[];
  currentTags: string[];
  tagsToAdd: string[];
  confidence: number;
}

const ModalContent = styled.div`
  .tag-category {
    margin-bottom: 20px;
  }

  .tag-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #e6f7ff;
      transform: translateX(4px);
    }

    &.selected {
      background: #e6f7ff;
      border: 2px solid #1890ff;
    }
  }

  .confidence-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .current-tags {
    padding: 12px;
    background: #fafafa;
    border-radius: 8px;
    margin-bottom: 16px;
  }
`;

const categoryColors: Record<string, string> = {
  technical: 'blue',
  functional: 'green',
  priority: 'red',
  team: 'purple',
  status: 'orange'
};

const categoryIcons: Record<string, string> = {
  technical: '⚙️',
  functional: '📦',
  priority: '⚡',
  team: '👥',
  status: '📊'
};

export const AutoTagButton: React.FC<AutoTagButtonProps> = ({
  issueId,
  currentTags = [],
  onTagsChanged,
  size = 'middle',
  type = 'default',
  showText = true
}) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [result, setResult] = useState<TaggingResult | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  const handleSuggestTags = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai-auto-tagging/suggest/${issueId}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setResult(data);
        // Pre-select high-confidence tags
        const highConfidenceTags = data.suggestedTags
          .filter((t: TagSuggestion) => t.confidence >= 80)
          .map((t: TagSuggestion) => t.tag);
        setSelectedTags(new Set(highConfidenceTags));
        setModalVisible(true);
        message.success(`Found ${data.tagsToAdd.length} new tag suggestions!`);
      } else {
        message.error(response.data.error || 'Failed to suggest tags');
      }
    } catch (error: any) {
      console.error('Tag suggestion error:', error);
      message.error(error.response?.data?.error || 'Failed to get tag suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTags = async () => {
    if (!result || selectedTags.size === 0) {
      message.warning('Please select at least one tag');
      return;
    }

    setApplying(true);
    try {
      const tagsArray = Array.from(selectedTags);
      const response = await axios.post(`${API_URL}/ai-auto-tagging/apply/${issueId}`, {
        tags: tagsArray,
        autoApply: true
      });

      if (response.data.success) {
        message.success(`Applied ${tagsArray.length} tags!`);
        setModalVisible(false);
        
        if (onTagsChanged) {
          onTagsChanged(response.data.data.issue.labels);
        }
      } else {
        message.error(response.data.error || 'Failed to apply tags');
      }
    } catch (error: any) {
      console.error('Apply tags error:', error);
      message.error(error.response?.data?.error || 'Failed to apply tags');
    } finally {
      setApplying(false);
    }
  };

  const toggleTag = (tag: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#52c41a';
    if (confidence >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const groupByCategory = (tags: TagSuggestion[]): Record<string, TagSuggestion[]> => {
    return tags.reduce((acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    }, {} as Record<string, TagSuggestion[]>);
  };

  return (
    <>
      <Tooltip title="Get AI-powered tag suggestions">
        <Badge count={result?.tagsToAdd.length || 0} offset={[-5, 5]}>
          <Button
            icon={<TagsOutlined />}
            onClick={handleSuggestTags}
            loading={loading}
            size={size}
            type={type}
          >
            {showText && 'AI Tags'}
          </Button>
        </Badge>
      </Tooltip>

      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>Smart Tag Suggestions</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        {result && (
          <ModalContent>
            {/* Current Tags */}
            {result.currentTags.length > 0 && (
              <div className="current-tags">
                <strong>Current Tags:</strong>
                <div style={{ marginTop: 8 }}>
                  {result.currentTags.map(tag => (
                    <Tag key={tag} color="default" style={{ marginBottom: 4 }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Tags by Category */}
            {Object.entries(groupByCategory(result.suggestedTags)).map(([category, tags]) => (
              <div key={category} className="tag-category">
                <h4>
                  {categoryIcons[category] || '🏷️'} {category.charAt(0).toUpperCase() + category.slice(1)} Tags
                </h4>
                {tags.map((tagSuggestion) => {
                  const isSelected = selectedTags.has(tagSuggestion.tag);
                  const isNew = !result.currentTags.includes(tagSuggestion.tag);
                  
                  return (
                    <div
                      key={tagSuggestion.tag}
                      className={`tag-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => isNew && toggleTag(tagSuggestion.tag)}
                      style={{ cursor: isNew ? 'pointer' : 'not-allowed', opacity: isNew ? 1 : 0.6 }}
                    >
                      <Space>
                        {isNew && (
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => toggleTag(tagSuggestion.tag)}
                          />
                        )}
                        <Tag color={categoryColors[category]}>
                          {tagSuggestion.tag}
                        </Tag>
                        {!isNew && <Tag color="default">Already Added</Tag>}
                      </Space>
                      <Space direction="vertical" align="end" size={0}>
                        <span 
                          className="confidence-badge"
                          style={{ 
                            background: getConfidenceColor(tagSuggestion.confidence),
                            color: 'white'
                          }}
                        >
                          {tagSuggestion.confidence}%
                        </span>
                        <span style={{ fontSize: 12, color: '#666' }}>
                          {tagSuggestion.reason}
                        </span>
                      </Space>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Summary */}
            <div style={{ 
              padding: 12, 
              background: '#e6f7ff', 
              borderRadius: 8,
              marginTop: 16,
              marginBottom: 16
            }}>
              <Space>
                <strong>Selected:</strong>
                <Tag color="blue">{selectedTags.size} tags</Tag>
                <span style={{ color: '#666' }}>
                  Overall Confidence: {result.confidence}%
                </span>
              </Space>
            </div>

            {/* Apply Button */}
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApplyTags}
              loading={applying}
              disabled={selectedTags.size === 0}
              block
              size="large"
            >
              Apply {selectedTags.size} Selected Tags
            </Button>
          </ModalContent>
        )}
      </Modal>
    </>
  );
};
