import React, { useState, useEffect, useRef } from 'react';
import { Input, Card, List, Tag, Avatar, Spin, Empty, Button } from 'antd';
import { Search, Sparkles, Filter, Clock } from 'lucide-react';
import styled from 'styled-components';
import { useStore } from '../../store/useStore';
import axios from 'axios';
import { ENV } from '../../config/env';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
`;

const SearchResults = styled(Card)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  
  &:hover {
    background: #f5f5f5;
  }
`;

interface SearchResult {
  id: string;
  type: 'issue' | 'user' | 'project';
  title: string;
  subtitle: string;
  key?: string;
  avatar?: string;
  priority?: string;
  status?: string;
}

export const AdvancedSearchAI: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { issues, currentProject } = useStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const debounce = setTimeout(() => {
        performSearch(query);
        getAISuggestions(query);
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setResults([]);
      setSuggestions([]);
      setShowResults(false);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Local search first
      const localResults = searchLocal(searchQuery);
      
      // AI-powered search
      const aiResults = await searchWithAI(searchQuery);
      
      setResults([...localResults, ...aiResults]);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchLocal = (searchQuery: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    // Search issues
    issues.forEach(issue => {
      if (
        issue.summary?.toLowerCase().includes(query) ||
        issue.key?.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query)
      ) {
        results.push({
          id: issue.id,
          type: 'issue',
          title: `${issue.key} - ${issue.summary}`,
          subtitle: issue.description || '',
          key: issue.key,
          priority: issue.priority,
          status: issue.status
        });
      }
    });

    return results.slice(0, 10);
  };

  const searchWithAI = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      const response = await axios.post(`${ENV.API_URL}/search/ai`, {
        query: searchQuery,
        projectId: currentProject?.id,
        context: 'issues'
      });
      return response.data.results || [];
    } catch (error) {
      console.error('AI search error:', error);
      return [];
    }
  };

  const getAISuggestions = async (searchQuery: string) => {
    try {
      const response = await axios.post(`${ENV.API_URL}/search/suggestions`, {
        query: searchQuery,
        projectId: currentProject?.id
      });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('AI suggestions error:', error);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'issue') {
      window.location.href = `/issue/${result.key}`;
    }
    setShowResults(false);
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'issue':
        return <Tag color="blue">{result.key}</Tag>;
      case 'user':
        return <Avatar size="small">{result.title[0]}</Avatar>;
      case 'project':
        return <Avatar size="small" shape="square">{result.title[0]}</Avatar>;
      default:
        return null;
    }
  };

  return (
    <SearchContainer ref={searchRef}>
      <Input
        size="large"
        placeholder="Search issues, users, projects... (AI-powered)"
        prefix={<Search size={16} />}
        suffix={<Sparkles size={16} style={{ color: '#0EA5E9' }} />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 2 && setShowResults(true)}
      />

      {showResults && (
        <SearchResults>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin tip="AI is searching..." />
            </div>
          ) : (
            <>
              {suggestions.length > 0 && (
                <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    <Sparkles size={12} /> AI Suggestions:
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <SuggestionItem
                      key={index}
                      onClick={() => setQuery(suggestion)}
                    >
                      <Tag color="purple" size="small">{suggestion}</Tag>
                    </SuggestionItem>
                  ))}
                </div>
              )}

              {results.length > 0 ? (
                <List
                  dataSource={results}
                  renderItem={(result) => (
                    <List.Item
                      style={{ cursor: 'pointer', padding: '8px 16px' }}
                      onClick={() => handleResultClick(result)}
                    >
                      <List.Item.Meta
                        avatar={getResultIcon(result)}
                        title={result.title}
                        description={result.subtitle}
                      />
                      {result.status && (
                        <Tag color="green" size="small">{result.status}</Tag>
                      )}
                    </List.Item>
                  )}
                />
              ) : query.length > 2 && !loading ? (
                <Empty
                  description="No results found"
                  style={{ padding: 20 }}
                />
              ) : null}
            </>
          )}
        </SearchResults>
      )}
    </SearchContainer>
  );
};