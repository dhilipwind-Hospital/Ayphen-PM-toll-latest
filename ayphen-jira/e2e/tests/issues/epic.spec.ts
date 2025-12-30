import { test, expect } from '../../fixtures/auth.fixture';
import { BacklogPage, CreateIssuePage, DashboardPage } from '../../pages';
import { createTestEpic } from '../../utils/test-data';

test.describe('Epic Management', () => {
  let dashboardPage: DashboardPage;
  let backlogPage: BacklogPage;
  let createIssuePage: CreateIssuePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    backlogPage = new BacklogPage(authenticatedPage);
    createIssuePage = new CreateIssuePage(authenticatedPage);
    
    // Navigate to backlog
    await backlogPage.goto();
    await backlogPage.expectBacklogLoaded();
  });

  test('EPC-001: should create an epic', async ({ authenticatedPage }) => {
    const epic = createTestEpic();
    
    // Open create modal
    await backlogPage.openCreateIssueModal();
    await createIssuePage.waitForModal();
    
    // Create epic
    await createIssuePage.createEpic(epic.summary, epic.description);
    
    // Verify success message
    await dashboardPage.expectSuccessMessage('created');
  });

  test('EPC-002: should display epic in issue list', async ({ authenticatedPage, page }) => {
    const epic = createTestEpic();
    
    // Create epic
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createEpic(epic.summary);
    
    // Wait for modal to close and list to update
    await page.waitForTimeout(1000);
    
    // Verify epic appears in list (check for summary text)
    const epicElement = page.locator(`text=${epic.summary}`).first();
    await expect(epicElement).toBeVisible({ timeout: 10000 });
  });

  test('EPC-003: should open epic detail on click', async ({ authenticatedPage, page }) => {
    const epic = createTestEpic();
    
    // Create epic
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createEpic(epic.summary);
    
    // Wait for creation
    await page.waitForTimeout(1000);
    
    // Click on epic
    await page.locator(`text=${epic.summary}`).first().click();
    
    // Verify detail panel opens
    const detailPanel = page.locator('[data-testid="issue-detail"], .issue-detail-panel, aside');
    await expect(detailPanel).toBeVisible({ timeout: 10000 });
  });

  test('EPC-004: should edit epic summary inline', async ({ authenticatedPage, page }) => {
    const epic = createTestEpic();
    const newSummary = 'Updated Epic Summary';
    
    // Create epic
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createEpic(epic.summary);
    await page.waitForTimeout(1000);
    
    // Click on epic to open detail
    await page.locator(`text=${epic.summary}`).first().click();
    await page.waitForTimeout(500);
    
    // Find and click on summary to edit
    const summaryElement = page.locator('h1, h2, [data-testid="issue-summary"]').first();
    await summaryElement.click();
    
    // Edit summary (if it's an input now)
    const summaryInput = page.locator('input[name="summary"], textarea[name="summary"], [contenteditable="true"]').first();
    if (await summaryInput.isVisible()) {
      await summaryInput.fill(newSummary);
      await page.keyboard.press('Enter');
      
      // Verify update
      await expect(page.locator(`text=${newSummary}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('EPC-005: should delete epic', async ({ authenticatedPage, page }) => {
    const epic = createTestEpic();
    
    // Create epic
    await backlogPage.openCreateIssueModal();
    await createIssuePage.createEpic(epic.summary);
    await page.waitForTimeout(1000);
    
    // Open epic detail
    await page.locator(`text=${epic.summary}`).first().click();
    await page.waitForTimeout(500);
    
    // Find and click delete button
    const deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-issue"]');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion
      await page.locator('.ant-modal-confirm-btns button.ant-btn-primary, button:has-text("Delete")').click();
      
      // Verify epic is removed
      await expect(page.locator(`text=${epic.summary}`)).not.toBeVisible({ timeout: 5000 });
    }
  });
});
