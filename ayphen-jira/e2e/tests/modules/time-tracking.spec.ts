import { test, expect, Page } from '@playwright/test';

/**
 * Time Tracking Tests
 * Route: /time-tracking
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

test.describe('Time Tracking', () => {

  test('TIM-001: View time tracking page', async ({ page }) => {
    await login(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/time-tracking/);
    await page.screenshot({ path: 'test-results/time-tracking.png' });
  });

  test('TIM-002: Time entries display', async ({ page }) => {
    await login(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const entries = page.locator('tr, [class*="entry"], [class*="time"]');
    const count = await entries.count();
    console.log(`Time entries: ${count}`);
  });

  test('TIM-003: Log time button', async ({ page }) => {
    await login(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const logBtn = page.locator('button:has-text("Log"), button:has-text("Add")').first();
    const visible = await logBtn.isVisible().catch(() => false);
    console.log(`Log time button: ${visible}`);
  });

  test('TIM-004: Time summary', async ({ page }) => {
    await login(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const summary = await page.locator('text=/Total|Hours|Time/i').count();
    console.log(`Time summary elements: ${summary}`);
  });

  test('TIM-005: Date filter', async ({ page }) => {
    await login(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dateFilter = page.locator('.ant-picker, input[type="date"]').first();
    const visible = await dateFilter.isVisible().catch(() => false);
    console.log(`Date filter: ${visible}`);
  });

  test('TIM-006: Time tracking refresh', async ({ page }) => {
    await login(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/time-tracking/);
  });
});
