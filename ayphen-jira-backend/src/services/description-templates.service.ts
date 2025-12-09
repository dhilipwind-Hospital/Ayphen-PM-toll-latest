import axios from 'axios';

/**
 * Template Section Definition
 */
export interface TemplateSection {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
  aiGenerate: boolean;
  format?: string;
  helpText?: string;
  defaultValue?: string;
}

/**
 * Template Definition
 */
export interface DescriptionTemplate {
  id: string;
  name: string;
  description: string;
  issueTypes: string[];
  category: 'bug' | 'story' | 'task' | 'epic' | 'subtask' | 'custom';
  sections: TemplateSection[];
  tags: string[];
  isDefault: boolean;
  isPublic: boolean;
  createdBy?: string;
  teamId?: string;
  usageCount: number;
  rating?: number;
}

/**
 * Filled Template
 */
export interface FilledTemplate {
  templateId: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    aiGenerated: boolean;
  }>;
  fullDescription: string;
}

/**
 * Description Templates Service
 * Manages template library and AI-powered template filling
 */
export class DescriptionTemplatesService {
  private templates: Map<string, DescriptionTemplate> = new Map();
  private userTemplates: Map<string, DescriptionTemplate[]> = new Map();
  private teamTemplates: Map<string, DescriptionTemplate[]> = new Map();
  
