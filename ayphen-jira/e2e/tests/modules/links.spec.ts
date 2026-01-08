import { test, expect, Page } from '@playwright/test';

/**
 * Issue Links Tests
 * Tests for linking issues together
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

test.describe('Issue Links', () => {

  test('LNK-001: Link section in issue detail', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const linksSection = await page.locator('text=/Link|Links|Related/i').count();
      console.log(`Links section: ${linksSection > 0}`);
    }
    
    await page.screenshot({ path: 'test-results/issue-links.png' });
  });

  test('LNK-002: Epic link field', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstStory = page.locator('tr').first();
    if (await firstStory.isVisible()) {
      await firstStory.click();
      await page.waitForTimeout(2000);
      
      const epicLink = await page.locator('text=/Epic|Parent/i').count();
      console.log(`Epic link field: ${epicLink > 0}`);
    }
  });

  test('LNK-003: Child issues section', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstEpic = page.locator('tr').first();
    if (await firstEpic.isVisible()) {
      await firstEpic.click();
      await page.waitForTimeout(2000);
      
      const children = await page.locator('text=/Child|Stories|Issues/i').count();
      console.log(`Child issues section: ${children > 0}`);
    }
  });

  test('LNK-004: Subtasks section', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const subtasks = await page.locator('text=/Subtask|Sub-task|Child/i').count();
      console.log(`Subtasks section: ${subtasks > 0}`);
    }
  });

  test('LNK-005: Add link button', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const addLinkBtn = page.locator('button:has-text("Link"), button:has-text("Add Link")').first();
      const visible = await addLinkBtn.isVisible().catch(() => false);
      console.log(`Add link button: ${visible}`);
    }
  });
});
