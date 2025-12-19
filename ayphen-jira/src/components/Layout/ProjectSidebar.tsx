import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Layout, Menu, Button, Modal, Form, Input, Select, message, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  Map,
  LayoutGrid,
  ListTodo,
  BarChart3,
  FileText,
  Settings,
  Bot,
  Layers,
  Plus,
  Bug,
  BookOpen,
  Users,
  Filter,
  Search,
  Calendar,
  Target,
  MessageCircle,
  Clock,
  Zap,
  Shield,
  Tag,
  GitBranch,
  Box,
} from 'lucide-react';
import { colors } from '../../theme/colors';
import { useStore } from '../../store/useStore';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  background: #FFFFFF;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  height: calc(100vh - 56px);
  overflow-y: auto;
  position: sticky;
  top: 56px;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.04);

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }
  
  @media (max-width: 768px) {
    position: fixed;
    top: 72px;
    left: 0;
    height: calc(100vh - 72px);
    z-index: 999;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.15);
    
    &.ant-layout-sider-collapsed {
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      overflow: hidden;
    }
  }
`;

const ProjectHeader = styled.div`
  padding: 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #FAFAFA;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ProjectInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const ProjectAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, ${colors.primary[400]}, ${colors.primary[500]});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
`;

const ProjectDetails = styled.div`
  flex: 1;
`;

const ProjectName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${colors.text.primary};
`;

const ProjectType = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  text-transform: capitalize;
`;

const StyledSettingsIcon = styled(Settings)`
  width: 18px;
  height: 18px;
  color: ${colors.text.secondary};
  cursor: pointer;

  &:hover {
    color: ${colors.text.primary};
  }
`;

const StyledMenu = styled(Menu)`
  background: transparent;
  border: none;

  .ant-menu-item {
    margin: 6px 12px;
    border-radius: 8px;
    height: 40px;
    line-height: 40px;
    padding-left: 16px !important;
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(6, 182, 212, 0.1));
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.15);
    }

    &.ant-menu-item-selected {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(6, 182, 212, 0.15));
      color: #0EA5E9;
      font-weight: 600;
      border-left: 3px solid #0EA5E9;
    }
  }

  .ant-menu-submenu {
    .ant-menu-submenu-title {
      margin: 6px 12px;
      border-radius: 8px;
      height: 40px;
      line-height: 40px;
      padding-left: 16px !important;
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(6, 182, 212, 0.1));
        transform: translateX(4px);
      }
    }
    
    .ant-menu-sub {
      background: rgba(224, 242, 254, 0.8);
      
      .ant-menu-item {
        margin: 2px 8px;
        padding-left: 32px !important;
      }
    }
  }

  .ant-menu-item-icon {
    font-size: 16px;
    color: #0EA5E9;
  }
`;

const AddButton = styled(Button)`
  margin: 16px;
  width: calc(100% - 32px);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  border: 2px dashed rgba(14, 165, 233, 0.3);
  background: rgba(14, 165, 233, 0.05);
  color: #0EA5E9;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #0EA5E9;
    background: rgba(14, 165, 233, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
  }
