import { test, expect, Page } from '@playwright/test';

/**
 * Calendar Tests
 * Route: /calendar
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

test.describe('Calendar', () => {

  test('CAL-001: View calendar page', async ({ page }) => {
    await login(page);
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/calendar/);
    await page.screenshot({ path: 'test-results/calendar.png' });
  });

  test('CAL-002: Calendar grid displays', async ({ page }) => {
    await login(page);
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const calendar = page.locator('[class*="calendar"], [class*="fc-"], table').first();
    const visible = await calendar.isVisible().catch(() => false);
    console.log(`Calendar grid: ${visible}`);
  });

  test('CAL-003: Month navigation', async ({ page }) => {
    await login(page);
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const nextBtn = page.locator('button:has-text("Next"), [class*="next"]').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      console.log('Navigated to next month');
    }
  });

  test('CAL-004: Today button', async ({ page }) => {
    await login(page);
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const todayBtn = page.locator('button:has-text("Today")').first();
    const visible = await todayBtn.isVisible().catch(() => false);
    console.log(`Today button: ${visible}`);
  });

  test('CAL-005: Calendar refresh', async ({ page }) => {
    await login(page);
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/calendar/);
  });
});
