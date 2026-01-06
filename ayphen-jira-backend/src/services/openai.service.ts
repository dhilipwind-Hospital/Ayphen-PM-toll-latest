import axios from 'axios';

export class OpenAIService {
  private apiKey: string;
  private baseURL: string;
  private isConfigured: boolean;

  constructor() {
    this.apiKey = process.env.CEREBRAS_API_KEY || process.env.OPENAI_API_KEY || '';
    this.baseURL = process.env.CEREBRAS_API_KEY 
      ? 'https://api.cerebras.ai/v1' 
      : 'https://api.openai.com/v1';
    this.isConfigured = !!this.apiKey;
    
    if (this.isConfigured) {
      console.log('🔵 AI Service configured:', process.env.CEREBRAS_API_KEY ? 'Cerebras' : 'OpenAI');
    } else {
      console.log('⚠️ AI Service: No API key configured - using fallback responses');
    }
  }

  /**
   * Check if AI is properly configured
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Fallback stories when AI is not available
   */
  private getFallbackStories(requirement: string) {
    const words = requirement.toLowerCase();
    const isAuth = words.includes('login') || words.includes('auth') || words.includes('user');
    const isUI = words.includes('ui') || words.includes('page') || words.includes('display');
    
    return {
      uiStories: [
        {
          title: isAuth ? 'User can login with email and password' : 'User can view the main dashboard',
          description: `As a user, I want to ${isAuth ? 'login securely' : 'see an overview'}, so that I can ${isAuth ? 'access my account' : 'understand the current status'}`,
          acceptanceCriteria: [
            isAuth ? 'Email field validates format' : 'Dashboard loads within 3 seconds',
            isAuth ? 'Password field is masked' : 'Key metrics are displayed',
            isAuth ? 'Error message shown for invalid credentials' : 'Data refreshes automatically'
          ]
        },
        {
          title: isUI ? 'User can navigate between sections' : 'User can perform primary action',
          description: 'As a user, I want clear navigation, so that I can find features easily',
          acceptanceCriteria: ['Navigation is visible', 'Current section is highlighted', 'Mobile menu works']
        }
      ],
      apiStories: [
        {
          title: isAuth ? 'API endpoint for user authentication' : 'API endpoint for data retrieval',
          description: `As an API consumer, I want a ${isAuth ? 'secure auth endpoint' : 'data endpoint'}, so that I can ${isAuth ? 'verify credentials' : 'fetch required data'}`,
          acceptanceCriteria: [
            isAuth ? 'POST /api/auth/login accepts credentials' : 'GET endpoint returns JSON',
            isAuth ? 'Returns JWT token on success' : 'Supports pagination',
            isAuth ? 'Returns 401 on invalid credentials' : 'Returns proper error codes'
          ]
        },
        {
          title: 'API endpoint for data validation',
          description: 'As an API consumer, I want input validation, so that data integrity is maintained',
          acceptanceCriteria: ['Validates required fields', 'Returns 400 for invalid input', 'Sanitizes user input']
        }
      ],
      _fallback: true,
      _message: 'AI not configured - showing template stories. Set CEREBRAS_API_KEY or OPENAI_API_KEY for AI-generated content.'
    };
  }

