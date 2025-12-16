/**
 * Voice-to-Voice Assistant Component
 * Phase 5-6: Advanced Features
 * 
 * Full conversational voice assistant with TTS responses
 */

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { message as antMessage, Switch, Slider } from 'antd';
import { EnhancedSpeechRecognitionService } from '../../services/enhanced-speech-recognition.service';
import { VoiceTTSService, TTSResponses } from '../../services/voice-tts.service';
import type { TranscriptResult, RecognitionError } from '../../services/enhanced-speech-recognition.service';
import axios from 'axios';

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-height: 400px;
`;

const VoiceOrb = styled.div<{ isActive: boolean; isSpeaking: boolean }>`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: ${props => props.isActive 
    ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)'
    : props.isSpeaking
    ? 'linear-gradient(135deg, #60A5FA, #3B82F6)'
    : 'linear-gradient(135deg, #E5E7EB, #9CA3AF)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  animation: ${props => (props.isActive || props.isSpeaking) ? pulse : 'none'} 2s infinite;
  box-shadow: ${props => (props.isActive || props.isSpeaking) 
    ? '0 0 40px rgba(236, 72, 153, 0.6)'
    : '0 0 20px rgba(0, 0, 0, 0.2)'
  };

  &:hover {
    transform: scale(1.05);
  }
`;

const StatusText = styled.div`
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TranscriptDisplay = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  min-height: 80px;
  width: 100%;
  max-width: 500px;
  font-size: 16px;
  color: #1F2937;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ResponseDisplay = styled.div<{ emotion: string }>`
  background: ${props => {
    switch (props.emotion) {
      case 'success': return 'linear-gradient(135deg, #10B981, #059669)';
      case 'error': return 'linear-gradient(135deg, #EF4444, #DC2626)';
      case 'warning': return 'linear-gradient(135deg, #F59E0B, #D97706)';
      default: return 'linear-gradient(135deg, #3B82F6, #2563EB)';
    }
  }};
  color: white;
  border-radius: 12px;
  padding: 16px;
  min-height: 60px;
  width: 100%;
  max-width: 500px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ControlsPanel = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  font-size: 14px;
