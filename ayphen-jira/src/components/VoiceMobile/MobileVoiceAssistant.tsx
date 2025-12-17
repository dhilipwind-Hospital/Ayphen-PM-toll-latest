/**
 * Mobile Voice Assistant Component
 * Phase 7-8: Integrations
 * 
 * Mobile-optimized voice assistant with touch-friendly UI
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Mic, MicOff, Send, X } from 'lucide-react';
import { EnhancedSpeechRecognitionService } from '../../services/enhanced-speech-recognition.service';
import type { TranscriptResult } from '../../services/enhanced-speech-recognition.service';
import axios from 'axios';

const MobileContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
  transition: transform 0.3s ease;
  transform: ${props => props.theme.isOpen ? 'translateY(0)' : 'translateY(100%)'};

  @media (min-width: 768px) {
    max-width: 500px;
    left: auto;
    right: 20px;
    bottom: 20px;
    border-radius: 24px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #6B7280;
  
  &:active {
    transform: scale(0.95);
  }
`;

const VoiceButton = styled.button<{ isListening: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isListening 
    ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)'
    : 'linear-gradient(135deg, #667eea, #764ba2)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 20px auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.95);
  }

  ${props => props.isListening && `
    animation: pulse 1.5s infinite;
  `}

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const TranscriptArea = styled.div`
  background: #F9FAFB;
  border-radius: 12px;
  padding: 16px;
  min-height: 80px;
  margin: 16px 0;
  font-size: 16px;
  color: #1F2937;
  line-height: 1.5;
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  
  &:focus {
    border-color: #0EA5E9;
  }
`;

const SendButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0EA5E9, #38BDF8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusText = styled.div`
  text-align: center;
  color: #6B7280;
  font-size: 14px;
  margin: 8px 0;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 0;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const QuickActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #E5E7EB;
  background: white;
  color: #374151;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  
  &:active {
    background: #F3F4F6;
  }
`;

const FloatingButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #0EA5E9, #38BDF8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
  z-index: 999;
  
  &:active {
    transform: scale(0.95);
  }
`;

interface MobileVoiceAssistantProps {
  issueId?: string;
  projectId?: string;
  onUpdate?: () => void;
}

export const MobileVoiceAssistant: React.FC<MobileVoiceAssistantProps> = ({
  issueId,
  projectId,
  onUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [status, setStatus] = useState('Ready');

  const recognitionService = useRef<EnhancedSpeechRecognitionService | null>(null);

  useEffect(() => {
    recognitionService.current = new EnhancedSpeechRecognitionService({
      language: 'en-US',
      continuous: false,
      interimResults: true
    });

    return () => {
      recognitionService.current?.destroy();
    };
  }, []);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!recognitionService.current) return;

    recognitionService.current.start({
      onStart: () => {
        setIsListening(true);
        setTranscript('');
        setStatus('Listening...');
      },
      onResult: (result: TranscriptResult) => {
        setTranscript(result.text);
        
        if (result.isFinal) {
          processCommand(result.text);
        }
      },
      onError: (error) => {
        setIsListening(false);
        setStatus('Error: ' + error.message);
      },
      onEnd: () => {
        setIsListening(false);
        setStatus('Ready');
      }
    });
  };

  const stopListening = () => {
    if (recognitionService.current) {
      recognitionService.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (command: string) => {
    setStatus('Processing...');

    try {
      const userId = localStorage.getItem('userId');

      // Parse with AI
      const parseResponse = await axios.post('/api/voice-assistant-ai/parse', {
        transcript: command,
        context: { userId, issueId, projectId, currentPage: 'mobile' }
      });

      if (!parseResponse.data.success) {
        setStatus('Could not understand command');
        return;
      }

      // Execute
      const executeResponse = await axios.post('/api/voice-assistant-ai/execute', {
        intent: parseResponse.data.intent,
        context: { userId, issueId, projectId }
      });

      if (executeResponse.data.success) {
        setStatus('✅ ' + executeResponse.data.message);
        if (onUpdate) await onUpdate();
        
        setTimeout(() => {
          setTranscript('');
          setStatus('Ready');
        }, 2000);
      } else {
        setStatus('❌ ' + executeResponse.data.message);
      }

    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    
    processCommand(textInput);
    setTextInput('');
  };

  const handleQuickAction = (action: string) => {
    setTextInput(action);
    processCommand(action);
  };

  const quickActions = [
    'Set priority to high',
    'Move to in progress',
    'Assign to me',
    'Show my issues',
    'Create a bug'
  ];

  return (
    <>
      {!isOpen && (
        <FloatingButton onClick={() => setIsOpen(true)}>
          <Mic size={28} />
        </FloatingButton>
      )}

      <MobileContainer theme={{ isOpen }}>
        <Header>
          <Title>🎤 Voice Assistant</Title>
          <CloseButton onClick={() => setIsOpen(false)}>
            <X size={24} />
          </CloseButton>
        </Header>

        <VoiceButton
          isListening={isListening}
          onClick={handleVoiceToggle}
        >
          {isListening ? (
            <MicOff size={36} color="white" />
          ) : (
            <Mic size={36} color="white" />
          )}
        </VoiceButton>

        <StatusText>{status}</StatusText>

        {transcript && (
          <TranscriptArea>
            "{transcript}"
          </TranscriptArea>
        )}

        <InputRow>
          <TextInput
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type your command..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit();
              }
            }}
          />
          <SendButton
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
          >
            <Send size={20} />
          </SendButton>
        </InputRow>

        <QuickActions>
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={index}
              onClick={() => handleQuickAction(action)}
            >
              {action}
            </QuickActionButton>
          ))}
        </QuickActions>
      </MobileContainer>
    </>
  );
};