`;

export const ProjectSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject, sidebarCollapsed, setSidebarCollapsed } = useStore();
  const [selectedKey, setSelectedKey] = useState('board');
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [customItems, setCustomItems] = useState<any[]>([]);

  useEffect(() => {
    const path = location.pathname.split('/')[1];
    if (path) {
      setSelectedKey(path);
    }
  }, [location]);

  const menuItems: MenuProps['items'] = [
    {
      key: 'roadmap',
      icon: <Map size={16} />,
      label: 'Roadmap',
      onClick: () => navigate('/roadmap'),
    },
    {
      key: 'board',
      icon: <LayoutGrid size={16} />,
      label: 'Board',
      onClick: () => navigate('/board'),
    },
    // Only show Backlog and Sprint Planning for Scrum projects
    ...(currentProject?.type !== 'kanban' ? [
      {
        key: 'backlog',
        icon: <ListTodo size={16} />,
        label: 'Backlog',
        onClick: () => navigate('/backlog'),
      },
      {
        key: 'sprint-planning',
        icon: <ListTodo size={16} />,
        label: 'Sprint Planning',
        onClick: () => navigate('/sprint-planning'),
      }
    ] : []),
    {
      key: 'epics',
      icon: <Layers size={16} />,
      label: 'Epics',
      onClick: () => navigate('/epics'),
    },
    {
      key: 'stories',
      icon: <BookOpen size={16} />,
      label: 'Stories',
      onClick: () => navigate('/stories'),
    },
    {
      key: 'bugs',
      icon: <Bug size={16} />,
      label: 'Bugs',
      onClick: () => navigate('/bugs'),
    },
    {
      key: 'reports',
      icon: <BarChart3 size={16} />,
      label: 'Reports',
      onClick: () => navigate('/reports'),
    },
    {
      type: 'divider',
    },
    {
      key: 'filters',
      icon: <Filter size={16} />,
      label: 'Filters',
      onClick: () => navigate('/filters'),
    },
    {
      key: 'search',
      icon: <Search size={16} />,
      label: 'Search',
      onClick: () => navigate('/search'),
    },
    {
      key: 'people',
      icon: <Users size={16} />,
      label: 'People',
      onClick: () => navigate('/people'),
    },
    {
      key: 'calendar',
      icon: <Calendar size={16} />,
      label: 'Calendar',
      onClick: () => navigate('/calendar'),
    },
    {
      type: 'divider',
    },
    {
      key: 'team-chat',
      icon: <MessageCircle size={16} />,
      label: 'Team Chat',
      onClick: () => navigate('/team-chat'),
    },
    {
      key: 'time-tracking',
      icon: <Clock size={16} />,
      label: 'Time Tracking',
      onClick: () => navigate('/time-tracking'),
    },
    {
      type: 'divider',
    },
    {
      key: 'ai-test-automation',
      icon: <Bot size={16} />,
      label: 'AI Test Automation',
      onClick: () => navigate('/ai-test-automation'),
      children: [
        { key: 'ai-requirements', label: 'Requirements', onClick: () => navigate('/ai-test-automation/requirements') },
        { key: 'ai-stories', label: 'Generated Stories', onClick: () => navigate('/ai-test-automation/stories') },
        { key: 'ai-test-cases', label: 'Test Cases', onClick: () => navigate('/ai-test-automation/test-cases') },
        { key: 'ai-suites', label: 'Test Suites', onClick: () => navigate('/ai-test-automation/suites') },
        { key: 'ai-execution', label: 'Test Execution', onClick: () => navigate('/ai-test-automation/execution') },
        { key: 'ai-reports', label: 'Reports & Analytics', onClick: () => navigate('/ai-test-automation/reports') },
        { key: 'ai-insights', label: 'AI Insights', onClick: () => navigate('/ai-test-automation/ai-insights') },
        { key: 'ai-sync', label: 'Sync Status', onClick: () => navigate('/ai-test-automation/sync') },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'manual-testing',
      icon: <FileText size={16} />,
      label: 'Manual Testing',
      children: [
        { key: 'test-cases', label: 'Test Cases', onClick: () => navigate('/test-cases') },
        { key: 'test-suites', label: 'Test Suites', onClick: () => navigate('/test-suites') },
        { key: 'test-runs', label: 'Test Runs', onClick: () => navigate('/test-runs') },
      ],
    },
    {
      key: 'automation',
      icon: <Zap size={16} />,
      label: 'Automation',
      onClick: () => navigate('/automation'),
    },
    {
      key: 'hierarchy',
      icon: <Target size={16} />,
      label: 'Hierarchy',
      onClick: () => navigate('/hierarchy'),
    },
    {
      type: 'divider',
    },
    {
      key: 'project-settings',
      icon: <Settings size={16} />,
      label: 'Project Settings',
      children: [
        { key: 'settings-details', label: 'Details', icon: <FileText size={14} />, onClick: () => navigate('/settings/details') },
        { key: 'settings-people', label: 'People', icon: <Users size={14} />, onClick: () => navigate('/settings/people') },
        { key: 'settings-components', label: 'Components', icon: <Box size={14} />, onClick: () => navigate('/settings/components-settings') },
        { key: 'settings-versions', label: 'Versions', icon: <Tag size={14} />, onClick: () => navigate('/settings/versions') },
        { key: 'settings-types', label: 'Issue Types', icon: <Bug size={14} />, onClick: () => navigate('/settings/issue-types') },
        { key: 'settings-workflows', label: 'Workflows', icon: <GitBranch size={14} />, onClick: () => navigate('/settings/workflows') },
        { key: 'settings-fields', label: 'Fields', icon: <ListTodo size={14} />, onClick: () => navigate('/settings/fields') },
        { key: 'settings-permissions', label: 'Permissions', icon: <Shield size={14} />, onClick: () => navigate('/settings/permissions') },
        { key: 'settings-automation', label: 'Automation', icon: <Zap size={14} />, onClick: () => navigate('/settings/automation') },
      ],
    },
    {
      type: 'divider',
    },
    ...customItems.map(item => ({
      key: item.id,
      icon: <span style={{ fontSize: '16px' }}>{item.icon}</span>,
      label: item.name,
      onClick: () => navigate(item.path),
    })),
  ];

  const projectSettingsMenu = {
    onClick: ({ key }: any) => {
      if (key === 'details') navigate('/settings/details');
      if (key === 'people') navigate('/settings/people');
      if (key === 'components-settings') navigate('/settings/components-settings');
      if (key === 'versions') navigate('/settings/versions');
      if (key === 'issue-types') navigate('/settings/issue-types');
      if (key === 'workflows') navigate('/settings/workflows');
      if (key === 'fields') navigate('/settings/fields');
      if (key === 'permissions') navigate('/settings/permissions');
      if (key === 'automation') navigate('/settings/automation');
    },
    items: [
      { key: 'details', label: '📝 Details' },
      { key: 'people', label: '👥 People' },
      { key: 'components-settings', label: '🧩 Components' },
      { key: 'versions', label: '🏷️ Versions' },
      { type: 'divider' as const },
      { key: 'issue-types', label: '🎫 Issue Types' },
      { key: 'workflows', label: '🔄 Workflows' },
      { key: 'fields', label: '📊 Fields' },
      { type: 'divider' as const },
      { key: 'permissions', label: '🔒 Permissions' },
      { key: 'automation', label: '⚡ Automation' },
    ],
  };

  if (!currentProject) {
    return null;
  }

  return (
    <StyledSider width={260} collapsed={sidebarCollapsed} collapsedWidth={0}>
      <ProjectHeader>
        <ProjectInfo>
          <ProjectAvatar>{currentProject.key?.substring(0, 3)}</ProjectAvatar>
          <ProjectDetails>
            <ProjectName>{currentProject.name}</ProjectName>
            <ProjectType>{currentProject.type} project</ProjectType>
          </ProjectDetails>
        </ProjectInfo>
      </ProjectHeader>

      <StyledMenu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={['reports', 'issues', 'ai-test-automation']}
        items={menuItems}
        onClick={({ key }) => {
          setSelectedKey(key);
          if (window.innerWidth < 1024) {
            setSidebarCollapsed(true);
          }

          // Find and execute the onClick handler for the clicked item
          const findAndExecuteHandler = (items: any[], targetKey: string): boolean => {
            for (const item of items) {
              if (item.key === targetKey && item.onClick) {
                item.onClick();
                return true;
              }
              if (item.children) {
                if (findAndExecuteHandler(item.children, targetKey)) {
                  return true;
                }
              }
            }
            return false;
          };

          findAndExecuteHandler(menuItems, key);
        }}
      />

      <AddButton
        type="dashed"
        icon={<Plus size={16} />}
        onClick={() => setAddItemModalVisible(true)}
      >
        Add item
      </AddButton>

      <Modal
        title="Add Custom Shortcut"
        open={addItemModalVisible}
        onCancel={() => setAddItemModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={(values) => {
            const newItem = {
              id: `custom-${Date.now()}`,
              ...values,
            };
            setCustomItems([...customItems, newItem]);
            message.success(`Shortcut "${values.name}" added successfully`);
            setAddItemModalVisible(false);
          }}
        >
          <Form.Item
            label="Shortcut Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., My Dashboard, Quick Links" />
          </Form.Item>
          <Form.Item
            label="Link To"
            name="path"
            rules={[{ required: true, message: 'Please enter a path' }]}
          >
            <Select placeholder="Select a page">
              <Select.Option value="/board">Board</Select.Option>
              <Select.Option value="/backlog">Backlog</Select.Option>
              <Select.Option value="/roadmap">Roadmap</Select.Option>
              <Select.Option value="/reports">Reports</Select.Option>
              <Select.Option value="/dashboard">Dashboard</Select.Option>
              <Select.Option value="/filters">Filters</Select.Option>
              <Select.Option value="/projects">Projects</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Icon"
            name="icon"
            initialValue="⭐"
          >
            <Input placeholder="Enter emoji or icon" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add Shortcut
          </Button>
        </Form>
      </Modal>
    </StyledSider >
  );
};
