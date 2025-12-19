import React from 'react';
import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const BreadcrumbContainer = styled.div`
  margin-bottom: 16px;
  
  .ant-breadcrumb {
    font-size: 13px;
  }
  
  .ant-breadcrumb-link {
    color: #5E6C84;
    
    &:hover {
      color: #0EA5E9;
    }
  }
  
  .ant-breadcrumb-separator {
    color: #A5ADBA;
  }
`;

// Route to label mapping
const routeLabels: Record<string, string> = {
    '': 'Home',
    'backlog': 'Backlog',
    'board': 'Board',
    'sprints': 'Sprints',
    'issues': 'Issues',
    'issue': 'Issue',
    'stories': 'Stories',
    'bugs': 'Bugs',
    'epics': 'Epics',
    'roadmap': 'Roadmap',
    'calendar': 'Calendar',
    'reports': 'Reports',
    'settings': 'Settings',
    'people': 'People',
    'filters': 'Filters',
    'dashboards': 'Dashboards',
    'projects': 'Projects',
    'hierarchy': 'Hierarchy',
    'test-suites': 'Test Suites',
    'test-runs': 'Test Runs',
    'test-cases': 'Test Cases',
    'ai-test-automation': 'AI Test Automation',
};

interface BreadcrumbsProps {
    items?: { label: string; path?: string }[];
    showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    items,
    showHome = true
}) => {
    const location = useLocation();

    // Generate breadcrumbs from current path if no items provided
    const generateBreadcrumbs = () => {
        const pathParts = location.pathname.split('/').filter(Boolean);
        const crumbs: { label: string; path: string }[] = [];

        let currentPath = '';
        pathParts.forEach((part, index) => {
            currentPath += `/${part}`;

            // Skip UUIDs in paths
            if (part.match(/^[0-9a-f-]{36}$/i)) {
                return;
            }

            const label = routeLabels[part] || part.charAt(0).toUpperCase() + part.slice(1);
            crumbs.push({
                label,
                path: currentPath
            });
        });

        return crumbs;
    };

    const breadcrumbItems = items || generateBreadcrumbs();

    // Don't render if only home or empty
    if (breadcrumbItems.length === 0) {
        return null;
    }

    return (
        <BreadcrumbContainer>
            <Breadcrumb>
                {showHome && (
                    <Breadcrumb.Item>
                        <Link to="/dashboard">
                            <HomeOutlined />
                        </Link>
                    </Breadcrumb.Item>
                )}
                {breadcrumbItems.map((item, index) => (
                    <Breadcrumb.Item key={index}>
                        {index === breadcrumbItems.length - 1 || !item.path ? (
                            <span>{item.label}</span>
                        ) : (
                            <Link to={item.path}>{item.label}</Link>
                        )}
                    </Breadcrumb.Item>
                ))}
            </Breadcrumb>
        </BreadcrumbContainer>
    );
};

export default Breadcrumbs;
