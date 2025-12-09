"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextCollector = exports.ContextCollectorService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const Project_1 = require("../entities/Project");
class ContextCollectorService {
    constructor() {
        this.issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        this.projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
    }
    /**
     * Collect Epic context including goals and scope
     */
    async collectEpicContext(epicKey) {
        try {
            const epic = await this.issueRepo.findOne({
                where: { key: epicKey, type: 'epic' }
            });
            if (!epic) {
                console.warn(`⚠️ Epic ${epicKey} not found`);
                return null;
            }
            // Get all stories in this epic
            const stories = await this.issueRepo.find({
                where: { epicKey, type: 'story' }
            });
            const completedStories = stories.filter(s => s.status === 'done' || s.status === 'closed');
            return {
                summary: epic.summary,
                description: epic.description || '',
                goals: this.extractGoals(epic.description || ''),
                scope: this.extractScope(epic.description || ''),
                totalStories: stories.length,
                completedStories: completedStories.length
            };
        }
        catch (error) {
            console.error('Error collecting epic context:', error);
            return null;
        }
    }
    /**
     * Collect all related stories from the same Epic
     */
    async collectRelatedStories(epicKey, limit = 20) {
        try {
            const stories = await this.issueRepo.find({
                where: { epicKey, type: 'story' },
                order: { createdAt: 'DESC' },
                take: limit
            });
            return stories.map(story => ({
                key: story.key,
                summary: story.summary,
                description: story.description || '',
                storyPoints: story.storyPoints,
                status: story.status,
                labels: story.labels || []
            }));
        }
        catch (error) {
            console.error('Error collecting related stories:', error);
            return [];
        }
    }
    /**
     * Collect project-level context by analyzing existing stories
     */
    async collectProjectContext(projectId) {
        try {
            const project = await this.projectRepo.findOne({
                where: { id: projectId }
            });
            if (!project) {
                console.warn(`⚠️ Project ${projectId} not found`);
                return null;
            }
            // Analyze recent stories to detect patterns
            const recentStories = await this.issueRepo.find({
                where: { projectId, type: 'story' },
                order: { createdAt: 'DESC' },
                take: 50 // Last 50 stories
            });
            return {
                name: project.name,
                key: project.key,
                techStack: this.detectTechStack(recentStories),
                namingConventions: this.detectNamingConventions(recentStories),
                avgStoryPoints: this.calculateAvgPoints(recentStories),
                commonLabels: this.extractCommonLabels(recentStories),
                preferredPointValues: this.detectPreferredPoints(recentStories)
            };
        }
        catch (error) {
            console.error('Error collecting project context:', error);
            return null;
        }
    }
    /**
     * Collect full context (Epic + Related Stories + Project)
     */
    async collectFullContext(epicKey, projectId) {
        try {
            const [epic, relatedStories, project] = await Promise.all([
                this.collectEpicContext(epicKey),
                this.collectRelatedStories(epicKey),
                this.collectProjectContext(projectId)
            ]);
            if (!epic || !project) {
                console.warn('⚠️ Missing epic or project context');
                return null;
            }
            return {
                epic,
                relatedStories,
                project
            };
        }
        catch (error) {
            console.error('Error collecting full context:', error);
            return null;
        }
    }
    /**
     * Extract goals from Epic description
     */
    extractGoals(description) {
        // Look for "Goals:" or "Objectives:" section
        const goalsMatch = description.match(/(?:Goals?|Objectives?):\s*([\s\S]*?)(?=\n\n|$)/i);
        if (!goalsMatch) {
            // Try to find bullet points at start
            const lines = description.split('\n').slice(0, 10);
            return lines
                .filter(line => line.trim().match(/^[-*•]\s+/))
                .map(line => line.replace(/^[-*•]\s+/, '').trim())
                .filter(goal => goal.length > 10);
        }
        return goalsMatch[1]
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^[-*•]\s*/, '').trim())
            .filter(goal => goal.length > 5);
    }
    /**
     * Extract scope from Epic description
     */
    extractScope(description) {
        const scopeMatch = description.match(/Scope:\s*([\s\S]*?)(?=\n\n|$)/i);
        return scopeMatch ? scopeMatch[1].trim() : undefined;
    }
    /**
     * Detect tech stack from story descriptions
     */
    detectTechStack(stories) {
        const techKeywords = [
            'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express',
            'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
            'GraphQL', 'REST', 'gRPC'
        ];
        const found = new Set();
        const allText = stories
            .map(s => `${s.summary} ${s.description}`)
            .join(' ');
        for (const tech of techKeywords) {
            if (new RegExp(tech, 'i').test(allText)) {
                found.add(tech);
            }
        }
        return Array.from(found);
    }
    /**
     * Detect naming conventions from story summaries
     */
    detectNamingConventions(stories) {
        const apiPatterns = [];
        const componentPatterns = [];
        for (const story of stories) {
            const text = story.summary + ' ' + story.description;
            // Look for API patterns
            const apiMatch = text.match(/(?:POST|GET|PUT|DELETE)\s+(\/[a-zA-Z0-9/_-]+)/);
            if (apiMatch) {
                apiPatterns.push(apiMatch[1]);
            }
            // Look for component patterns
            const componentMatch = text.match(/(?:Component|View|Page|Container):\s+([A-Z][a-zA-Z]+)/);
            if (componentMatch) {
                componentPatterns.push(componentMatch[1]);
            }
        }
        return {
            apiPattern: apiPatterns.length > 0
                ? this.findCommonPattern(apiPatterns)
                : undefined,
            componentPattern: componentPatterns.length > 0
                ? this.findCommonPattern(componentPatterns)
                : undefined
        };
    }
    /**
     * Find common pattern in array of strings
     */
    findCommonPattern(patterns) {
        if (patterns.length === 0)
            return '';
        // Find most common prefix
        const sorted = patterns.sort();
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        let i = 0;
        while (i < first.length && first.charAt(i) === last.charAt(i)) {
            i++;
        }
        return first.substring(0, i) || patterns[0];
    }
    /**
     * Calculate average story points
     */
    calculateAvgPoints(stories) {
        const storiesWithPoints = stories.filter(s => s.storyPoints && s.storyPoints > 0);
        if (storiesWithPoints.length === 0)
            return 5;
        const total = storiesWithPoints.reduce((sum, s) => sum + (s.storyPoints || 0), 0);
        return Math.round(total / storiesWithPoints.length);
    }
    /**
     * Extract most common labels
     */
    extractCommonLabels(stories) {
        const labelCounts = new Map();
        for (const story of stories) {
            if (story.labels && Array.isArray(story.labels)) {
                for (const label of story.labels) {
                    labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
                }
            }
        }
        // Return labels that appear in at least 20% of stories
        const threshold = stories.length * 0.2;
        return Array.from(labelCounts.entries())
            .filter(([_, count]) => count >= threshold)
            .sort((a, b) => b[1] - a[1])
            .map(([label]) => label)
            .slice(0, 10);
    }
    /**
     * Detect preferred story point values
     */
    detectPreferredPoints(stories) {
        const pointCounts = new Map();
        for (const story of stories) {
            if (story.storyPoints && story.storyPoints > 0) {
                pointCounts.set(story.storyPoints, (pointCounts.get(story.storyPoints) || 0) + 1);
            }
        }
        // Return top 3 most used point values
        return Array.from(pointCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([points]) => points);
    }
}
exports.ContextCollectorService = ContextCollectorService;
exports.contextCollector = new ContextCollectorService();
