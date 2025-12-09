import styled from 'styled-components';
import { motion } from 'framer-motion';
import { colors } from '../../theme/colors';

interface GlassPanelProps {
  padding?: string;
  hover?: boolean;
  interactive?: boolean;
}

export const GlassPanel = styled(motion.div)<GlassPanelProps>`
  background: ${colors.glass.background};
  backdrop-filter: blur(${colors.glass.blur});
  border: 1px solid ${colors.glass.border};
  box-shadow: ${colors.glass.shadow};
  border-radius: 16px;
  padding: ${props => props.padding || '24px'};
  transition: all 0.3s ease;
  
  ${props => (props.hover || props.interactive) && `
    cursor: ${props.interactive ? 'pointer' : 'default'};
    &:hover {
      background: ${colors.glass.backgroundHover};
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(31, 38, 135, 0.12);
      border-color: rgba(255, 255, 255, 0.8);
    }
  `}
`;

export const GlassCard = styled(GlassPanel)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const GlassHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.glass.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: ${colors.text.primary};
  background: rgba(255, 255, 255, 0.4);
`;
