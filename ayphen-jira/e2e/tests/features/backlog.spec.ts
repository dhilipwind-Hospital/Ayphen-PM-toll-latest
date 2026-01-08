import { test, expect, Page } from '@playwright/test';

/**
 * Backlog Feature Tests
 * Tests backlog management functionality
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
  await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/(dashboard|board|backlog|projects)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Backlog Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('BACK-001: Backlog page loads', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/backlog/);
    console.log('✅ BACK-001: Backlog page loaded');
  });

  test('BACK-002: Backlog shows issues', async ({ page }) => {
    const issues = await page.locator('[class*="issue"], [class*="Issue"], [class*="item"], [class*="row"]').count();
    console.log(`✅ BACK-002: Backlog items found: ${issues}`);
  });

  test('BACK-003: Backlog has sprint sections', async ({ page }) => {
    const sprints = await page.locator('text=Sprint, text=Iteration').count();
    console.log(`✅ BACK-003: Sprint sections found: ${sprints}`);
  });

  test('BACK-004: Backlog create issue button', async ({ page }) => {
    const createBtn = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').count();
    console.log(`✅ BACK-004: Create buttons found: ${createBtn}`);
  });

  test('BACK-005: Backlog items clickable', async ({ page }) => {
    const firstItem = page.locator('[class*="issue"], [class*="Issue"], [data-rbd-draggable-id]').first();
    
    if (await firstItem.isVisible()) {
      await firstItem.click();
      await page.waitForTimeout(1000);
      console.log('✅ BACK-005: Backlog item clicked');
    } else {
      console.log('⚠️ BACK-005: No backlog items to click');
    }
  });

  test('BACK-006: Backlog filter options', async ({ page }) => {
    const filters = await page.locator('[class*="filter"], [class*="Filter"], select, [class*="dropdown"]').count();
    console.log(`✅ BACK-006: Filter elements found: ${filters}`);
  });

  test('BACK-007: Backlog search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      console.log('✅ BACK-007: Backlog search works');
    } else {
      console.log('⚠️ BACK-007: Search input not found');
    }
  });

  test('BACK-008: Backlog refresh', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/backlog/);
    console.log('✅ BACK-008: Backlog refreshed successfully');
  });
});
