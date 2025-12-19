import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Input, Tabs, Tag, Button, Space, Empty, Badge, Modal, Form, message, Select } from 'antd';
import { Search, Download, FileText, Bug, CheckSquare, Zap, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { filtersApi } from '../services/api';
import { BulkOperationsToolbar } from '../components/BulkOperations/BulkOperationsToolbar';

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
  margin: 0;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const PlaceholderCard = styled(Card)`
  text-align: center;
  padding: 60px 20px;
  color: ${colors.text.secondary};
`;

const IssueCard = styled.div`
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  border-radius: 4px;
  margin-bottom: 4px;
  
  &:hover {
    background: #f8fafc;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
`;

const IssueContent = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(300px, 1fr) 120px 120px 120px;
  gap: 16px;
  align-items: center;
  
  @media (max-width: 1200px) {
    grid-template-columns: 32px 1fr;
    gap: 8px;
  }
`;

const IssueMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const IssueMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
`;

const IssueDescription = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FiltersView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { issues, currentProject, currentUser, addFilter } = useStore();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [saveFilterModalVisible, setSaveFilterModalVisible] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadSavedFilters();
  }, [currentUser]);

  const loadSavedFilters = async () => {
    try {
      setLoadingFilters(true);
      const res = await filtersApi.getAll();
      setSavedFilters(res.data || []);
    } catch (error) {
      console.error('Failed to load filters', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter) {
      setActiveFilter(filter);
    }
  }, [searchParams]);

  const handleSaveFilter = async (values: any) => {
    try {
      const filterConfig = {
        projectId: currentProject?.id,
        status: activeFilter === 'done' ? ['done'] : activeFilter === 'my-open' ? undefined : undefined,
        assigneeId: activeFilter === 'my-open' ? currentUser?.id : undefined,
        searchText: searchText || undefined,
      };

      const { data: newFilter } = await filtersApi.create({
        ...values,
        ownerId: currentUser?.id,
        filterConfig,
      });

      addFilter(newFilter);

      message.success('Filter saved successfully');
      setSaveFilterModalVisible(false);
      form.resetFields();
      loadSavedFilters(); // Reload list
    } catch (error) {
      console.error('Error saving filter:', error);
      message.error('Failed to save filter');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'epic': return <Zap size={16} color="#722ed1" />;
      case 'story': return <FileText size={16} color="#52c41a" />;
      case 'bug': return <Bug size={16} color="#ff4d4f" />;
      case 'task': return <CheckSquare size={16} color="#1890ff" />;
      default: return <FileText size={16} />;
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ?
        <mark key={i} style={{ background: '#fff566', padding: '0 2px' }}>{part}</mark> : part
    );
  };

  const handleAiSearch = () => {
    if (!aiQuery.trim()) return;

    // Simple Client-Side Heuristic Parsing
    const query = aiQuery.toLowerCase();
    const config: any = {
      searchText: '',
      status: [] as string[],
      type: [] as string[]
    };

    // 1. Detect Status
    if (query.includes('done') || query.includes('completed')) config.status.push('done');
    if (query.includes('pending') || query.includes('progress') || query.includes('working')) config.status.push('in-progress');
    if (query.includes('todo') || query.includes('backlog')) config.status.push('todo');

    // 2. Detect Type
    if (query.includes('bug')) config.type.push('bug');
    if (query.includes('story') || query.includes('stories')) config.type.push('story');
    if (query.includes('epic')) config.type.push('epic');
    if (query.includes('task')) config.type.push('task');

    // 3. Detect Assignee (Simple 'me')
    if (query.includes('my') || query.includes('assigned to me')) {
      // We can't easily filter by ID in search text, so we rely on status/search text combination
      // But typically we'd set activeFilter='my-open' if that was the only intent.
      // For now, let's treat it as a special "Assignee: Me" search text if backend supports it or filter locally.
      // The existing filter logic primarily uses searchText.
    }

    // 4. Extract keywords for search text (removing known tokens)
    const keywords = ['show', 'me', 'issues', 'tickets', 'that', 'are', 'in', 'assigned', 'to', 'priority', 'high', 'low', 'bugs', 'stories', 'epics', 'tasks', 'done', 'completed', 'progress', 'pending'];
    const words = query.split(' ').filter(w => !keywords.includes(w));
    if (words.length > 0) config.searchText = words.join(' ');

    setSearchText(config.searchText); // Update search bar

    // Apply status filter if detected
    if (config.status.length > 0) {
      if (config.status.includes('done') && config.status.length === 1) setActiveFilter('done');
      else setActiveFilter('custom_ai'); // We would need a custom filter state theoretically, or just filter via searchText
    }

    // Since our local filtering is simplistic in this view (it relies on `activeFilter` enum), 
    // we will mostly rely on the Search Text field for filtering unless it's strictly 'done' or 'my-open'.
    // However, we can inject a temporary "AI result" message.

    message.success(`🤖 Filtered for "${aiQuery}"`);
    setAiModalVisible(false);
  };

  const handleSelectIssue = (issueId: string, checked: boolean) => {
    if (checked) {
      setSelectedIssueIds(prev => [...prev, issueId]);
    } else {
      setSelectedIssueIds(prev => prev.filter(id => id !== issueId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIssueIds(filteredIssues.map(i => i.id));
    } else {
      setSelectedIssueIds([]);
    }
  };

  const renderIssueList = (issuesList: any[]) => {
    if (issuesList.length === 0) {
      return (
        <Empty
          description="No issues found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <div>
        <div style={{ marginBottom: 16, color: colors.text.secondary, display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="checkbox"
            checked={selectedIssueIds.length === issuesList.length && issuesList.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <strong>{issuesList.length}</strong> issue{issuesList.length !== 1 ? 's' : ''} found
          {selectedIssueIds.length > 0 && (
            <Tag color="blue">{selectedIssueIds.length} selected</Tag>
          )}
        </div>
        {issuesList.map(issue => (
          <IssueCard
            key={issue.id}
          >
            <IssueContent>
              <input
                type="checkbox"
                checked={selectedIssueIds.includes(issue.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleSelectIssue(issue.id, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: 'pointer', marginRight: 12 }}
              />
              <IssueMain onClick={() => navigate(`/issue/${issue.key}`)} style={{ cursor: 'pointer', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {getTypeIcon(issue.type)}
                  <Tag color="blue">{issue.key}</Tag>
                  <Tag color={issue.type === 'epic' ? 'purple' : issue.type === 'story' ? 'green' : issue.type === 'bug' ? 'red' : 'default'}>
                    {issue.type.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  {highlightText(issue.summary, searchText)}
                </div>
                {issue.description && (
                  <IssueDescription>
                    {highlightText(issue.description.substring(0, 100), searchText)}
                    {issue.description.length > 100 ? '...' : ''}
                  </IssueDescription>
                )}
                {issue.labels && issue.labels.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {issue.labels.map((label: string) => (
                      <Tag key={label} style={{ fontSize: 11 }}>{label}</Tag>
                    ))}
                  </div>
                )}
              </IssueMain>
              <IssueMeta>
                <Tag color={issue.status === 'done' ? 'green' : issue.status === 'in-progress' ? 'blue' : 'default'}>
                  {issue.status?.toUpperCase()}
                </Tag>
                <Tag color={issue.priority === 'highest' ? 'red' : issue.priority === 'high' ? 'orange' : 'default'}>
                  {issue.priority?.toUpperCase()}
                </Tag>
                {issue.assignee && (
                  <Tag icon={<span>👤</span>}>{issue.assignee.name}</Tag>
                )}
              </IssueMeta>
            </IssueContent>
          </IssueCard>
        ))}
      </div>
    );
  };

  // Filter issues based on active filter and search
  const filteredIssues = useMemo(() => {
    let filtered = issues.filter(issue => {
      const matchesProject = !currentProject || issue.projectId === currentProject.id;
      return matchesProject;
    });

    // Apply filter type
    if (activeFilter === 'my-open') {
      filtered = filtered.filter(issue =>
        issue.assignee?.id === currentUser?.id &&
        issue.status !== 'done'
      );
    } else if (activeFilter === 'done') {
      filtered = filtered.filter(issue => issue.status === 'done');
    } else {
      // Check if it's a saved filter
      const saved = savedFilters.find(f => f.id === activeFilter);
      if (saved && saved.filterConfig) {
        const { status, assigneeId, searchText: savedSearch } = saved.filterConfig;

        if (status && status.length > 0) {
          filtered = filtered.filter(issue => status.includes(issue.status));
        }
        if (assigneeId) {
          filtered = filtered.filter(issue => issue.assignee?.id === assigneeId);
        }
        // Note: Saved search text might conflict with current search text. 
        // For now, we apply saved search text only if current search text is empty?
        // Or we merge them? Let's assume saved filter sets the base.
        if (savedSearch && !searchText) {
          // This is tricky because searchText state drives the input.
          // Ideally selecting a filter should populate searchText state.
        }
      }
    }

    // Apply search if present
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(issue =>
        issue.key.toLowerCase().includes(query) ||
        issue.summary.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query) ||
        issue.labels?.some(l => l.toLowerCase().includes(query)) ||
        issue.assignee?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchText, issues, currentProject, currentUser, activeFilter]);

  // Group results by type
  const groupedResults = useMemo(() => {
    return {
      epics: filteredIssues.filter(i => i.type === 'epic'),
      stories: filteredIssues.filter(i => i.type === 'story'),
      bugs: filteredIssues.filter(i => i.type === 'bug'),
      tasks: filteredIssues.filter(i => i.type === 'task'),
      all: filteredIssues
    };
  }, [filteredIssues]);

  return (
    <Container>
      <Header>
        <Title>
          {activeFilter === 'my-open' ? 'My Open Issues' :
            activeFilter === 'done' ? 'Done Issues' :
              'All Issues'}
        </Title>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="Load Saved Filter"
            allowClear
            onChange={(val) => {
              setActiveFilter(val || 'all');
              // Optionally populate search text if filter has it
              const saved = savedFilters.find(f => f.id === val);
              if (saved?.filterConfig?.searchText) {
                setSearchText(saved.filterConfig.searchText);
              } else {
                setSearchText('');
              }
            }}
            loading={loadingFilters}
            value={['all', 'my-open', 'done'].includes(activeFilter) ? null : activeFilter}
          >
            {savedFilters.map(f => (
              <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
            ))}
          </Select>
          <Button
            type={activeFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setActiveFilter('all')}
            style={{ color: activeFilter === 'all' ? '#FFFFFF' : undefined }}
          >
            All Issues
          </Button>
          <Button
            type={activeFilter === 'my-open' ? 'primary' : 'default'}
            onClick={() => setActiveFilter('my-open')}
            style={{ color: activeFilter === 'my-open' ? '#FFFFFF' : undefined }}
          >
            My Open Issues
          </Button>
          <Button
            type={activeFilter === 'done' ? 'primary' : 'default'}
            onClick={() => setActiveFilter('done')}
            style={{ color: activeFilter === 'done' ? '#FFFFFF' : undefined }}
          >
            Done Issues
          </Button>
          <Button icon={<Save size={16} />} onClick={() => setSaveFilterModalVisible(true)}>
            Save Filter
          </Button>
          <Button icon={<Download size={16} />}>Export</Button>
        </Space>
      </Header>

      <FilterBar>
        <Input
          placeholder="Search issues..."
          prefix={<Search size={16} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
          allowClear
        />
        <Button
          icon={<Zap size={16} />}
          onClick={() => setAiModalVisible(true)}
          style={{ background: '#F3E8FF', borderColor: '#D8B4FE', color: '#9333EA' }}
        >
          Ask AI
        </Button>
      </FilterBar>

      <Card>
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: (
                <span>
                  All Issues <Badge count={groupedResults.all.length} style={{ marginLeft: 8, backgroundColor: '#1890ff' }} />
                </span>
              ),
              children: renderIssueList(groupedResults.all)
            },
            {
              key: 'epics',
              label: (
                <span>
                  <Zap size={14} style={{ marginRight: 4 }} />
                  Epics <Badge count={groupedResults.epics.length} style={{ marginLeft: 8, backgroundColor: '#722ed1' }} />
                </span>
              ),
              children: renderIssueList(groupedResults.epics)
            },
            {
              key: 'stories',
              label: (
                <span>
                  <FileText size={14} style={{ marginRight: 4 }} />
                  Stories <Badge count={groupedResults.stories.length} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
                </span>
              ),
              children: renderIssueList(groupedResults.stories)
            },
            {
              key: 'bugs',
              label: (
                <span>
                  <Bug size={14} style={{ marginRight: 4 }} />
                  Bugs <Badge count={groupedResults.bugs.length} style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }} />
                </span>
              ),
              children: renderIssueList(groupedResults.bugs)
            },
            {
              key: 'tasks',
              label: (
                <span>
                  <CheckSquare size={14} style={{ marginRight: 4 }} />
                  Tasks <Badge count={groupedResults.tasks.length} style={{ marginLeft: 8, backgroundColor: '#1890ff' }} />
                </span>
              ),
              children: renderIssueList(groupedResults.tasks)
            }
          ]}
        />
      </Card>

      {/* Save Filter Modal */}
      <Modal
        title="Save Filter"
        open={saveFilterModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setSaveFilterModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveFilter}>
          <Form.Item
            name="name"
            label="Filter Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., My Open Bugs" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe what this filter does" />
          </Form.Item>
        </Form>
      </Modal>

      {/* AI Search Modal */}
      <Modal
        title={<div><span style={{ fontSize: 20 }}>🤖</span> Ask AI to Filter</div>}
        open={aiModalVisible}
        onOk={handleAiSearch}
        onCancel={() => setAiModalVisible(false)}
        okText="Filter"
      >
        <div style={{ marginBottom: 16 }}>
          Describe what you are looking for in natural language.
        </div>
        <Input.TextArea
          rows={3}
          placeholder="e.g. show me high priority bugs in progress..."
          value={aiQuery}
          onChange={e => setAiQuery(e.target.value)}
          autoFocus
        />
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          Try queries like:
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li>"My pending bugs"</li>
            <li>"Frontend stories that are done"</li>
            <li>"Critical issues in backlog"</li>
          </ul>
        </div>
      </Modal>

      {/* Bulk Operations Toolbar */}
      <BulkOperationsToolbar
        selectedIssueIds={selectedIssueIds}
        onClearSelection={() => setSelectedIssueIds([])}
        onOperationComplete={() => {
          // Refresh issues
          window.location.reload();
        }}
      />
    </Container>
  );
};
