import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { Project } from '../entities/Project';
import axios from 'axios';

/**
 * Meeting Scribe - AI-powered meeting notes processor
 * Converts meeting transcripts into actionable items:
 * - Extracts tasks and creates issues
 * - Identifies action items and assignees
 * - Generates meeting summary
 */

interface MeetingTranscript {
    text: string;
    projectId: string;
    meetingTitle?: string;
    attendees?: string[];
}

interface ExtractedItem {
    type: 'task' | 'bug' | 'decision' | 'action';
    summary: string;
    description: string;
    assignee?: string;
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
}

interface MeetingProcessResult {
    summary: string;
    actionItems: ExtractedItem[];
    issuesCreated: Array<{
        id: string;
        key: string;
        summary: string;
    }>;
    decisions: string[];
    nextSteps: string[];
}

export class MeetingScribeService {
    private cerebrasApiKey: string;
    private cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';

    constructor() {
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }

    /**
     * Process meeting transcript and extract actionable items
     */
    async processMeetingTranscript(input: MeetingTranscript): Promise<MeetingProcessResult> {
        try {
            // Step 1: Extract structured data from transcript
            const extracted = await this.extractItemsFromTranscript(input.text);

            // Step 2: Create issues from action items
            const issuesCreated = await this.createIssuesFromItems(
                extracted.actionItems,
                input.projectId
            );

            // Step 3: Generate meeting summary
            const summary = await this.generateMeetingSummary(
                input.text,
                input.meetingTitle || 'Team Meeting'
            );

            return {
                summary,
                actionItems: extracted.actionItems,
                issuesCreated,
                decisions: extracted.decisions,
                nextSteps: extracted.nextSteps
            };
        } catch (error: any) {
            console.error('❌ Meeting scribe error:', error);
            throw new Error(`Failed to process meeting: ${error.message}`);
        }
    }

    /**
     * Extract action items and decisions from transcript using AI
     */
    private async extractItemsFromTranscript(transcript: string): Promise<{
        actionItems: ExtractedItem[];
        decisions: string[];
        nextSteps: string[];
    }> {
        const prompt = `You are an expert meeting notes analyzer. Extract actionable items from this meeting transcript.

Transcript:
"""
${transcript}
"""

Extract and return ONLY a valid JSON object with:
{
  "actionItems": [
    {
      "type": "task" | "bug",
      "summary": "Brief title",
      "description": "Detailed description",
      "assignee": "Person's name if mentioned",
      "priority": "high" | "medium" | "low",
      "dueDate": "YYYY-MM-DD if mentioned"
    }
  ],
  "decisions": ["Decision 1", "Decision 2"],
  "nextSteps": ["Next step 1", "Next step 2"]
}

Rules:
- Extract all action items, tasks, and decisions
- Identify assignees from phrases like "John will", "Sarah to handle", etc.
- Determine priority from urgency words
- Only include dueDate if explicitly mentioned
- Be concise but complete

Return ONLY the JSON, no explanations.`;

        try {
            const response = await axios.post(
                this.cerebrasEndpoint,
                {
                    model: 'llama3.1-8b',
                    messages: [
                        { role: 'system', content: 'You are a JSON-only response assistant.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.cerebrasApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const content = response.data.choices[0].message.content;
            let jsonStr = content.trim();

            // Clean up markdown code blocks
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```\n?/g, '');
            }

            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('❌ AI extraction error:', error);

            // Fallback: basic extraction
            return {
                actionItems: this.extractBasicActionItems(transcript),
                decisions: [],
                nextSteps: []
            };
        }
    }

    /**
     * Fallback basic extraction if AI fails
     */
    private extractBasicActionItems(transcript: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const lines = transcript.split('\n');

        for (const line of lines) {
            const lowerLine = line.toLowerCase();

            // Look for action verbs
            if (lowerLine.includes('will') || lowerLine.includes('should') ||
                lowerLine.includes('need to') || lowerLine.includes('action:')) {
                items.push({
                    type: 'task',
                    summary: line.trim().substring(0, 100),
                    description: line.trim(),
                    priority: 'medium'
                });
            }
        }

        return items;
    }

    /**
     * Create issues from extracted action items
     */
    private async createIssuesFromItems(
        items: ExtractedItem[],
        projectId: string
    ): Promise<Array<{ id: string; key: string; summary: string }>> {
        const issueRepo = AppDataSource.getRepository(Issue);
        const projectRepo = AppDataSource.getRepository(Project);

        const project = await projectRepo.findOne({ where: { id: projectId } });
        if (!project) {
            throw new Error('Project not found');
        }

        const createdIssues = [];

        for (const item of items.filter(i => i.type === 'task' || i.type === 'bug')) {
            try {
                // Generate issue key
                const issueCount = await issueRepo.count({ where: { projectId } });
                const key = `${project.key}-${issueCount + 1}`;

                const issue = issueRepo.create({
                    key,
                    summary: item.summary,
                    description: item.description,
                    type: item.type,
                    projectId,
                    priority: item.priority || 'medium',
                    status: 'todo',
                    labels: ['meeting-scribe', 'auto-generated'],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                const saved = await issueRepo.save(issue);

                createdIssues.push({
                    id: saved.id,
                    key: saved.key,
                    summary: saved.summary
                });

                console.log(`✅ Created issue ${saved.key} from meeting notes`);
            } catch (error) {
                console.error('Failed to create issue from item:', item, error);
            }
        }

        return createdIssues;
    }

    /**
     * Generate concise meeting summary
     */
    private async generateMeetingSummary(transcript: string, title: string): Promise<string> {
        const prompt = `Summarize this meeting in 3-5 bullet points. Be concise and focus on key takeaways.

Meeting: ${title}

Transcript:
"""
${transcript.substring(0, 3000)} ${transcript.length > 3000 ? '...' : ''}
"""

Return only the bullet points, one per line, starting with "-".`;

        try {
            const response = await axios.post(
                this.cerebrasEndpoint,
                {
                    model: 'llama3.1-8b',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.5,
                    max_tokens: 300
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.cerebrasApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0].message.content.trim();
        } catch (error) {
            console.error('❌ Summary generation error:', error);
            return `Meeting: ${title}\n\nSummary generation failed. Please review the transcript manually.`;
        }
    }

    /**
     * Quick action: Parse and execute from meeting notes
     */
    async quickProcessNotes(notes: string, projectId: string): Promise<{
        tasksCreated: number;
        summary: string;
    }> {
        const result = await this.processMeetingTranscript({
            text: notes,
            projectId,
            meetingTitle: 'Quick Notes'
        });

        return {
            tasksCreated: result.issuesCreated.length,
            summary: result.summary
        };
    }
}

export const meetingScribeService = new MeetingScribeService();