  private cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
  private cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize built-in templates
   */
  private initializeDefaultTemplates() {
    const defaultTemplates: DescriptionTemplate[] = [
      // Bug Report Template
      {
        id: 'bug-report-standard',
        name: 'Standard Bug Report',
        description: 'Comprehensive bug report with all essential details',
        issueTypes: ['bug'],
        category: 'bug',
        sections: [
          {
            id: 'summary',
            title: 'Summary',
            placeholder: 'Brief description of the bug',
            required: true,
            aiGenerate: true,
            helpText: 'One-line summary of the issue'
          },
          {
            id: 'steps',
            title: 'Steps to Reproduce',
            placeholder: '1. Go to...\n2. Click on...\n3. Observe...',
            required: true,
            aiGenerate: true,
            format: 'numbered-list',
            helpText: 'Detailed steps to reproduce the bug'
          },
          {
            id: 'expected',
            title: 'Expected Behavior',
            placeholder: 'What should happen?',
            required: true,
            aiGenerate: true,
            helpText: 'Describe the expected outcome'
          },
          {
            id: 'actual',
            title: 'Actual Behavior',
            placeholder: 'What actually happens?',
            required: true,
            aiGenerate: true,
            helpText: 'Describe what actually occurred'
          },
          {
            id: 'environment',
            title: 'Environment',
            placeholder: 'Browser: Chrome 120\nOS: macOS 14\nVersion: 2.1.0',
            required: false,
            aiGenerate: false,
            format: 'key-value',
            helpText: 'Browser, OS, app version, etc.'
          },
          {
            id: 'screenshots',
            title: 'Screenshots/Logs',
            placeholder: 'Attach screenshots or paste error logs',
            required: false,
            aiGenerate: false,
            helpText: 'Visual evidence or error messages'
          },
          {
            id: 'impact',
            title: 'Impact',
            placeholder: 'How does this affect users?',
            required: false,
            aiGenerate: true,
            helpText: 'Severity and user impact'
          }
        ],
        tags: ['bug', 'standard', 'comprehensive'],
        isDefault: true,
        isPublic: true,
        usageCount: 0
      },

      // User Story Template
      {
        id: 'user-story-standard',
        name: 'Standard User Story',
        description: 'Agile user story with acceptance criteria',
        issueTypes: ['story'],
        category: 'story',
        sections: [
          {
            id: 'user-story',
            title: 'User Story',
            placeholder: 'As a [user type], I want [goal], so that [benefit]',
            required: true,
            aiGenerate: true,
            format: 'user-story',
            helpText: 'Who, what, and why'
          },
          {
            id: 'context',
            title: 'Context & Background',
            placeholder: 'Why is this needed? What problem does it solve?',
            required: false,
            aiGenerate: true,
            helpText: 'Additional context for the story'
          },
          {
            id: 'acceptance-criteria',
            title: 'Acceptance Criteria',
            placeholder: 'Given [context], when [action], then [outcome]',
            required: true,
            aiGenerate: true,
            format: 'given-when-then',
            helpText: 'Testable conditions for completion'
          },
          {
            id: 'test-scenarios',
            title: 'Test Scenarios',
            placeholder: 'Scenario 1: Happy path\nScenario 2: Edge cases',
            required: false,
            aiGenerate: true,
            format: 'bullet-list',
            helpText: 'Key scenarios to test'
          },
          {
            id: 'technical-notes',
            title: 'Technical Notes',
            placeholder: 'Implementation considerations, APIs, dependencies',
            required: false,
            aiGenerate: true,
            helpText: 'Technical implementation details'
          },
          {
            id: 'design-links',
            title: 'Design/Mockups',
            placeholder: 'Links to Figma, wireframes, or design docs',
            required: false,
            aiGenerate: false,
            helpText: 'Visual design references'
          }
        ],
        tags: ['story', 'agile', 'user-story'],
        isDefault: true,
        isPublic: true,
        usageCount: 0
      },

      // Technical Task Template
      {
        id: 'technical-task-standard',
        name: 'Technical Task',
        description: 'Technical implementation task with details',
        issueTypes: ['task'],
        category: 'task',
        sections: [
          {
            id: 'objective',
            title: 'Objective',
            placeholder: 'What needs to be done?',
            required: true,
            aiGenerate: true,
            helpText: 'Clear goal of the task'
          },
          {
            id: 'approach',
            title: 'Technical Approach',
            placeholder: 'How will this be implemented?',
            required: true,
            aiGenerate: true,
            helpText: 'Implementation strategy'
          },
          {
            id: 'requirements',
            title: 'Requirements',
            placeholder: '- Requirement 1\n- Requirement 2',
            required: true,
            aiGenerate: true,
            format: 'bullet-list',
            helpText: 'Specific requirements'
          },
          {
            id: 'dependencies',
            title: 'Dependencies',
            placeholder: 'APIs, libraries, other tasks',
            required: false,
            aiGenerate: true,
            helpText: 'What this task depends on'
          },
          {
            id: 'testing',
            title: 'Testing Strategy',
            placeholder: 'Unit tests, integration tests, manual testing',
            required: false,
            aiGenerate: true,
            helpText: 'How to verify completion'
          },
          {
            id: 'risks',
            title: 'Risks & Considerations',
            placeholder: 'Potential issues or challenges',
            required: false,
            aiGenerate: true,
            helpText: 'Known risks or concerns'
          }
        ],
        tags: ['task', 'technical', 'implementation'],
        isDefault: true,
        isPublic: true,
        usageCount: 0
      },

      // Epic Template
      {
        id: 'epic-standard',
        name: 'Standard Epic',
        description: 'Large initiative with goals and success metrics',
        issueTypes: ['epic'],
        category: 'epic',
        sections: [
          {
            id: 'vision',
            title: 'Vision & Goals',
            placeholder: 'What is the big picture? What are we trying to achieve?',
            required: true,
            aiGenerate: true,
            helpText: 'High-level vision'
          },
          {
            id: 'business-value',
            title: 'Business Value',
            placeholder: 'Why is this important? What value does it provide?',
            required: true,
            aiGenerate: true,
            helpText: 'Business justification'
          },
          {
            id: 'scope',
            title: 'Scope',
            placeholder: 'What is included? What is NOT included?',
            required: true,
            aiGenerate: true,
            helpText: 'In-scope and out-of-scope items'
          },
          {
            id: 'success-metrics',
            title: 'Success Metrics',
            placeholder: 'How will we measure success?',
            required: true,
            aiGenerate: true,
            format: 'bullet-list',
            helpText: 'KPIs and success criteria'
          },
          {
            id: 'user-personas',
            title: 'Target Users',
            placeholder: 'Who will benefit from this?',
            required: false,
            aiGenerate: true,
            helpText: 'User personas or segments'
          },
          {
            id: 'timeline',
            title: 'Timeline & Milestones',
            placeholder: 'Key milestones and target dates',
            required: false,
            aiGenerate: true,
            helpText: 'High-level timeline'
          },
          {
            id: 'dependencies',
            title: 'Dependencies & Risks',
            placeholder: 'External dependencies, risks, assumptions',
            required: false,
            aiGenerate: true,
            helpText: 'Critical dependencies'
          }
        ],
        tags: ['epic', 'initiative', 'strategic'],
        isDefault: true,
        isPublic: true,
        usageCount: 0
      },

      // Security Bug Template
      {
        id: 'security-bug',
        name: 'Security Bug Report',
        description: 'Security vulnerability report with impact assessment',
        issueTypes: ['bug'],
        category: 'bug',
        sections: [
          {
            id: 'vulnerability',
            title: 'Vulnerability Description',
            placeholder: 'Describe the security issue',
            required: true,
            aiGenerate: true,
            helpText: 'What is the vulnerability?'
          },
          {
            id: 'severity',
            title: 'Severity Assessment',
            placeholder: 'Critical/High/Medium/Low and why',
            required: true,
            aiGenerate: true,
            helpText: 'Impact and severity level'
          },
          {
            id: 'exploit',
            title: 'Exploitation Steps',
            placeholder: 'How can this be exploited?',
            required: true,
            aiGenerate: false,
            helpText: 'Steps to exploit (handle carefully)'
          },
          {
            id: 'impact',
            title: 'Impact Analysis',
            placeholder: 'What data/systems are at risk?',
            required: true,
            aiGenerate: true,
            helpText: 'Potential damage'
          },
          {
            id: 'mitigation',
            title: 'Recommended Fix',
            placeholder: 'How should this be fixed?',
            required: false,
            aiGenerate: true,
            helpText: 'Suggested remediation'
          },
          {
            id: 'affected-versions',
            title: 'Affected Versions',
            placeholder: 'Which versions are vulnerable?',
            required: false,
            aiGenerate: false,
            helpText: 'Version information'
          }
        ],
        tags: ['security', 'bug', 'vulnerability'],
        isDefault: true,
        isPublic: true,
        usageCount: 0
      },

      // Performance Issue Template
      {
        id: 'performance-issue',
        name: 'Performance Issue',
        description: 'Performance bug or optimization task',
        issueTypes: ['bug', 'task'],
        category: 'bug',
        sections: [
          {
            id: 'issue',
            title: 'Performance Issue',
            placeholder: 'What is slow or inefficient?',
            required: true,
            aiGenerate: true,
            helpText: 'Describe the performance problem'
          },
          {
            id: 'metrics',
            title: 'Current Metrics',
            placeholder: 'Load time: 5s\nMemory: 500MB\nCPU: 80%',
            required: true,
            aiGenerate: false,
            format: 'key-value',
            helpText: 'Measured performance data'
          },
          {
            id: 'target',
            title: 'Target Metrics',
            placeholder: 'Load time: <2s\nMemory: <200MB\nCPU: <40%',
            required: true,
            aiGenerate: true,
            format: 'key-value',
            helpText: 'Desired performance'
          },
          {
            id: 'reproduction',
            title: 'How to Reproduce',
            placeholder: 'Steps to observe the performance issue',
            required: true,
            aiGenerate: true,
            helpText: 'Reproduction steps'
          },
          {
            id: 'analysis',
            title: 'Root Cause Analysis',
            placeholder: 'What is causing the slowness?',
            required: false,
            aiGenerate: true,
            helpText: 'Known or suspected causes'
          },
          {
            id: 'optimization',
            title: 'Optimization Approach',
            placeholder: 'How to improve performance?',
            required: false,
            aiGenerate: true,
            helpText: 'Proposed solutions'
          }
        ],
        tags: ['performance', 'optimization', 'bug'],
        isDefault: true,
        isPublic: true,
        usageCount: 0
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log(`✅ Initialized ${defaultTemplates.length} default templates`);
  }

  /**
   * Get all templates
   */
  getTemplates(filters?: {
    issueType?: string;
    category?: string;
    tags?: string[];
    userId?: string;
    teamId?: string;
  }): DescriptionTemplate[] {
    let templates = Array.from(this.templates.values());

    // Add user templates
    if (filters?.userId && this.userTemplates.has(filters.userId)) {
      templates = [...templates, ...this.userTemplates.get(filters.userId)!];
    }

    // Add team templates
    if (filters?.teamId && this.teamTemplates.has(filters.teamId)) {
      templates = [...templates, ...this.teamTemplates.get(filters.teamId)!];
    }

    // Apply filters
    if (filters?.issueType) {
      templates = templates.filter(t => t.issueTypes.includes(filters.issueType!));
    }

    if (filters?.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      templates = templates.filter(t => 
        filters.tags!.some(tag => t.tags.includes(tag))
      );
    }

    // Sort by usage count and rating
    return templates.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return (b.usageCount + (b.rating || 0) * 10) - (a.usageCount + (a.rating || 0) * 10);
    });
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): DescriptionTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Fill template with AI
   */
  async fillTemplate(
    templateId: string,
    summary: string,
    context?: {
      issueType?: string;
      projectId?: string;
      epicId?: string;
      userInput?: string;
      additionalContext?: string;
    }
  ): Promise<FilledTemplate> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    console.log(`🤖 Filling template: ${template.name}`);

