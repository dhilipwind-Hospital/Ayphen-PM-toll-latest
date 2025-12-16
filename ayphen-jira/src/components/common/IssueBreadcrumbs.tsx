import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ChevronRight } from 'lucide-react';
import { useIssueContext } from '../../hooks/useIssueContext';

const BreadcrumbContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const BreadcrumbLink = styled(Link)`
  color: #6B7280;
  text-decoration: none;
  transition: color 0.15s;
  
  &:hover {
    color: #111827;
    text-decoration: underline;
  }
`;

const BreadcrumbText = styled.span`
  color: #374151;
  font-weight: 500;
`;

const SkeletonBar = styled.div<{ width?: string }>`
  height: 14px;
  width: ${props => props.width || '60px'};
  background: #E5E7EB;
  border-radius: 3px;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
`;

interface IssueBreadcrumbsProps {
    issueIdOrKey: string;
}

export const IssueBreadcrumbs: React.FC<IssueBreadcrumbsProps> = ({ issueIdOrKey }) => {
    const { breadcrumbs, isLoading } = useIssueContext(issueIdOrKey);

    if (isLoading) {
        return (
            <BreadcrumbContainer>
                <SkeletonBar width="50px" />
                <ChevronRight size={12} strokeWidth={2} style={{ opacity: 0.3 }} />
                <SkeletonBar width="80px" />
                <ChevronRight size={12} strokeWidth={2} style={{ opacity: 0.3 }} />
                <SkeletonBar width="40px" />
            </BreadcrumbContainer>
        );
    }

    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return (
        <BreadcrumbContainer>
            {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                    <React.Fragment key={index}>
                        {index > 0 && <ChevronRight size={12} strokeWidth={2} style={{ opacity: 0.3 }} />}

                        {crumb.path && !isLast ? (
                            <BreadcrumbLink to={crumb.path}>
                                {crumb.label}
                            </BreadcrumbLink>
                        ) : (
                            <BreadcrumbText>
                                {crumb.label}
                            </BreadcrumbText>
                        )}
                    </React.Fragment>
                );
            })}
        </BreadcrumbContainer>
    );
};