  async generateStories(requirement: string) {
    // Return fallback if not configured
    if (!this.isConfigured) {
      console.log('⚠️ AI not configured, returning fallback stories');
      return this.getFallbackStories(requirement);
    }

    const prompt = `
You are a Product Manager. Given this Epic requirement, generate User Stories.

REQUIREMENT:
${requirement}

Generate EXACTLY:
1. 5 UI User Stories (frontend/user-facing features)
2. 5 API User Stories (backend/API features)

For each story, provide:
- Title (concise, user-focused, max 100 chars)
- Description (As a [user], I want [goal], so that [benefit])
- Acceptance Criteria (3-5 testable criteria)

Return as JSON with this exact structure:
{
  "uiStories": [
    {
      "title": "User can login with email",
      "description": "As a user, I want to login with my email, so that I can access my account",
      "acceptanceCriteria": ["Email field validates format", "Password field is masked", "Login button is enabled when fields are valid"]
    }
  ],
  "apiStories": [
    {
      "title": "API endpoint for user authentication",
      "description": "As an API consumer, I want an authentication endpoint, so that I can verify user credentials",
      "acceptanceCriteria": ["POST /api/auth/login accepts email and password", "Returns JWT token on success", "Returns 401 on invalid credentials"]
    }
  ]
}
`;

    try {
      console.log('🤖 Calling AI API...');
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: process.env.CEREBRAS_API_KEY ? 'llama-3.3-70b' : 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      console.log('✅ AI API succeeded!');
      let content = response.data.choices[0].message.content || '{}';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(content);
    } catch (error: any) {
      console.error('❌ AI API failed:', error.message);
      console.log('⚠️ Returning fallback stories');
      return this.getFallbackStories(requirement);
    }
  }

  /**
   * Generate stories WITH Epic + Project context (Context-Aware AI)
   */
  async generateStoriesWithContext(requirement: string, context: any) {
    const prompt = `
You are a Senior Product Manager creating User Stories for a Jira project.

**PROJECT CONTEXT:**
Project: ${context.project?.name || 'Unknown'}
Tech Stack: ${context.project?.techStack?.join(', ') || 'Not specified'}
Average Story Points: ${context.project?.avgStoryPoints || 5}
Common Labels: ${context.project?.commonLabels?.join(', ') || 'None'}
${context.project?.namingConventions?.apiPattern ? `API Pattern: ${context.project.namingConventions.apiPattern}` : ''}

**PARENT EPIC:**
Title: ${context.epic?.summary || 'Unknown'}
Description: ${context.epic?.description || 'No description'}
Goals: ${context.epic?.goals?.join('; ') || 'Not specified'}
Progress: ${context.epic?.completedStories || 0}/${context.epic?.totalStories || 0} stories completed

**RELATED STORIES IN THIS EPIC:**
${context.relatedStories?.length > 0
        ? context.relatedStories.map((s: any, i: number) =>
          `${i + 1}. [${s.storyPoints || '?'} pts] ${s.summary} (Status: ${s.status})`
        ).join('\n')
        : 'This is the first story in the epic'}

**NEW REQUIREMENT:**
${requirement}

**INSTRUCTIONS:**
1. Align stories with Epic goals: ${context.epic?.goals?.[0] || 'project objectives'}
2. DON'T duplicate existing stories - check the related stories list
3. Reference related stories when applicable (e.g., "Extends STORY-123")
4. Follow project's ${context.project?.techStack?.[0] || 'technical'} conventions
5. Use similar story point values as existing stories: ${context.project?.preferredPointValues?.join(', ') || '2, 5, 8'}
6. Apply common labels: ${context.project?.commonLabels?.slice(0, 3).join(', ') || 'None'}
7. Generate 2-4 UI stories and 2-4 API stories

Return ONLY valid JSON with this EXACT structure:
{
  "uiStories": [
    {
      "title": "User can [action]",
      "description": "As a [user], I want [goal], so that [benefit]",
      "acceptanceCriteria": ["criterion 1", "criterion 2", "criterion 3"]
    }
  ],
  "apiStories": [
    {
      "title": "API endpoint for [feature]",
      "description": "As an API consumer, I want [goal], so that [benefit]",
      "acceptanceCriteria": ["criterion 1", "criterion 2", "criterion 3"]
    }
  ]
}
`;

    if (!this.isConfigured) {
      console.log('⚠️ AI not configured, returning fallback stories');
      return this.getFallbackStories(requirement);
    }

    try {
      console.log('🤖 Calling AI API with CONTEXT...');
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: process.env.CEREBRAS_API_KEY ? 'llama-3.3-70b' : 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      console.log('✅ Context-aware generation succeeded!');
      let content = response.data.choices[0].message.content || '{}';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(content);
    } catch (error: any) {
      console.error('❌ AI API failed:', error.message);
      return this.getFallbackStories(requirement);
    }
  }

