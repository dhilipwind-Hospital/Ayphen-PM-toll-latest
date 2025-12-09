import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI clients
const cerebrasClient = process.env.CEREBRAS_API_KEY ? new Groq({
  apiKey: process.env.CEREBRAS_API_KEY,
  baseURL: 'https://api.cerebras.ai/v1',
}) : null;

const groqClient = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

const geminiClient = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!)
  : null;

/**
 * AI Test Insights Service
 * Provides AI-powered analysis and predictions for test automation
 */
export class AITestInsightsService {
  /**
   * Analyze flaky tests and provide recommendations
   */
  async analyzeFlakyTest(testCase: any, executionHistory: any[]): Promise<any> {
    const prompt = `You are a test automation expert. Analyze this flaky test and provide recommendations.

Test Case: ${testCase.title}
Test Type: ${testCase.type}
Total Runs: ${executionHistory.length}
Pass Rate: ${(executionHistory.filter((r: any) => r.status === 'passed').length / executionHistory.length * 100).toFixed(2)}%

Recent Execution Pattern:
${executionHistory.slice(0, 10).map((r: any, i: number) => `${i + 1}. ${r.status} (${r.environment}, ${r.browser})`).join('\n')}

Test Steps:
${testCase.steps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'N/A'}

Provide a JSON response with:
1. rootCause: Likely root cause of flakiness
2. recommendations: Array of specific recommendations to fix
3. priority: high/medium/low
4. estimatedEffort: hours to fix
5. preventionTips: Tips to prevent similar issues

Return only valid JSON, no markdown.`;

    try {
      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing flaky test:', error);
      return {
        rootCause: 'Unable to determine automatically',
        recommendations: ['Review test steps for timing issues', 'Add explicit waits', 'Check for race conditions'],
        priority: 'medium',
        estimatedEffort: 2,
        preventionTips: ['Use stable selectors', 'Add proper synchronization'],
      };
    }
  }

  /**
   * Predict test failure probability
   */
  async predictTestFailure(testCase: any, recentChanges: string[]): Promise<any> {
    const prompt = `You are a test automation expert. Predict if this test is likely to fail based on recent code changes.

Test Case: ${testCase.title}
Test Type: ${testCase.type}
Test Categories: ${testCase.categories?.join(', ') || 'N/A'}

Recent Code Changes:
${recentChanges.slice(0, 5).map((c, i) => `${i + 1}. ${c}`).join('\n')}

Test Steps:
${testCase.steps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'N/A'}

Provide a JSON response with:
1. failureProbability: 0-100 (percentage)
2. confidence: high/medium/low
3. reasoning: Why you think it might fail
4. affectedAreas: Which parts of the test are at risk
5. recommendation: Should we run this test? (yes/no/with-caution)

Return only valid JSON, no markdown.`;

    try {
      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error predicting test failure:', error);
      return {
        failureProbability: 50,
        confidence: 'low',
        reasoning: 'Unable to analyze automatically',
        affectedAreas: ['Unknown'],
        recommendation: 'yes',
      };
    }
  }

  /**
   * Suggest test optimization
   */
  async suggestTestOptimization(testCase: any, executionTime: number): Promise<any> {
    const prompt = `You are a test automation expert. Suggest optimizations for this slow test.

Test Case: ${testCase.title}
Test Type: ${testCase.type}
Current Execution Time: ${(executionTime / 1000).toFixed(2)} seconds

Test Steps:
${testCase.steps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'N/A'}

Provide a JSON response with:
1. optimizations: Array of specific optimization suggestions
2. estimatedTimeReduction: Percentage (0-100)
3. complexity: easy/medium/hard
4. risks: Potential risks of optimization
5. priority: high/medium/low

Return only valid JSON, no markdown.`;

    try {
      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error suggesting optimization:', error);
      return {
        optimizations: ['Reduce wait times', 'Parallelize independent steps', 'Use faster selectors'],
        estimatedTimeReduction: 30,
        complexity: 'medium',
        risks: ['May introduce flakiness if not careful'],
        priority: 'medium',
      };
    }
  }

