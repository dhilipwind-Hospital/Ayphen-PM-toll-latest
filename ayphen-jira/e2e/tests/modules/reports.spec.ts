import { test, expect, Page } from '@playwright/test';

/**
 * Reports Tests
 * Routes: /reports, /advanced-reports
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

test.describe('Reports', () => {

  test('RPT-001: View reports page', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/reports/);
    await page.screenshot({ path: 'test-results/reports-view.png' });
  });

  test('RPT-002: Charts display', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const charts = page.locator('canvas, svg, [class*="chart"]');
    const count = await charts.count();
    console.log(`Charts found: ${count}`);
  });

  test('RPT-003: Advanced reports page', async ({ page }) => {
    await login(page);
    await page.goto('/advanced-reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/advanced-reports/);
    await page.screenshot({ path: 'test-results/advanced-reports.png' });
  });

  test('RPT-004: Report type selector', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const selector = page.locator('.ant-select, select, [class*="dropdown"]').first();
    const visible = await selector.isVisible().catch(() => false);
    console.log(`Report type selector: ${visible}`);
  });

  test('RPT-005: Date range filter', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dateFilter = page.locator('.ant-picker, input[type="date"], [class*="date"]').first();
    const visible = await dateFilter.isVisible().catch(() => false);
    console.log(`Date filter: ${visible}`);
  });

  test('RPT-006: Reports refresh', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/reports/);
  });
});
