import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Mic } from 'lucide-react';
import { message as antMessage, Tooltip } from 'antd';
import axios from 'axios';

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const VoiceButton = styled.button<{ isListening: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${props => props.isListening ? '#0EA5E9' : '#e0e0e0'};
  background: ${props => props.isListening ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)' : 'white'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  animation: ${props => props.isListening ? pulse : 'none'} 1s infinite;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  }
`;

const TranscriptBox = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  border: 2px solid #0EA5E9;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
`;

interface VoiceAssistantProps {
  issueId: string;
  onUpdate: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ issueId, onUpdate }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceCommand = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      antMessage.error('Voice input not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = async (event: any) => {
      const command = event.results[0][0].transcript;
      setTranscript(`"${command}"`);
      setIsListening(false);
      setIsProcessing(true);
      
      try {
        const response = await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/voice-assistant/process', {
          command,
          issueId
        });

        if (response.data.success) {
          antMessage.success(response.data.message);
          setTranscript('✓ ' + response.data.message);
          await onUpdate();
          setTimeout(() => {
            setTranscript('');
            setIsProcessing(false);
          }, 2000);
        } else {
          antMessage.warning(response.data.message);
          setTranscript('');
          setIsProcessing(false);
        }
      } catch (error: any) {
        antMessage.error(error.response?.data?.error || 'Command failed');
        setTranscript('');
        setIsProcessing(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setTranscript('');
      setIsProcessing(false);
      antMessage.error('Voice recognition failed');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title="Voice commands: 'set priority to high', 'change status to in progress', 'assign to John'">
        <VoiceButton isListening={isListening || isProcessing} onClick={handleVoiceCommand} disabled={isProcessing}>
          <Mic size={20} color={(isListening || isProcessing) ? 'white' : '#0EA5E9'} />
        </VoiceButton>
      </Tooltip>
      {transcript && (
        <TranscriptBox>
          {transcript}
        </TranscriptBox>
      )}
    </div>
  );
};
