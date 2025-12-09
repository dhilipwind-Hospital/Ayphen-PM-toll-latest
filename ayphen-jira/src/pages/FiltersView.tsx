import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Input, Tabs, Tag, Button, Space, Empty, Badge, Modal, Form, message } from 'antd';
import { Search, Download, FileText, Bug, CheckSquare, Zap, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import axios from 'axios';
import { BulkOperationsToolbar } from '../components/BulkOperations/BulkOperationsToolbar';

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

const IssueCard = styled(Card.Grid)`
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f0f7ff;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const IssueContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

const IssueMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const IssueMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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
  const { issues, currentProject, currentUser } = useStore();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [saveFilterModalVisible, setSaveFilterModalVisible] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [form] = Form.useForm();

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

      await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/saved-filters', {
        ...values,
        ownerId: currentUser?.id,
        filterConfig,
      });

      message.success('Filter saved successfully');
      setSaveFilterModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving filter:', error);
      message.error('Failed to save filter');
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
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
            hoverable
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
          <Button 
            type={activeFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setActiveFilter('all')}
          >
            All Issues
          </Button>
          <Button 
            type={activeFilter === 'my-open' ? 'primary' : 'default'}
            onClick={() => setActiveFilter('my-open')}
          >
            My Open Issues
          </Button>
          <Button 
            type={activeFilter === 'done' ? 'primary' : 'default'}
            onClick={() => setActiveFilter('done')}
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
