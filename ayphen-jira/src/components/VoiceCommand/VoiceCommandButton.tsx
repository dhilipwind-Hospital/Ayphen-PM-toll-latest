import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import styled from 'styled-components';
import { colors } from '../../theme/colors';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ENV } from '../../config/env';

const FloatingButton = styled.button<{ isListening: boolean }>`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${props => props.isListening
        ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 1000;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  ${props => props.isListening && `
    animation: pulse 1.5s ease-in-out infinite;
  `}
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
    }
    50% {
      box-shadow: 0 8px 32px rgba(255, 107, 107, 0.8);
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: ${colors.background.paper};
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from {
      transform: translateY(40px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0;
  color: ${colors.text.primary};
  font-size: 24px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.text.secondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: ${colors.background.default};
    color: ${colors.text.primary};
  }
`;

const TranscriptArea = styled.div`
  background: ${colors.background.default};
  border-radius: 12px;
  padding: 20px;
  min-height: 120px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 2px solid ${colors.border.default};
`;

const Transcript = styled.p<{ isListening: boolean }>`
  color: ${props => props.isListening ? colors.text.primary : colors.text.secondary};
  font-size: 18px;
  line-height: 1.6;
  margin: 0;
  min-height: 60px;
  
  ${props => props.isListening && `
    &::after {
      content: '▊';
      animation: blink 1s step-end infinite;
    }
  `}
  
  @keyframes blink {
    50% { opacity: 0; }
  }
`;

const FeedbackArea = styled.div`
  margin-top: 16px;
`;

const FeedbackMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  background: ${props => {
        if (props.type === 'success') return 'rgba(76, 175, 80, 0.1)';
        if (props.type === 'error') return 'rgba(244, 67, 54, 0.1)';
        return 'rgba(33, 150, 243, 0.1)';
    }};
  color: ${props => {
        if (props.type === 'success') return '#4caf50';
        if (props.type === 'error') return '#f44336';
        return '#2196f3';
    }};
  border-left: 4px solid currentColor;
`;

const SuggestionsArea = styled.div`
  margin-top: 20px;
`;

const SuggestionTitle = styled.h4`
  color: ${colors.text.secondary};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
`;

const Suggestion = styled.button`
  background: ${colors.background.default};
  border: 1px solid ${colors.border.default};
  color: ${colors.text.primary};
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: transparent;
  }
`;

interface VoiceCommandModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string;
    issueId?: string;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({
    isOpen,
    onClose,
    projectId,
    issueId
}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const navigate = useNavigate();
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check if browser supports speech recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setFeedback({ type: 'error', message: 'Speech recognition not supported in this browser' });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcriptText = event.results[current][0].transcript;
            setTranscript(transcriptText);

            // If final result, process the command
            if (event.results[current].isFinal) {
                processCommand(transcriptText);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            setFeedback({ type: 'error', message: `Error: ${event.error}` });
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            setTranscript('');
            setFeedback(null);
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const processCommand = async (command: string) => {
        setFeedback({ type: 'info', message: 'Processing command...' });

        try {
            const userId = localStorage.getItem('userId');
            const response = await axios.post(`${ENV.API_URL}/voice-assistant/process-enhanced`, {
                command,
                context: {
                    userId,
                    projectId,
                    issueId
                }
            });

            if (response.data.success) {
                setFeedback({ type: 'success', message: response.data.message });

                // Handle different action types
                if (response.data.action === 'navigate' && response.data.data?.route) {
                    setTimeout(() => {
                        navigate(response.data.data.route);
                        onClose();
                    }, 1000);
                } else if (response.data.action === 'create' && response.data.data) {
                    // Open create issue modal with pre-filled data
                    setFeedback({
                        type: 'success',
                        message: `Ready to create ${response.data.data.type}: "${response.data.data.summary}"`
                    });
                } else if (response.data.action === 'search' && response.data.data?.results) {
                    setFeedback({
                        type: 'success',
                        message: `Found ${response.data.data.results.length} issues`
                    });
                }
            } else {
                setFeedback({ type: 'error', message: response.data.message });
            }
        } catch (error: any) {
            console.error('Command processing error:', error);
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Failed to process command' });
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setTranscript(suggestion);
        processCommand(suggestion);
    };

    if (!isOpen) return null;

    const suggestions = [
        'Take me to the board',
        'Show me the backlog',
        'Create a bug',
        'Find my issues',
        'Go to dashboard'
    ];

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Title>🎤 Voice Command</Title>
                    <CloseButton onClick={onClose}>
                        <X size={24} />
                    </CloseButton>
                </Header>

                <TranscriptArea>
                    <Transcript isListening={isListening}>
                        {transcript || (isListening ? 'Listening...' : 'Click the microphone to start')}
                    </Transcript>
                </TranscriptArea>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <FloatingButton
                        isListening={isListening}
                        onClick={isListening ? stopListening : startListening}
                        style={{ position: 'relative', margin: '0 auto' }}
                    >
                        {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                    </FloatingButton>
                </div>

                {feedback && (
                    <FeedbackArea>
                        <FeedbackMessage type={feedback.type}>
                            {feedback.message}
                        </FeedbackMessage>
                    </FeedbackArea>
                )}

                <SuggestionsArea>
                    <SuggestionTitle>Try saying:</SuggestionTitle>
                    {suggestions.map((suggestion, index) => (
                        <Suggestion
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </Suggestion>
                    ))}
                </SuggestionsArea>
            </ModalContent>
        </ModalOverlay>
    );
};

// Floating voice button component
export const VoiceCommandButton: React.FC<{ projectId?: string; issueId?: string }> = ({ projectId, issueId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <FloatingButton
                isListening={false}
                onClick={() => setIsModalOpen(true)}
                title="Voice Command (Click to speak)"
            >
                <Mic size={28} />
            </FloatingButton>

            <VoiceCommandModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                projectId={projectId}
                issueId={issueId}
            />
        </>
    );
};
