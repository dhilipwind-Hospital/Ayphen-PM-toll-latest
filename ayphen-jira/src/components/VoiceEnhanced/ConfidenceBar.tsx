import React from 'react';
import styled from 'styled-components';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const Container = styled.div`
  width: 100%;
  margin: 8px 0;
`;

const BarContainer = styled.div`
  width: 100%;
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const BarFill = styled.div<{ confidence: number; color: string }>`
  height: 100%;
  width: ${props => props.confidence * 100}%;
  background: ${props => props.color};
  transition: width 0.3s ease, background 0.3s ease;
  border-radius: 4px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
`;

const ConfidenceLabel = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.color};
  font-weight: 500;
`;

const PercentageText = styled.span<{ color: string }>`
  color: ${props => props.color};
  font-weight: 600;
`;

interface ConfidenceBarProps {
  confidence: number; // 0-1
  threshold?: number; // 0-1
  showPercentage?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  confidence,
  threshold = 0.7,
  showPercentage = true,
  showLabel = true,
  size = 'medium'
}) => {
  const getConfidenceLevel = (): {
    level: 'high' | 'medium' | 'low';
    color: string;
    icon: React.ReactNode;
    label: string;
  } => {
    if (confidence >= threshold) {
      return {
        level: 'high',
        color: '#10B981',
        icon: <CheckCircle size={14} />,
        label: 'High Confidence'
      };
    } else if (confidence >= threshold - 0.2) {
      return {
        level: 'medium',
        color: '#F59E0B',
        icon: <AlertCircle size={14} />,
        label: 'Medium Confidence'
      };
    } else {
      return {
        level: 'low',
        color: '#EF4444',
        icon: <XCircle size={14} />,
        label: 'Low Confidence'
      };
    }
  };

  const { color, icon, label } = getConfidenceLevel();
  const percentage = Math.round(confidence * 100);

  const heights = {
    small: '6px',
    medium: '8px',
    large: '12px'
  };

  return (
    <Container>
      <BarContainer style={{ height: heights[size] }}>
        <BarFill confidence={confidence} color={color} />
      </BarContainer>
      {(showLabel || showPercentage) && (
        <InfoRow>
          {showLabel && (
            <ConfidenceLabel color={color}>
              {icon}
              <span>{label}</span>
            </ConfidenceLabel>
          )}
          {showPercentage && (
            <PercentageText color={color}>{percentage}%</PercentageText>
          )}
        </InfoRow>
      )}
    </Container>
  );
};
