"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiDuplicateDetector = exports.AIDuplicateDetectorService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const axios_1 = __importDefault(require("axios"));
class AIDuplicateDetectorService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
        this.cache = new Map();
    }
    /**
     * Main method: Check for duplicate issues using semantic AI
     */
    async checkDuplicates(summary, description, projectId, issueType) {
        try {
            // Check cache first
            const cacheKey = `${projectId}-${summary}-${issueType || 'all'}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.log('✅ Returning cached duplicate detection result');
                return cached;
            }
            // Get all issues in the project
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            const existingIssues = await issueRepo.find({
                where: { projectId },
                select: ['id', 'key', 'summary', 'description', 'status', 'type', 'priority'],
                order: { createdAt: 'DESC' },
                take: 100 // Limit to recent 100 issues for performance
            });
            if (existingIssues.length === 0) {
                return {
                    hasDuplicates: false,
                    duplicates: [],
                    confidence: 0,
                    suggestion: 'No existing issues to compare against.'
                };
            }
            // Filter by issue type if specified
            const filteredIssues = issueType
                ? existingIssues.filter(i => i.type === issueType)
                : existingIssues;
            // Use AI to find semantic duplicates
            const duplicates = await this.findSemanticDuplicates(summary, description, filteredIssues);
            // Calculate overall confidence
            const confidence = duplicates.length > 0
                ? Math.max(...duplicates.map(d => d.confidence))
                : 0;
            // Generate suggestion
            const suggestion = this.generateSuggestion(duplicates, confidence);
            const result = {
                hasDuplicates: duplicates.length > 0 && confidence > 60,
                duplicates: duplicates.slice(0, 5), // Top 5 duplicates
                confidence,
                suggestion
            };
            // Cache the result
            this.cache.set(cacheKey, result);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry);
            return result;
        }
        catch (error) {
            console.error('❌ Duplicate detection error:', error);
            throw new Error(`Failed to check duplicates: ${error.message}`);
        }
    }
    /**
     * Use Cerebras AI to find semantic duplicates
     */
    async findSemanticDuplicates(summary, description, existingIssues) {
        try {
            // Prepare issue data for AI
            const issuesData = existingIssues.map((issue, idx) => ({
                index: idx,
                key: issue.key,
                summary: issue.summary,
                description: issue.description?.substring(0, 200) || 'No description',
                status: issue.status,
                type: issue.type,
                priority: issue.priority
            }));
            const prompt = `You are an expert at detecting duplicate issues in a project management system. Analyze the new issue and find semantically similar existing issues.

**NEW ISSUE:**
Title: ${summary}
Description: ${description || 'No description provided'}

**EXISTING ISSUES (${issuesData.length} total):**
${issuesData.map(i => `${i.index}. [${i.key}] ${i.summary} (${i.status})
   ${i.description}`).join('\n\n')}

**TASK:**
Find issues that are:
1. **Exact duplicates** (same problem, different wording) - Confidence: 90-100%
2. **Very similar** (related problem, same component) - Confidence: 70-89%
3. **Possibly related** (similar area, might be connected) - Confidence: 60-69%

**IMPORTANT:**
- Understand the INTENT and MEANING, not just keywords
- "Login failed" = "Cannot sign in" = "Authentication error"
- "Button not working" = "Button unresponsive" = "Click doesn't work"
- Consider the issue type and context

**OUTPUT FORMAT:**
Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "index": 0,
    "similarity": 95,
    "confidence": 95,
    "reason": "Exact duplicate - same login authentication issue"
  },
  {
    "index": 3,
    "similarity": 75,
    "confidence": 75,
    "reason": "Very similar - related to same authentication component"
  }
]

