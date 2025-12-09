"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTestCaseGeneratorService = exports.AITestCaseGeneratorService = void 0;
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const test_case_service_1 = require("./test-case.service");
class AITestCaseGeneratorService {
    constructor() {
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        this.cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';
    }
    /**
     * Generate test cases for an issue
     */
    async generateTestCases(issueId) {
        try {
            console.log(`🧪 Generating test cases for issue: ${issueId}`);
            // Get issue details
            const issue = await this.getIssue(issueId);
            if (!issue) {
                throw new Error('Issue not found');
            }
            // Generate test cases using AI
            const testCases = await this.generateWithAI(issue);
            // Save to database
            try {
                await test_case_service_1.testCaseService.createMultiple(testCases.map(tc => ({
                    title: tc.title,
                    description: tc.description,
                    steps: tc.steps,
                    expectedResult: tc.expectedResult,
                    type: tc.type,
                    status: 'active',
                    issueId: issue.id,
                    projectId: issue.projectId,
                    testCaseKey: `TC-${issue.key.split('-')[0]}-${Date.now().toString().slice(-4)}` // Simple unique key generation
                })));
                console.log(`✅ Saved ${testCases.length} test cases to database`);
            }
            catch (dbError) {
                console.error('⚠️ Failed to save test cases to DB:', dbError);
                // Continue to return the generated cases even if save fails
            }
            // Calculate coverage
            const coverage = this.calculateCoverage(testCases);
            // Generate recommendations
            const recommendations = this.generateRecommendations(issue, testCases, coverage);
            return {
                issueId: issue.id,
                issueKey: issue.key,
                summary: issue.summary,
                testCases,
                coverage,
                recommendations
            };
        }
        catch (error) {
            console.error('❌ Test case generation error:', error);
            throw new Error(`Failed to generate test cases: ${error.message}`);
        }
    }
    /**
     * Get issue by ID
     */
    async getIssue(issueId) {
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        return await issueRepo.findOne({ where: { id: issueId } });
    }
    /**
     * Generate test cases using AI
     */
    async generateWithAI(issue) {
        try {
            const prompt = `You are an expert QA engineer. Generate comprehensive test cases for this user story/issue.

Issue:
Type: ${issue.type}
Summary: ${issue.summary}
Description: ${issue.description || 'No description'}
Acceptance Criteria: ${this.extractAcceptanceCriteria(issue.description || '')}

Generate test cases covering:
1. Happy path scenarios
2. Edge cases
3. Error handling
4. Boundary conditions
5. Integration points

Return ONLY a valid JSON array:
[
  {
    "title": "Test case title",
    "description": "What this test validates",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "expectedResult": "What should happen",
    "priority": "critical" | "high" | "medium" | "low",
    "type": "functional" | "integration" | "unit" | "e2e" | "api",
    "automated": true/false
  }
]

Generate 5-10 test cases covering all scenarios.`;
            const response = await axios_1.default.post(this.cerebrasEndpoint, {
                model: 'llama3.1-8b',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert QA engineer specializing in test case design. Return only valid JSON arrays.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.cerebrasApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0].message.content.trim();
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const testCases = JSON.parse(jsonMatch[0]);
                return testCases.map((tc, index) => ({
                    id: `test-${issue.id}-${index + 1}`,
                    title: tc.title || `Test case ${index + 1}`,
                    description: tc.description || '',
                    steps: tc.steps || [],
                    expectedResult: tc.expectedResult || '',
                    priority: tc.priority || 'medium',
                    type: tc.type || 'functional',
                    automated: tc.automated || false,
                    testData: tc.testData
                }));
            }
            return this.fallbackGeneration(issue);
        }
        catch (error) {
            console.error('AI generation failed, using fallback:', error);
            return this.fallbackGeneration(issue);
        }
    }
    /**
     * Fallback test case generation
     */
    fallbackGeneration(issue) {
        const testCases = [];
        // Happy path
        testCases.push({
            id: `test-${issue.id}-1`,
            title: `${issue.summary} - Happy Path`,
            description: 'Verify the main functionality works as expected',
            steps: [
                'Navigate to the feature',
                'Perform the main action',
                'Verify the result'
            ],
            expectedResult: 'Feature works correctly with valid input',
            priority: 'critical',
            type: 'functional',
            automated: false
        });
        // Error handling
        testCases.push({
            id: `test-${issue.id}-2`,
            title: `${issue.summary} - Error Handling`,
            description: 'Verify error handling with invalid input',
            steps: [
                'Navigate to the feature',
                'Provide invalid input',
                'Verify error message'
            ],
            expectedResult: 'Appropriate error message is displayed',
            priority: 'high',
            type: 'functional',
            automated: false
        });
        // Edge case
        testCases.push({
            id: `test-${issue.id}-3`,
            title: `${issue.summary} - Edge Cases`,
            description: 'Verify behavior with boundary values',
            steps: [
                'Test with minimum value',
                'Test with maximum value',
                'Test with empty value'
            ],
            expectedResult: 'System handles edge cases gracefully',
            priority: 'medium',
            type: 'functional',
            automated: false
        });
        return testCases;
    }
    /**
     * Extract acceptance criteria from description
     */
    extractAcceptanceCriteria(description) {
        const lines = description.split('\n');
        const criteria = [];
        for (const line of lines) {
            if (line.trim().match(/^[-*]\s/)) {
                criteria.push(line.trim());
            }
        }
        return criteria.length > 0 ? criteria.join('\n') : 'No acceptance criteria found';
    }
    /**
     * Calculate test coverage
     */
    calculateCoverage(testCases) {
        let happy_path = 0;
        let edge_cases = 0;
        let error_handling = 0;
        for (const tc of testCases) {
            const title = tc.title.toLowerCase();
            const desc = tc.description.toLowerCase();
            if (title.includes('happy') || title.includes('main') || title.includes('basic')) {
                happy_path++;
            }
            if (title.includes('edge') || title.includes('boundary') || desc.includes('edge')) {
                edge_cases++;
            }
            if (title.includes('error') || title.includes('invalid') || desc.includes('error')) {
                error_handling++;
            }
        }
        return {
            happy_path,
            edge_cases,
            error_handling,
            total: testCases.length
        };
    }
    /**
     * Generate recommendations
     */
    generateRecommendations(issue, testCases, coverage) {
        const recommendations = [];
        if (coverage.happy_path === 0) {
            recommendations.push('Add happy path test cases');
        }
        if (coverage.edge_cases === 0) {
            recommendations.push('Add edge case test scenarios');
        }
        if (coverage.error_handling === 0) {
            recommendations.push('Add error handling test cases');
        }
        if (coverage.total < 5) {
            recommendations.push('Consider adding more test cases for better coverage');
        }
        const automatedCount = testCases.filter(tc => tc.automated).length;
        if (automatedCount === 0) {
            recommendations.push('Consider automating some test cases');
        }
        if (issue.type === 'bug') {
            recommendations.push('Add regression test to prevent bug recurrence');
        }
        if (recommendations.length === 0) {
            recommendations.push('Test coverage looks good!');
        }
        return recommendations;
    }
    /**
     * Generate API test cases
     */
    async generateAPITests(endpoint) {
        const testCases = [];
        // Success case
        testCases.push({
            id: `api-test-${Date.now()}-1`,
            title: `${endpoint.method} ${endpoint.path} - Success`,
            description: 'Verify successful API response',
            steps: [
                `Send ${endpoint.method} request to ${endpoint.path}`,
                'Include valid parameters and body',
                'Verify response status and data'
            ],
            expectedResult: 'Returns 200 OK with expected data',
            priority: 'critical',
            type: 'api',
            automated: true,
            testData: {
                method: endpoint.method,
                path: endpoint.path,
                expectedStatus: 200
            }
        });
        // Error cases
        testCases.push({
            id: `api-test-${Date.now()}-2`,
            title: `${endpoint.method} ${endpoint.path} - Invalid Input`,
            description: 'Verify error handling with invalid input',
            steps: [
                `Send ${endpoint.method} request with invalid data`,
                'Verify error response'
            ],
            expectedResult: 'Returns 400 Bad Request with error message',
            priority: 'high',
            type: 'api',
            automated: true,
            testData: {
                method: endpoint.method,
                path: endpoint.path,
                expectedStatus: 400
            }
        });
        // Authentication
        testCases.push({
            id: `api-test-${Date.now()}-3`,
            title: `${endpoint.method} ${endpoint.path} - Unauthorized`,
            description: 'Verify authentication is required',
            steps: [
                `Send ${endpoint.method} request without auth`,
                'Verify unauthorized response'
            ],
            expectedResult: 'Returns 401 Unauthorized',
            priority: 'high',
            type: 'api',
            automated: true,
            testData: {
                method: endpoint.method,
                path: endpoint.path,
                expectedStatus: 401
            }
        });
        return testCases;
    }
    /**
     * Generate test data
     */
    async generateTestData(testCase) {
        // Generate realistic test data based on test case
        return {
            valid: {
            // Valid test data
            },
            invalid: {
            // Invalid test data
            },
            edge: {
            // Edge case data
            }
        };
    }
}
exports.AITestCaseGeneratorService = AITestCaseGeneratorService;
exports.aiTestCaseGeneratorService = new AITestCaseGeneratorService();