  /**
   * Fallback test cases when AI is not available
   */
  private getFallbackTestCases(story: any) {
    return {
      testCases: [
        {
          title: `Verify ${story.title || 'feature'} works correctly`,
          steps: ['Navigate to the feature', 'Perform the main action', 'Verify the result'],
          expectedResult: 'Feature works as expected',
          categories: ['smoke', 'sanity']
        },
        {
          title: `Verify ${story.title || 'feature'} handles errors`,
          steps: ['Navigate to the feature', 'Provide invalid input', 'Verify error handling'],
          expectedResult: 'Appropriate error message is shown',
          categories: ['regression']
        },
        {
          title: `Verify ${story.title || 'feature'} edge cases`,
          steps: ['Test with empty input', 'Test with special characters', 'Test boundary values'],
          expectedResult: 'All edge cases handled properly',
          categories: ['regression']
        }
      ],
      _fallback: true,
      _message: 'AI not configured - showing template test cases.'
    };
  }

  async generateTestCases(story: any) {
    if (!this.isConfigured) {
      console.log('⚠️ AI not configured, returning fallback test cases');
      return this.getFallbackTestCases(story);
    }

    const prompt = `
You are a QA Engineer. Generate test cases for this User Story.

STORY:
Title: ${story.title}
Description: ${story.description}
Type: ${story.type}
Acceptance Criteria:
${story.acceptanceCriteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

Generate EXACTLY 4 ${story.type === 'ui' ? 'UI' : 'API'} test cases covering:
1. 1 Smoke test (critical happy path)
2. 1 Sanity test (basic functionality)
3. 2 Regression tests (edge cases and error scenarios)

For each test case:
- Title (clear, specific)
- Steps (array of strings, detailed actions)
- Expected Result (what should happen)
- Categories (array: must include at least one of: "smoke", "sanity", "regression")

Return as JSON with this exact structure:
{
  "testCases": [
    {
      "title": "Verify successful login with valid credentials",
      "steps": ["Navigate to login page", "Enter valid email", "Enter valid password", "Click login button"],
      "expectedResult": "User is redirected to dashboard and sees welcome message",
      "categories": ["smoke", "sanity"]
    }
  ]
}
`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: process.env.CEREBRAS_API_KEY ? 'llama-3.3-70b' : 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      let content = response.data.choices[0].message.content || '{}';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(content);
    } catch (error: any) {
      console.error('❌ AI API failed:', error.message);
      return this.getFallbackTestCases(story);
    }
  }

  async detectChanges(oldContent: string, newContent: string) {
    if (!this.isConfigured) {
      return {
        hasChanges: oldContent !== newContent,
        changes: [{ type: 'modified', section: 'Content', impact: 'medium', description: 'Content was modified' }],
        impactedAreas: ['general'],
        _fallback: true
      };
    }
    const prompt = `
You are a Change Analyst. Compare these two requirement versions and identify changes.

OLD VERSION:
${oldContent}

NEW VERSION:
${newContent}

Analyze:
1. What changed (added, modified, removed features/requirements)
2. Impact level for each change (high, medium, low)
3. Which functional areas are affected

Return as JSON with this exact structure:
{
  "hasChanges": true,
  "changes": [
    {
      "type": "added",
      "section": "Authentication",
      "impact": "high",
      "description": "Added two-factor authentication requirement"
    }
  ],
  "impactedAreas": ["authentication", "security", "user-management"]
}
`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: process.env.CEREBRAS_API_KEY ? 'llama-3.3-70b' : 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      let content = response.data.choices[0].message.content || '{}';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(content);
    } catch (error: any) {
      console.error('❌ AI API failed:', error.message);
      return {
        hasChanges: oldContent !== newContent,
        changes: [{ type: 'modified', section: 'Content', impact: 'medium', description: 'Content was modified' }],
        impactedAreas: ['general'],
        _fallback: true
      };
    }
  }
}
