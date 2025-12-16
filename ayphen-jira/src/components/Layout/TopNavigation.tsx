import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Layout,
  Dropdown,
  Input,
  Avatar,
  Button,
  Select,
} from 'antd';
import {
  Search,
  HelpCircle,
  Settings,
  Plus,
  ChevronDown,
  Briefcase,
  FolderKanban,
  Filter,
  LayoutDashboard,
  Users,
  Grid3x3,
  Moon,
  Sun,
  Bot,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useStore } from '../../store/useStore';
import { colors } from '../../theme/colors';
import { CreateIssueModal } from '../CreateIssueModal';
import { useAuth } from '../../contexts/AuthContext';
import { TeamNotificationPanel } from '../TeamNotifications/TeamNotificationPanel';
import { NotificationSystem } from '../Notifications/NotificationSystem';

const { Header } = Layout;

const StyledHeader = styled(Header)`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
  position: fixed;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 1000;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  width: calc(100% - 32px);
  transition: all 0.3s ease;
  gap: 16px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${colors.navigation.text};
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.02);
  }
`;

const NavMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const NavItem = styled.div`
  color: #1F2937;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  height: 36px;
  white-space: nowrap;

  &:hover {
    background: rgba(236, 72, 153, 0.1);
    color: #0EA5E9;
    box-shadow: 0 0 12px rgba(236, 72, 153, 0.2);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`;

const SearchInput = styled(Input)`
  width: 240px;
  min-width: 180px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: ${colors.navigation.text};
  border-radius: 8px;
  transition: all 0.2s ease;

  &::placeholder {
    color: ${colors.text.secondary};
  }

  &:hover,
  &:focus,
  &:focus-within {
    background: rgba(255, 255, 255, 0.9);
    border-color: ${colors.primary[400]};
    width: 320px;
  }

  .ant-input {
    background: transparent;
    color: ${colors.navigation.text};
  }
  
  .ant-input-prefix {
    color: ${colors.text.secondary};
  }
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.text.secondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: ${colors.primary[500]};
    transform: translateY(-1px);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CreateButton = styled(Button)`
  background: ${colors.primary[600]};
  border: none;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);

  &:hover {
    background: ${colors.primary[700]} !important;
    color: white !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);
  }
`;

const ProjectSelector = styled(Select)`
  min-width: 220px;
  
  .ant-select-selector {
    background: rgba(255, 255, 255, 0.5) !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    color: ${colors.text.primary} !important;
    font-weight: 600;
    border-radius: 8px !important;
  }

  .ant-select-selection-item {
    color: ${colors.text.primary} !important;
  }

  .ant-select-arrow {
    color: ${colors.text.secondary};
  }

  &:hover .ant-select-selector {
    background: rgba(255, 255, 255, 0.8) !important;
    border-color: ${colors.primary[200]} !important;
  }
