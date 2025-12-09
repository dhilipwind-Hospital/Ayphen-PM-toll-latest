import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`;

const WaveformContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 60px;
  padding: 10px;
`;

const WaveBar = styled.div<{ height: number; delay: number; isActive: boolean }>`
  width: 4px;
  height: ${props => props.height}%;
  background: ${props => props.isActive 
    ? 'linear-gradient(180deg, #EC4899 0%, #F472B6 100%)'
    : '#E5E7EB'
  };
  border-radius: 2px;
  transition: height 0.1s ease-out, background 0.3s ease;
  animation: ${props => props.isActive ? pulse : 'none'} 1s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const CanvasWaveform = styled.canvas`
  width: 100%;
  height: 60px;
  border-radius: 8px;
`;

interface VoiceWaveformProps {
  isListening: boolean;
  audioLevel?: number;
  style?: 'bars' | 'gradient' | 'circle';
  barCount?: number;
  color?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isListening,
  audioLevel = 0,
  style = 'bars',
  barCount = 12,
  color = '#EC4899'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (style === 'gradient' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (isListening) {
          // Draw gradient waveform
          const centerY = height / 2;
          const amplitude = audioLevel * height * 0.4;

          ctx.beginPath();
          ctx.moveTo(0, centerY);

          // Create smooth wave
          for (let x = 0; x < width; x++) {
            const y = centerY + Math.sin((x / width) * Math.PI * 4 + Date.now() / 200) * amplitude;
            ctx.lineTo(x, y);
          }

          // Create gradient
          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, '#EC4899');
          gradient.addColorStop(0.5, '#F472B6');
          gradient.addColorStop(1, '#EC4899');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();

      return () => {
        if (animationFrameRef.current !== undefined) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isListening, audioLevel, style]);

  if (style === 'bars') {
    const bars = Array.from({ length: barCount }, (_, i) => {
      const baseHeight = 20;
      const dynamicHeight = isListening ? baseHeight + (audioLevel * 60) : baseHeight;
      const variation = Math.sin((i / barCount) * Math.PI) * 20;
      const height = Math.min(100, dynamicHeight + variation);
      const delay = i * 0.05;

      return (
        <WaveBar
          key={i}
          height={height}
          delay={delay}
          isActive={isListening}
        />
      );
    });

    return <WaveformContainer>{bars}</WaveformContainer>;
  }

  if (style === 'gradient') {
    return <CanvasWaveform ref={canvasRef} width={300} height={60} />;
  }

  // Circle style
  return (
    <CircleWaveform isListening={isListening} audioLevel={audioLevel} color={color} />
  );
};

// Circle waveform component
const CircleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  width: 80px;
  position: relative;
`;

const CircleRing = styled.div<{ scale: number; opacity: number; color: string }>`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid ${props => props.color};
  opacity: ${props => props.opacity};
  transform: scale(${props => props.scale});
  transition: all 0.3s ease;
`;

const CircleCore = styled.div<{ isActive: boolean; color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.isActive 
    ? `linear-gradient(135deg, ${props.color}, ${props.color}CC)`
    : '#E5E7EB'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.3s ease;
`;

interface CircleWaveformProps {
  isListening: boolean;
  audioLevel: number;
  color: string;
}

const CircleWaveform: React.FC<CircleWaveformProps> = ({ isListening, audioLevel, color }) => {
  const rings = [
    { scale: 1 + audioLevel * 0.2, opacity: isListening ? 0.8 : 0.3 },
    { scale: 1 + audioLevel * 0.4, opacity: isListening ? 0.5 : 0.2 },
    { scale: 1 + audioLevel * 0.6, opacity: isListening ? 0.3 : 0.1 }
  ];

  return (
    <CircleContainer>
      {rings.map((ring, i) => (
        <CircleRing key={i} scale={ring.scale} opacity={ring.opacity} color={color} />
      ))}
      <CircleCore isActive={isListening} color={color}>
        {isListening && '🎤'}
      </CircleCore>
    </CircleContainer>
  );
};
