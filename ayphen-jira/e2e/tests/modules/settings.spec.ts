import { test, expect, Page } from '@playwright/test';

/**
 * Settings Tests
 * Routes: /settings/profile, /settings/notifications, /settings/system
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

test.describe('Settings', () => {

  test('SET-001: Profile settings page', async ({ page }) => {
    await login(page);
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/settings\/profile/);
    await page.screenshot({ path: 'test-results/settings-profile.png' });
  });

  test('SET-002: Profile form fields', async ({ page }) => {
    await login(page);
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
    const visible = await nameInput.isVisible().catch(() => false);
    console.log(`Name input: ${visible}`);
  });

  test('SET-003: Notification settings', async ({ page }) => {
    await login(page);
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/settings\/notifications/);
    await page.screenshot({ path: 'test-results/settings-notifications.png' });
  });

  test('SET-004: Notification toggles', async ({ page }) => {
    await login(page);
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const toggles = page.locator('.ant-switch, input[type="checkbox"]');
    const count = await toggles.count();
    console.log(`Notification toggles: ${count}`);
  });

  test('SET-005: System settings', async ({ page }) => {
    await login(page);
    await page.goto('/settings/system');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/settings\/system/);
    await page.screenshot({ path: 'test-results/settings-system.png' });
  });

  test('SET-006: Theme toggle', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const themeBtn = page.locator('button[aria-label*="theme" i], button:has-text("Toggle theme")').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(1000);
      console.log('Theme toggled');
    }
  });

  test('SET-007: Issue settings', async ({ page }) => {
    await login(page);
    await page.goto('/settings/issues');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/settings-issues.png' });
  });

  test('SET-008: Settings navigation', async ({ page }) => {
    await login(page);
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for settings tabs/menu
    const tabs = page.locator('[class*="tab"], [class*="menu"] a');
    const count = await tabs.count();
    console.log(`Settings tabs: ${count}`);
  });
});
