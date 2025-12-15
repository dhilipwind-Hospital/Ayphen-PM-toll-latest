import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { colors } from '../../../theme/colors';

const SectionContainer = styled.div`
  border-bottom: 1px solid ${colors.border.light};
  padding: 16px 0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 12px;
  user-select: none;
  
  &:hover {
    opacity: 0.8;
  }
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.secondary};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Content = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

interface SidebarSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
    title,
    children,
    defaultOpen = true
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <SectionContainer>
            <Header onClick={() => setIsOpen(!isOpen)}>
                <Title>{title}</Title>
                {isOpen ? <ChevronDown size={16} color={colors.text.secondary} /> : <ChevronRight size={16} color={colors.text.secondary} />}
            </Header>
            <Content isOpen={isOpen}>
                {children}
            </Content>
        </SectionContainer>
    );
};
