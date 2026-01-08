import { test, expect, Page } from '@playwright/test';

/**
 * Epics Tests
 * Routes: /epics, /epics/board, /epic/:id
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

test.describe('Epics', () => {

  test('EPC-001: View epics list', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/epics/);
    await page.screenshot({ path: 'test-results/epics-list.png' });
  });

  test('EPC-002: Create Epic button', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button:has-text("Create Epic")');
    await expect(createBtn).toBeVisible();
  });

  test('EPC-003: Epics table columns', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const columns = await page.locator('th').allTextContents();
    console.log(`Epic columns: ${columns.join(', ')}`);
  });

  test('EPC-004: Epic progress bar', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const progressBars = page.locator('.ant-progress, [class*="progress"]');
    const count = await progressBars.count();
    console.log(`Progress bars: ${count}`);
  });

  test('EPC-005: Epic board view', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/epics-board.png' });
  });

  test('EPC-006: Click epic opens detail', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstEpic = page.locator('tr').nth(1);
    if (await firstEpic.isVisible()) {
      await firstEpic.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'test-results/epic-detail.png' });
  });

  test('EPC-007: Epic filter', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const filter = page.locator('.ant-select, [class*="filter"]').first();
    const visible = await filter.isVisible().catch(() => false);
    console.log(`Epic filter: ${visible}`);
  });

  test('EPC-008: Epic stories count', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const storiesColumn = await page.locator('text=/Stories|Issues/i').count();
    console.log(`Stories column: ${storiesColumn > 0}`);
  });
});
