"use strict";
/**
 * Voice Natural Language Understanding (NLU) Service
 * Phase 3-4: AI Intelligence
 *
 * Uses Cerebras AI to understand voice commands with natural language
 * instead of rigid keyword matching
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceNLU = exports.VoiceNLUService = void 0;
const axios_1 = __importDefault(require("axios"));
class VoiceNLUService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        this.model = 'llama3.1-8b';
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
        if (!this.cerebrasApiKey) {
            console.warn('CEREBRAS_API_KEY not set. NLU features will be limited.');
        }
    }
    /**
     * Parse voice command using AI to understand intent
     */
    async parseIntent(transcript, context = {}) {
        const startTime = Date.now();
        try {
            // Build AI prompt with context
            const prompt = this.buildNLUPrompt(transcript, context);
            // Call Cerebras AI
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert Jira voice command parser. Parse natural language commands into structured intents with high accuracy.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3, // Lower temperature for more consistent parsing
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const aiResponse = response.data.choices[0].message.content;
            const intent = this.parseAIResponse(aiResponse);
            const processingTime = Date.now() - startTime;
            return {
                intent,
                originalTranscript: transcript,
                normalizedCommand: this.normalizeCommand(transcript),
                processingTime
            };
        }
        catch (error) {
            console.error('NLU parsing error:', error);
            // Fallback to keyword-based parsing
            const fallbackIntent = this.fallbackParse(transcript);
            const processingTime = Date.now() - startTime;
            return {
                intent: fallbackIntent,
                originalTranscript: transcript,
                normalizedCommand: this.normalizeCommand(transcript),
                processingTime
            };
        }
    }
    /**
     * Build NLU prompt with context
     */
    buildNLUPrompt(transcript, context) {
        const contextInfo = [];
        if (context.issueId) {
            contextInfo.push(`Current Issue: ${context.issueId}`);
        }
        if (context.projectId) {
            contextInfo.push(`Current Project: ${context.projectId}`);
        }
        if (context.currentPage) {
            contextInfo.push(`Current Page: ${context.currentPage}`);
        }
        if (context.recentCommands && context.recentCommands.length > 0) {
            contextInfo.push(`Recent Commands: ${context.recentCommands.slice(0, 3).join(', ')}`);
        }
        return `
Parse this Jira voice command into a structured intent:

Command: "${transcript}"

${contextInfo.length > 0 ? `Context:\n${contextInfo.join('\n')}` : ''}

Return a JSON object with this exact structure:
{
  "type": "update_priority" | "update_status" | "assign" | "add_label" | "set_due_date" | "add_comment" | "create_issue" | "navigate" | "search" | "batch_update" | "link_issue" | "add_watcher" | "set_estimate" | "unknown",
  "confidence": 0.0 to 1.0,
  "entities": {
    // Extracted values like priority, status, assignee, etc.
  },
  "description": "Human-readable description of what will happen",
  "suggestions": ["alternative interpretation 1", "alternative interpretation 2"]
}

Examples:
- "make this urgent" → {"type": "update_priority", "confidence": 0.95, "entities": {"priority": "highest"}, "description": "Set priority to Highest"}
- "john should handle this" → {"type": "assign", "confidence": 0.9, "entities": {"assignee": "john"}, "description": "Assign to John"}
- "this blocks PROJ-456" → {"type": "link_issue", "confidence": 0.85, "entities": {"linkType": "blocks", "targetIssue": "PROJ-456"}, "description": "Add blocker link to PROJ-456"}
- "due by friday" → {"type": "set_due_date", "confidence": 0.9, "entities": {"dueDate": "friday"}, "description": "Set due date to Friday"}

Parse the command now:
`.trim();
    }
    /**
     * Parse AI response into Intent object
     */
    parseAIResponse(aiResponse) {
        try {
            // Extract JSON from response (AI might wrap it in markdown)
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                type: parsed.type || 'unknown',
                confidence: parsed.confidence || 0.5,
                entities: parsed.entities || {},
                description: parsed.description || 'Unknown command',
                suggestions: parsed.suggestions || []
            };
        }
        catch (error) {
            console.error('Failed to parse AI response:', error);
            return {
                type: 'unknown',
                confidence: 0,
                entities: {},
                description: 'Failed to parse command'
            };
        }
    }
    /**
     * Normalize command text
     */
    normalizeCommand(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Multiple spaces to single
            .replace(/[^\w\s-]/g, ''); // Remove special chars except hyphen
    }
    /**
     * Fallback keyword-based parsing when AI is unavailable
     */
    fallbackParse(transcript) {
        const cmd = this.normalizeCommand(transcript);
        // Priority detection
        if (cmd.includes('priority') || cmd.includes('urgent') || cmd.includes('important')) {
            let priority = 'medium';
            if (cmd.includes('urgent') || cmd.includes('critical') || cmd.includes('highest')) {
                priority = 'highest';
            }
            else if (cmd.includes('high')) {
                priority = 'high';
            }
            else if (cmd.includes('low')) {
                priority = 'low';
            }
            return {
                type: 'update_priority',
                confidence: 0.7,
                entities: { priority },
                description: `Set priority to ${priority}`
            };
        }
        // Status detection
        if (cmd.includes('status') || cmd.includes('move') || cmd.includes('change')) {
            let status = 'todo';
            if (cmd.includes('progress')) {
                status = 'in-progress';
            }
            else if (cmd.includes('done') || cmd.includes('complete')) {
                status = 'done';
            }
            else if (cmd.includes('review')) {
                status = 'in-review';
            }
            else if (cmd.includes('blocked')) {
                status = 'blocked';
            }
            return {
                type: 'update_status',
                confidence: 0.7,
                entities: { status },
                description: `Change status to ${status}`
            };
        }
        // Assignment detection
        if (cmd.includes('assign')) {
            const nameMatch = cmd.match(/assign\s+(?:to\s+)?(\w+)/i);
            const assignee = nameMatch ? nameMatch[1] : null;
            return {
                type: 'assign',
                confidence: assignee ? 0.75 : 0.5,
                entities: { assignee },
                description: assignee ? `Assign to ${assignee}` : 'Assign issue'
            };
        }
        // Navigation detection
        if (cmd.includes('show') || cmd.includes('go to') || cmd.includes('open')) {
            let page = 'dashboard';
            if (cmd.includes('board'))
                page = 'board';
            else if (cmd.includes('backlog'))
                page = 'backlog';
            else if (cmd.includes('roadmap'))
                page = 'roadmap';
            return {
                type: 'navigate',
                confidence: 0.8,
                entities: { page },
                description: `Navigate to ${page}`
            };
        }
        return {
            type: 'unknown',
            confidence: 0,
            entities: {},
            description: 'Command not recognized',
            suggestions: [
                'Try: "set priority to high"',
                'Try: "change status to in progress"',
                'Try: "assign to [name]"'
            ]
        };
    }
    /**
     * Suggest corrections for unclear commands
     */
    async suggestCorrections(transcript, context = {}) {
        try {
            const prompt = `
The user said: "${transcript}"

This command was unclear or had low confidence. Suggest 3 alternative ways to phrase this command more clearly.

Return only a JSON array of strings:
["suggestion 1", "suggestion 2", "suggestion 3"]
`.trim();
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that suggests clearer ways to phrase Jira voice commands.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const aiResponse = response.data.choices[0].message.content;
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        }
        catch (error) {
            console.error('Failed to suggest corrections:', error);
            return [
                'Try being more specific',
                'Use keywords like "priority", "status", "assign"',
                'Example: "set priority to high"'
            ];
        }
    }
    /**
     * Expand synonyms and handle variations
     */
    expandSynonyms(text) {
        const synonymMap = {
            // Priority synonyms
            'urgent': 'highest priority',
            'critical': 'highest priority',
            'important': 'high priority',
            'asap': 'highest priority',
            // Status synonyms
            'working on': 'in progress',
            'doing': 'in progress',
            'finished': 'done',
            'completed': 'done',
            'reviewing': 'in review',
            // Action synonyms
            'give to': 'assign to',
            'hand to': 'assign to',
            'tag': 'add label',
            'label': 'add label',
            // Time synonyms
            'eod': 'end of day',
            'eow': 'end of week',
            'tomorrow': 'next day',
            'next week': 'in 7 days'
        };
        let expanded = text.toLowerCase();
        for (const [synonym, replacement] of Object.entries(synonymMap)) {
            const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
            expanded = expanded.replace(regex, replacement);
        }
        return expanded;
    }
    /**
     * Validate intent before execution
     */
    validateIntent(intent) {
        const errors = [];
        // Check confidence threshold
        if (intent.confidence < 0.5) {
            errors.push('Low confidence. Please rephrase your command.');
        }
        // Validate required entities
        switch (intent.type) {
            case 'update_priority':
                if (!intent.entities.priority) {
                    errors.push('Priority value is required');
                }
                break;
            case 'update_status':
                if (!intent.entities.status) {
                    errors.push('Status value is required');
                }
                break;
            case 'assign':
                if (!intent.entities.assignee) {
                    errors.push('Assignee name is required');
                }
                break;
            case 'set_due_date':
                if (!intent.entities.dueDate) {
                    errors.push('Due date is required');
                }
                break;
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.VoiceNLUService = VoiceNLUService;
// Export singleton instance
exports.voiceNLU = new VoiceNLUService();
