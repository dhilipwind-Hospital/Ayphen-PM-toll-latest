import React from 'react';
import styled from 'styled-components';
import { Checkbox } from 'antd';
import { colors } from '../theme/colors';

const FiltersContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: white;
  border-radius: 4px;
  border: 1px solid ${colors.border.light};
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterCheckbox = styled(Checkbox)`
  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: ${colors.primary[500]};
    border-color: ${colors.primary[500]};
  }
  
  &:hover .ant-checkbox-inner {
    border-color: ${colors.primary[500]};
  }
`;

const FilterLabel = styled.span`
  font-size: 14px;
  color: ${colors.text.primary};
  margin-left: 8px;
`;

export interface QuickFiltersProps {
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  currentUserId?: string;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  activeFilters,
  onFilterChange,
  currentUserId,
}) => {
  const filters = [
    { id: 'my-issues', label: '⭐ Only My Issues', enabled: !!currentUserId },
    { id: 'blocked', label: '🚫 Blocked' },
    { id: 'overdue', label: '⏰ Overdue' },
    { id: 'unassigned', label: '👤 Unassigned' },
    { id: 'high-priority', label: '🔥 High Priority' },
  ];

  const handleToggle = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    onFilterChange(newFilters);
  };

  return (
    <FiltersContainer>
      {filters.map(filter => (
        filter.enabled !== false && (
          <FilterCheckbox
            key={filter.id}
            checked={activeFilters.includes(filter.id)}
            onChange={() => handleToggle(filter.id)}
          >
            <FilterLabel>{filter.label}</FilterLabel>
          </FilterCheckbox>
        )
      ))}
    </FiltersContainer>
  );
};
