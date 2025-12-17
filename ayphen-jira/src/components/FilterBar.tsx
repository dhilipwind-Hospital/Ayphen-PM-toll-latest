import React from 'react';
import styled from 'styled-components';
import { Select, Button } from 'antd';
import { Grid3x3, List } from 'lucide-react';
import { colors } from '../theme/colors';
import type { Project } from '../types';

const FilterBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid ${colors.border.light};
  margin-bottom: 24px;
`;

const ProjectInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: auto;
`;

const ProjectAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: #1890ff;
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
`;

const ProjectDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ProjectName = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const ProjectType = styled.span`
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const FiltersGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FilterSelect = styled(Select)`
  min-width: 150px;
  
  .ant-select-selector {
    border-radius: 4px !important;
    border-color: ${colors.border.light} !important;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 4px;
  margin-left: auto;
`;

const ViewButton = styled(Button) <{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: ${props => props.$active ? '#0EA5E9' : 'white'};
  color: ${props => props.$active ? 'white' : colors.text.secondary};
  border: 1px solid ${props => props.$active ? '#0EA5E9' : colors.border.light};
  
  &:hover {
    background: ${props => props.$active ? '#0284C7' : '#F9FAFB'};
    color: ${props => props.$active ? 'white' : colors.text.primary};
    border-color: ${props => props.$active ? '#0284C7' : colors.border.main};
  }
`;

interface FilterBarProps {
  project?: Project;
  priorities?: string[];
  types?: string[];
  assignees?: { id: string; name: string }[];
  selectedPriority?: string | string[];
  selectedType?: string | string[];
  selectedAssignee?: string | string[];
  onPriorityChange?: (value: unknown) => void;
  onTypeChange?: (value: unknown) => void;
  onAssigneeChange?: (value: unknown) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  project,
  priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
  types = ['Epic', 'Story', 'Task', 'Bug'],
  assignees = [],
  selectedPriority = 'all',
  selectedType = 'all',
  selectedAssignee = 'all',
  onPriorityChange,
  onTypeChange,
  onAssigneeChange,
  viewMode = 'grid',
  onViewModeChange,
}) => {
  return (
    <FilterBarContainer>
      {project && (
        <ProjectInfo>
          <ProjectAvatar>
            {project.key.substring(0, 3)}
          </ProjectAvatar>
          <ProjectDetails>
            <ProjectName>{project.name}</ProjectName>
            <ProjectType>Scrum Project</ProjectType>
          </ProjectDetails>
        </ProjectInfo>
      )}

      <FiltersGroup>
        <FilterSelect
          mode="multiple"
          value={selectedPriority}
          onChange={onPriorityChange}
          placeholder="All Priority"
          maxTagCount="responsive"
          allowClear
        >
          {priorities.map(priority => (
            <Select.Option key={priority} value={priority.toLowerCase()}>
              {priority}
            </Select.Option>
          ))}
        </FilterSelect>

        <FilterSelect
          mode="multiple"
          value={selectedType}
          onChange={onTypeChange}
          placeholder="All Types"
          maxTagCount="responsive"
          allowClear
        >
          {types.map(type => (
            <Select.Option key={type} value={type.toLowerCase()}>
              {type}
            </Select.Option>
          ))}
        </FilterSelect>

        <FilterSelect
          mode="multiple"
          value={selectedAssignee}
          onChange={onAssigneeChange}
          placeholder="All Assignees"
          maxTagCount="responsive"
          allowClear
        >
          {assignees.map(assignee => (
            <Select.Option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </Select.Option>
          ))}
        </FilterSelect>

        <ViewToggle>
          <ViewButton
            $active={viewMode === 'grid'}
            onClick={() => onViewModeChange?.('grid')}
            icon={<Grid3x3 size={18} />}
          />
          <ViewButton
            $active={viewMode === 'list'}
            onClick={() => onViewModeChange?.('list')}
            icon={<List size={18} />}
          />
        </ViewToggle>
      </FiltersGroup>
    </FilterBarContainer>
  );
};
