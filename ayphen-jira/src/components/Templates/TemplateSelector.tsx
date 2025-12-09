import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, message, Card, Tag, Empty, Input, Tabs } from 'antd';
import { FileText, Sparkles, Star, TrendingUp } from 'lucide-react';
import styled from 'styled-components';
import axios from 'axios';

const { Search: AntSearch } = Input;
const { TabPane } = Tabs;

interface TemplateSection {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
  aiGenerate: boolean;
  format?: string;
  helpText?: string;
  defaultValue?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  issueTypes: string[];
  category: string;
  sections: TemplateSection[];
  tags: string[];
  isDefault: boolean;
  isPublic: boolean;
  usageCount: number;
  rating?: number;
}

interface FilledTemplate {
  templateId: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    aiGenerated: boolean;
  }>;
  fullDescription: string;
}

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  issueType: string;
  issueSummary: string;
  onTemplateSelected: (description: string) => void;
  projectId?: string;
  epicId?: string;
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
`;

const TemplateCard = styled(Card)<{ selected: boolean }>`
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.selected ? '#1890ff' : '#f0f0f0'};
  background: ${props => props.selected ? '#e6f7ff' : 'white'};

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
    transform: translateY(-2px);
  }

  .ant-card-body {
    padding: 16px;
  }
`;

const TemplateHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const TemplateName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #262626;
  margin-bottom: 4px;
`;

const TemplateDescription = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const TemplateStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 8px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`;

const SectionPreview = styled.div`
  background: #fafafa;
  border-radius: 4px;
  padding: 12px;
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
`;

const SectionItem = styled.div`
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: #262626;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionHelp = styled.div`
  font-size: 11px;
  color: #8c8c8c;
  font-style: italic;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: #595959;
`;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ayphen-pm-toll-latest.onrender.com';

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  open,
  onClose,
  issueType,
  issueSummary,
  onTemplateSelected,
  projectId,
  epicId
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (open) {
      fetchTemplates();
      fetchPopularTemplates();
    }
  }, [open, issueType]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates`, {
        params: { issueType }
      });
      setTemplates(response.data.templates || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      message.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPopularTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates/stats/popular`, {
        params: { limit: 5 }
      });
      setPopularTemplates(response.data.templates || []);
    } catch (error: any) {
      console.error('Error fetching popular templates:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchTemplates();
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates/search/query`, {
        params: { q: query }
      });
      setTemplates(response.data.templates || []);
    } catch (error: any) {
      console.error('Error searching templates:', error);
      message.error('Search failed');
    }
  };

  const handleFillTemplate = async () => {
    if (!selectedTemplate) {
      message.warning('Please select a template');
      return;
    }

    if (!issueSummary || issueSummary.trim() === '') {
      message.warning('Please provide an issue summary first');
      return;
    }

    setIsFilling(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/templates/${selectedTemplate.id}/fill`,
        {
          summary: issueSummary,
          context: {
            issueType,
            projectId,
            epicId
          }
        }
      );

      const filledTemplate: FilledTemplate = response.data.filledTemplate;
      onTemplateSelected(filledTemplate.fullDescription);
      message.success('Template filled successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error filling template:', error);
      message.error(error.response?.data?.error || 'Failed to fill template');
    } finally {
      setIsFilling(false);
    }
  };

  const getFilteredTemplates = () => {
    if (activeTab === 'popular') {
      return popularTemplates;
    }
    return templates;
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} style={{ color: '#1890ff' }} />
          <span>Select Description Template</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="structure"
          onClick={() => {
            if (selectedTemplate) {
              const structure = selectedTemplate.sections
                .map(s => `## ${s.title}\n\n${s.defaultValue || s.placeholder}\n`)
                .join('\n');
              onTemplateSelected(structure);
              onClose();
            }
          }}
          disabled={!selectedTemplate}
        >
          Use Structure Only
        </Button>,
        <Button
          key="fill"
          type="primary"
          icon={<Sparkles size={16} />}
          onClick={handleFillTemplate}
          loading={isFilling}
          disabled={!selectedTemplate}
        >
          {isFilling ? 'Generating...' : 'Generate with AI'}
        </Button>
      ]}
    >
      <ModalContent>
        {/* Search and Tabs */}
        <div>
          <AntSearch
            placeholder="Search templates..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                fetchTemplates();
                setSearchQuery('');
              }
            }}
            style={{ marginBottom: 16 }}
          />

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <FileText size={14} style={{ marginRight: 6 }} />
                  All Templates ({templates.length})
                </span>
              }
              key="all"
            />
            <TabPane
              tab={
                <span>
                  <TrendingUp size={14} style={{ marginRight: 6 }} />
                  Popular ({popularTemplates.length})
                </span>
              }
              key="popular"
            />
          </Tabs>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <LoadingContainer>
            <Spin size="large" />
            <LoadingText>Loading templates...</LoadingText>
          </LoadingContainer>
        ) : filteredTemplates.length === 0 ? (
          <Empty
            description={
              searchQuery
                ? `No templates found for "${searchQuery}"`
                : 'No templates available'
            }
          />
        ) : (
          <TemplateGrid>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                selected={selectedTemplate?.id === template.id}
                onClick={() => setSelectedTemplate(template)}
                hoverable
              >
                <TemplateHeader>
                  <div style={{ flex: 1 }}>
                    <TemplateName>{template.name}</TemplateName>
                    {template.isDefault && (
                      <Tag color="blue" style={{ fontSize: 10 }}>
                        Default
                      </Tag>
                    )}
                  </div>
                  {template.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} fill="#faad14" color="#faad14" />
                      <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {template.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </TemplateHeader>

                <TemplateDescription>{template.description}</TemplateDescription>

                <TagsContainer>
                  {template.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag} style={{ fontSize: 10, margin: 0 }}>
                      {tag}
                    </Tag>
                  ))}
                </TagsContainer>

                <TemplateStats>
                  <span>📝 {template.sections.length} sections</span>
                  <span>
                    ✨ {template.sections.filter((s) => s.aiGenerate).length} AI-powered
                  </span>
                  <span>📊 {template.usageCount} uses</span>
                </TemplateStats>
              </TemplateCard>
            ))}
          </TemplateGrid>
        )}

        {/* Selected Template Preview */}
        {selectedTemplate && (
          <SectionPreview>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Sparkles size={16} color="#1890ff" />
              Template Sections Preview
            </div>
            {selectedTemplate.sections.map((section) => (
              <SectionItem key={section.id}>
                <SectionTitle>
                  {section.title}
                  {section.required && <Tag color="red" style={{ fontSize: 10 }}>Required</Tag>}
                  {section.aiGenerate && <Tag color="blue" style={{ fontSize: 10 }}>AI</Tag>}
                </SectionTitle>
                {section.helpText && <SectionHelp>{section.helpText}</SectionHelp>}
              </SectionItem>
            ))}
          </SectionPreview>
        )}
      </ModalContent>
    </Modal>
  );
};
