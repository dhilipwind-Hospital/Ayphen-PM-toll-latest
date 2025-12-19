import React from 'react';
import { Skeleton, Card, Space } from 'antd';
import styled from 'styled-components';

const SkeletonCard = styled(Card)`
  margin-bottom: 16px;
  
  .ant-skeleton {
    .ant-skeleton-content {
      .ant-skeleton-title {
        margin-bottom: 12px;
      }
    }
  }
`;

const SkeletonRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const SkeletonTableRow = styled.div`
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
`;

// Card skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <SkeletonCard key={index}>
                <Skeleton active avatar paragraph={{ rows: 2 }} />
            </SkeletonCard>
        ))}
    </>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 4
}) => (
    <div style={{ padding: 16 }}>
        {/* Header */}
        <SkeletonRow>
            {Array.from({ length: columns }).map((_, index) => (
                <Skeleton.Button key={index} active style={{ width: 100, height: 16 }} />
            ))}
        </SkeletonRow>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <SkeletonTableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton.Input
                        key={colIndex}
                        active
                        size="small"
                        style={{ width: colIndex === 1 ? 200 : 80 }}
                    />
                ))}
            </SkeletonTableRow>
        ))}
    </div>
);

// Dashboard stat skeleton
export const StatsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 16 }}>
        {Array.from({ length: count }).map((_, index) => (
            <Card key={index}>
                <Skeleton.Button active style={{ width: 100, height: 20, marginBottom: 8 }} />
                <Skeleton.Button active style={{ width: 60, height: 40 }} />
            </Card>
        ))}
    </div>
);

// List skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
    <div>
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Skeleton active avatar={{ size: 32 }} paragraph={{ rows: 1, width: '60%' }} />
            </div>
        ))}
    </div>
);

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
    <div style={{
        height,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 8
    }}>
        <style>
            {`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}
        </style>
    </div>
);

// Generic page skeleton
export const PageSkeleton: React.FC = () => (
    <div style={{ padding: 24 }}>
        {/* Header */}
        <Skeleton.Button active style={{ width: 200, height: 32, marginBottom: 24 }} />

        {/* Stats */}
        <StatsSkeleton />

        <div style={{ marginTop: 24 }} />

        {/* Content */}
        <Card>
            <TableSkeleton />
        </Card>
    </div>
);

export default {
    CardSkeleton,
    TableSkeleton,
    StatsSkeleton,
    ListSkeleton,
    ChartSkeleton,
    PageSkeleton
};
