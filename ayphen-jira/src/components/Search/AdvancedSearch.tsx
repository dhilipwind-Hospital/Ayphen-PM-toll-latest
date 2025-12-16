import React, { useState } from 'react';
import { Input, Select, DatePicker, Button, Card, List, Avatar, Tag, Tabs, AutoComplete } from 'antd';
import { Search, Filter, Save, History, Code, X } from 'lucide-react';
import styled from 'styled-components';

const SearchContainer = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  min-height: calc(100vh - 64px);
`;

const SearchCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
  border: 1px solid rgba(14, 165, 233, 0.1);
  margin-bottom: 24px;
`;

const JQLEditor = styled.div`
  background: #1F2937;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #F9FAFB;
  border: 1px solid rgba(14, 165, 233, 0.2);
`;

const FilterRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(14, 165, 233, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(14, 165, 233, 0.1);
`;

const ResultCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid rgba(14, 165, 233, 0.1);
  
  &:hover {
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
    transform: translateY(-2px);
    transition: all 0.2s ease;
  }
`;

interface SearchFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface SearchResult {
  id: string;
  key: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  created: string;
  updated: string;
  description: string;
}

export const AdvancedSearch: React.FC = () => {
  const [searchMode, setSearchMode] = useState<'basic' | 'jql'>('basic');
  const [filters, setFilters] = useState<SearchFilter[]>([
    { id: '1', field: 'project', operator: '=', value: '' }
  ]);
  const [jqlQuery, setJqlQuery] = useState('project = "PROJ" AND status != "Done"');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedSearches, setSavedSearches] = useState([
    'My Open Issues',
    'Recently Updated',
    'High Priority Bugs',
    'Overdue Tasks'
  ]);
  const [searchHistory, setSearchHistory] = useState([
    'assignee = currentUser() AND status != "Done"',
    'project = "PROJ" AND priority = "High"',
    'created >= -7d AND type = "Bug"'
  ]);

  const fieldOptions = [
    { value: 'project', label: 'Project' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'reporter', label: 'Reporter' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'type', label: 'Issue Type' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'summary', label: 'Summary' },
    { value: 'description', label: 'Description' }
  ];

  const operatorOptions = [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'greater than' },
    { value: '<', label: 'less than' },
    { value: '>=', label: 'greater or equal' },
    { value: '<=', label: 'less or equal' },
    { value: 'IN', label: 'in' },
    { value: 'NOT IN', label: 'not in' },
    { value: '~', label: 'contains' },
    { value: '!~', label: 'does not contain' }
  ];

  const jqlSuggestions = [
    'project = "PROJ"',
    'assignee = currentUser()',
    'status != "Done"',
    'priority = "High"',
    'created >= -7d',
    'updated >= startOfWeek()',
    'type = "Bug"',
    'reporter in (currentUser())',
    'fixVersion = "1.0"',
    'component = "Frontend"'
  ];

  const mockResults: SearchResult[] = [
    {
      id: '1',
      key: 'PROJ-123',
      title: 'Implement user authentication system',
      type: 'Story',
      status: 'In Progress',
      priority: 'High',
      assignee: 'John Doe',
      reporter: 'Jane Smith',
      created: '2024-01-10',
      updated: '2024-01-15',
      description: 'Create a secure authentication system with JWT tokens...'
    },
    {
      id: '2',
      key: 'PROJ-124',
      title: 'Fix login page responsive design',
      type: 'Bug',
      status: 'To Do',
      priority: 'Medium',
      assignee: 'Mike Johnson',
      reporter: 'Sarah Wilson',
      created: '2024-01-12',
      updated: '2024-01-14',
      description: 'Login page breaks on mobile devices...'
    }
  ];

  const addFilter = () => {
    const newFilter: SearchFilter = {
      id: Date.now().toString(),
      field: 'project',
      operator: '=',
      value: ''
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, field: keyof SearchFilter, value: string) => {
    setFilters(filters.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const executeSearch = () => {
    // Simulate search execution
    setSearchResults(mockResults);

    // Add to search history
    if (searchMode === 'jql' && jqlQuery) {
      setSearchHistory(prev => [jqlQuery, ...prev.filter(q => q !== jqlQuery)].slice(0, 10));
    }
  };

  const generateJQL = () => {
    const jqlParts = filters
      .filter(f => f.field && f.value)
      .map(f => `${f.field} ${f.operator} "${f.value}"`);

    return jqlParts.join(' AND ');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'to do': return '#6B7280';
      case 'in progress': return '#3B82F6';
      case 'done': return '#10B981';
      case 'blocked': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <SearchContainer>
      <SearchCard title="Advanced Search" extra={
        <Button.Group>
          <Button
            type={searchMode === 'basic' ? 'primary' : 'default'}
            onClick={() => setSearchMode('basic')}
            style={{ background: searchMode === 'basic' ? 'linear-gradient(to right, #0284C7, #0EA5E9)' : undefined, color: searchMode === 'basic' ? '#FFFFFF' : undefined }}
          >
            <Filter size={16} /> Basic
          </Button>
          <Button
            type={searchMode === 'jql' ? 'primary' : 'default'}
            onClick={() => setSearchMode('jql')}
            style={{ background: searchMode === 'jql' ? 'linear-gradient(to right, #0284C7, #0EA5E9)' : undefined, color: searchMode === 'jql' ? '#FFFFFF' : undefined }}
          >
            <Code size={16} /> JQL
          </Button>
        </Button.Group>
      }>
        <Tabs activeKey={searchMode} onChange={(key) => setSearchMode(key as 'basic' | 'jql')}>
          <Tabs.TabPane key="basic" tab="Basic Search">
            {filters.map((filter, index) => (
              <FilterRow key={filter.id}>
                <Select
                  value={filter.field}
                  onChange={(value) => updateFilter(filter.id, 'field', value)}
                  options={fieldOptions}
                  style={{ width: 150 }}
                  placeholder="Field"
                />
                <Select
                  value={filter.operator}
                  onChange={(value) => updateFilter(filter.id, 'operator', value)}
                  options={operatorOptions}
                  style={{ width: 120 }}
                />
                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                  placeholder="Value"
                  style={{ flex: 1 }}
                />
                {filters.length > 1 && (
                  <Button
                    type="text"
                    icon={<X size={16} />}
                    onClick={() => removeFilter(filter.id)}
                    style={{ color: '#EF4444' }}
                  />
                )}
              </FilterRow>
            ))}

            <div style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={addFilter} style={{ marginRight: 8 }}>
                Add Filter
              </Button>
              <Button type="link" onClick={() => setJqlQuery(generateJQL())}>
                View as JQL
              </Button>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="jql" tab="JQL Search">
            <AutoComplete
              value={jqlQuery}
              onChange={setJqlQuery}
              options={jqlSuggestions.map(s => ({ value: s }))}
              style={{ width: '100%', marginBottom: 16 }}
            >
              <Input.TextArea
                rows={4}
                placeholder="Enter JQL query..."
                style={{ fontFamily: 'Monaco, Menlo, monospace' }}
              />
            </AutoComplete>

            <div style={{ marginBottom: 16 }}>
              <Button.Group>
                <Button type="link" onClick={() => setJqlQuery('')}>Clear</Button>
                <Button type="link">Syntax Help</Button>
              </Button.Group>
            </div>
          </Tabs.TabPane>
        </Tabs>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<Search size={16} />}
            onClick={executeSearch}
            style={{ background: 'linear-gradient(to right, #0284C7, #0EA5E9)', color: '#FFFFFF' }}
          >
            Search
          </Button>
          <Button icon={<Save size={16} />}>Save Search</Button>
          <Select placeholder="Saved Searches" style={{ width: 200 }}>
            {savedSearches.map(search => (
              <Select.Option key={search} value={search}>{search}</Select.Option>
            ))}
          </Select>
        </div>
      </SearchCard>

      {searchResults.length > 0 && (
        <SearchCard title={`Search Results (${searchResults.length})`}>
          <List
            dataSource={searchResults}
            renderItem={(result) => (
              <ResultCard size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Tag color="blue">{result.key}</Tag>
                      <Tag color={getStatusColor(result.status)}>{result.status}</Tag>
                      <Tag color={getPriorityColor(result.priority)}>{result.priority}</Tag>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{result.type}</span>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0' }}>{result.title}</h4>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
                      {result.description}
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: '12px', color: '#9CA3AF' }}>
                      <span>Assignee: {result.assignee}</span>
                      <span>Reporter: {result.reporter}</span>
                      <span>Updated: {result.updated}</span>
                    </div>
                  </div>
                  <Avatar style={{ backgroundColor: '#0EA5E9' }}>
                    {result.assignee[0]}
                  </Avatar>
                </div>
              </ResultCard>
            )}
          />
        </SearchCard>
      )}

      <SearchCard title="Search History">
        <List
          size="small"
          dataSource={searchHistory}
          renderItem={(query) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  size="small"
                  onClick={() => setJqlQuery(query)}
                  style={{ color: '#0EA5E9' }}
                >
                  Use
                </Button>
              ]}
            >
              <code style={{ fontSize: '12px', color: '#6B7280' }}>{query}</code>
            </List.Item>
          )}
        />
      </SearchCard>
    </SearchContainer>
  );
};