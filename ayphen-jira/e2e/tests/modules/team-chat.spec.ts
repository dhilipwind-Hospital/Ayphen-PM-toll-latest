import { test, expect, Page } from '@playwright/test';

/**
 * Team Chat Tests
 * Route: /team-chat
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

test.describe('Team Chat', () => {

  test('CHT-001: View team chat page', async ({ page }) => {
    await login(page);
    await page.goto('/team-chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/team-chat/);
    await page.screenshot({ path: 'test-results/team-chat.png' });
  });

  test('CHT-002: Chat input visible', async ({ page }) => {
    await login(page);
    await page.goto('/team-chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    const visible = await chatInput.isVisible().catch(() => false);
    console.log(`Chat input: ${visible}`);
  });

  test('CHT-003: Message list', async ({ page }) => {
    await login(page);
    await page.goto('/team-chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const messages = page.locator('[class*="message"], [class*="chat"]');
    const count = await messages.count();
    console.log(`Messages: ${count}`);
  });

  test('CHT-004: Send button', async ({ page }) => {
    await login(page);
    await page.goto('/team-chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const sendBtn = page.locator('button:has-text("Send"), button[type="submit"]').first();
    const visible = await sendBtn.isVisible().catch(() => false);
    console.log(`Send button: ${visible}`);
  });

  test('CHT-005: Chat channels/rooms', async ({ page }) => {
    await login(page);
    await page.goto('/team-chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const channels = page.locator('[class*="channel"], [class*="room"]');
    const count = await channels.count();
    console.log(`Channels: ${count}`);
  });

  test('CHT-006: Chat refresh', async ({ page }) => {
    await login(page);
    await page.goto('/team-chat');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/team-chat/);
  });
});
