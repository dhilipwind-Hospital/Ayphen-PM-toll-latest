/**
 * Meeting Integration Service
 * Phase 7-8: Integrations
 * 
 * Handles Zoom/Teams meeting transcription and voice commands during meetings
 */

import { voiceNLU } from './voice-nlu.service';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';

export interface MeetingTranscript {
  id: string;
  meetingId: string;
  platform: 'zoom' | 'teams';
  startTime: Date;
  endTime?: Date;
  participants: string[];
  segments: TranscriptSegment[];
  actionItems: ActionItem[];
  issues: IssueReference[];
}

export interface TranscriptSegment {
  id: string;
  timestamp: number;
  speaker: string;
  text: string;
  confidence: number;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: Date;
  priority?: string;
  createdFromSegment: string;
}

export interface IssueReference {
  issueKey: string;
  mentionedAt: number[];
  context: string[];
}

export class MeetingIntegrationService {
  private issueRepo = AppDataSource.getRepository(Issue);
  private activeMeetings: Map<string, MeetingTranscript> = new Map();

  /**
   * Start meeting transcription
   */
  startMeeting(
    meetingId: string,
    platform: 'zoom' | 'teams',
    participants: string[]
  ): MeetingTranscript {
    const meeting: MeetingTranscript = {
      id: this.generateId(),
      meetingId,
      platform,
      startTime: new Date(),
      participants,
      segments: [],
      actionItems: [],
      issues: []
    };

    this.activeMeetings.set(meetingId, meeting);
    return meeting;
  }

