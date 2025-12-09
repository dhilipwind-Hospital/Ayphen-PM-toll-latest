"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const database_1 = require("../config/database");
const AIRequirement_1 = require("../entities/AIRequirement");
const AIRequirementVersion_1 = require("../entities/AIRequirementVersion");
const AIStory_1 = require("../entities/AIStory");
const AITestCase_1 = require("../entities/AITestCase");
const AIChangeLog_1 = require("../entities/AIChangeLog");
const openai_service_1 = require("./openai.service");
class SyncService {
    constructor() {
        this.openaiService = new openai_service_1.OpenAIService();
        this.requirementRepo = database_1.AppDataSource.getRepository(AIRequirement_1.AIRequirement);
        this.versionRepo = database_1.AppDataSource.getRepository(AIRequirementVersion_1.AIRequirementVersion);
        this.storyRepo = database_1.AppDataSource.getRepository(AIStory_1.AIStory);
        this.testCaseRepo = database_1.AppDataSource.getRepository(AITestCase_1.AITestCase);
        this.changeLogRepo = database_1.AppDataSource.getRepository(AIChangeLog_1.AIChangeLog);
    }
    async syncRequirement(requirementId) {
        // Get current requirement
        const requirement = await this.requirementRepo.findOne({
            where: { id: requirementId },
        });
        if (!requirement) {
            return { synced: false, error: 'Requirement not found' };
        }
        // Get last version
        const lastVersion = await this.versionRepo.findOne({
            where: { requirementId },
            order: { version: 'DESC' },
        });
        if (!lastVersion) {
            return { synced: false, reason: 'No previous version' };
        }
        // Detect changes using AI
        const changeAnalysis = await this.openaiService.detectChanges(lastVersion.content, requirement.content);
        if (!changeAnalysis.hasChanges) {
            return { synced: false, reason: 'No changes detected' };
        }
        // Get all stories for this requirement
        const stories = await this.storyRepo.find({
            where: { requirementId },
        });
        // Identify impacted stories
        const impactedStories = stories.filter(story => {
            return changeAnalysis.impactedAreas.some((area) => story.title.toLowerCase().includes(area.toLowerCase()) ||
                story.description.toLowerCase().includes(area.toLowerCase()));
        });
        // Update impacted stories
        for (const story of impactedStories) {
            // Flag as updated
            await this.storyRepo.update(story.id, {
                flagged: true,
                syncStatus: 'updated',
                version: story.version + 1,
            });
            // Log change
            await this.changeLogRepo.save({
                requirementId,
                entityType: 'story',
                entityId: story.id,
                changeType: 'flagged',
                oldValue: JSON.stringify(story),
                newValue: 'Flagged due to requirement change',
            });
            // Update related test cases
            await this.updateTestCasesForStory(story.id, requirementId);
        }
        // Create new version
        await this.versionRepo.save({
            requirementId,
            version: requirement.version + 1,
            content: requirement.content,
            changes: JSON.stringify(changeAnalysis.changes),
        });
        // Update requirement version
        await this.requirementRepo.update(requirementId, {
            version: requirement.version + 1,
        });
        return {
            synced: true,
            impactedStories: impactedStories.length,
            changes: changeAnalysis.changes,
        };
    }
    async updateTestCasesForStory(storyId, requirementId) {
        const testCases = await this.testCaseRepo.find({
            where: { storyId },
        });
        for (const testCase of testCases) {
            // Flag test case as needing review
            await this.testCaseRepo.update(testCase.id, {
                flagged: true,
                status: 'needs_review',
            });
            // Log change
            await this.changeLogRepo.save({
                requirementId,
                entityType: 'test_case',
                entityId: testCase.id,
                changeType: 'flagged',
                oldValue: JSON.stringify(testCase),
                newValue: 'Flagged due to requirement change',
            });
        }
    }
    async getChanges(requirementId) {
        const requirement = await this.requirementRepo.findOne({
            where: { id: requirementId },
        });
        if (!requirement) {
            return { hasChanges: false, error: 'Requirement not found' };
        }
        const lastVersion = await this.versionRepo.findOne({
            where: { requirementId },
            order: { version: 'DESC' },
        });
        if (!lastVersion) {
            return { hasChanges: false, reason: 'No previous version' };
        }
        const changeAnalysis = await this.openaiService.detectChanges(lastVersion.content, requirement.content);
        return changeAnalysis;
    }
}
exports.SyncService = SyncService;
