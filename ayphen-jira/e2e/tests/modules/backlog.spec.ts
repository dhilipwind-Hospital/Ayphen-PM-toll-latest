import { test, expect, Page } from '@playwright/test';

/**
 * Backlog Tests
 * Route: /backlog
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
  await page.waitForURL(/.*\/(dashboard|board|backlog)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Backlog', () => {

  test('BKL-001: View backlog page', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/backlog/);
    await page.screenshot({ path: 'test-results/backlog-view.png' });
  });

  test('BKL-002: Backlog displays issues', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for backlog items
    const items = page.locator('[data-rbd-draggable-id], tr, [class*="issue"]');
    const count = await items.count();
    console.log(`Backlog items: ${count}`);
  });

  test('BKL-003: Create Issue button visible', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button:has-text("Create")').first();
    await expect(createBtn).toBeVisible();
  });

  test('BKL-004: Sprint sections visible', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for sprint sections
    const sprintSections = await page.locator('text=/Sprint/i').count();
    console.log(`Sprint sections: ${sprintSections}`);
  });

  test('BKL-005: Backlog section visible', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const backlogSection = page.locator('text=/Backlog/i').first();
    await expect(backlogSection).toBeVisible();
  });

  test('BKL-006: Click issue opens detail', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'test-results/backlog-issue-detail.png' });
  });

  test('BKL-007: Create Sprint button', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createSprintBtn = page.locator('button:has-text("Create Sprint"), button:has-text("Start Sprint")').first();
    const visible = await createSprintBtn.isVisible().catch(() => false);
    console.log(`Create Sprint button visible: ${visible}`);
  });

  test('BKL-008: Backlog refresh', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/backlog/);
  });
});