Return empty array [] if no similar issues found (confidence < 60%).
Maximum 5 results, sorted by confidence (highest first).`;
            console.log('🤖 Calling Cerebras AI for duplicate detection...');
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama-3.3-70b',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at semantic similarity detection for issue tracking systems. Always return valid JSON arrays.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3, // Lower temperature for more consistent results
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            let content = response.data.choices[0].message.content || '[]';
            // Clean up the response
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            // Extract JSON array if wrapped in text
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                content = jsonMatch[0];
            }
            const aiResults = JSON.parse(content);
            console.log(`✅ AI found ${aiResults.length} potential duplicates`);
            // Map AI results to duplicate candidates
            const duplicates = aiResults
                .filter((r) => r.confidence >= 60)
                .map((r) => {
                const issue = issuesData[r.index];
                const originalIssue = existingIssues[r.index];
                return {
                    id: originalIssue.id,
                    key: issue.key,
                    summary: issue.summary,
                    description: originalIssue.description || '',
                    status: issue.status,
                    type: issue.type,
                    priority: issue.priority,
                    similarity: r.similarity || r.confidence,
                    confidence: r.confidence,
                    reason: r.reason || 'Similar issue detected'
                };
            })
                .sort((a, b) => b.confidence - a.confidence);
            return duplicates;
        }
        catch (error) {
            console.error('❌ AI duplicate detection error:', error);
            // Fallback to keyword-based detection
            console.log('⚠️ Falling back to keyword-based detection');
            return this.keywordBasedDetection(summary, description, existingIssues);
        }
    }
    /**
     * Fallback: Keyword-based duplicate detection
     */
    keywordBasedDetection(summary, description, existingIssues) {
        const keywords = this.extractKeywords(summary + ' ' + (description || ''));
        const scored = existingIssues.map(issue => {
            const issueText = issue.summary + ' ' + (issue.description || '');
            const issueKeywords = this.extractKeywords(issueText);
            // Calculate keyword overlap
            const commonKeywords = keywords.filter(k => issueKeywords.includes(k));
            const similarity = (commonKeywords.length / Math.max(keywords.length, 1)) * 100;
            // Boost score if summary is very similar
            const summaryMatch = issue.summary.toLowerCase().includes(summary.toLowerCase()) ||
                summary.toLowerCase().includes(issue.summary.toLowerCase());
            const confidence = summaryMatch ? Math.min(similarity + 20, 100) : similarity;
            return {
                id: issue.id,
                key: issue.key,
                summary: issue.summary,
                description: issue.description || '',
                status: issue.status,
                type: issue.type,
                priority: issue.priority,
                similarity,
                confidence,
                reason: summaryMatch ? 'Title contains similar keywords' : 'Similar keywords found'
            };
        });
        return scored
            .filter(s => s.confidence >= 60)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        // Remove common words
        const stopWords = new Set([
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'could', 'can', 'may', 'might', 'must', 'shall', 'to', 'from', 'in',
            'on', 'at', 'by', 'for', 'with', 'about', 'as', 'of', 'and', 'or',
            'but', 'not', 'this', 'that', 'these', 'those', 'i', 'you', 'we',
            'they', 'it', 'when', 'where', 'why', 'how', 'what', 'which', 'who'
        ]);
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word))
            .filter((word, index, self) => self.indexOf(word) === index); // Unique
    }
    /**
     * Generate suggestion based on duplicates found
     */
    generateSuggestion(duplicates, confidence) {
        if (duplicates.length === 0) {
            return 'No similar issues found. You can proceed with creating this issue.';
        }
        if (confidence >= 90) {
            return `⚠️ High probability of duplicate! Found ${duplicates.length} very similar issue(s). Please review before creating.`;
        }
        if (confidence >= 70) {
            return `⚠️ Similar issues found. Found ${duplicates.length} related issue(s) that might be duplicates. Please check.`;
        }
        return `ℹ️ Found ${duplicates.length} possibly related issue(s). Consider reviewing them.`;
    }
    /**
     * Auto-link issues as duplicates if confidence is very high (>95%)
     */
    async autoLinkDuplicates(newIssueId, duplicateIssueId, confidence) {
        if (confidence < 95) {
            return {
                success: false,
                message: 'Confidence too low for auto-linking (requires 95%+)'
            };
        }
        try {
            const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
            // Get both issues
            const newIssue = await issueRepo.findOne({ where: { id: newIssueId } });
            const duplicateIssue = await issueRepo.findOne({ where: { id: duplicateIssueId } });
            if (!newIssue || !duplicateIssue) {
                throw new Error('Issue not found');
            }
            // Add a note to the new issue description
            const linkNote = `\n\n---\n**🤖 AI Auto-Linked:** This issue was automatically identified as a duplicate of ${duplicateIssue.key} (${confidence}% confidence)`;
            newIssue.description = (newIssue.description || '') + linkNote;
            // Update status to indicate it's a duplicate
            newIssue.status = 'closed';
            await issueRepo.save(newIssue);
            console.log(`✅ Auto-linked ${newIssue.key} to ${duplicateIssue.key} (${confidence}% confidence)`);
            return {
                success: true,
                message: `Automatically linked to ${duplicateIssue.key} as duplicate`
            };
        }
        catch (error) {
            console.error('❌ Auto-link failed:', error);
            return {
                success: false,
                message: `Failed to auto-link: ${error.message}`
            };
        }
    }
    /**
     * Clear cache (useful for testing)
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Duplicate detection cache cleared');
    }
}
exports.AIDuplicateDetectorService = AIDuplicateDetectorService;
// Export singleton instance
exports.aiDuplicateDetector = new AIDuplicateDetectorService();