    const filledSections = await Promise.all(
      template.sections.map(async (section) => {
        let content = section.defaultValue || '';

        if (section.aiGenerate) {
          content = await this.generateSectionContent(
            section,
            summary,
            template.category,
            context
          );
        }

        return {
          id: section.id,
          title: section.title,
          content,
          aiGenerated: section.aiGenerate
        };
      })
    );

    // Build full description
    const fullDescription = this.buildFullDescription(template, filledSections);

    // Increment usage count
    template.usageCount++;

    return {
      templateId,
      sections: filledSections,
      fullDescription
    };
  }

  /**
   * Generate content for a template section
   */
  private async generateSectionContent(
    section: TemplateSection,
    summary: string,
    category: string,
    context?: any
  ): Promise<string> {
    const prompt = this.buildSectionPrompt(section, summary, category, context);

    try {
      const response = await axios.post(
        this.cerebrasEndpoint,
        {
          model: 'llama3.1-8b',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${this.cerebrasApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error(`❌ Error generating section ${section.id}:`, error);
      return section.placeholder;
    }
  }

  /**
   * Build prompt for section generation
   */
  private buildSectionPrompt(
    section: TemplateSection,
    summary: string,
    category: string,
    context?: any
  ): string {
    let prompt = `Generate content for the "${section.title}" section of a ${category} issue.

Issue Summary: "${summary}"
Section Purpose: ${section.helpText || section.title}
`;

    if (context?.userInput) {
      prompt += `\nUser Input: "${context.userInput}"`;
    }

    if (context?.additionalContext) {
      prompt += `\nAdditional Context: ${context.additionalContext}`;
    }

    // Add format-specific instructions
    if (section.format === 'numbered-list') {
      prompt += '\n\nFormat: Numbered list (1. 2. 3.)';
    } else if (section.format === 'bullet-list') {
      prompt += '\n\nFormat: Bullet points (- item)';
    } else if (section.format === 'given-when-then') {
      prompt += '\n\nFormat: Given [context], When [action], Then [outcome]';
    } else if (section.format === 'user-story') {
      prompt += '\n\nFormat: As a [user type], I want [goal], so that [benefit]';
    } else if (section.format === 'key-value') {
      prompt += '\n\nFormat: Key: Value pairs';
    }

    prompt += `\n\nGenerate clear, specific, and actionable content for this section:`;

    return prompt;
  }

  /**
   * Build full description from filled sections
   */
  private buildFullDescription(
    template: DescriptionTemplate,
    sections: Array<{ id: string; title: string; content: string }>
  ): string {
    const parts: string[] = [];

    sections.forEach(section => {
      if (section.content && section.content.trim()) {
        parts.push(`## ${section.title}\n\n${section.content}\n`);
      }
    });

    return parts.join('\n');
  }

  /**
   * Create custom template
   */
  createTemplate(
    template: Omit<DescriptionTemplate, 'id' | 'usageCount' | 'isDefault'>,
    userId: string
  ): DescriptionTemplate {
    const newTemplate: DescriptionTemplate = {
      ...template,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usageCount: 0,
      isDefault: false,
      createdBy: userId
    };

    if (template.teamId) {
      const teamTemplates = this.teamTemplates.get(template.teamId) || [];
      teamTemplates.push(newTemplate);
      this.teamTemplates.set(template.teamId, teamTemplates);
    } else {
      const userTemplates = this.userTemplates.get(userId) || [];
      userTemplates.push(newTemplate);
      this.userTemplates.set(userId, userTemplates);
    }

    console.log(`✅ Created custom template: ${newTemplate.name}`);
    return newTemplate;
  }

  /**
   * Update template
   */
  updateTemplate(templateId: string, updates: Partial<DescriptionTemplate>): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    if (template.isDefault) {
      throw new Error('Cannot modify default templates');
    }

    Object.assign(template, updates);
    return true;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string, userId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    if (template.isDefault) {
      throw new Error('Cannot delete default templates');
    }

    if (template.createdBy !== userId) {
      throw new Error('Unauthorized to delete this template');
    }

    this.templates.delete(templateId);
    return true;
  }

  /**
   * Rate template
   */
  rateTemplate(templateId: string, rating: number): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    template.rating = rating;
    return true;
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(limit: number = 5): DescriptionTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): DescriptionTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

export const descriptionTemplates = new DescriptionTemplatesService();
