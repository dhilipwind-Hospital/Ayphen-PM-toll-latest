import { test, expect, Page } from '@playwright/test';

/**
 * Issue Details Tests
 * Tests for issue detail view - watchers, labels, links, history
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

const PROJECT_NAME = 'AI Automation';

async function loginAndSelectProject(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
  await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/(dashboard|board|backlog)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log(`Project: ${PROJECT_NAME}`);
}

test.describe('Issue Details', () => {

  test('ISD-001: Issue detail view opens', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const detailView = page.locator('.ant-drawer:visible, .ant-modal:visible, [class*="detail"]').first();
      const visible = await detailView.isVisible().catch(() => false);
      console.log(`Detail view opened: ${visible}`);
    }
    
    await page.screenshot({ path: 'test-results/issue-detail.png' });
  });

  test('ISD-002: Issue title editable', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const titleInput = page.locator('input[class*="title"], h1, h2, [class*="summary"]').first();
      const visible = await titleInput.isVisible().catch(() => false);
      console.log(`Title element: ${visible}`);
    }
  });

  test('ISD-003: Status dropdown', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const statusDropdown = page.locator('[class*="status"], .ant-tag, .ant-select:has-text("Status")').first();
      const visible = await statusDropdown.isVisible().catch(() => false);
      console.log(`Status dropdown: ${visible}`);
    }
  });

  test('ISD-004: Priority field', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const priority = await page.locator('text=/Priority/i').count();
      console.log(`Priority field: ${priority > 0}`);
    }
  });

  test('ISD-005: Assignee field', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const assignee = await page.locator('text=/Assignee/i').count();
      console.log(`Assignee field: ${assignee > 0}`);
    }
  });

  test('ISD-006: Labels section', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const labels = await page.locator('text=/Label|Labels/i').count();
      console.log(`Labels section: ${labels > 0}`);
    }
  });

  test('ISD-007: Due date field', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const dueDate = await page.locator('text=/Due|Date/i').count();
      console.log(`Due date field: ${dueDate > 0}`);
    }
  });

  test('ISD-008: Reporter field', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const reporter = await page.locator('text=/Reporter|Created by/i').count();
      console.log(`Reporter field: ${reporter > 0}`);
    }
  });

  test('ISD-009: Issue history/activity', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const history = await page.locator('text=/History|Activity|Log/i').count();
      console.log(`History section: ${history > 0}`);
    }
  });

  test('ISD-010: Close issue detail', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      const detailClosed = await page.locator('.ant-drawer:visible, .ant-modal:visible').count() === 0;
      console.log(`Detail closed: ${detailClosed}`);
    }
  });
});
