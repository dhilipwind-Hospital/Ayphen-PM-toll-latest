import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Mic, MicOff, Keyboard, Globe } from 'lucide-react';
import { message as antMessage, Select, Tooltip } from 'antd';
import { 
  EnhancedSpeechRecognitionService
} from '../../services/enhanced-speech-recognition.service';
import type { TranscriptResult, RecognitionError } from '../../services/enhanced-speech-recognition.service';
import { offlineCommandQueue } from '../../services/offline-command-queue.service';
import { VoiceWaveform } from './VoiceWaveform';
import { ConfidenceBar } from './ConfidenceBar';
import { CommandPreview } from './CommandPreview';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ControlBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VoiceButton = styled.button<{ isListening: boolean; mode: 'voice' | 'text' | 'hybrid' }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid ${props => props.isListening ? '#0EA5E9' : '#E0E0E0'};
  background: ${props => props.isListening 
    ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)' 
    : props.mode === 'voice' ? 'white' : '#F3F4F6'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.mode === 'voice' ? 'pointer' : 'not-allowed'};
  transition: all 0.3s;
  box-shadow: ${props => props.isListening ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'};

  &:hover {
    transform: ${props => props.mode === 'voice' ? 'scale(1.05)' : 'none'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModeSelector = styled.div`
  display: flex;
  background: #F3F4F6;
  border-radius: 8px;
  padding: 4px;
`;

const ModeButton = styled.button<{ active: boolean }>`
  padding: 6px 12px;
  border: none;
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#0EA5E9' : '#6B7280'};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  box-shadow: ${props => props.active ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'};

  &:hover {
    background: ${props => props.active ? 'white' : '#E5E7EB'};
  }
`;

const TextInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #0EA5E9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }

  &::placeholder {
    color: #9CA3AF;
  }
`;

const TranscriptBox = styled.div<{ confidence: number }>`
  background: ${props => props.confidence >= 0.7 ? '#F0FDF4' : '#FEF3C7'};
  border: 2px solid ${props => props.confidence >= 0.7 ? '#86EFAC' : '#FCD34D'};
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #1F2937;
  min-height: 60px;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #6B7280;
  padding: 8px 0;
`;

const StatusIndicator = styled.div<{ status: 'online' | 'offline' | 'syncing' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => {
      switch (props.status) {
        case 'online': return '#10B981';
        case 'offline': return '#EF4444';
        case 'syncing': return '#F59E0B';
      }
    }};
  }
`;

const LanguageSelector = styled(Select)`
  width: 150px;
`;

interface EnhancedVoiceAssistantProps {
  issueId?: string;
  projectId?: string;
  onUpdate?: () => void;
  mode?: 'voice' | 'text' | 'hybrid';
  showPreview?: boolean;
  autoExecute?: boolean;
}

export const EnhancedVoiceAssistant: React.FC<EnhancedVoiceAssistantProps> = ({
  issueId,
  projectId,
  onUpdate,
  mode: initialMode = 'voice',
  showPreview = true,
  autoExecute = false
}) => {
  const [mode, setMode] = useState<'voice' | 'text' | 'hybrid'>(initialMode);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedAction, setParsedAction] = useState<any>(null);
  const [language, setLanguage] = useState('en-US');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCommands, setQueuedCommands] = useState(0);
  
  const recognitionService = useRef<EnhancedSpeechRecognitionService | null>(null);

  useEffect(() => {
    // Initialize speech recognition service
    recognitionService.current = new EnhancedSpeechRecognitionService({
      language,
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7
    });

    // Check browser support
    const browserInfo = recognitionService.current.getBrowserInfo();
    if (!browserInfo.supported) {
      antMessage.warning('Voice input not supported in this browser. Switching to text mode.');
      setMode('text');
    }

    // Subscribe to offline queue
    const unsubscribe = offlineCommandQueue.subscribe((queue) => {
      setQueuedCommands(queue.filter(cmd => cmd.status === 'pending').length);
    });

    // Setup online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      recognitionService.current?.destroy();
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  const handleVoiceStart = () => {
    if (!recognitionService.current || mode === 'text') return;

    recognitionService.current.start({
      onStart: () => {
        setIsListening(true);
        setTranscript('');
        setConfidence(0);
        setParsedAction(null);
        antMessage.info('🎤 Listening...');
      },
      onResult: (result: TranscriptResult) => {
        setTranscript(result.text);
        setConfidence(result.confidence);
        
        if (result.isFinal && autoExecute && result.confidence >= 0.7) {
          handleExecuteCommand(result.text);
        }
      },
      onError: (error: RecognitionError) => {
        setIsListening(false);
        antMessage.error(error.message);
        
        if (!error.recoverable) {
          setMode('text');
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
      onAudioLevel: (level: number) => {
        setAudioLevel(level);
      }
    });
  };

  const handleVoiceStop = () => {
    recognitionService.current?.stop();
    setIsListening(false);
  };

  const handleExecuteCommand = async (command: string) => {
    setIsProcessing(true);

    try {
      const userId = localStorage.getItem('userId');
      const context = { issueId, projectId, userId: userId || undefined };

      // Use offline queue for reliability
      const result = await offlineCommandQueue.addCommand(command, context, isOnline);

      if (result.queued) {
        antMessage.info(`Command queued. ${queuedCommands + 1} commands pending.`);
      } else if (result.result) {
        antMessage.success(result.result.message || 'Command executed successfully');
        setParsedAction(result.result);
        
        if (onUpdate) {
          await onUpdate();
        }
      }

      // Clear transcript after execution
      setTimeout(() => {
        setTranscript('');
        setConfidence(0);
        setParsedAction(null);
      }, 2000);
    } catch (error: any) {
      antMessage.error(error.message || 'Failed to execute command');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = () => {
    if (!transcript.trim()) {
      antMessage.warning('Please enter a command');
      return;
    }
    handleExecuteCommand(transcript);
  };

  const handleLanguageChange = (value: unknown) => {
    const lang = String(value);
    setLanguage(lang);
    recognitionService.current?.updateConfig({ language: lang });
  };

  const languages = EnhancedSpeechRecognitionService.getSupportedLanguages();

  return (
    <Container>
      <ControlBar>
        <VoiceButton
          isListening={isListening}
          mode={mode}
          onClick={isListening ? handleVoiceStop : handleVoiceStart}
          disabled={mode === 'text' || isProcessing}
        >
          {isListening ? (
            <MicOff size={24} color="white" />
          ) : (
            <Mic size={24} color={mode === 'voice' ? '#0EA5E9' : '#9CA3AF'} />
          )}
        </VoiceButton>

        <ModeSelector>
          <Tooltip title="Voice input">
            <ModeButton active={mode === 'voice'} onClick={() => setMode('voice')}>
              <Mic size={14} />
              Voice
            </ModeButton>
          </Tooltip>
          <Tooltip title="Text input">
            <ModeButton active={mode === 'text'} onClick={() => setMode('text')}>
              <Keyboard size={14} />
              Text
            </ModeButton>
          </Tooltip>
        </ModeSelector>

        <LanguageSelector
          value={language}
          onChange={handleLanguageChange}
          size="small"
          suffixIcon={<Globe size={14} />}
        >
          {languages.map(lang => (
            <Select.Option key={lang.code} value={lang.code}>
              {lang.name}
            </Select.Option>
          ))}
        </LanguageSelector>
      </ControlBar>

      {mode === 'voice' && isListening && (
        <VoiceWaveform
          isListening={isListening}
          audioLevel={audioLevel}
          style="bars"
          barCount={12}
        />
      )}

      {mode === 'text' ? (
        <TextInput
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Type your command here... (e.g., 'set priority to high')"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleTextSubmit();
            }
          }}
        />
      ) : (
        transcript && (
          <TranscriptBox confidence={confidence}>
            "{transcript}"
          </TranscriptBox>
        )
      )}

      {transcript && confidence > 0 && (
        <ConfidenceBar
          confidence={confidence}
          threshold={0.7}
          showPercentage={true}
          showLabel={true}
        />
      )}

      {showPreview && transcript && !autoExecute && (
        <CommandPreview
          command={transcript}
          parsedAction={parsedAction}
          confidence={confidence}
          onConfirm={() => handleExecuteCommand(transcript)}
          onEdit={(newCommand) => setTranscript(newCommand)}
          onCancel={() => {
            setTranscript('');
            setConfidence(0);
            setParsedAction(null);
          }}
          isProcessing={isProcessing}
        />
      )}

      <StatusBar>
        <StatusIndicator status={isOnline ? 'online' : 'offline'}>
          {isOnline ? 'Online' : 'Offline'}
        </StatusIndicator>
        {queuedCommands > 0 && (
          <span>{queuedCommands} command{queuedCommands > 1 ? 's' : ''} queued</span>
        )}
        {mode === 'text' && (
          <span style={{ color: '#9CA3AF' }}>Press Ctrl+Enter to submit</span>
        )}
      </StatusBar>
    </Container>
  );
};