  /**
   * Add transcript segment
   */
  async addSegment(
    meetingId: string,
    speaker: string,
    text: string,
    confidence: number = 1.0
  ): Promise<void> {
    const meeting = this.activeMeetings.get(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const segment: TranscriptSegment = {
      id: this.generateId(),
      timestamp: Date.now(),
      speaker,
      text,
      confidence
    };

    meeting.segments.push(segment);

    // Detect action items
    await this.detectActionItems(meeting, segment);

    // Detect issue references
    this.detectIssueReferences(meeting, segment);

    // Detect voice commands
    await this.detectVoiceCommands(meeting, segment);
  }

  /**
   * Detect action items from transcript
   */
  private async detectActionItems(
    meeting: MeetingTranscript,
    segment: TranscriptSegment
  ): Promise<void> {
    const text = segment.text.toLowerCase();

    // Action item keywords
    const actionKeywords = [
      'action item',
      'todo',
      'task',
      'follow up',
      'need to',
      'should',
      'will',
      'assign',
      'create'
    ];

    const hasActionKeyword = actionKeywords.some(keyword => text.includes(keyword));

    if (hasActionKeyword) {
      // Parse with AI to extract action details
      const result = await voiceNLU.parseIntent(segment.text, {
        currentPage: 'meeting'
      });

      if (result.intent.type === 'create_issue' || result.intent.type === 'assign') {
        const actionItem: ActionItem = {
          id: this.generateId(),
          text: segment.text,
          assignee: result.intent.entities.assignee,
          priority: result.intent.entities.priority,
          createdFromSegment: segment.id
        };

        meeting.actionItems.push(actionItem);
      }
    }
  }

  /**
   * Detect issue references (PROJ-123 format)
   */
  private detectIssueReferences(
    meeting: MeetingTranscript,
    segment: TranscriptSegment
  ): void {
    // Match issue keys (e.g., PROJ-123, ABC-456)
    const issueKeyRegex = /\b([A-Z]{2,10}-\d+)\b/g;
    const matches = segment.text.match(issueKeyRegex);

    if (matches) {
      matches.forEach(issueKey => {
        let issueRef = meeting.issues.find(i => i.issueKey === issueKey);
        
        if (!issueRef) {
          issueRef = {
            issueKey,
            mentionedAt: [],
            context: []
          };
          meeting.issues.push(issueRef);
        }

        issueRef.mentionedAt.push(segment.timestamp);
        issueRef.context.push(segment.text);
      });
    }
  }

  /**
   * Detect and execute voice commands during meeting
   */
  private async detectVoiceCommands(
    meeting: MeetingTranscript,
    segment: TranscriptSegment
  ): Promise<void> {
    const text = segment.text.toLowerCase();

    // Command triggers
    const commandTriggers = [
      'jira',
      'create issue',
      'set priority',
      'assign to',
      'move to'
    ];

    const hasCommandTrigger = commandTriggers.some(trigger => text.includes(trigger));

    if (hasCommandTrigger) {
      try {
        const result = await voiceNLU.parseIntent(segment.text, {
          currentPage: 'meeting'
        });

        if (result.intent.confidence >= 0.7) {
          // Log command for post-meeting review
          console.log('Meeting command detected:', {
            speaker: segment.speaker,
            command: segment.text,
            intent: result.intent
          });

          // Could auto-execute high-confidence commands
          // For now, just log them
        }
      } catch (error) {
        console.error('Error detecting voice command:', error);
      }
    }
  }

  /**
   * End meeting and generate summary
   */
  async endMeeting(meetingId: string): Promise<MeetingSummary> {
    const meeting = this.activeMeetings.get(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    meeting.endTime = new Date();

    const summary = await this.generateSummary(meeting);

    // Remove from active meetings
    this.activeMeetings.delete(meetingId);

    return summary;
  }

  /**
   * Generate meeting summary
   */
  private async generateSummary(meeting: MeetingTranscript): Promise<MeetingSummary> {
    const duration = meeting.endTime 
      ? (meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000 / 60
      : 0;

    // Get issue details
    const issueDetails = await Promise.all(
      meeting.issues.map(async (ref) => {
        const issue = await this.issueRepo.findOne({ where: { key: ref.issueKey } });
        return {
          key: ref.issueKey,
          summary: issue?.summary || 'Unknown',
          mentionCount: ref.mentionedAt.length,
          context: ref.context.slice(0, 3) // First 3 mentions
        };
      })
    );

    return {
      meetingId: meeting.meetingId,
      platform: meeting.platform,
      duration: Math.round(duration),
      participants: meeting.participants,
      segmentCount: meeting.segments.length,
      actionItems: meeting.actionItems,
      issuesDiscussed: issueDetails,
      keyTopics: this.extractKeyTopics(meeting),
      transcript: meeting.segments.map(s => ({
        speaker: s.speaker,
        text: s.text,
        timestamp: new Date(s.timestamp).toISOString()
      }))
    };
  }

  /**
   * Extract key topics from meeting
   */
  private extractKeyTopics(meeting: MeetingTranscript): string[] {
    // Simple keyword extraction
    const allText = meeting.segments.map(s => s.text).join(' ').toLowerCase();
    
    const keywords = [
      'bug', 'feature', 'sprint', 'release', 'deadline',
      'priority', 'blocker', 'review', 'testing', 'deployment'
    ];

    return keywords.filter(keyword => allText.includes(keyword));
  }

  /**
   * Get active meeting
   */
  getActiveMeeting(meetingId: string): MeetingTranscript | undefined {
    return this.activeMeetings.get(meetingId);
  }

  /**
   * Create issues from action items
   */
  async createIssuesFromActionItems(
    meetingId: string,
    actionItemIds: string[]
  ): Promise<Issue[]> {
    const meeting = this.activeMeetings.get(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const actionItems = meeting.actionItems.filter(item => 
      actionItemIds.includes(item.id)
    );

    const issues: Issue[] = [];

    for (const actionItem of actionItems) {
      const issue = this.issueRepo.create({
        summary: actionItem.text,
        type: 'task',
        priority: actionItem.priority || 'medium',
        status: 'backlog',
        description: `Created from meeting ${meetingId}\nSpeaker: ${
          meeting.segments.find(s => s.id === actionItem.createdFromSegment)?.speaker
        }`,
        createdAt: new Date()
      });

      await this.issueRepo.save(issue);
      issues.push(issue);
    }

    return issues;
  }

  /**
   * Search meeting transcripts
   */
  async searchTranscripts(query: string, limit: number = 10): Promise<TranscriptSearchResult[]> {
    const results: TranscriptSearchResult[] = [];

    for (const [meetingId, meeting] of this.activeMeetings) {
      const matchingSegments = meeting.segments.filter(segment =>
        segment.text.toLowerCase().includes(query.toLowerCase())
      );

      if (matchingSegments.length > 0) {
        results.push({
          meetingId,
          platform: meeting.platform,
          startTime: meeting.startTime,
          matches: matchingSegments.slice(0, 5).map(s => ({
            speaker: s.speaker,
            text: s.text,
            timestamp: new Date(s.timestamp).toISOString()
          }))
        });
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface MeetingSummary {
  meetingId: string;
  platform: 'zoom' | 'teams';
  duration: number; // minutes
  participants: string[];
  segmentCount: number;
  actionItems: ActionItem[];
  issuesDiscussed: Array<{
    key: string;
    summary: string;
    mentionCount: number;
    context: string[];
  }>;
  keyTopics: string[];
  transcript: Array<{
    speaker: string;
    text: string;
    timestamp: string;
  }>;
}

export interface TranscriptSearchResult {
  meetingId: string;
  platform: 'zoom' | 'teams';
  startTime: Date;
  matches: Array<{
    speaker: string;
    text: string;
    timestamp: string;
  }>;
}

// Export singleton instance
export const meetingIntegration = new MeetingIntegrationService();
