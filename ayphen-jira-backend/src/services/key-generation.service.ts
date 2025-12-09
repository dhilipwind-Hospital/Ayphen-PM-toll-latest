import { AppDataSource } from '../config/database';
import { AIRequirement } from '../entities/AIRequirement';
import { AIStory } from '../entities/AIStory';
import { AITestCase } from '../entities/AITestCase';
import { Project } from '../entities/Project';

export class KeyGenerationService {
  private requirementRepo = AppDataSource.getRepository(AIRequirement);
  private storyRepo = AppDataSource.getRepository(AIStory);
  private testCaseRepo = AppDataSource.getRepository(AITestCase);
  private projectRepo = AppDataSource.getRepository(Project);

  /**
   * Generate Epic Key
   * Format: {PROJECT_KEY}-{EPIC_NUMBER}
   * Example: PROJ-100
   */
  generateEpicKey(projectKey: string, epicNumber: number): string {
    return `${projectKey}-${epicNumber}`;
  }

  /**
   * Generate Story Key
   * Format: {PROJECT_KEY}-{STORY_NUMBER}
   * Example: PROJ-201
   */
  generateStoryKey(projectKey: string, storyNumber: number): string {
    return `${projectKey}-${storyNumber}`;
  }

  /**
   * Generate Test Case Key
   * Format: TC-{EPIC_KEY_WITHOUT_DASH}-{NUMBER}
   * Example: TC-PROJ100-001
   */
  generateTestCaseKey(epicKey: string, tcNumber: number): string {
    const epicKeyNoDash = epicKey.replace('-', '');
    return `TC-${epicKeyNoDash}-${String(tcNumber).padStart(3, '0')}`;
  }

  /**
   * Generate Test Suite Key
   * Format: TS-{CATEGORY}-{EPIC_KEY_WITHOUT_DASH}
   * Example: TS-SMOKE-PROJ100
   */
  generateSuiteKey(category: string, epicKey: string): string {
    const epicKeyNoDash = epicKey.replace('-', '');
    return `TS-${category.toUpperCase()}-${epicKeyNoDash}`;
  }

  /**
   * Get next Epic number for a project
   * Queries database for highest epic number and increments
   */
  async getNextEpicNumber(projectId: string): Promise<number> {
    try {
      // Get project to get its key
      const project = await this.projectRepo.findOne({ where: { id: projectId } });
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Find all requirements for this project with epicKey
      const requirements = await this.requirementRepo.find({
        where: { projectId },
        select: ['epicKey'],
      });

      // Extract numbers from epic keys (PROJ-100 -> 100)
      const epicNumbers = requirements
        .filter(req => req.epicKey)
        .map(req => {
          const match = req.epicKey!.match(/-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      // Get highest number, default to 99 if none exist (so first epic is 100)
      const maxNumber = epicNumbers.length > 0 ? Math.max(...epicNumbers) : 99;
      
      return maxNumber + 1;
    } catch (error) {
      console.error('Error getting next epic number:', error);
      // Default to 100 for first epic
      return 100;
    }
  }

  /**
   * Get next Story number for a project
   * Queries database for highest story number and increments
   */
  async getNextStoryNumber(projectId: string): Promise<number> {
    try {
      // Get project to get its key
      const project = await this.projectRepo.findOne({ where: { id: projectId } });
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Find all stories for this project with storyKey
      const stories = await this.storyRepo.find({
        where: { projectId },
        select: ['storyKey'],
      });

      // Extract numbers from story keys (PROJ-201 -> 201)
      const storyNumbers = stories
        .filter(story => story.storyKey)
        .map(story => {
          const match = story.storyKey!.match(/-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      // Get highest number, default to 200 if none exist (so first story is 201)
      const maxNumber = storyNumbers.length > 0 ? Math.max(...storyNumbers) : 200;
      
      return maxNumber + 1;
    } catch (error) {
      console.error('Error getting next story number:', error);
      // Default to 201 for first story
      return 201;
    }
  }

  /**
   * Get next Test Case number for an epic
   * Queries database for highest test case number for this epic and increments
   */
  async getNextTestCaseNumber(epicKey: string): Promise<number> {
    try {
      // Get requirement to get its ID
      const requirement = await this.requirementRepo.findOne({ where: { epicKey } });
      if (!requirement) {
        throw new Error(`Requirement not found for epicKey: ${epicKey}`);
      }

      // Find all test cases for this requirement with testCaseKey
      const testCases = await this.testCaseRepo.find({
        where: { requirementId: requirement.id },
        select: ['testCaseKey'],
      });

      // Extract numbers from test case keys (TC-PROJ100-001 -> 1)
      const tcNumbers = testCases
        .filter(tc => tc.testCaseKey)
        .map(tc => {
          const match = tc.testCaseKey!.match(/-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      // Get highest number, default to 0 if none exist (so first test case is 1)
      const maxNumber = tcNumbers.length > 0 ? Math.max(...tcNumbers) : 0;
      
      return maxNumber + 1;
    } catch (error) {
      console.error('Error getting next test case number:', error);
      // Default to 1 for first test case
      return 1;
    }
  }

  /**
   * Get project key by project ID
   */
  async getProjectKey(projectId: string): Promise<string> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    return project.key;
  }
}