`;

export const TopNavigation: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, projects, issues = [], currentProject, setCurrentProject } = useStore();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [searchValue, setSearchValue] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [teamNotifVisible, setTeamNotifVisible] = useState(false);

  const handleProjectChange = (value: unknown) => {
    const projectId = value as string;
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      localStorage.setItem('lastProjectId', projectId);
      // Navigate to board if not already there
      if (!window.location.pathname.includes('/board')) {
        navigate('/board');
      }
    }
  };

  // Navigation handlers
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const yourWorkMenu = {
    onClick: ({ key }: any) => {
      if (key === 'worked-on') handleNavigation('/board?filter=worked-on');
      if (key === 'viewed') handleNavigation('/board?filter=viewed');
      if (key === 'assigned') handleNavigation('/board?filter=assigned');
      if (key === 'starred') handleNavigation('/projects?filter=starred');
      if (key === 'recent-projects') handleNavigation('/projects?filter=recent');
      if (key === 'recent-boards') handleNavigation('/board?filter=recent');
      if (key === 'recent-filters') handleNavigation('/filters?filter=recent');
      if (key === 'view-all-projects') handleNavigation('/projects');
    },
    items: [
      { key: 'worked-on', label: `💼 Worked on (${issues.filter(i => i.assignee?.id === currentUser?.id).length})` },
      { key: 'viewed', label: '👁️ Viewed recently' },
      { key: 'assigned', label: `📌 Assigned to me (${issues.filter(i => i.assignee?.id === currentUser?.id).length})` },
      { key: 'starred', label: `⭐ Starred (${projects.filter(p => p.isStarred).length})` },
      { type: 'divider' as const },
      { key: 'recent-projects', label: '📁 Recent projects' },
      { key: 'recent-boards', label: '📊 Recent boards' },
      { key: 'recent-filters', label: '🔍 Recent filters' },
      { type: 'divider' as const },
      { key: 'view-all-projects', label: '📋 View all projects' },
    ],
  };

  const projectsMenu = {
    onClick: ({ key }: any) => {
      if (key === 'view-all') handleNavigation('/projects');
      if (key === 'recent') handleNavigation('/projects?filter=recent');
      if (key === 'categories') handleNavigation('/projects/categories');
      if (key === 'create') {
        handleNavigation('/projects/create');
      }
      if (key.startsWith('project-')) {
        const projectId = key.replace('project-', '');
        handleNavigation(`/board?project=${projectId}`);
      }
    },
    items: [
      {
        key: 'create',
        label: '➕ Create project',
        style: {
          color: colors.primary[600],
          fontWeight: 700,
          background: 'rgba(24, 144, 255, 0.1)',
          borderRadius: '4px'
        }
      },
      { type: 'divider' as const },
      { key: 'view-all', label: `📁 View all projects (${projects.length})` },
      { key: 'recent', label: '🕐 Recent projects' },
      { key: 'categories', label: '📂 Project categories' },
      { type: 'divider' as const },
      ...projects.slice(0, 5).map(p => ({
        key: `project-${p.id}`,
        label: `${p.key} - ${p.name}`,
        icon: p.isStarred ? '⭐' : '📂',
      })),
    ],
  };

  const filtersMenu = {
    onClick: ({ key }: any) => {
      console.log('Filter menu clicked:', key);
      if (key === 'all-filters') handleNavigation('/filters');
      if (key === 'recent') handleNavigation('/filters?filter=recent');
      if (key === 'my-open-issues') handleNavigation('/filters?filter=my-open');
      if (key === 'reported-by-me') handleNavigation('/filters?filter=reported');
      if (key === 'all-issues') handleNavigation('/filters?filter=all');
      if (key === 'open-issues') handleNavigation('/filters?filter=open');
      if (key === 'done-issues') handleNavigation('/filters?filter=done');
      if (key === 'viewed-recently') handleNavigation('/filters?filter=viewed');
      if (key === 'created-recently') handleNavigation('/filters?filter=created');
      if (key === 'resolved-recently') handleNavigation('/filters?filter=resolved');
      if (key === 'updated-recently') handleNavigation('/filters?filter=updated');
      if (key === 'advanced-search') handleNavigation('/filters/advanced');
      if (key === 'create-filter') handleNavigation('/filters/create');
    },
    items: [
      { key: 'all-filters', label: '📋 View all filters' },
      { key: 'recent', label: '🕐 Recent filters' },
      { type: 'divider' as const },
      {
        key: 'my-open-issues',
        label: `My open issues (${issues.filter(i => i.assignee?.id === currentUser?.id && i.status !== 'done').length})`
      },
      {
        key: 'reported-by-me',
        label: `Reported by me (${issues.filter(i => i.reporter?.id === currentUser?.id).length})`
      },
      { key: 'all-issues', label: `All issues (${issues.length})` },
      {
        key: 'open-issues',
        label: `Open issues (${issues.filter(i => i.status !== 'done').length})`
      },
      {
        key: 'done-issues',
        label: `Done issues (${issues.filter(i => i.status === 'done').length})`
      },
      { type: 'divider' as const },
      { key: 'viewed-recently', label: '👁️ Viewed recently' },
      { key: 'created-recently', label: '✨ Created recently' },
      { key: 'resolved-recently', label: '✅ Resolved recently' },
      { key: 'updated-recently', label: '🔄 Updated recently' },
      { type: 'divider' as const },
      { key: 'advanced-search', label: '🔍 Advanced issue search' },
      { key: 'create-filter', label: '➕ Create filter', style: { color: colors.primary[600], fontWeight: 600 } },
    ],
  };

  const dashboardsMenu = {
    onClick: ({ key }: any) => {
      if (key === 'view-all') handleNavigation('/dashboard');
      if (key === 'recent') handleNavigation('/dashboard?filter=recent');
      if (key === 'my') handleNavigation('/dashboard?filter=my');
      if (key === 'starred') handleNavigation('/dashboard?filter=starred');
      if (key === 'system') handleNavigation('/dashboard?filter=system');
      if (key === 'create') handleNavigation('/dashboard/create');
    },
    items: [
      { key: 'view-all', label: 'View all dashboards' },
      { key: 'recent', label: 'Recent dashboards' },
      { key: 'my', label: 'My dashboards' },
      { key: 'starred', label: 'Starred dashboards' },
      { key: 'system', label: 'System dashboards' },
      { type: 'divider' as const },
      { key: 'create', label: '+ Create dashboard', style: { color: colors.primary[600] } },
    ],
  };

  const peopleMenu = {
    onClick: ({ key }: any) => {
      if (key === 'view-all') handleNavigation('/people');
      if (key === 'directory') handleNavigation('/people/directory');
      if (key === 'teams') handleNavigation('/people/teams');
      if (key === 'profile') handleNavigation('/profile');
    },
    items: [
      { key: 'search', label: '🔍 Search people', disabled: true },
      { key: 'view-all', label: '👥 View all people' },
      { key: 'directory', label: '📋 Team directory' },
      { type: 'divider' as const },
      { key: 'profile', label: `👤 ${currentUser?.name} (You)` },
      { type: 'divider' as const },
      { key: 'teams', label: '🏢 Teams' },
    ],
  };

  const appsMenu = {
    onClick: ({ key }: any) => {
      if (key === 'explore') handleNavigation('/apps/explore');
      if (key === 'manage') handleNavigation('/apps/manage');
      if (key === 'installed') handleNavigation('/apps/installed');
      if (key === 'requests') handleNavigation('/apps/requests');
      if (key === 'marketplace') handleNavigation('/apps/marketplace');
    },
    items: [
      { key: 'explore', label: '🔍 Explore apps' },
      { key: 'manage', label: '⚙️ Manage apps' },
      { type: 'divider' as const },
      { key: 'installed', label: '📦 Installed apps' },
      { type: 'divider' as const },
      { key: 'requests', label: '📋 App requests' },
      { key: 'marketplace', label: '🛒 Marketplace' },
    ],
  };

  const helpMenu = {
    onClick: ({ key }: any) => {
      if (key === 'keyboard-shortcuts') {
        alert('Keyboard Shortcuts:\n\n' +
          'c - Create issue\n' +
          '/ - Search\n' +
          'g + b - Go to board\n' +
          'g + d - Go to dashboard\n' +
          'g + p - Go to projects');
      }
      if (key === 'about') {
        alert('Ayphen Jira v1.0.0\n\nA complete Jira replica with full E2E functionality');
      }
    },
    items: [
      { key: 'help-center', label: '❓ Help center' },
      { key: 'keyboard-shortcuts', label: '⌨️ Keyboard shortcuts' },
      { key: 'documentation', label: '📚 Documentation' },
      { type: 'divider' as const },
      { key: 'about', label: 'ℹ️ About Ayphen Jira' },
    ],
  };

  const aiMenu = {
    onClick: ({ key }: any) => {
      if (key === 'features') handleNavigation('/ai-features');
      if (key === 'voice') {
        // Trigger voice command modal via keyboard shortcut
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
        window.dispatchEvent(event);
      }
      if (key === 'pmbot') handleNavigation('/ai-features?tab=1');
      if (key === 'meeting-scribe') handleNavigation('/ai-features?tab=2');
      if (key === 'settings') handleNavigation('/ai-features?tab=3');
    },
    items: [
      { key: 'features', label: '✨ AI Features Dashboard', style: { fontWeight: 600, color: colors.primary[600] } },
      { type: 'divider' as const },
      { key: 'voice', label: '🎤 Voice Command (Cmd+K)' },
      { key: 'pmbot', label: '🤖 PMBot Dashboard' },
      { key: 'meeting-scribe', label: '📝 Meeting Scribe' },
      { type: 'divider' as const },
      { key: 'settings', label: '⚙️ AI Settings' },
    ],
  };

  const settingsMenu = {
    onClick: ({ key }: any) => {
      if (key === 'system') handleNavigation('/settings/system');
      if (key === 'projects') handleNavigation('/settings/projects');
      if (key === 'issues') handleNavigation('/settings/issues');
      if (key === 'users') handleNavigation('/settings/users');
      if (key === 'apps') handleNavigation('/settings/apps');
      if (key === 'personal') handleNavigation('/settings/profile');
    },
    items: [
      { key: 'personal', label: '👤 Personal settings' },
      { type: 'divider' as const },
      { key: 'system', label: '⚙️ System settings' },
      { key: 'projects', label: '📁 Projects' },
      { key: 'issues', label: '🎫 Issues' },
      { key: 'users', label: '👥 User management' },
      { type: 'divider' as const },
      { key: 'apps', label: '🔌 Apps' },
    ],
  };

  const profileMenu = {
    onClick: ({ key }: any) => {
      if (key === 'profile') handleNavigation(`/people/${currentUser?.id}`);
      if (key === 'settings') handleNavigation('/settings/profile');
      if (key === 'account') handleNavigation('/settings/account');
      if (key === 'logout') {
        logout();
      }
    },
    items: [
      { key: 'profile', label: `${currentUser?.name}`, icon: '👤' },
      { key: 'email', label: currentUser?.email, disabled: true },
      { type: 'divider' as const },
      { key: 'settings', label: '⚙️ Personal settings' },
      { type: 'divider' as const },
      { key: 'language', label: '🌐 Language' },
      { key: 'timezone', label: '🕐 Time zone' },
      { type: 'divider' as const },
      { key: 'account', label: '👤 Manage account' },
      { key: 'logout', label: '🚪 Log out', danger: true },
    ],
  };

  return (
    <>
      <StyledHeader>
        <LeftSection>
          <Logo onClick={() => navigate('/dashboard')}>
            <div style={{
              background: 'white',
              padding: '4px 12px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
              height: '44px'
            }}>
              <img
                src="/ayphen-logo.png"
                alt="Ayphen Technologies"
                style={{ height: '36px', display: 'block' }}
              />
            </div>
          </Logo>

          {projects.length > 0 && (
            <ProjectSelector
              value={currentProject?.id}
              onChange={handleProjectChange}
              placeholder="Select Project"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={projects.map(p => ({
                value: p.id,
                label: `${p.key} - ${p.name}`,
              }))}
            />
          )}

          <NavMenu>
            <Dropdown menu={yourWorkMenu} trigger={['click']}>
              <NavItem>
                <Briefcase />
                <span>Your Work</span>
                <ChevronDown size={14} />
              </NavItem>
            </Dropdown>

            <Dropdown menu={projectsMenu} trigger={['click']}>
              <NavItem>
                <FolderKanban />
                <span>Projects</span>
                <ChevronDown size={14} />
              </NavItem>
            </Dropdown>

            <Dropdown menu={filtersMenu} trigger={['click']}>
              <NavItem>
                <Filter />
                <span>Filters</span>
                <ChevronDown size={14} />
              </NavItem>
            </Dropdown>

            <Dropdown menu={dashboardsMenu} trigger={['click']}>
              <NavItem>
                <LayoutDashboard />
                <span>Dashboards</span>
                <ChevronDown size={14} />
              </NavItem>
            </Dropdown>

            <Dropdown menu={peopleMenu} trigger={['click']}>
              <NavItem>
                <Users />
                <span>Team</span>
                <ChevronDown size={14} />
              </NavItem>
            </Dropdown>

            <Dropdown menu={appsMenu} trigger={['click']}>
              <NavItem>
                <Grid3x3 />
                <span>Apps</span>
                <ChevronDown size={14} />
              </NavItem>
            </Dropdown>

            <Dropdown menu={aiMenu} trigger={['click']}>
              <NavItem style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)', borderLeft: '3px solid #667eea' }}>
                <Bot />
                <span>AI</span>
                <ChevronDown size={14} />
              </NavItem>
            </Dropdown>
          </NavMenu>
        </LeftSection>

        <RightSection>
          <CreateButton type="primary" icon={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
            Create
          </CreateButton>

          <SearchInput
            placeholder="Search (Press '/' to focus)"
            prefix={<Search size={16} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />

          <NotificationSystem />

          <IconButton onClick={toggleTheme} title="Toggle theme">
            {isDark ? <Sun /> : <Moon />}
          </IconButton>

          <IconButton onClick={() => setTeamNotifVisible(true)} title="Team Notifications">
            <Users />
          </IconButton>

          <Dropdown menu={helpMenu} trigger={['click']}>
            <IconButton>
              <HelpCircle />
            </IconButton>
          </Dropdown>

          <Dropdown menu={settingsMenu} trigger={['click']}>
            <IconButton>
              <Settings />
            </IconButton>
          </Dropdown>

          <Dropdown menu={profileMenu} trigger={['click']}>
            <Avatar
              src={currentUser?.avatar}
              style={{ cursor: 'pointer', background: colors.primary[500] }}
            >
              {currentUser?.name?.charAt(0) || 'U'}
            </Avatar>
          </Dropdown>
        </RightSection>
      </StyledHeader>
      <CreateIssueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          // Modal handles navigation to issue page - no reload needed
          setCreateModalOpen(false);
        }}
      />
      <TeamNotificationPanel visible={teamNotifVisible} onClose={() => setTeamNotifVisible(false)} />
    </>
  );
};
