import { test, expect, Page } from '@playwright/test';

/**
 * Stories Tests
 * Routes: /stories, /stories/board
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

test.describe('Stories', () => {

  test('STR-001: View stories list', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/stories/);
    await page.screenshot({ path: 'test-results/stories-list.png' });
  });

  test('STR-002: Create Story button', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button:has-text("Create Story")');
    await expect(createBtn).toBeVisible();
  });

  test('STR-003: Stories table displays', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const rows = page.locator('tr');
    const count = await rows.count();
    console.log(`Story rows: ${count}`);
  });

  test('STR-004: Story points column', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const pointsColumn = await page.locator('text=/Points|Story Points/i').count();
    console.log(`Points column: ${pointsColumn > 0}`);
  });

  test('STR-005: Stories board view', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/stories-board.png' });
  });

  test('STR-006: Click story opens detail', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstStory = page.locator('tr').nth(1);
    if (await firstStory.isVisible()) {
      await firstStory.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'test-results/story-detail.png' });
  });

  test('STR-007: Story status filter', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const statusFilter = page.locator('.ant-select, [class*="filter"]').first();
    const visible = await statusFilter.isVisible().catch(() => false);
    console.log(`Status filter: ${visible}`);
  });

  test('STR-008: Story epic link', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const epicColumn = await page.locator('text=/Epic/i').count();
    console.log(`Epic column: ${epicColumn > 0}`);
  });
});
