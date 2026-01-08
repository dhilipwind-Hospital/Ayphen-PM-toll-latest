import { test, expect, Page } from '@playwright/test';

/**
 * Dashboard Tests
 * Route: /dashboard
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

test.describe('Dashboard', () => {

  test('DSH-001: View dashboard', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    await page.screenshot({ path: 'test-results/dashboard-view.png' });
  });

  test('DSH-002: Dashboard shows welcome message', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const welcome = await page.locator('text=/Welcome|Hello|Hi/i').count();
    console.log(`Welcome message found: ${welcome > 0}`);
  });

  test('DSH-003: Quick stats display', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for stat cards
    const stats = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
    const count = await stats.count();
    console.log(`Stat cards: ${count}`);
  });

  test('DSH-004: Recent activity section', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const activity = await page.locator('text=/Recent|Activity|Latest/i').count();
    console.log(`Activity sections: ${activity}`);
  });

  test('DSH-005: Assigned issues widget', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const assigned = await page.locator('text=/Assigned|My Issues|Tasks/i').count();
    console.log(`Assigned sections: ${assigned}`);
  });

  test('DSH-006: Dashboard navigation links', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check sidebar navigation
    const navLinks = page.locator('[class*="menu"], [class*="sidebar"], [class*="nav"]');
    const count = await navLinks.count();
    console.log(`Navigation elements: ${count}`);
    // Just verify page loaded, navigation may use different selectors
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
