import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Input, List, Tag, Typography } from 'antd';
import { 
  SearchOutlined, 
  FileOutlined, 
  FolderOutlined, 
  PlusOutlined,
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { Text } = Typography;

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords: string[];
}

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Define all available commands
  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-board',
      title: 'Go to Board',
      description: 'View Kanban board',
      icon: <DashboardOutlined />,
      category: 'Navigation',
      action: () => navigate('/board'),
      keywords: ['board', 'kanban', 'navigate']
    },
    {
      id: 'nav-backlog',
      title: 'Go to Backlog',
      description: 'View backlog and sprints',
      icon: <FileOutlined />,
      category: 'Navigation',
      action: () => navigate('/backlog'),
      keywords: ['backlog', 'sprint', 'navigate']
    },
    {
      id: 'nav-roadmap',
      title: 'Go to Roadmap',
      description: 'View project roadmap',
      icon: <FolderOutlined />,
      category: 'Navigation',
      action: () => navigate('/roadmap'),
      keywords: ['roadmap', 'timeline', 'navigate']
    },
    {
      id: 'nav-reports',
      title: 'Go to Reports',
      description: 'View analytics and reports',
      icon: <DashboardOutlined />,
      category: 'Navigation',
      action: () => navigate('/reports'),
      keywords: ['reports', 'analytics', 'charts', 'navigate']
    },
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'View project dashboard',
      icon: <DashboardOutlined />,
      category: 'Navigation',
      action: () => navigate('/dashboard'),
      keywords: ['dashboard', 'home', 'navigate']
    },
    {
      id: 'nav-filters',
      title: 'Go to Filters',
      description: 'Manage saved filters',
      icon: <FilterOutlined />,
      category: 'Navigation',
      action: () => navigate('/filters'),
      keywords: ['filters', 'search', 'navigate']
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects',
      description: 'View all projects',
      icon: <FolderOutlined />,
      category: 'Navigation',
      action: () => navigate('/projects'),
      keywords: ['projects', 'portfolio', 'navigate']
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      description: 'Project settings',
      icon: <SettingOutlined />,
      category: 'Navigation',
      action: () => navigate('/settings'),
      keywords: ['settings', 'configuration', 'navigate']
    },
    // Actions
    {
      id: 'action-create-issue',
      title: 'Create Issue',
      description: 'Create a new issue',
      icon: <PlusOutlined />,
      category: 'Actions',
      action: () => {
        setOpen(false);
        // Trigger create issue modal
        window.dispatchEvent(new CustomEvent('openCreateIssue'));
      },
      keywords: ['create', 'new', 'issue', 'task', 'bug', 'story']
    },
    {
      id: 'action-create-sprint',
      title: 'Create Sprint',
      description: 'Start a new sprint',
      icon: <PlusOutlined />,
      category: 'Actions',
      action: () => {
        setOpen(false);
        window.dispatchEvent(new CustomEvent('openCreateSprint'));
      },
      keywords: ['create', 'new', 'sprint']
    },
    {
      id: 'action-create-epic',
      title: 'Create Epic',
      description: 'Create a new epic',
      icon: <PlusOutlined />,
      category: 'Actions',
      action: () => {
        setOpen(false);
        window.dispatchEvent(new CustomEvent('openCreateEpic'));
      },
      keywords: ['create', 'new', 'epic']
    },
    // Search
    {
      id: 'search-issues',
      title: 'Search Issues',
      description: 'Search all issues',
      icon: <SearchOutlined />,
      category: 'Search',
      action: () => navigate('/search'),
      keywords: ['search', 'find', 'issues']
    },
    // User
    {
      id: 'user-profile',
      title: 'My Profile',
      description: 'View your profile',
      icon: <UserOutlined />,
      category: 'User',
      action: () => navigate('/profile'),
      keywords: ['profile', 'user', 'account']
    }
  ];

  // Filter commands based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredCommands(commands);
      setSelectedIndex(0);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = commands.filter(cmd => {
      return (
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.keywords.some(k => k.includes(searchLower))
      );
    });

    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [search]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) return;

      // Escape to close
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
      }

      // Enter to execute
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex]);

  const executeCommand = (command: Command) => {
    command.action();
    setOpen(false);
    setSearch('');
  };

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <StyledModal
      open={open}
      onCancel={() => {
        setOpen(false);
        setSearch('');
      }}
      footer={null}
      closable={false}
      width={600}
      centered
    >
      <SearchInput
        prefix={<SearchOutlined />}
        placeholder="Type a command or search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        size="large"
      />

      <CommandList>
        {Object.entries(groupedCommands).map(([category, cmds]) => (
          <div key={category}>
            <CategoryTitle>{category}</CategoryTitle>
            {cmds.map((cmd, index) => {
              const globalIndex = filteredCommands.indexOf(cmd);
              return (
                <CommandItem
                  key={cmd.id}
                  $selected={globalIndex === selectedIndex}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                >
                  <CommandIcon>{cmd.icon}</CommandIcon>
                  <CommandContent>
                    <CommandTitle>{cmd.title}</CommandTitle>
                    {cmd.description && (
                      <CommandDescription>{cmd.description}</CommandDescription>
                    )}
                  </CommandContent>
                </CommandItem>
              );
            })}
          </div>
        ))}

        {filteredCommands.length === 0 && (
          <EmptyState>
            <Text type="secondary">No commands found</Text>
          </EmptyState>
        )}
      </CommandList>

      <Footer>
        <Hint>
          <Tag>↑↓</Tag> Navigate
          <Tag>↵</Tag> Execute
          <Tag>Esc</Tag> Close
        </Hint>
      </Footer>
    </StyledModal>
  );
};

const StyledModal = styled(Modal)`
  .ant-modal-content {
    padding: 0;
    border-radius: 12px;
    overflow: hidden;
  }

  .ant-modal-body {
    padding: 0;
  }
`;

const SearchInput = styled(Input)`
  border: none;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 0;
  padding: 16px 20px;
  font-size: 16px;

  &:focus {
    box-shadow: none;
  }
`;

const CommandList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
`;

const CategoryTitle = styled.div`
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CommandItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  background: ${props => props.$selected ? '#f5f5f5' : 'transparent'};
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }
`;

const CommandIcon = styled.div`
  font-size: 18px;
  color: #595959;
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

const CommandContent = styled.div`
  flex: 1;
`;

const CommandTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #262626;
`;

const CommandDescription = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
`;

const Footer = styled.div`
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
`;

const Hint = styled.div`
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8c8c8c;

  .ant-tag {
    margin: 0;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

export default CommandPalette;
