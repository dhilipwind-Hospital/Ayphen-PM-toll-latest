"use strict";
/**
 * Meeting Integration Service
 * Phase 7-8: Integrations
 *
 * Handles Zoom/Teams meeting transcription and voice commands during meetings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.meetingIntegration = exports.MeetingIntegrationService = void 0;
const voice_nlu_service_1 = require("./voice-nlu.service");
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
class MeetingIntegrationService {
    constructor() {
        this.issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        this.activeMeetings = new Map();
    }
    /**
     * Start meeting transcription
     */
    startMeeting(meetingId, platform, participants) {
        const meeting = {
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
    async addSegment(meetingId, speaker, text, confidence = 1.0) {
        const meeting = this.activeMeetings.get(meetingId);
        if (!meeting) {
            throw new Error('Meeting not found');
        }
        const segment = {
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
    async detectActionItems(meeting, segment) {
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
            const result = await voice_nlu_service_1.voiceNLU.parseIntent(segment.text, {
                currentPage: 'meeting'
            });
            if (result.intent.type === 'create_issue' || result.intent.type === 'assign') {
                const actionItem = {
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
    detectIssueReferences(meeting, segment) {
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
    async detectVoiceCommands(meeting, segment) {
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
                const result = await voice_nlu_service_1.voiceNLU.parseIntent(segment.text, {
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
            }
            catch (error) {
                console.error('Error detecting voice command:', error);
            }
        }
    }
    /**
     * End meeting and generate summary
     */
    async endMeeting(meetingId) {
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
    async generateSummary(meeting) {
        const duration = meeting.endTime
            ? (meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000 / 60
            : 0;
        // Get issue details
        const issueDetails = await Promise.all(meeting.issues.map(async (ref) => {
            const issue = await this.issueRepo.findOne({ where: { key: ref.issueKey } });
            return {
                key: ref.issueKey,
                summary: issue?.summary || 'Unknown',
                mentionCount: ref.mentionedAt.length,
                context: ref.context.slice(0, 3) // First 3 mentions
            };
        }));
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
    extractKeyTopics(meeting) {
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
    getActiveMeeting(meetingId) {
        return this.activeMeetings.get(meetingId);
    }
    /**
     * Create issues from action items
     */
    async createIssuesFromActionItems(meetingId, actionItemIds) {
        const meeting = this.activeMeetings.get(meetingId);
        if (!meeting) {
            throw new Error('Meeting not found');
        }
        const actionItems = meeting.actionItems.filter(item => actionItemIds.includes(item.id));
        const issues = [];
        for (const actionItem of actionItems) {
            const issue = this.issueRepo.create({
                summary: actionItem.text,
                type: 'task',
                priority: actionItem.priority || 'medium',
                status: 'todo',
                description: `Created from meeting ${meetingId}\nSpeaker: ${meeting.segments.find(s => s.id === actionItem.createdFromSegment)?.speaker}`,
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
    async searchTranscripts(query, limit = 10) {
        const results = [];
        for (const [meetingId, meeting] of this.activeMeetings) {
            const matchingSegments = meeting.segments.filter(segment => segment.text.toLowerCase().includes(query.toLowerCase()));
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
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.MeetingIntegrationService = MeetingIntegrationService;
// Export singleton instance
exports.meetingIntegration = new MeetingIntegrationService();
