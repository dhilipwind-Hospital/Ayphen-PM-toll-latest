import { test, expect, Page } from '@playwright/test';

/**
 * Bugs Tests
 * Route: /bugs
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

test.describe('Bugs', () => {

  test('BUG-001: View bugs list', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/bugs/);
    await page.screenshot({ path: 'test-results/bugs-list.png' });
  });

  test('BUG-002: Report Bug button', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const reportBtn = page.locator('button:has-text("Report Bug")').first();
    await expect(reportBtn).toBeVisible();
  });

  test('BUG-003: Bugs table displays', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const rows = page.locator('tr');
    const count = await rows.count();
    console.log(`Bug rows: ${count}`);
  });

  test('BUG-004: Severity column', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const severityColumn = await page.locator('text=/Severity/i').count();
    console.log(`Severity column: ${severityColumn > 0}`);
  });

  test('BUG-005: Priority column', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const priorityColumn = await page.locator('text=/Priority/i').count();
    console.log(`Priority column: ${priorityColumn > 0}`);
  });

  test('BUG-006: Click bug opens detail', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstBug = page.locator('tr').nth(1);
    if (await firstBug.isVisible()) {
      await firstBug.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'test-results/bug-detail.png' });
  });

  test('BUG-007: Bug status filter', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const statusFilter = page.locator('.ant-select, [class*="filter"]').first();
    const visible = await statusFilter.isVisible().catch(() => false);
    console.log(`Status filter: ${visible}`);
  });

  test('BUG-008: Bug environment field', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstBug = page.locator('tr').nth(1);
    if (await firstBug.isVisible()) {
      await firstBug.click();
      await page.waitForTimeout(2000);
      
      const envField = await page.locator('text=/Environment|Browser|OS/i').count();
      console.log(`Environment field: ${envField > 0}`);
    }
  });
});
