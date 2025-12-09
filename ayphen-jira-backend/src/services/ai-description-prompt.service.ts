import { IssueContext } from './context-hierarchy.service';

export interface DescriptionPromptOptions {
  issueType: 'story' | 'bug' | 'task' | 'epic' | 'subtask';
  issueSummary: string;
  userInput: string;
  context: IssueContext;
  format?: 'user-story' | 'technical' | 'brief';
}

export class AIDescriptionPromptService {
  /**
   * Build AI prompt based on issue type and context
   */
  buildPrompt(options: DescriptionPromptOptions): string {
    const { issueType, issueSummary, userInput, context, format = 'user-story' } = options;

    const contextSummary = this.buildContextSection(context);
    
    switch (issueType) {
      case 'story':
        return this.buildStoryPrompt(issueSummary, userInput, contextSummary, format);
      case 'bug':
        return this.buildBugPrompt(issueSummary, userInput, contextSummary);
      case 'task':
        return this.buildTaskPrompt(issueSummary, userInput, contextSummary);
      case 'epic':
        return this.buildEpicPrompt(issueSummary, userInput, contextSummary);
      case 'subtask':
        return this.buildSubtaskPrompt(issueSummary, userInput, contextSummary);
      default:
        return this.buildGenericPrompt(issueSummary, userInput, contextSummary);
    }
  }

  private buildContextSection(context: IssueContext): string {
    const parts: string[] = [];

    if (context.project) {
      parts.push(`PROJECT CONTEXT:`);
      parts.push(`- Name: ${context.project.name}`);
      parts.push(`- Type: ${context.project.type}`);
      if (context.project.description) {
        parts.push(`- Description: ${context.project.description}`);
      }
    }

    if (context.epic) {
      parts.push(`\nEPIC CONTEXT:`);
      parts.push(`- ${context.epic.key}: ${context.epic.summary}`);
      if (context.epic.description) {
        parts.push(`- Description: ${context.epic.description}`);
      }
    }

    if (context.parentIssue) {
      parts.push(`\nPARENT ISSUE:`);
      parts.push(`- ${context.parentIssue.key}: ${context.parentIssue.summary}`);
      if (context.parentIssue.description) {
        parts.push(`- Description: ${context.parentIssue.description}`);
      }
    }

    if (context.relatedIssues.length > 0) {
      parts.push(`\nRELATED ISSUES:`);
      context.relatedIssues.slice(0, 3).forEach(issue => {
        parts.push(`- ${issue.key}: ${issue.summary}`);
      });
    }

    return parts.join('\n');
  }

  private buildStoryPrompt(summary: string, userInput: string, context: string, format: string): string {
    return `You are an expert Agile product owner writing user stories.

${context}

TASK: Write a detailed user story description for:
Title: "${summary}"
User Input: "${userInput}"

${format === 'user-story' ? `
FORMAT: Use the standard user story format:
- As a [user type], I want [goal], so that [benefit]
- Include clear acceptance criteria in Given/When/Then format
- Add test scenarios
- Consider edge cases
` : format === 'technical' ? `
FORMAT: Technical approach:
- Implementation details
- Technical requirements
- API endpoints or components needed
- Dependencies
` : `
FORMAT: Brief and concise:
- 2-3 sentences maximum
- Focus on the core functionality
- Clear and actionable
`}

REQUIREMENTS:
1. Be specific and actionable
2. Use context from the project and epic
3. Include measurable acceptance criteria
4. Consider user experience
5. Keep it clear and concise

Generate the description now:`;
  }

  private buildBugPrompt(summary: string, userInput: string, context: string): string {
    return `You are an expert QA engineer writing bug reports.

${context}

TASK: Write a detailed bug description for:
Title: "${summary}"
User Report: "${userInput}"

FORMAT:
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Additional Context:**
- Browser/Environment: [if applicable]
- Frequency: [Always/Sometimes/Rare]
- Impact: [High/Medium/Low]

REQUIREMENTS:
1. Be specific and reproducible
2. Include all necessary details
3. Consider the related features from context
4. Suggest potential causes if obvious

Generate the bug description now:`;
  }

  private buildTaskPrompt(summary: string, userInput: string, context: string): string {
    return `You are an expert software developer writing technical tasks.

${context}

TASK: Write a detailed task description for:
Title: "${summary}"
Task Details: "${userInput}"

FORMAT:
**Objective:**
[Clear goal of this task]

**Implementation Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Technical Requirements:**
- [Requirement 1]
- [Requirement 2]

**Definition of Done:**
- [ ] [Criteria 1]
- [ ] [Criteria 2]
- [ ] [Criteria 3]

REQUIREMENTS:
1. Be specific and actionable
2. Include technical details
3. Consider dependencies from parent story
4. Define clear completion criteria

Generate the task description now:`;
  }

  private buildEpicPrompt(summary: string, userInput: string, context: string): string {
    return `You are an expert product manager writing epics.

${context}

TASK: Write a comprehensive epic description for:
Title: "${summary}"
Epic Idea: "${userInput}"

FORMAT:
**Business Value:**
[Why this epic matters to the business and users]

**User Personas:**
[Who will benefit from this epic]

**High-Level Requirements:**
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

**Success Metrics:**
- [Metric 1]
- [Metric 2]

**Potential Stories:**
1. [Story idea 1]
2. [Story idea 2]
3. [Story idea 3]

REQUIREMENTS:
1. Focus on business value and user impact
2. Be strategic, not tactical
3. Include measurable success criteria
4. Suggest breakdown into stories

Generate the epic description now:`;
  }

  private buildSubtaskPrompt(summary: string, userInput: string, context: string): string {
    return `You are an expert developer writing subtasks.

${context}

TASK: Write a focused subtask description for:
Title: "${summary}"
Subtask Details: "${userInput}"

FORMAT:
**What needs to be done:**
[Clear, specific action]

**Steps:**
1. [Step 1]
2. [Step 2]

**Acceptance:**
- [ ] [Done when...]

REQUIREMENTS:
1. Keep it focused and specific
2. Should be completable in a few hours
3. Clear definition of done
4. Consider parent task context

Generate the subtask description now:`;
  }

  private buildGenericPrompt(summary: string, userInput: string, context: string): string {
    return `You are an expert project manager writing issue descriptions.

${context}

TASK: Write a clear description for:
Title: "${summary}"
Details: "${userInput}"

Generate a well-structured, clear, and actionable description that includes:
1. What needs to be done
2. Why it's important
3. How to verify completion

Generate the description now:`;
  }

  /**
   * Generate multiple suggestion variants
   */
  generateVariants(basePrompt: string): string[] {
    return [
      basePrompt + '\n\nStyle: Detailed and comprehensive',
      basePrompt + '\n\nStyle: Concise and focused',
      basePrompt + '\n\nStyle: Technical and specific',
    ];
  }
}

export const aiDescriptionPromptService = new AIDescriptionPromptService();
