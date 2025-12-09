"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiIssueCreatorService = exports.AIIssueCreatorService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const axios_1 = __importDefault(require("axios"));
class AIIssueCreatorService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }
    /**
     * Convert natural language to structured issue
     */
    async createFromNaturalLanguage(input) {
        try {
            // Step 1: Parse natural language to structured data
            const structured = await this.parseNaturalLanguage(input.text);
            // Step 2: Find similar existing issues
            const similar = await this.findSimilarIssues(structured.summary, input.projectId);
            // Step 3: Suggest assignee based on expertise
            const suggestedAssignee = await this.suggestAssignee(structured, input.projectId);
            structured.suggestedAssignee = suggestedAssignee;
            // Step 4: Generate additional suggestions
            const suggestions = await this.generateSuggestions(structured, similar);
            return {
                structured,
                similar,
                suggestions
            };
        }
        catch (error) {
            console.error('❌ AI Issue Creator Error:', error);
            throw new Error(`Failed to create issue from natural language: ${error.message}`);
        }
    }
    /**
     * Parse natural language using AI
     */
    async parseNaturalLanguage(text) {
        const prompt = `You are an expert Jira issue analyzer. Convert this natural language request into a structured Jira issue.

Input: "${text}"

Extract and return ONLY a valid JSON object with these fields:
{
  "type": "epic" | "story" | "task" | "bug" | "subtask",
  "summary": "concise title (max 100 chars)",
  "description": "detailed description with context",
  "priority": "highest" | "high" | "medium" | "low" | "lowest",
  "storyPoints": number (1-13, Fibonacci),
  "labels": ["label1", "label2"],
  "acceptanceCriteria": ["criterion1", "criterion2"],
  "confidence": number (0-1)
}

Rules:
- If it mentions "epic" or "initiative", type is "epic"
- If it's a user story ("As a user..."), type is "story"
- If it's a bug/error/issue, type is "bug"
- If it's a simple task, type is "task"
- Priority based on urgency words (critical, urgent, important, etc.)
- Story points based on complexity (simple=1-3, medium=5-8, complex=13)
- Extract relevant labels from domain keywords
- Generate 2-5 acceptance criteria

Return ONLY the JSON, no explanations.`;
        try {
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama3.1-8b',
                messages: [
                    { role: 'system', content: 'You are a JSON-only response assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0].message.content;
            // Extract JSON from response (handle markdown code blocks)
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```\n?/g, '');
            }
            const parsed = JSON.parse(jsonStr);
            return parsed;
        }
        catch (error) {
            console.error('❌ Parse error:', error);
            // Fallback: basic parsing
            return {
                type: 'task',
                summary: text.substring(0, 100),
                description: text,
                priority: 'medium',
                storyPoints: 5,
                labels: [],
                confidence: 0.5
            };
        }
    }
    /**
     * Find similar issues using semantic search
     */
    async findSimilarIssues(summary, projectId) {
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            // Get all issues in project
            const issues = await issueRepo.find({
                where: { projectId },
                select: ['id', 'key', 'summary', 'description']
            });
            // Simple keyword-based similarity (can be enhanced with embeddings)
            const keywords = this.extractKeywords(summary);
            const scored = issues.map(issue => {
                const issueKeywords = this.extractKeywords(issue.summary + ' ' + (issue.description || ''));
                const commonKeywords = keywords.filter(k => issueKeywords.includes(k));
                const similarity = commonKeywords.length / Math.max(keywords.length, 1);
                return {
                    id: issue.id,
                    key: issue.key,
                    summary: issue.summary,
                    similarity
                };
            });
            // Return top 5 similar issues
            return scored
                .filter(s => s.similarity > 0.3)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5);
        }
        catch (error) {
            console.error('❌ Find similar issues error:', error);
            return [];
        }
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being'];
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.includes(word));
    }
    /**
     * Suggest assignee based on expertise
     */
    async suggestAssignee(structured, projectId) {
        try {
            // Get project members
            const memberRepo = database_1.AppDataSource.getRepository('ProjectMember');
            const members = await memberRepo.find({
                where: { projectId },
                relations: ['user']
            });
            if (!members || members.length === 0) {
                return undefined;
            }
            // Simple heuristic: assign to member with relevant labels
            const keywords = this.extractKeywords(structured.summary);
            // For now, return first available member
            // TODO: Implement expertise matching based on past issues
            return members[0]?.userId;
        }
        catch (error) {
            console.error('❌ Suggest assignee error:', error);
            return undefined;
        }
    }
    /**
     * Generate additional suggestions
     */
    async generateSuggestions(structured, similar) {
        const suggestions = [];
        // Suggest linking to similar issues
        if (similar.length > 0) {
            suggestions.push(`Found ${similar.length} similar issue(s). Consider linking or merging.`);
        }
        // Suggest breaking down large stories
        if (structured.storyPoints && structured.storyPoints > 8) {
            suggestions.push('This issue has high complexity. Consider breaking it into smaller tasks.');
        }
        // Suggest adding labels
        if (structured.labels.length === 0) {
            suggestions.push('Add labels to improve organization and searchability.');
        }
        // Suggest adding acceptance criteria
        if (!structured.acceptanceCriteria || structured.acceptanceCriteria.length === 0) {
            suggestions.push('Define clear acceptance criteria for better clarity.');
        }
        return suggestions;
    }
    /**
     * Auto-complete issue description
     */
    async autoCompleteDescription(partialDescription, issueType) {
        const prompt = `Complete this ${issueType} description professionally:

Partial description: "${partialDescription}"

Continue the description with:
- Clear context and background
- Specific requirements
- Expected behavior
- Additional relevant details

Keep it concise and professional. Return only the completed description.`;
        try {
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama3.1-8b',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content.trim();
        }
        catch (error) {
            console.error('❌ Auto-complete error:', error);
            return partialDescription;
        }
    }
    /**
     * Generate acceptance criteria
     */
    async generateAcceptanceCriteria(summary, description) {
        const prompt = `Generate 3-5 clear acceptance criteria for this issue:

Summary: ${summary}
Description: ${description}

Return as a JSON array of strings. Each criterion should be:
- Specific and measurable
- Testable
- Clear and concise
- Start with "Given/When/Then" or "User can/should"

Return ONLY the JSON array, no explanations.`;
        try {
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama3.1-8b',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 300
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0].message.content.trim();
            let jsonStr = content;
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```\n?/g, '');
            }
            return JSON.parse(jsonStr);
        }
        catch (error) {
            console.error('❌ Generate acceptance criteria error:', error);
            return [
                'User can complete the main functionality',
                'System validates all inputs correctly',
                'Error handling works as expected'
            ];
        }
    }
}
exports.AIIssueCreatorService = AIIssueCreatorService;
exports.aiIssueCreatorService = new AIIssueCreatorService();
