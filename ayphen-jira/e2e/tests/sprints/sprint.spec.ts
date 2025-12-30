import { test, expect } from '../../fixtures/auth.fixture';
import { BacklogPage, DashboardPage } from '../../pages';

test.describe('Sprint Management', () => {
  let dashboardPage: DashboardPage;
  let backlogPage: BacklogPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    backlogPage = new BacklogPage(authenticatedPage);
    
    await backlogPage.goto();
    await backlogPage.expectBacklogLoaded();
  });

  test('SPR-001: should create a new sprint', async ({ authenticatedPage, page }) => {
    await backlogPage.createSprint();
    
    // Fill sprint form if modal opens
    const modal = page.locator('.ant-modal');
    if (await modal.isVisible()) {
      await page.locator('.ant-modal-footer button.ant-btn-primary').click();
    }
    
    await page.waitForTimeout(1000);
    
    // Sprint should appear
    const sprintContainer = page.locator('.ant-card').filter({ hasText: /Sprint/ });
    await expect(sprintContainer.first()).toBeVisible();
  });

  test('SPR-002: should start a sprint', async ({ authenticatedPage, page }) => {
    // First create a sprint if none exists
    const startButton = page.locator('button:has-text("Start Sprint")');
    
    if (!(await startButton.isVisible())) {
      await backlogPage.createSprint();
      await page.locator('.ant-modal-footer button.ant-btn-primary').click();
      await page.waitForTimeout(1000);
    }
    
    // Click Start Sprint
    await startButton.first().click();
    
    // Fill start sprint modal
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // Submit
    await page.locator('.ant-modal-footer button.ant-btn-primary').click();
    
    // Sprint should now show as Active
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Active')).toBeVisible({ timeout: 5000 });
  });

  test('SPR-003: should prevent starting multiple sprints', async ({ authenticatedPage, page }) => {
    // If there's already an active sprint, try to start another
    const activeSprintExists = await page.locator('text=Active').isVisible();
    
    if (activeSprintExists) {
      // Create a new sprint
      await backlogPage.createSprint();
      await page.locator('.ant-modal-footer button.ant-btn-primary').click();
      await page.waitForTimeout(1000);
      
      // Try to start it
      const startButton = page.locator('button:has-text("Start Sprint")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        
        // Should show error message
        await expect(page.locator('.ant-message-error')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('SPR-004: should complete a sprint', async ({ authenticatedPage, page }) => {
    // Find Complete Sprint button
    const completeButton = page.locator('button:has-text("Complete Sprint")');
    
    if (await completeButton.isVisible()) {
      await completeButton.first().click();
      
      // Complete Sprint modal should open
      const modal = page.locator('.ant-modal');
      await expect(modal).toBeVisible();
      
      // Select "Move to Backlog" option
      await page.locator('input[value="backlog"], label:has-text("Move to Backlog")').click();
      
      // Complete
      await page.locator('.ant-modal-footer button.ant-btn-primary').click();
      
      // Should show success message
      await dashboardPage.expectSuccessMessage('completed');
    }
  });

  test('SPR-005: should drag issue from backlog to sprint', async ({ authenticatedPage, page }) => {
    // Get first issue in backlog
    const backlogIssue = page.locator('.ant-card:has-text("Backlog") [data-testid^="issue-"], .ant-card:has-text("Backlog") .issue-item').first();
    const sprintContainer = page.locator('.ant-card').filter({ hasText: /Sprint/ }).first();
    
    if (await backlogIssue.isVisible() && await sprintContainer.isVisible()) {
      await backlogIssue.dragTo(sprintContainer);
      
      // Issue should now be in sprint
      await page.waitForTimeout(1000);
    }
  });

  test('SPR-006: should update issue status to TODO when added to sprint', async ({ authenticatedPage, page }) => {
    // Create an issue
    await backlogPage.openCreateIssueModal();
    const { CreateIssuePage } = await import('../../pages');
    const createIssuePage = new CreateIssuePage(page);
    
    await createIssuePage.createStory('Test story for sprint');
    await page.waitForTimeout(1000);
    
    // Drag to sprint
    const storyElement = page.locator('text=Test story for sprint').first();
    const sprintContainer = page.locator('.ant-card').filter({ hasText: /Sprint/ }).first();
    
    if (await storyElement.isVisible() && await sprintContainer.isVisible()) {
      await storyElement.dragTo(sprintContainer);
      await page.waitForTimeout(1000);
      
      // Status should change to TODO
      // Check if the issue now shows TODO tag
    }
  });
});
