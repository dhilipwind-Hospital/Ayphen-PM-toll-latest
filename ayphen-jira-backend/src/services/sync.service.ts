import { AppDataSource } from '../config/database';
import { AIRequirement } from '../entities/AIRequirement';
import { AIRequirementVersion } from '../entities/AIRequirementVersion';
import { AIStory } from '../entities/AIStory';
import { AITestCase } from '../entities/AITestCase';
import { AIChangeLog } from '../entities/AIChangeLog';
import { OpenAIService } from './openai.service';

export class SyncService {
  private openaiService = new OpenAIService();
  private requirementRepo = AppDataSource.getRepository(AIRequirement);
  private versionRepo = AppDataSource.getRepository(AIRequirementVersion);
  private storyRepo = AppDataSource.getRepository(AIStory);
  private testCaseRepo = AppDataSource.getRepository(AITestCase);
  private changeLogRepo = AppDataSource.getRepository(AIChangeLog);

  async syncRequirement(requirementId: string) {
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
    const changeAnalysis = await this.openaiService.detectChanges(
      lastVersion.content,
      requirement.content
    );
    
    if (!changeAnalysis.hasChanges) {
      return { synced: false, reason: 'No changes detected' };
    }
    
    // Get all stories for this requirement
    const stories = await this.storyRepo.find({
      where: { requirementId },
    });
    
    // Identify impacted stories
    const impactedStories = stories.filter(story => {
      return changeAnalysis.impactedAreas.some((area: string) => 
        story.title.toLowerCase().includes(area.toLowerCase()) ||
        story.description.toLowerCase().includes(area.toLowerCase())
      );
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

  private async updateTestCasesForStory(storyId: string, requirementId: string) {
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

  async getChanges(requirementId: string) {
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
    
    const changeAnalysis = await this.openaiService.detectChanges(
      lastVersion.content,
      requirement.content
    );
    
    return changeAnalysis;
  }
}
