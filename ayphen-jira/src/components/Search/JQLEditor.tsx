import React, { useState } from 'react';
import { Input, Button, message, Tag, Tooltip } from 'antd';
import { Search, BookOpen, History } from 'lucide-react';
import styled from 'styled-components';
import axios from 'axios';

const EditorContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const JQLInput = styled(Input.TextArea)`
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
  border: 2px solid #e8e8e8;
  border-radius: 4px;
  
  &:focus {
    border-color: #1890ff;
  }
`;

const SuggestionBox = styled.div`
  margin-top: 8px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ExampleQueries = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #e6f7ff;
  border-radius: 4px;
`;

const ExampleQuery = styled.div`
  margin-bottom: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background: #bae7ff;
  }
`;

interface JQLEditorProps {
  onSearch?: (jql: string, results: any[]) => void;
}

export const JQLEditor: React.FC<JQLEditorProps> = ({ onSearch }) => {
  const [jql, setJql] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(false);

  const exampleQueries = [
    'assignee = currentUser() AND status = "In Progress"',
    'project = PROJ AND type = Bug AND priority = High',
    'created >= -7d ORDER BY created DESC',
    'status IN (Done, Closed) AND resolved >= startOfMonth()',
    'assignee IN (currentUser(), membersOf("Developers"))',
    'summary ~ "login" OR description ~ "authentication"',
  ];

  const fields = [
    'project', 'type', 'status', 'priority', 'assignee', 'reporter',
    'created', 'updated', 'resolved', 'due', 'summary', 'description',
  ];

  const operators = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'IS', 'IS NOT', '~', '!~'];
  const functions = ['currentUser()', 'now()', 'startOfDay()', 'endOfDay()', 'startOfWeek()', 'endOfWeek()'];

  const handleSearch = async () => {
    if (!jql.trim()) {
      message.warning('Please enter a JQL query');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/search/jql', {
        jql,
        userId: 'current-user-id',
      });

      message.success(`Found ${response.data.issues?.length || 0} issues`);
      if (onSearch) {
        onSearch(jql, response.data.issues || []);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setJql(value);
    
    // Simple autocomplete
    const lastWord = value.split(/\s+/).pop() || '';
    if (lastWord.length > 0) {
      const matches = [...fields, ...operators, ...functions].filter(s =>
        s.toLowerCase().startsWith(lastWord.toLowerCase())
      );
      setSuggestions(matches.slice(0, 10));
    } else {
      setSuggestions([]);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const words = jql.split(/\s+/);
    words[words.length - 1] = suggestion;
    setJql(words.join(' ') + ' ');
    setSuggestions([]);
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <h3>JQL Search</h3>
        <div>
          <Tooltip title="Show examples">
            <Button
              icon={<BookOpen size={16} />}
              onClick={() => setShowExamples(!showExamples)}
              style={{ marginRight: 8 }}
            >
              Examples
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<Search size={16} />}
            onClick={handleSearch}
            loading={loading}
          >
            Search
          </Button>
        </div>
      </EditorHeader>

      <JQLInput
        rows={4}
        value={jql}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Enter JQL query... (e.g., assignee = currentUser() AND status = 'In Progress')"
      />

      {suggestions.length > 0 && (
        <SuggestionBox>
          {suggestions.map((suggestion, index) => (
            <Tag
              key={index}
              color="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => insertSuggestion(suggestion)}
            >
              {suggestion}
            </Tag>
          ))}
        </SuggestionBox>
      )}

      {showExamples && (
        <ExampleQueries>
          <h4>Example Queries:</h4>
          {exampleQueries.map((query, index) => (
            <ExampleQuery key={index} onClick={() => setJql(query)}>
              <code>{query}</code>
            </ExampleQuery>
          ))}
        </ExampleQueries>
      )}
    </EditorContainer>
  );
};
