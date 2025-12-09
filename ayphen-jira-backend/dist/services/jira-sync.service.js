"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JiraSyncService = void 0;
const database_1 = require("../config/database");
const Issue_1 = require("../entities/Issue");
const AIRequirement_1 = require("../entities/AIRequirement");
const AIStory_1 = require("../entities/AIStory");
class JiraSyncService {
    constructor() {
        this.issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        this.requirementRepo = database_1.AppDataSource.getRepository(AIRequirement_1.AIRequirement);
        this.storyRepo = database_1.AppDataSource.getRepository(AIStory_1.AIStory);
    }
    /**
     * Sync Epic (AI Requirement) to Jira
     * Creates a Jira Issue with type='epic' and links it to the AI requirement
     */
    async syncEpicToJira(requirement, projectId, userId) {
        try {
            console.log(`📌 Syncing epic to Jira: ${requirement.epicKey}`);
            // Check if already synced
            if (requirement.jiraIssueId) {
                const existing = await this.issueRepo.findOne({
                    where: { id: requirement.jiraIssueId },
                });
                if (existing) {
                    console.log(`✅ Epic already synced: ${existing.key}`);
                    return existing;
                }
            }
            // Create Jira Issue as Epic
            const jiraIssue = await this.issueRepo.save({
                key: requirement.epicKey,
                summary: requirement.title,
                description: requirement.content,
                type: 'epic',
                status: 'backlog',
                priority: 'medium',
                projectId,
                reporterId: userId,
                labels: ['ai-generated', 'epic'],
            });
            // Update AI Requirement with Jira link
            await this.requirementRepo.update(requirement.id, {
                jiraIssueId: jiraIssue.id,
            });
            console.log(`✅ Epic synced to Jira: ${jiraIssue.key}`);
            return jiraIssue;
        }
        catch (error) {
            console.error(`❌ Error syncing epic to Jira:`, error);
            throw error;
        }
    }
    /**
     * Sync Story (AI Story) to Jira
     * Creates a Jira Issue with type='story' and links it to the epic
     */
    async syncStoryToJira(story, epicKey, projectId, userId) {
        try {
            console.log(`📌 Syncing story to Jira: ${story.storyKey}`);
            // Check if already synced
            if (story.jiraIssueId) {
                const existing = await this.issueRepo.findOne({
                    where: { id: story.jiraIssueId },
                });
                if (existing) {
                    console.log(`✅ Story already synced: ${existing.key}`);
                    return existing;
                }
            }
            // Calculate story points from acceptance criteria
            const storyPoints = story.acceptanceCriteria?.length || 3;
            // Create Jira Issue as Story
            const jiraIssue = await this.issueRepo.save({
                key: story.storyKey,
                summary: story.title,
                description: story.description || '',
                type: 'story',
                status: 'backlog', // Automatically in backlog
                priority: 'medium',
                projectId,
                reporterId: userId,
                epicLink: epicKey, // Link to parent epic
                storyPoints: Math.min(storyPoints, 13), // Fibonacci max
                labels: ['ai-generated', story.type], // ui or api
            });
            // Update AI Story with Jira link
            await this.storyRepo.update(story.id, {
                jiraIssueId: jiraIssue.id,
            });
            console.log(`✅ Story synced to Jira: ${jiraIssue.key}`);
            return jiraIssue;
        }
        catch (error) {
            console.error(`❌ Error syncing story to Jira:`, error);
            throw error;
        }
    }
    /**
     * Sync all stories to Jira in batch
     * Continues on individual failures and returns summary
     */
    async syncAllStoriesToJira(stories, epicKey, projectId, userId) {
        console.log(`📦 Batch syncing ${stories.length} stories to Jira...`);
        const successful = [];
        const failed = [];
        for (const story of stories) {
            try {
                const jiraIssue = await this.syncStoryToJira(story, epicKey, projectId, userId);
                successful.push(jiraIssue);
            }
            catch (error) {
                console.error(`❌ Failed to sync story ${story.storyKey}:`, error.message);
                failed.push({
                    story,
                    error: error.message || 'Unknown error',
                });
                // Continue with next story
            }
        }
        const summary = {
            total: stories.length,
            synced: successful.length,
            failed: failed.length,
        };
        console.log(`✅ Batch sync complete: ${summary.synced}/${summary.total} synced`);
        return { successful, failed, summary };
    }
    /**
     * Get all stories for an epic
     */
    async getStoriesForEpic(epicKey) {
        return await this.issueRepo.find({
            where: {
                epicLink: epicKey,
                type: 'story',
            },
            order: {
                createdAt: 'ASC',
            },
        });
    }
    /**
     * Calculate epic progress
     */
    async getEpicProgress(epicKey) {
        const stories = await this.getStoriesForEpic(epicKey);
        const total = stories.length;
        const completed = stories.filter(s => s.status === 'done').length;
        const inProgress = stories.filter(s => s.status === 'in-progress').length;
        const todo = stories.filter(s => s.status === 'todo' || s.status === 'backlog').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
            total,
            completed,
            inProgress,
            todo,
            percentage,
        };
    }
}
exports.JiraSyncService = JiraSyncService;
