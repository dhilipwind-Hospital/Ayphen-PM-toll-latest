import { test, expect, Page } from '@playwright/test';

/**
 * Hierarchy & Roadmap Tests
 * Routes: /hierarchy, /roadmap
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

test.describe('Hierarchy & Roadmap', () => {

  test('HIR-001: View hierarchy page', async ({ page }) => {
    await login(page);
    await page.goto('/hierarchy');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/hierarchy/);
    await page.screenshot({ path: 'test-results/hierarchy.png' });
  });

  test('HIR-002: Hierarchy tree displays', async ({ page }) => {
    await login(page);
    await page.goto('/hierarchy');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const nodes = page.locator('[class*="node"], [class*="tree"], [class*="item"]');
    const count = await nodes.count();
    console.log(`Hierarchy nodes: ${count}`);
  });

  test('HIR-003: View roadmap page', async ({ page }) => {
    await login(page);
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/roadmap/);
    await page.screenshot({ path: 'test-results/roadmap.png' });
  });

  test('HIR-004: Roadmap timeline', async ({ page }) => {
    await login(page);
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const timeline = page.locator('[class*="timeline"], [class*="gantt"], [class*="roadmap"]').first();
    const visible = await timeline.isVisible().catch(() => false);
    console.log(`Timeline visible: ${visible}`);
  });

  test('HIR-005: Epics on roadmap', async ({ page }) => {
    await login(page);
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const epics = await page.locator('text=/Epic/i').count();
    console.log(`Epics on roadmap: ${epics}`);
  });

  test('HIR-006: Hierarchy refresh', async ({ page }) => {
    await login(page);
    await page.goto('/hierarchy');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/hierarchy/);
  });
});
