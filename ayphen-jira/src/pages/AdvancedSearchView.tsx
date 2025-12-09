import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Card, Input, Button, Table, Tag, Select, DatePicker, Form,
  Tabs, message, Spin, Empty, Space, Tooltip, Modal
} from 'antd';
import {
  Search, Filter, Save, Download, Code, Eye, Plus, X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import axios from 'axios';
import dayjs from 'dayjs';

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 56px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SearchCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const JQLEditor = styled.div`
  background: #f9f9f9;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  min-height: 60px;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
`;

const ResultsCard = styled(Card)`
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const API_URL = 'http://localhost:8500/api';

interface SearchFilter {
  field: string;
  operator: string;
  value: any;
}

export const AdvancedSearchView: React.FC = () => {
  const { currentProject } = useStore();
  const [mode, setMode] = useState<'basic' | 'jql'>('basic');
  const [jql, setJql] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([
    { field: 'status', operator: '=', value: '' }
  ]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  
  const projectId = currentProject?.id || 'default-project';
  
  const fieldOptions = [
    { label: 'Status', value: 'status' },
    { label: 'Type', value: 'type' },
    { label: 'Priority', value: 'priority' },
    { label: 'Assignee', value: 'assignee' },
    { label: 'Reporter', value: 'reporter' },
    { label: 'Project', value: 'project' },
    { label: 'Sprint', value: 'sprint' },
    { label: 'Text', value: 'text' },
    { label: 'Summary', value: 'summary' },
    { label: 'Labels', value: 'labels' },
    { label: 'Story Points', value: 'storyPoints' },
  ];
  
  const operatorOptions = [
    { label: '=', value: '=' },
    { label: '!=', value: '!=' },
    { label: 'IN', value: 'IN' },
    { label: 'NOT IN', value: 'NOT IN' },
    { label: '~', value: '~' },
    { label: 'IS EMPTY', value: 'IS EMPTY' },
    { label: 'IS NOT EMPTY', value: 'IS NOT EMPTY' },
  ];
  
  const statusOptions = ['todo', 'in-progress', 'in-review', 'done', 'backlog'];
  const typeOptions = ['epic', 'story', 'task', 'bug', 'subtask'];
  const priorityOptions = ['highest', 'high', 'medium', 'low', 'lowest'];
  
  const buildJQLFromFilters = () => {
    const conditions = filters
      .filter(f => f.value)
      .map(f => {
        if (f.operator === 'IS EMPTY') {
          return `${f.field} IS EMPTY`;
        }
        if (f.operator === 'IS NOT EMPTY') {
          return `${f.field} IS NOT EMPTY`;
        }
        if (f.operator === 'IN') {
          const values = Array.isArray(f.value) ? f.value : [f.value];
          return `${f.field} IN (${values.map((v: string) => `"${v}"`).join(', ')})`;
        }
        return `${f.field} ${f.operator} "${f.value}"`;
      });
    
    return conditions.join(' AND ');
  };
  
  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchJQL = mode === 'jql' ? jql : buildJQLFromFilters();
      
      const response = await axios.post(`${API_URL}/search`, {
        jql: searchJQL,
        limit: 100,
      });
      
      setResults(response.data.issues);
      setTotal(response.data.total);
      message.success(`Found ${response.data.total} issues`);
    } catch (error) {
      console.error('Search failed:', error);
      message.error('Search failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuickSearch = async (text: string) => {
    if (!text) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/search/quick?q=${text}`);
      setResults(response.data.issues);
      setTotal(response.data.issues.length);
    } catch (error) {
      message.error('Quick search failed');
    } finally {
      setLoading(false);
    }
  };
  
  const addFilter = () => {
    setFilters([...filters, { field: 'status', operator: '=', value: '' }]);
  };
  
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };
  
  const updateFilter = (index: number, key: keyof SearchFilter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };
  
  const handleSaveFilter = () => {
    setSaveModalVisible(true);
  };
  
  const saveFilter = (name: string) => {
    const filter = {
      id: Date.now().toString(),
      name,
      jql: mode === 'jql' ? jql : buildJQLFromFilters(),
      createdAt: new Date().toISOString(),
    };
    
    const saved = [...savedFilters, filter];
    setSavedFilters(saved);
    localStorage.setItem('savedFilters', JSON.stringify(saved));
    message.success('Filter saved successfully');
    setSaveModalVisible(false);
  };
  
  useEffect(() => {
    const saved = localStorage.getItem('savedFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);
  
  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 120,
      render: (key: string) => <a href={`/issue/${key}`}><strong>{key}</strong></a>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'done' ? 'green' : status === 'in-progress' ? 'blue' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={priority === 'highest' || priority === 'high' ? 'red' : 'default'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 150,
      render: (assignee: any) => assignee?.name || 'Unassigned',
    },
  ];
  
  return (
    <Container>
      <Header>
        <Title>
          <Search size={28} color="#1890ff" />
          Advanced Search
        </Title>
        <Space>
          <Button icon={<Save size={16} />} onClick={handleSaveFilter}>
            Save Filter
          </Button>
          <Button icon={<Download size={16} />}>
            Export
          </Button>
        </Space>
      </Header>
      
      <SearchCard>
        <Tabs
          activeKey={mode}
          onChange={(key) => setMode(key as 'basic' | 'jql')}
          items={[
            {
              key: 'basic',
              label: (
                <span>
                  <Filter size={14} style={{ marginRight: 8 }} />
                  Basic Search
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Input.Search
                      placeholder="Quick search by key or summary..."
                      size="large"
                      onSearch={handleQuickSearch}
                      style={{ marginBottom: 16 }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <h4>Filters</h4>
                    {filters.map((filter, index) => (
                      <FilterRow key={index}>
                        <Select
                          style={{ width: 150 }}
                          value={filter.field}
                          onChange={(value) => updateFilter(index, 'field', value)}
                          options={fieldOptions}
                        />
                        <Select
                          style={{ width: 120 }}
                          value={filter.operator}
                          onChange={(value) => updateFilter(index, 'operator', value)}
                          options={operatorOptions}
                        />
                        {filter.operator !== 'IS EMPTY' && filter.operator !== 'IS NOT EMPTY' && (
                          <>
                            {filter.field === 'status' && (
                              <Select
                                style={{ flex: 1 }}
                                mode={filter.operator === 'IN' ? 'multiple' : undefined}
                                value={filter.value}
                                onChange={(value) => updateFilter(index, 'value', value)}
                                options={statusOptions.map(s => ({ label: s, value: s }))}
                                placeholder="Select status"
                              />
                            )}
                            {filter.field === 'type' && (
                              <Select
                                style={{ flex: 1 }}
                                mode={filter.operator === 'IN' ? 'multiple' : undefined}
                                value={filter.value}
                                onChange={(value) => updateFilter(index, 'value', value)}
                                options={typeOptions.map(t => ({ label: t, value: t }))}
                                placeholder="Select type"
                              />
                            )}
                            {filter.field === 'priority' && (
                              <Select
                                style={{ flex: 1 }}
                                mode={filter.operator === 'IN' ? 'multiple' : undefined}
                                value={filter.value}
                                onChange={(value) => updateFilter(index, 'value', value)}
                                options={priorityOptions.map(p => ({ label: p, value: p }))}
                                placeholder="Select priority"
                              />
                            )}
                            {!['status', 'type', 'priority'].includes(filter.field) && (
                              <Input
                                style={{ flex: 1 }}
                                value={filter.value}
                                onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                placeholder="Enter value"
                              />
                            )}
                          </>
                        )}
                        <Button
                          type="text"
                          danger
                          icon={<X size={16} />}
                          onClick={() => removeFilter(index)}
                        />
                      </FilterRow>
                    ))}
                    <Button icon={<Plus size={16} />} onClick={addFilter}>
                      Add Filter
                    </Button>
                  </div>
                  
                  <Button type="primary" size="large" icon={<Search size={16} />} onClick={handleSearch}>
                    Search
                  </Button>
                </div>
              ),
            },
            {
              key: 'jql',
              label: (
                <span>
                  <Code size={14} style={{ marginRight: 8 }} />
                  JQL
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <h4>JQL Query</h4>
                    <Input.TextArea
                      value={jql}
                      onChange={(e) => setJql(e.target.value)}
                      placeholder='status = "in-progress" AND type = "bug"'
                      rows={4}
                      style={{ fontFamily: 'monospace' }}
                    />
                    <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                      <strong>Examples:</strong>
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        <li>status = "done"</li>
                        <li>type IN ("bug", "task")</li>
                        <li>status = "in-progress" AND priority = "high"</li>
                        <li>assignee IS EMPTY</li>
                        <li>summary ~ "search term"</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Button type="primary" size="large" icon={<Search size={16} />} onClick={handleSearch}>
                    Run Query
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </SearchCard>
      
      {savedFilters.length > 0 && (
        <Card title="Saved Filters" style={{ marginBottom: 24 }}>
          <Space wrap>
            {savedFilters.map(filter => (
              <Button
                key={filter.id}
                onClick={() => {
                  setMode('jql');
                  setJql(filter.jql);
                }}
              >
                {filter.name}
              </Button>
            ))}
          </Space>
        </Card>
      )}
      
      <ResultsCard
        title={`Search Results (${total})`}
        extra={
          <Space>
            <Tooltip title="List View">
              <Button icon={<Eye size={16} />} type="primary" />
            </Tooltip>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="Searching..." />
          </div>
        ) : results.length > 0 ? (
          <Table
            columns={columns}
            dataSource={results}
            rowKey="id"
            pagination={{ pageSize: 50 }}
          />
        ) : (
          <Empty description="No results found. Try adjusting your search criteria." />
        )}
      </ResultsCard>
      
      <Modal
        title="Save Filter"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        footer={null}
      >
        <Form
          onFinish={(values) => saveFilter(values.name)}
          layout="vertical"
        >
          <Form.Item
            label="Filter Name"
            name="name"
            rules={[{ required: true, message: 'Please enter filter name' }]}
          >
            <Input placeholder="My Custom Filter" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};
