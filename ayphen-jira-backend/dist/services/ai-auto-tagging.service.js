"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAutoTaggingService = exports.AIAutoTaggingService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const axios_1 = __importDefault(require("axios"));
class AIAutoTaggingService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        // Predefined tag categories and patterns
        this.tagPatterns = {
            technical: {
                'frontend': ['react', 'ui', 'component', 'interface', 'css', 'html', 'javascript', 'vue', 'angular'],
                'backend': ['api', 'server', 'database', 'node', 'express', 'endpoint', 'service'],
                'database': ['sql', 'query', 'schema', 'migration', 'postgres', 'mysql', 'mongodb'],
                'api': ['rest', 'graphql', 'endpoint', 'integration', 'webhook'],
                'mobile': ['ios', 'android', 'mobile', 'app', 'native', 'react-native'],
                'devops': ['deploy', 'ci/cd', 'docker', 'kubernetes', 'pipeline', 'infrastructure'],
                'security': ['auth', 'authentication', 'authorization', 'encryption', 'vulnerability', 'xss', 'csrf'],
                'performance': ['slow', 'optimization', 'cache', 'speed', 'latency', 'memory'],
                'testing': ['test', 'qa', 'unit test', 'integration test', 'e2e']
            },
            functional: {
                'user-management': ['user', 'account', 'profile', 'login', 'signup', 'registration'],
                'payment': ['payment', 'billing', 'subscription', 'checkout', 'stripe', 'paypal'],
                'notification': ['email', 'notification', 'alert', 'message', 'sms'],
                'search': ['search', 'filter', 'query', 'find'],
                'reporting': ['report', 'analytics', 'dashboard', 'chart', 'metrics'],
                'admin': ['admin', 'settings', 'configuration', 'management']
            },
            priority: {
                'critical': ['critical', 'urgent', 'emergency', 'production down', 'outage'],
                'customer-request': ['customer', 'client', 'user request', 'feedback'],
                'technical-debt': ['refactor', 'cleanup', 'technical debt', 'legacy'],
                'enhancement': ['improvement', 'enhancement', 'feature', 'new']
            }
        };
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }
    /**
     * Analyze issue and suggest tags
     */
    async suggestTags(issueId) {
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const issue = await issueRepo.findOne({ where: { id: issueId } });
            if (!issue) {
                throw new Error('Issue not found');
            }
            const currentTags = issue.labels || [];
            const text = `${issue.summary} ${issue.description || ''}`.toLowerCase();
            // Pattern-based tag extraction
            const patternTags = this.extractTagsFromPatterns(text, issue.type);
            // AI-powered tag extraction
            const aiTags = await this.getAITagSuggestions(issue);
            // Merge and deduplicate
            const allSuggestions = this.mergeSuggestions(patternTags, aiTags);
            // Filter high-confidence tags
            const highConfidenceTags = allSuggestions
                .filter(t => t.confidence >= 60)
                .sort((a, b) => b.confidence - a.confidence);
            // Determine tags to add (not already present)
            const tagsToAdd = highConfidenceTags
                .filter(t => !currentTags.includes(t.tag))
                .map(t => t.tag);
            // Calculate overall confidence
            const avgConfidence = highConfidenceTags.length > 0
                ? highConfidenceTags.reduce((sum, t) => sum + t.confidence, 0) / highConfidenceTags.length
                : 0;
            return {
                suggestedTags: highConfidenceTags,
                currentTags,
                tagsToAdd,
                tagsToRemove: [], // Could implement tag removal logic
                confidence: Math.round(avgConfidence)
            };
        }
        catch (error) {
            console.error('❌ Auto-tagging error:', error);
            throw new Error(`Failed to suggest tags: ${error.message}`);
        }
    }
    /**
     * Extract tags using pattern matching
     */
    extractTagsFromPatterns(text, issueType) {
        const suggestions = [];
        // Check all pattern categories
        for (const [category, patterns] of Object.entries(this.tagPatterns)) {
            for (const [tag, keywords] of Object.entries(patterns)) {
                const matches = keywords.filter(keyword => text.includes(keyword));
                if (matches.length > 0) {
                    const confidence = Math.min(50 + (matches.length * 15), 95);
                    suggestions.push({
                        tag,
                        confidence,
                        reason: `Detected keywords: ${matches.slice(0, 2).join(', ')}`,
                        category: category
                    });
                }
            }
        }
        // Type-specific tags
        if (issueType === 'bug') {
            suggestions.push({
                tag: 'bug',
                confidence: 100,
                reason: 'Issue type is bug',
                category: 'status'
            });
        }
        else if (issueType === 'story') {
            suggestions.push({
                tag: 'feature',
                confidence: 80,
                reason: 'Issue type is story',
                category: 'functional'
            });
        }
        return suggestions;
    }
    /**
     * Get AI-powered tag suggestions
     */
    async getAITagSuggestions(issue) {
        try {
            const prompt = `Analyze this issue and suggest relevant tags/labels.

Issue:
- Type: ${issue.type}
- Summary: ${issue.summary}
- Description: ${issue.description || 'No description'}
- Current Labels: ${issue.labels?.join(', ') || 'None'}

Return ONLY a valid JSON array of tag suggestions:
[
  {
    "tag": "tag-name",
    "confidence": number (0-100),
    "reason": "why this tag applies",
    "category": "technical" | "functional" | "priority" | "team" | "status"
  }
]

Tag Categories:
- technical: frontend, backend, database, api, mobile, devops, security, performance
- functional: user-management, payment, notification, search, reporting
- priority: critical, customer-request, technical-debt, enhancement
- team: team-specific tags
- status: bug, feature, improvement

Guidelines:
- Suggest 3-7 most relevant tags
- Be specific and actionable
- Consider technical area, business domain, and priority
- Don't suggest generic tags like "issue" or "task"`;
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama3.1-8b',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at categorizing and tagging software issues. Return only valid JSON arrays.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.4,
                max_tokens: 600
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0].message.content.trim();
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const tags = JSON.parse(jsonMatch[0]);
                return tags.map((t) => ({
                    tag: t.tag || '',
                    confidence: t.confidence || 70,
                    reason: t.reason || 'AI suggested',
                    category: t.category || 'functional'
                }));
            }
            return [];
        }
        catch (error) {
            console.error('AI tag suggestion failed:', error);
            return [];
        }
    }
    /**
     * Merge pattern and AI suggestions
     */
    mergeSuggestions(patternTags, aiTags) {
        const merged = new Map();
        // Add pattern tags
        for (const tag of patternTags) {
            merged.set(tag.tag, tag);
        }
        // Merge AI tags (boost confidence if already exists)
        for (const tag of aiTags) {
            if (merged.has(tag.tag)) {
                const existing = merged.get(tag.tag);
                existing.confidence = Math.min(existing.confidence + 10, 100);
                existing.reason += ` + AI confirmed`;
            }
            else {
                merged.set(tag.tag, tag);
            }
        }
        return Array.from(merged.values());
    }
    /**
     * Apply suggested tags to issue
     */
    async applyTags(issueId, tags) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const issue = await issueRepo.findOne({ where: { id: issueId } });
        if (!issue) {
            throw new Error('Issue not found');
        }
        // Merge with existing tags (deduplicate)
        const existingTags = issue.labels || [];
        const newTags = [...new Set([...existingTags, ...tags])];
        issue.labels = newTags;
        await issueRepo.save(issue);
        return issue;
    }
    /**
     * Bulk tag multiple issues
     */
    async bulkSuggestTags(issueIds) {
        const results = new Map();
        for (const issueId of issueIds) {
            try {
                const result = await this.suggestTags(issueId);
                results.set(issueId, result);
            }
            catch (error) {
                console.error(`Failed to suggest tags for issue ${issueId}:`, error);
            }
        }
        return results;
    }
    /**
     * Bulk apply tags
     */
    async bulkApplyTags(issueIds) {
        let appliedCount = 0;
        for (const issueId of issueIds) {
            try {
                const result = await this.suggestTags(issueId);
                if (result.tagsToAdd.length > 0) {
                    await this.applyTags(issueId, result.tagsToAdd);
                    appliedCount++;
                }
            }
            catch (error) {
                console.error(`Failed to apply tags for issue ${issueId}:`, error);
            }
        }
        return appliedCount;
    }
}
exports.AIAutoTaggingService = AIAutoTaggingService;
exports.aiAutoTaggingService = new AIAutoTaggingService();
