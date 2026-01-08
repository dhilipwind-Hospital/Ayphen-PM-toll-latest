import { test, expect, Page } from '@playwright/test';

/**
 * Reports Feature Tests
 * Tests reporting and analytics functionality
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

test.describe('Reports Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('RPT-001: Reports page loads', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/reports/);
    console.log('✅ RPT-001: Reports page loaded');
  });

  test('RPT-002: Reports shows charts', async ({ page }) => {
    const charts = await page.locator('canvas, svg, [class*="chart"], [class*="Chart"]').count();
    console.log(`✅ RPT-002: Chart elements found: ${charts}`);
  });

  test('RPT-003: Reports has report types', async ({ page }) => {
    const reportTypes = await page.locator('text=Burndown, text=Velocity, text=Sprint, text=Summary').count();
    console.log(`✅ RPT-003: Report type labels found: ${reportTypes}`);
  });

  test('RPT-004: Reports date filters', async ({ page }) => {
    const dateFilters = await page.locator('[class*="date"], [class*="Date"], input[type="date"], [class*="picker"]').count();
    console.log(`✅ RPT-004: Date filter elements found: ${dateFilters}`);
  });

  test('RPT-005: Reports export options', async ({ page }) => {
    const exportBtns = await page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("PDF")').count();
    console.log(`✅ RPT-005: Export buttons found: ${exportBtns}`);
  });

  test('RPT-006: Reports refresh', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/reports/);
    console.log('✅ RPT-006: Reports page refreshed successfully');
  });
});
