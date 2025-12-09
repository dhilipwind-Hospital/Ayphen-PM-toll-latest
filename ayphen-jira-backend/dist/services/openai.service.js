"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const axios_1 = __importDefault(require("axios"));
class OpenAIService {
    constructor() {
        console.log('🔵 Using Cerebras API');
        this.apiKey = process.env.CEREBRAS_API_KEY || '';
        this.baseURL = 'https://api.cerebras.ai/v1';
    }
    async generateStories(requirement) {
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
        console.log('🤖 Calling Cerebras API...');
        const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
            model: 'llama-3.3-70b',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Cerebras succeeded!');
        let content = response.data.choices[0].message.content || '{}';
        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(content);
    }
    /**
     * Generate stories WITH Epic + Project context (Context-Aware AI)
     */
    async generateStoriesWithContext(requirement, context) {
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
            ? context.relatedStories.map((s, i) => `${i + 1}. [${s.storyPoints || '?'} pts] ${s.summary} (Status: ${s.status})`).join('\n')
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
        console.log('🤖 Calling Cerebras API with CONTEXT...');
        const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
            model: 'llama-3.3-70b',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Context-aware generation succeeded!');
        let content = response.data.choices[0].message.content || '{}';
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(content);
    }
    async generateTestCases(story) {
        const prompt = `
You are a QA Engineer. Generate test cases for this User Story.

STORY:
Title: ${story.title}
Description: ${story.description}
Type: ${story.type}
Acceptance Criteria:
${story.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

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
        const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
            model: 'llama-3.3-70b',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        let content = response.data.choices[0].message.content || '{}';
        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(content);
    }
    async detectChanges(oldContent, newContent) {
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
        const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
            model: 'llama-3.3-70b',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        let content = response.data.choices[0].message.content || '{}';
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(content);
    }
}
exports.OpenAIService = OpenAIService;
