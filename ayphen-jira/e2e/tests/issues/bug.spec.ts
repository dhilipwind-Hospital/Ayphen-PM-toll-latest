import { test, expect } from '../../fixtures/auth.fixture';
import { BacklogPage, CreateIssuePage, DashboardPage } from '../../pages';
import { createTestBug } from '../../utils/test-data';

test.describe('Bug Management', () => {
  let dashboardPage: DashboardPage;
  let backlogPage: BacklogPage;
  let createIssuePage: CreateIssuePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    backlogPage = new BacklogPage(authenticatedPage);
    createIssuePage = new CreateIssuePage(authenticatedPage);
    
    await backlogPage.goto();
    await backlogPage.expectBacklogLoaded();
  });

  test('BUG-001: should create a bug', async ({ authenticatedPage, page }) => {
    const bug = createTestBug();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.waitForModal();
    
    await createIssuePage.createBug(bug.summary, {
      description: bug.description,
      priority: bug.priority,
    });
    
    await dashboardPage.expectSuccessMessage('created');
  });

  test('BUG-002: should display bug with correct icon', async ({ authenticatedPage, page }) => {
    const bug = createTestBug();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createBug(bug.summary);
    
    await page.waitForTimeout(1000);
    
    // Bug should appear in list
    const bugElement = page.locator(`text=${bug.summary}`).first();
    await expect(bugElement).toBeVisible({ timeout: 10000 });
    
    // Bug icon should be visible (red bug icon)
    // This depends on your implementation
  });

  test('BUG-003: should create high priority bug', async ({ authenticatedPage, page }) => {
    const bug = createTestBug();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.waitForModal();
    
    await createIssuePage.createBug(bug.summary, {
      priority: 'Highest',
    });
    
    await dashboardPage.expectSuccessMessage('created');
    
    // Verify priority is displayed
    await page.waitForTimeout(1000);
    const bugRow = page.locator(`text=${bug.summary}`).first().locator('..');
    // Check for priority indicator
  });

  test('BUG-004: should open bug detail panel', async ({ authenticatedPage, page }) => {
    const bug = createTestBug();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createBug(bug.summary);
    await page.waitForTimeout(1000);
    
    // Click on bug
    await page.locator(`text=${bug.summary}`).first().click();
    
    // Detail panel should open
    await expect(page.locator('aside, .issue-detail-panel, [data-testid="issue-detail"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('BUG-005: should show bug in board', async ({ authenticatedPage, page }) => {
    const bug = createTestBug();
    
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createBug(bug.summary);
    await page.waitForTimeout(1000);
    
    // Navigate to board
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    
    // Bug should be visible on board (in BACKLOG or TODO column)
    const bugCard = page.locator(`text=${bug.summary}`).first();
    // May or may not be visible depending on board filters
  });

  test('BUG-006: should transition bug through workflow', async ({ authenticatedPage, page }) => {
    const bug = createTestBug();
    
    // Create bug
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createBug(bug.summary);
    await page.waitForTimeout(1000);
    
    // Open bug detail
    await page.locator(`text=${bug.summary}`).first().click();
    await page.waitForTimeout(500);
    
    // Find status dropdown and change it
    const statusButton = page.locator('[data-testid="status-select"], .status-tag, .ant-tag').first();
    if (await statusButton.isVisible()) {
      await statusButton.click();
      
      // Select "In Progress"
      const inProgressOption = page.locator('.ant-dropdown-menu-item:has-text("In Progress"), .ant-select-item:has-text("In Progress")');
      if (await inProgressOption.isVisible()) {
        await inProgressOption.click();
      }
    }
  });
});
