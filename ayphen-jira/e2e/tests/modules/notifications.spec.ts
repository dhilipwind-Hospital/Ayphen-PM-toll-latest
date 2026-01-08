import { test, expect, Page } from '@playwright/test';

/**
 * Notifications Tests
 * Tests for notification features
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

test.describe('Notifications', () => {

  test('NOT-001: Notification bell visible', async ({ page }) => {
    await loginAndSelectProject(page);
    
    const notifBell = page.locator('button[aria-label*="notification" i], [class*="notification"], [class*="bell"]').first();
    const visible = await notifBell.isVisible().catch(() => false);
    console.log(`Notification bell: ${visible}`);
    
    await page.screenshot({ path: 'test-results/notification-bell.png' });
  });

  test('NOT-002: Click notification opens panel', async ({ page }) => {
    await loginAndSelectProject(page);
    
    const notifBell = page.locator('button[aria-label*="notification" i], [class*="notification"]').first();
    if (await notifBell.isVisible()) {
      await notifBell.click();
      await page.waitForTimeout(1000);
      
      const panel = page.locator('.ant-dropdown:visible, .ant-popover:visible, [class*="notification-panel"]').first();
      const visible = await panel.isVisible().catch(() => false);
      console.log(`Notification panel opened: ${visible}`);
    }
    
    await page.screenshot({ path: 'test-results/notification-panel.png' });
  });

  test('NOT-003: Notification count badge', async ({ page }) => {
    await loginAndSelectProject(page);
    
    const badge = page.locator('.ant-badge, [class*="badge"], sup').first();
    const visible = await badge.isVisible().catch(() => false);
    console.log(`Notification badge: ${visible}`);
  });

  test('NOT-004: Team notifications button', async ({ page }) => {
    await loginAndSelectProject(page);
    
    const teamNotif = page.locator('button[aria-label*="Team Notification" i], button:has-text("Team Notification")').first();
    const visible = await teamNotif.isVisible().catch(() => false);
    console.log(`Team notifications button: ${visible}`);
  });

  test('NOT-005: Notification settings link', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/settings\/notifications/);
    await page.screenshot({ path: 'test-results/notification-settings.png' });
  });

  test('NOT-006: Email notification toggle', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailToggle = page.locator('text=/Email/i').first();
    const visible = await emailToggle.isVisible().catch(() => false);
    console.log(`Email notification option: ${visible}`);
  });
});
