import { issuesApi } from './api';
import { aiStoriesApi } from './ai-test-automation-api';
import { message } from 'antd';

/**
 * Calculate story points based on acceptance criteria and complexity
 */
function calculateStoryPoints(story: any): number {
  const complexity = story.acceptanceCriteria?.length || 3;
  const basePoints = story.type === 'ui' ? 5 : 3;
  return Math.min(basePoints + complexity, 13);
}

/**
 * Generate unique issue key
 */
function generateIssueKey(projectId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PROJ-${timestamp}-${random}`;
}

/**
 * Convert AI story to issue format
 */
export function convertAIStoryToIssue(aiStory: any, projectId: string, reporterId: string): any {
  return {
    key: generateIssueKey(projectId),
    projectId,
    reporterId,
    type: 'story',
    summary: aiStory.title || aiStory.name || 'Untitled Story',
    description: aiStory.description || '',
    storyPoints: calculateStoryPoints(aiStory),
    status: 'backlog',
    priority: 'medium',
    aiStoryId: aiStory.id,
    labels: ['ai-generated', aiStory.type || 'story'],
    components: [],
    fixVersions: [],
  };
}

/**
 * Sync single AI story to issues system
 */
export async function syncAIStoryToIssue(
  aiStory: any,
  projectId: string,
  reporterId: string
): Promise<any> {
  try {
    // Check if already synced
    const userId = localStorage.getItem('userId');
    const existingIssues = await issuesApi.getAll({ projectId, userId: userId || undefined });
    const alreadySynced = existingIssues.data?.find(
      (issue: any) => issue.aiStoryId === aiStory.id
    );

    if (alreadySynced) {
      console.log(`Story ${aiStory.id} already synced as issue ${alreadySynced.id}`);
      return alreadySynced;
    }

    // Create new issue
    const issueData = convertAIStoryToIssue(aiStory, projectId, reporterId);
    const response = await issuesApi.create(issueData);

    // Update AI story with issue ID and sync status
    await aiStoriesApi.update(aiStory.id, {
      issueId: response.data.id,
      syncStatus: 'synced',
      jiraIssueKey: response.data.key,
    });

    console.log(`✅ Synced story ${aiStory.id} to issue ${response.data.id}`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Failed to sync story ${aiStory.id}:`, error);
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    message.error(`Failed to sync story: ${errorMessage}`);
    throw new Error(`Story sync failed: ${errorMessage}`);
  }
}

/**
 * Sync multiple AI stories to issues system
 */
export async function syncAllAIStoriesToIssues(
  projectId: string,
  reporterId: string
): Promise<{ synced: number; skipped: number; errors: number }> {
  try {
    const storiesResponse = await aiStoriesApi.getAll();
    const stories = storiesResponse.data || [];

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const story of stories) {
      try {
        const result = await syncAIStoryToIssue(story, projectId, reporterId);
        if (result) {
          synced++;
        } else {
          skipped++;
        }
      } catch (error: any) {
        errors++;
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        console.error(`❌ Error syncing story ${story.id}:`, errorMessage);
        // Don't show message for each error, will show summary at end
      }
    }

    return { synced, skipped, errors };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    console.error('❌ Failed to sync stories:', errorMessage);
    message.error(`Failed to fetch AI stories: ${errorMessage}`);
    throw new Error(`Batch sync failed: ${errorMessage}`);
  }
}

/**
 * Sync all AI stories for a project
 */
export async function syncAllAIStories(projectId: string, reporterId: string): Promise<void> {
  try {
    message.loading('Syncing AI stories to backlog...', 0);

    // Get all AI stories
    const aiStoriesResponse = await aiStoriesApi.getAll();
    const aiStories = aiStoriesResponse.data || [];

    if (aiStories.length === 0) {
      message.info('No AI stories to sync');
      return;
    }

    // Sync all stories
    const result = await syncAllAIStoriesToIssues(projectId, reporterId);

    message.destroy();

    if (result.errors === 0) {
      message.success(`✅ Synced ${result.synced} stories to backlog!`);
    } else {
      message.warning(
        `Synced ${result.synced} stories, ${result.errors} failed`
      );
    }
  } catch (error: any) {
    message.destroy();
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    message.error(`Failed to sync stories: ${errorMessage}`);
    console.error('❌ Sync error:', errorMessage, error);
  }
}

/**
 * Update issue when AI story changes
 */
export async function updateIssueFromAIStory(
  aiStory: any,
  projectId: string
): Promise<void> {
  try {
    // Find linked issue
    const userId = localStorage.getItem('userId');
    const existingIssues = await issuesApi.getAll({ projectId, userId: userId || undefined });
    const linkedIssue = existingIssues.data?.find(
      (issue: any) => issue.aiStoryId === aiStory.id
    );

    if (!linkedIssue) {
      console.log('No linked issue found, skipping update');
      return;
    }

    // Update issue with AI story changes
    const updates = {
      summary: aiStory.title || aiStory.name,
      description: aiStory.description,
      storyPoints: calculateStoryPoints(aiStory),
    };

    await issuesApi.update(linkedIssue.id, updates);
    console.log(`✅ Updated issue ${linkedIssue.id} from AI story ${aiStory.id}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    console.error('❌ Failed to update issue from AI story:', errorMessage);
    message.error(`Failed to update issue: ${errorMessage}`);
    throw new Error(`Issue update from AI story failed: ${errorMessage}`);
  }
}
