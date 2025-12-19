import React, { useState } from 'react';
import styled from 'styled-components';
import { colors } from '../../theme/colors';
import { FileText, Sparkles, CheckCircle, Loader } from 'lucide-react';
import { message } from 'antd';
import { api } from '../../services/api';

const FormContainer = styled.div`
  background: ${colors.background.paper};
  border-radius: 12px;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text.primary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid ${colors.border.default};
  border-radius: 8px;
  font-size: 14px;
  color: ${colors.text.primary};
  background: ${colors.background.default};
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 2px solid ${colors.border.default};
  border-radius: 8px;
  font-size: 14px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  line-height: 1.6;
  color: ${colors.text.primary};
  background: ${colors.background.default};
  resize: vertical;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: ${colors.text.secondary};
  }
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  
  ${props => props.primary ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  ` : `
    background: ${colors.background.default};
    color: ${colors.text.primary};
    border: 2px solid ${colors.border.default};
    
    &:hover {
      border-color: #667eea;
    }
  `}
`;

const ResultsSection = styled.div`
  margin-top: 24px;
  padding: 20px;
  background: ${colors.background.default};
  border-radius: 8px;
  border-left: 4px solid #4caf50;
`;

const ResultTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IssuesList = styled.div`
  margin-top: 12px;
`;

const IssueItem = styled.div`
  padding: 12px;
  background: ${colors.background.paper};
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IssueKey = styled.span`
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  color: #667eea;
  min-width: 80px;
`;

const IssueSummary = styled.span`
  color: ${colors.text.primary};
  flex: 1;
`;

const Summary = styled.div`
  padding: 16px;
  background: ${colors.background.paper};
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.8;
  color: ${colors.text.secondary};
  white-space: pre-line;
`;

interface MeetingScribeFormProps {
  projectId: string;
  onComplete?: () => void;
}

export const MeetingScribeForm: React.FC<MeetingScribeFormProps> = ({ projectId, onComplete }) => {
  const [meetingTitle, setMeetingTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/meeting-scribe/process', {
        transcript,
        projectId,
        meetingTitle: meetingTitle || 'Team Meeting'
      });

      if (response.data.success) {
        setResult(response.data);
        setTranscript('');
        setMeetingTitle('');

        if (onComplete) {
          onComplete();
        }
      }
    } catch (error: any) {
      console.error('Meeting scribe error:', error);
      message.error(`Failed to process meeting: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const placeholder = `Paste your meeting notes or transcript here...

Example:
"Sprint Planning Meeting - March 15

- John will fix the login bug by Friday
- Sarah to review the API changes and submit feedback
- Decided to postpone the mobile release to next quarter
- Mike needs to update the documentation
- Action item: All team members to complete security training by end of week

Next meeting: March 22"`;

  return (
    <FormContainer>
      <Header>
        <IconWrapper>
          <FileText size={24} />
        </IconWrapper>
        <div>
          <Title>
            <Sparkles size={22} style={{ color: '#ffd700' }} />
            Meeting Scribe
          </Title>
          <div style={{ fontSize: '13px', color: colors.text.secondary }}>
            AI-powered meeting notes → Jira issues
          </div>
        </div>
      </Header>

      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Meeting Title (Optional)</Label>
          <Input
            type="text"
            placeholder="e.g., Sprint Planning, Team Sync, Retro..."
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <Label>Meeting Transcript or Notes *</Label>
          <TextArea
            placeholder={placeholder}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            required
          />
        </FormGroup>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" primary disabled={loading || !transcript.trim()}>
            {loading ? (
              <>
                <Loader size={16} className="spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Process Meeting
              </>
            )}
          </Button>

          <Button type="button" onClick={() => { setTranscript(''); setMeetingTitle(''); setResult(null); }}>
            Clear
          </Button>
        </div>
      </form>

      {result && (
        <ResultsSection>
          <ResultTitle>
            <CheckCircle size={20} style={{ color: '#4caf50' }} />
            Meeting Processed Successfully!
          </ResultTitle>

          {result.summary && (
            <div style={{ marginBottom: '20px' }}>
              <Label>Summary</Label>
              <Summary>{result.summary}</Summary>
            </div>
          )}

          {result.issuesCreated && result.issuesCreated.length > 0 && (
            <div>
              <Label>Created {result.issuesCreated.length} Issue{result.issuesCreated.length > 1 ? 's' : ''}</Label>
              <IssuesList>
                {result.issuesCreated.map((issue: any) => (
                  <IssueItem key={issue.id}>
                    <CheckCircle size={16} style={{ color: '#4caf50' }} />
                    <IssueKey>{issue.key}</IssueKey>
                    <IssueSummary>{issue.summary}</IssueSummary>
                  </IssueItem>
                ))}
              </IssuesList>
            </div>
          )}

          {result.decisions && result.decisions.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Label>Key Decisions</Label>
              <ul style={{ margin: '8px 0', paddingLeft: '20px', color: colors.text.secondary }}>
                {result.decisions.map((decision: string, i: number) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{decision}</li>
                ))}
              </ul>
            </div>
          )}
        </ResultsSection>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </FormContainer>
  );
};