`;

interface VoiceToVoiceAssistantProps {
  issueId?: string;
  projectId?: string;
  onUpdate?: () => void;
}

export const VoiceToVoiceAssistant: React.FC<VoiceToVoiceAssistantProps> = ({
  issueId,
  projectId,
  onUpdate
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [responseEmotion, setResponseEmotion] = useState<'neutral' | 'success' | 'error' | 'warning'>('neutral');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsVolume, setTtsVolume] = useState(1.0);
  const [showControls, setShowControls] = useState(false);

  const recognitionService = useRef<EnhancedSpeechRecognitionService | null>(null);
  const ttsService = useRef<VoiceTTSService | null>(null);

  useEffect(() => {
    // Initialize services
    recognitionService.current = new EnhancedSpeechRecognitionService({
      language: 'en-US',
      continuous: false,
      interimResults: true
    });

    ttsService.current = new VoiceTTSService({
      language: 'en-US',
      rate: ttsRate,
      volume: ttsVolume
    });

    // Subscribe to TTS events
    const unsubscribe = ttsService.current.subscribe((event, data) => {
      if (event === 'start') {
        setIsSpeaking(true);
      } else if (event === 'end') {
        setIsSpeaking(false);
      }
    });

    // Speak greeting
    if (ttsEnabled) {
      ttsService.current.speak({
        text: TTSResponses.ready(),
        emotion: 'neutral',
        priority: 'normal'
      });
    }

    return () => {
      recognitionService.current?.destroy();
      ttsService.current?.destroy();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Update TTS config when settings change
    if (ttsService.current) {
      ttsService.current.updateConfig({
        rate: ttsRate,
        volume: ttsVolume
      });
    }
  }, [ttsRate, ttsVolume]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!recognitionService.current) return;

    // Stop TTS if speaking
    if (isSpeaking && ttsService.current) {
      ttsService.current.stop();
    }

    recognitionService.current.start({
      onStart: () => {
        setIsListening(true);
        setTranscript('');
        setResponse('');
        
        if (ttsEnabled && ttsService.current) {
          ttsService.current.speak({
            text: TTSResponses.listening(),
            emotion: 'info',
            priority: 'high',
            interrupt: true
          });
        }
      },
      onResult: (result: TranscriptResult) => {
        setTranscript(result.text);
        
        if (result.isFinal) {
          processCommand(result.text, result.confidence);
        }
      },
      onError: (error: RecognitionError) => {
        setIsListening(false);
        handleError(error.message);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const stopListening = () => {
    if (recognitionService.current) {
      recognitionService.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (command: string, confidence: number) => {
    try {
      const userId = localStorage.getItem('userId');

      // Parse with AI
      const parseResponse = await axios.post('/api/voice-assistant-ai/parse', {
        transcript: command,
        context: {
          userId,
          issueId,
          projectId,
          currentPage: 'voice-assistant'
        }
      });

      if (!parseResponse.data.success) {
        handleError('Could not understand command');
        return;
      }

      const { intent } = parseResponse.data;

      // Check confidence
      if (intent.confidence < 0.7) {
        const confirmText = `I heard: ${command}. Is that correct?`;
        setResponse(confirmText);
        setResponseEmotion('warning');
        
        if (ttsEnabled && ttsService.current) {
          await ttsService.current.speak({
            text: confirmText,
            emotion: 'warning',
            priority: 'high'
          });
        }
        return;
      }

      // Execute command
      const executeResponse = await axios.post('/api/voice-assistant-ai/execute', {
        intent,
        context: {
          userId,
          issueId,
          projectId
        }
      });

      if (executeResponse.data.success) {
        handleSuccess(executeResponse.data.message);
        
        if (onUpdate) {
          await onUpdate();
        }
      } else {
        handleError(executeResponse.data.message || 'Command failed');
      }

      // Track analytics
      await axios.post('/api/voice-advanced/analytics/track', {
        userId,
        eventType: 'command',
        data: {
          transcript: command,
          intent: intent.type,
          confidence: intent.confidence,
          success: executeResponse.data.success,
          mode: 'voice-to-voice'
        }
      });

    } catch (error: any) {
      handleError(error.response?.data?.error || 'Failed to process command');
    }
  };

  const handleSuccess = async (message: string) => {
    setResponse(message);
    setResponseEmotion('success');
    antMessage.success(message);

    if (ttsEnabled && ttsService.current) {
      await ttsService.current.speakCommandResult(true, message);
      
      // Ask what's next
      setTimeout(async () => {
        if (ttsService.current) {
          await ttsService.current.speak({
            text: TTSResponses.whatNext(),
            emotion: 'info',
            priority: 'normal'
          });
        }
      }, 1500);
    }
  };

  const handleError = async (error: string) => {
    setResponse(error);
    setResponseEmotion('error');
    antMessage.error(error);

    if (ttsEnabled && ttsService.current) {
      await ttsService.current.speakCommandResult(false, error);
    }
  };

  const getStatusText = (): string => {
    if (isListening) return '🎤 Listening...';
    if (isSpeaking) return '🔊 Speaking...';
    return '👋 Ready to help!';
  };

  return (
    <Container>
      <VoiceOrb
        isActive={isListening}
        isSpeaking={isSpeaking}
        onClick={handleVoiceToggle}
      >
        {isListening ? (
          <Mic size={60} color="white" />
        ) : isSpeaking ? (
          <Volume2 size={60} color="white" />
        ) : (
          <MicOff size={60} color="white" />
        )}
      </VoiceOrb>

      <StatusText>{getStatusText()}</StatusText>

      {transcript && (
        <TranscriptDisplay>
          <strong>You said:</strong> "{transcript}"
        </TranscriptDisplay>
      )}

      {response && (
        <ResponseDisplay emotion={responseEmotion}>
          {responseEmotion === 'success' && '✅'}
          {responseEmotion === 'error' && '❌'}
          {responseEmotion === 'warning' && '⚠️'}
          {responseEmotion === 'neutral' && 'ℹ️'}
          <span>{response}</span>
        </ResponseDisplay>
      )}

      <ControlsPanel>
        <ControlRow>
          <span>Voice Responses</span>
          <Switch
            checked={ttsEnabled}
            onChange={setTtsEnabled}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </ControlRow>

        <ControlRow>
          <span>Show Settings</span>
          <Settings
            size={20}
            style={{ cursor: 'pointer' }}
            onClick={() => setShowControls(!showControls)}
          />
        </ControlRow>

        {showControls && (
          <>
            <ControlRow>
              <span>Speech Rate</span>
              <Slider
                min={0.5}
                max={2}
                step={0.1}
                value={ttsRate}
                onChange={setTtsRate}
                style={{ width: '200px' }}
              />
            </ControlRow>

            <ControlRow>
              <span>Volume</span>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={ttsVolume}
                onChange={setTtsVolume}
                style={{ width: '200px' }}
              />
            </ControlRow>
          </>
        )}
      </ControlsPanel>
    </Container>
  );
};
