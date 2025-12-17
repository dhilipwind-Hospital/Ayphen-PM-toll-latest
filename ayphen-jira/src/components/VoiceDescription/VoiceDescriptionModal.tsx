import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Card, Tag, Spin, message } from 'antd';
import { Mic, MicOff, Sparkles, Check, RefreshCw } from 'lucide-react';
import styled from 'styled-components';
import axios from 'axios';

const { TextArea } = Input;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ContextPanel = styled.div`
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #7DD3FC;
`;

const ContextTitle = styled.div`
  font-weight: 600;
  color: #0EA5E9;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ContextItem = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VoiceInputArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: #fafafa;
  border-radius: 12px;
  border: 2px dashed #d9d9d9;
`;

const MicButton = styled.button<{ $isRecording?: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$isRecording
    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
    : 'linear-gradient(135deg, #0EA5E9, #38BDF8)'};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }

  ${props => props.$isRecording && `
    animation: pulse 1.5s ease-in-out infinite;
  `}

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% {
      box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
    }
  }
`;

const TranscriptArea = styled(TextArea)`
  font-size: 14px;
  border-radius: 8px;
  
  &:focus {
    border-color: #0EA5E9;
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
  }
`;

const SuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SuggestionCard = styled(Card) <{ $selected?: boolean }>`
  cursor: pointer;
  border: 2px solid ${props => props.$selected ? '#0EA5E9' : '#f0f0f0'};
  background: ${props => props.$selected ? '#F0F9FF' : 'white'};
  transition: all 0.2s ease;

  &:hover {
    border-color: #0EA5E9;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
  }

  .ant-card-head {
    background: ${props => props.$selected ? '#E0F2FE' : 'transparent'};
    border-bottom: 1px solid ${props => props.$selected ? '#7DD3FC' : '#f0f0f0'};
  }

  .ant-card-body {
    max-height: 200px;
    overflow-y: auto;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

interface VoiceDescriptionModalProps {
  open: boolean;
  onClose: () => void;
  issueType: string;
  issueSummary: string;
  projectId?: string;
  epicId?: string;
  parentIssueId?: string;
  currentDescription?: string;
  onTextGenerated: (text: string) => void;
}

interface Suggestion {
  id: number;
  title: string;
  description: string;
  style: string;
  confidence: number;
}

interface ContextData {
  project?: { name: string; key: string; description: string };
  epic?: { key: string; summary: string };
  parentIssue?: { key: string; summary: string };
  relatedIssues: Array<{ key: string; summary: string }>;
}

export const VoiceDescriptionModal: React.FC<VoiceDescriptionModalProps> = ({
  open,
  onClose,
  issueType,
  issueSummary,
  projectId,
  epicId,
  parentIssueId,
  currentDescription,
  onTextGenerated,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [context, setContext] = useState<ContextData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Load context and initialize description when modal opens
  useEffect(() => {
    if (open) {
      if (currentDescription && !transcript) {
        setTranscript(currentDescription); // Pre-fill with existing description
      }

      if (projectId || epicId || parentIssueId) {
        loadContext();
      }
    }
  }, [open, projectId, epicId, parentIssueId, currentDescription]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(prev => prev + (finalTranscript || interimTranscript));
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          message.error('Microphone access denied. Please allow microphone access.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const loadContext = async () => {
    setIsLoadingContext(true);
    try {
      const response = await axios.get('https://ayphen-pm-toll-latest.onrender.com/api/ai-description/context', {
        params: {
          projectId,
          epicId,
          parentIssueId,
          issueType,
        },
      });

      if (response.data.success) {
        setContext(response.data.context);
      }
    } catch (error) {
      console.error('Error loading context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      message.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const generateDescriptions = async () => {
    if (!transcript.trim() && !issueSummary) {
      message.warning('Please speak or type your description idea');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/ai-description/generate', {
        issueType,
        issueSummary,
        userInput: transcript || currentDescription || 'Generate a description',
        projectId,
        epicId,
        parentIssueId,
        format: 'user-story',
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        setSelectedSuggestion(response.data.suggestions[0]?.id || null);
        message.success('AI generated 3 description options!');
      }
    } catch (error: any) {
      console.error('Error generating descriptions:', error);
      message.error(error.response?.data?.error || 'Failed to generate descriptions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseDescription = () => {
    if (selectedSuggestion !== null) {
      const selected = suggestions.find(s => s.id === selectedSuggestion);
      if (selected) {
        onTextGenerated(selected.description);
        message.success('Description inserted!');
      }
    }
  };

  const handleClose = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    setTranscript('');
    setSuggestions([]);
    setSelectedSuggestion(null);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mic size={20} style={{ color: '#0EA5E9' }} />
          <span>AI Voice Description Assistant</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      width={800}
      footer={null}
    >
      <ModalContent>
        {/* Context Panel */}
        {isLoadingContext ? (
          <Spin tip="Loading context..." />
        ) : context && (
          <ContextPanel>
            <ContextTitle>
              <Sparkles size={16} />
              Context Being Used
            </ContextTitle>
            {context.project && (
              <ContextItem>
                📁 <strong>Project:</strong> {context.project.name} ({context.project.key})
              </ContextItem>
            )}
            {context.epic && (
              <ContextItem>
                📊 <strong>Epic:</strong> {context.epic.key} - {context.epic.summary}
              </ContextItem>
            )}
            {context.parentIssue && (
              <ContextItem>
                📝 <strong>Parent:</strong> {context.parentIssue.key} - {context.parentIssue.summary}
              </ContextItem>
            )}
            {context.relatedIssues && context.relatedIssues.length > 0 && (
              <ContextItem>
                🔗 <strong>Related:</strong> {context.relatedIssues.length} similar issues
              </ContextItem>
            )}
          </ContextPanel>
        )}

        {/* Voice Input Area */}
        <VoiceInputArea>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              {isRecording ? 'Listening... Speak now!' : 'Click microphone to speak'}
            </div>
            <Tag color={isRecording ? 'red' : 'default'}>
              {isRecording ? 'Recording' : 'Ready'}
            </Tag>
          </div>

          <MicButton onClick={toggleRecording} $isRecording={isRecording}>
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </MicButton>

          <TranscriptArea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Or type your description idea here..."
            rows={3}
            style={{ width: '100%' }}
          />

          <Button
            type="primary"
            icon={<Sparkles size={16} />}
            onClick={generateDescriptions}
            loading={isGenerating}
            size="large"
            style={{
              background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
              border: 'none',
            }}
          >
            Generate AI Descriptions
          </Button>
        </VoiceInputArea>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <SuggestionsContainer>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              AI Generated Suggestions:
            </div>
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                $selected={selectedSuggestion === suggestion.id}
                onClick={() => setSelectedSuggestion(suggestion.id)}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{suggestion.title}</span>
                    {selectedSuggestion === suggestion.id && (
                      <Check size={16} style={{ color: '#0EA5E9' }} />
                    )}
                  </div>
                }
                size="small"
              >
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>
                  {suggestion.description}
                </div>
              </SuggestionCard>
            ))}
          </SuggestionsContainer>
        )}

        {/* Action Buttons */}
        <ActionButtons>
          {suggestions.length > 0 && (
            <Button
              icon={<RefreshCw size={16} />}
              onClick={generateDescriptions}
              loading={isGenerating}
            >
              Regenerate
            </Button>
          )}
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<Check size={16} />}
            onClick={handleUseDescription}
            disabled={selectedSuggestion === null}
            style={{
              background: selectedSuggestion !== null ? '#0EA5E9' : undefined,
              borderColor: selectedSuggestion !== null ? '#0EA5E9' : undefined,
            }}
          >
            Use This Description
          </Button>
        </ActionButtons>
      </ModalContent>
    </Modal>
  );
};
