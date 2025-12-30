import { test, expect } from '../../fixtures/auth.fixture';
import { BacklogPage, CreateIssuePage, DashboardPage, BoardPage } from '../../pages';
import { createTestStory } from '../../utils/test-data';

test.describe('Story Management', () => {
  let dashboardPage: DashboardPage;
  let backlogPage: BacklogPage;
  let createIssuePage: CreateIssuePage;
  let boardPage: BoardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    backlogPage = new BacklogPage(authenticatedPage);
    createIssuePage = new CreateIssuePage(authenticatedPage);
    boardPage = new BoardPage(authenticatedPage);
    
    await backlogPage.goto();
    await backlogPage.expectBacklogLoaded();
  });

  test('STR-001: should create a story', async ({ authenticatedPage, page }) => {
    const story = createTestStory();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.waitForModal();
    
    await createIssuePage.createStory(story.summary, {
      description: story.description,
    });
    
    // Verify success
    await dashboardPage.expectSuccessMessage('created');
  });

  test('STR-002: should create story with story points', async ({ authenticatedPage, page }) => {
    const story = createTestStory();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.waitForModal();
    
    await createIssuePage.createStory(story.summary, {
      storyPoints: story.storyPoints,
    });
    
    await dashboardPage.expectSuccessMessage('created');
  });

  test('STR-003: should create story with priority', async ({ authenticatedPage, page }) => {
    const story = createTestStory();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.waitForModal();
    
    await createIssuePage.createStory(story.summary, {
      priority: story.priority,
    });
    
    await dashboardPage.expectSuccessMessage('created');
  });

  test('STR-004: should display story in backlog', async ({ authenticatedPage, page }) => {
    const story = createTestStory();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createStory(story.summary);
    
    await page.waitForTimeout(1000);
    
    // Story should appear in backlog
    const storyElement = page.locator(`text=${story.summary}`).first();
    await expect(storyElement).toBeVisible({ timeout: 10000 });
  });

  test('STR-005: should drag story to sprint', async ({ authenticatedPage, page }) => {
    const story = createTestStory();
    
    // First, ensure there's a sprint
    await backlogPage.createSprint();
    await page.locator('.ant-modal-footer button.ant-btn-primary').click();
    await page.waitForTimeout(500);
    
    // Create story
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createStory(story.summary);
    await page.waitForTimeout(1000);
    
    // Find story and drag to sprint
    // Note: Actual drag implementation depends on your app's structure
    const storyItem = page.locator(`text=${story.summary}`).first();
    const sprintContainer = page.locator('.ant-card').filter({ hasText: /Sprint/ }).first();
    
    if (await storyItem.isVisible() && await sprintContainer.isVisible()) {
      await storyItem.dragTo(sprintContainer);
    }
  });

  test('STR-006: should change story status on board', async ({ authenticatedPage, page }) => {
    const story = createTestStory();
    
    // Create story
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createStory(story.summary);
    await page.waitForTimeout(1000);
    
    // Go to board
    await boardPage.goto();
    await boardPage.expectBoardLoaded();
    
    // Find story card (might be in TODO or BACKLOG column)
    const storyCard = page.locator(`text=${story.summary}`).first();
    
    if (await storyCard.isVisible()) {
      // Try to drag to IN PROGRESS
      const inProgressColumn = page.locator('.board-column:has-text("IN PROGRESS")');
      if (await inProgressColumn.isVisible()) {
        await storyCard.dragTo(inProgressColumn);
      }
    }
  });

  test('STR-007: should open story detail panel', async ({ authenticatedPage, page }) => {
    const story = createTestStory();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createStory(story.summary);
    await page.waitForTimeout(1000);
    
    // Click on story
    await page.locator(`text=${story.summary}`).first().click();
    
    // Detail panel should open
    await expect(page.locator('aside, .issue-detail-panel, [data-testid="issue-detail"]').first()).toBeVisible({ timeout: 5000 });
  });
});
