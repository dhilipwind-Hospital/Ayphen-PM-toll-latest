import { GoogleGenerativeAI } from '@google/generative-ai';
import { Issue } from '../entities/Issue';

// Types for AI classification results
export interface BugClassification {
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    tags: string[];
    priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
    impact: string;
    estimatedUsers: number;
    confidence: number;
    reasoning: string;
}

export interface SimilarBug {
    issueKey: string;
    title: string;
    similarity: number;
    resolution?: string;
}

export interface RootCauseAnalysis {
    likelyFile: string;
    likelyFunction: string;
    confidence: number;
    suggestedAssignee?: string;
    relatedIssues: string[];
    reasoning: string;
}

export class AIBugAnalyzerService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY or GOOGLE_API_KEY not set - Bug AI Analyzer will not function');
            this.genAI = null as any;
            this.model = null as any;
            return;
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    /**
     * Auto-classify a bug with severity, tags, priority, and impact
     */
    async classifyBug(issue: Issue): Promise<BugClassification> {
        const prompt = `You are an expert bug triaging system. Analyze this bug report and provide a detailed classification.

Bug Title: ${issue.summary}
Bug Description: ${issue.description || 'No description provided'}

Analyze and provide:
1. Severity level (Critical/High/Medium/Low)
   - Critical: System down, data loss, security breach
   - High: Major feature broken, affects many users
   - Medium: Feature partially broken, workaround exists
   - Low: Minor issue, cosmetic problem

2. Up to 3 relevant tags from: security, performance, ui, api, authentication, database, payment, integration, mobile, accessibility, data-integrity

3. Priority (Highest/High/Medium/Low/Lowest)

4. Impact description (1 sentence)

5. Estimated number of users affected (number)

6. Confidence score (0.0 to 1.0)

7. Brief reasoning for your classification

Respond ONLY with valid JSON in this exact format:
{
  "severity": "High",
  "tags": ["api", "authentication"],
  "priority": "High",
  "impact": "Users cannot log in to the application",
  "estimatedUsers": 500,
  "confidence": 0.9,
  "reasoning": "Authentication is a critical path; failure affects all users trying to access the system"
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();

            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from AI');
            }

            const classification: BugClassification = JSON.parse(jsonMatch[0]);

            // Validate the response
            if (!classification.severity || !classification.tags || !classification.priority) {
                throw new Error('Incomplete classification from AI');
            }

            return classification;
        } catch (error) {
            console.error('Error classifying bug:', error);

            // Fallback classification
            return {
                severity: 'Medium',
                tags: ['bug'],
                priority: 'Medium',
                impact: 'Impact analysis unavailable',
                estimatedUsers: 0,
                confidence: 0.3,
                reasoning: 'AI classification failed, using default values'
            };
        }
    }

    /**
     * Find similar/duplicate bugs using semantic analysis
     */
    async findSimilarBugs(issue: Issue, allIssues: Issue[]): Promise<SimilarBug[]> {
        // Filter to only bugs
        const bugs = allIssues.filter(i => i.type === 'bug' && i.id !== issue.id);

        if (bugs.length === 0) {
            return [];
        }

        const prompt = `You are analyzing bug similarity. Compare this new bug to existing bugs and find duplicates or similar issues.

New Bug:
Title: ${issue.summary}
Description: ${issue.description || 'No description'}

Existing Bugs:
${bugs.slice(0, 20).map((bug, idx) => `${idx + 1}. [${bug.key}] ${bug.summary}\n   ${bug.description?.substring(0, 200) || ''}`).join('\n\n')}

Find bugs that are:
1. Duplicates (same root cause)
2. Very similar (related functionality)
3. Possibly related (same component/area)

Respond ONLY with valid JSON array:
[
  {
    "issueKey": "BUG-123",
    "title": "Bug title",
    "similarity": 0.95,
    "resolution": "Fixed in v1.2"
  }
]

Return empty array [] if no similar bugs found. Maximum 5 results, sorted by similarity (highest first).`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();

            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return [];
            }

            const similar: SimilarBug[] = JSON.parse(jsonMatch[0]);
            return similar.filter(s => s.similarity > 0.6); // Only return high similarity
        } catch (error) {
            console.error('Error finding similar bugs:', error);
            return [];
        }
    }

    /**
     * Analyze stack trace and identify root cause
     */
    async analyzeRootCause(issue: Issue, stackTrace?: string): Promise<RootCauseAnalysis> {
        const trace = stackTrace || this.extractStackTrace(issue.description || '');

        if (!trace) {
            return {
                likelyFile: 'Unknown',
                likelyFunction: 'Unknown',
                confidence: 0.1,
                relatedIssues: [],
                reasoning: 'No stack trace found in bug description'
            };
        }

        const prompt = `Analyze this stack trace and identify the root cause:

Bug Title: ${issue.summary}
Stack Trace:
${trace}

Provide:
1. Most likely file causing the issue
2. Most likely function/method
3. Confidence (0.0 to 1.0)
4. Brief reasoning

Respond ONLY with valid JSON:
{
  "likelyFile": "auth.service.ts",
  "likelyFunction": "validateToken",
  "confidence": 0.85,
  "reasoning": "Exception originates from token validation logic"
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response');
            }

            const analysis: RootCauseAnalysis = JSON.parse(jsonMatch[0]);
            analysis.relatedIssues = [];

            return analysis;
        } catch (error) {
            console.error('Error analyzing root cause:', error);
            return {
                likelyFile: 'Unknown',
                likelyFunction: 'Unknown',
                confidence: 0.2,
                relatedIssues: [],
                reasoning: 'Root cause analysis failed'
            };
        }
    }

    /**
     * Generate test cases to reproduce the bug
     */
    async generateTestCases(issue: Issue): Promise<string[]> {
        const prompt = `Generate test cases to reproduce this bug:

Title: ${issue.summary}
Description: ${issue.description || 'No description'}

Generate 3-5 specific test cases that would reproduce or verify this bug. Each test case should be:
- Clear and actionable
- Include expected vs actual behavior
- Cover edge cases if applicable

Respond ONLY with valid JSON array of strings:
[
  "Test 1: Attempt login with valid credentials and verify 500 error occurs",
  "Test 2: Check server logs for authentication service errors",
  "Test 3: Verify database connection during login attempt"
]`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();

            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return ['Manual testing required'];
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error generating test cases:', error);
            return [
                'Reproduce the issue as described',
                'Verify error messages and logs',
                'Test with different scenarios'
            ];
        }
    }

    /**
     * Predict bug impact and suggest priority
     */
    async predictImpact(issue: Issue): Promise<{
        userImpact: number;
        businessImpact: 'Critical' | 'High' | 'Medium' | 'Low';
        recommendedTimeframe: string;
        reasoning: string;
    }> {
        const prompt = `Analyze the business impact of this bug:

Title: ${issue.summary}
Description: ${issue.description || 'No description'}

Analyze:
1. How many users are likely affected (%)
2. Business impact level (Critical/High/Medium/Low)
3. Recommended fix timeframe (Immediate/This Sprint/Next Sprint/Backlog)
4. Reasoning

Respond ONLY with valid JSON:
{
  "userImpact": 50,
  "businessImpact": "High",
  "recommendedTimeframe": "This Sprint",
  "reasoning": "Authentication affects half of users, critical for business operations"
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error predicting impact:', error);
            return {
                userImpact: 25,
                businessImpact: 'Medium',
                recommendedTimeframe: 'Next Sprint',
                reasoning: 'Impact analysis unavailable'
            };
        }
    }

    /**
     * Extract stack trace from description
     */
    private extractStackTrace(description: string): string | null {
        // Look for common stack trace patterns
        const patterns = [
            /at\s+[\w\.<>]+\s*\([^)]+\)/g, // JavaScript/TypeScript
            /\s+at\s+[\w.]+\.[\w]+\([^)]*\)/g, // Java/C#
            /File\s+"[^"]+",\s+line\s+\d+/g, // Python
        ];

        for (const pattern of patterns) {
            const matches = description.match(pattern);
            if (matches && matches.length > 2) {
                return matches.slice(0, 10).join('\n');
            }
        }

        return null;
    }
}

export const aiBugAnalyzer = new AIBugAnalyzerService();
