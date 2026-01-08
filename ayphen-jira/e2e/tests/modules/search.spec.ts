import { test, expect, Page } from '@playwright/test';

/**
 * Search & Filters Tests
 * Routes: /search, /filters, /filters/saved
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

test.describe('Search & Filters', () => {

  test('SRH-001: Global search', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find global search
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      console.log('Global search performed');
    }
    
    await page.screenshot({ path: 'test-results/global-search.png' });
  });

  test('SRH-002: Search page', async ({ page }) => {
    await login(page);
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/search/);
    await page.screenshot({ path: 'test-results/search-page.png' });
  });

  test('SRH-003: Filters page', async ({ page }) => {
    await login(page);
    await page.goto('/filters');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/filters/);
    await page.screenshot({ path: 'test-results/filters-page.png' });
  });

  test('SRH-004: Saved filters', async ({ page }) => {
    await login(page);
    await page.goto('/filters/saved');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/saved-filters.png' });
  });

  test('SRH-005: Advanced search', async ({ page }) => {
    await login(page);
    await page.goto('/filters/advanced');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/advanced-search.png' });
  });

  test('SRH-006: Filter by issue type', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for type filter
    const typeFilter = page.locator('text=/Type|Issue Type/i').first();
    const visible = await typeFilter.isVisible().catch(() => false);
    console.log(`Type filter: ${visible}`);
  });

  test('SRH-007: Filter by status', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const statusFilter = page.locator('text=/Status/i').first();
    const visible = await statusFilter.isVisible().catch(() => false);
    console.log(`Status filter: ${visible}`);
  });

  test('SRH-008: Search results display', async ({ page }) => {
    await login(page);
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
    }
    
    const results = await page.locator('tr, [class*="result"], [class*="item"]').count();
    console.log(`Search results: ${results}`);
  });
});