  /**
   * Generate test data automatically
   */
  async generateTestData(testCase: any, environment: string): Promise<any> {
    const prompt = `You are a test automation expert. Generate realistic test data for this test case.

Test Case: ${testCase.title}
Test Type: ${testCase.type}
Environment: ${environment}

Test Steps:
${testCase.steps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'N/A'}

Expected Result: ${testCase.expectedResult || 'N/A'}

Generate test data as a JSON object with appropriate fields based on the test case.
Include both valid and edge case data.

Provide a JSON response with:
1. validData: Object with valid test data
2. edgeCases: Array of edge case data objects
3. invalidData: Object with invalid data for negative testing
4. description: Brief description of the data

Return only valid JSON, no markdown.`;

    try {
      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating test data:', error);
      return {
        validData: { username: 'testuser', password: 'Test@123' },
        edgeCases: [
          { username: 'a', password: 'short' },
          { username: 'very_long_username_that_exceeds_limits', password: 'Test@123' },
        ],
        invalidData: { username: '', password: '' },
        description: 'Basic test data generated',
      };
    }
  }

  /**
   * Identify missing test coverage
   */
  async identifyMissingCoverage(requirements: any[], existingTests: any[]): Promise<any> {
    const prompt = `You are a test automation expert. Identify missing test coverage.

Requirements:
${requirements.slice(0, 5).map((r, i) => `${i + 1}. ${r.title || r.name}`).join('\n')}

Existing Tests:
${existingTests.slice(0, 10).map((t, i) => `${i + 1}. ${t.title} (${t.type})`).join('\n')}

Provide a JSON response with:
1. missingAreas: Array of areas that need test coverage
2. suggestedTests: Array of test case suggestions with {title, type, priority, description}
3. coverageScore: 0-100 (percentage)
4. criticalGaps: Most important missing tests

Return only valid JSON, no markdown.`;

    try {
      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error identifying coverage:', error);
      return {
        missingAreas: ['Edge cases', 'Error handling', 'Performance testing'],
        suggestedTests: [
          { title: 'Test error handling', type: 'api', priority: 'high', description: 'Verify error responses' },
        ],
        coverageScore: 70,
        criticalGaps: ['Security testing', 'Load testing'],
      };
    }
  }

  /**
   * Answer test-related questions (Chat Assistant)
   */
  async answerQuestion(question: string, context: any): Promise<string> {
    const prompt = `You are a test automation expert assistant. Answer this question based on the context.

Question: ${question}

Context:
- Total Test Cases: ${context.totalTests || 0}
- Pass Rate: ${context.passRate || 0}%
- Failed Tests: ${context.failedTests || 0}
- Flaky Tests: ${context.flakyTests || 0}

Provide a helpful, concise answer (2-3 paragraphs max).`;

    try {
      return await this.callAI(prompt);
    } catch (error) {
      console.error('Error answering question:', error);
      return 'I apologize, but I encountered an error processing your question. Please try rephrasing or contact support.';
    }
  }

  /**
   * Call AI with automatic failover
   */
  private async callAI(prompt: string): Promise<string> {
    // Try Cerebras first (1B tokens/day)
    try {
      const response = await cerebrasClient.chat.completions.create({
        model: 'llama3.1-8b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.log('Cerebras failed, trying Gemini...');
    }

    // Try Gemini (1M tokens/min)
    if (geminiClient) {
      try {
        const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        console.log('Gemini failed, trying Groq...');
      }
    }

    // Try Cerebras (1B tokens/day)
    if (cerebrasClient) {
      try {
        const response = await cerebrasClient.chat.completions.create({
          model: 'llama-3.3-70b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        });
        return response.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Cerebras failed:', error);
      }
    }

    // Try Groq (14K tokens/min)
    if (groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        });
        return response.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Groq failed:', error);
      }
    }

    console.error('All AI providers failed or no API keys configured');
    throw new Error('AI service unavailable - please configure CEREBRAS_API_KEY or GROQ_API_KEY');
  }
}

export const aiTestInsightsService = new AITestInsightsService();
