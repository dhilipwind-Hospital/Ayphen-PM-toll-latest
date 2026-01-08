import { test, expect, Page } from '@playwright/test';

/**
 * Watchers Tests
 * Tests for watching/following issues
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

test.describe('Watchers', () => {

  test('WCH-001: Watch button in issue detail', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const watchBtn = page.locator('button:has-text("Watch"), [class*="watch"], text=/Watch/i').first();
      const visible = await watchBtn.isVisible().catch(() => false);
      console.log(`Watch button: ${visible}`);
    }
    
    await page.screenshot({ path: 'test-results/watch-button.png' });
  });

  test('WCH-002: Watchers count', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const watchersCount = await page.locator('text=/Watcher|watching/i').count();
      console.log(`Watchers section: ${watchersCount > 0}`);
    }
  });

  test('WCH-003: Star/Favorite issue', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const starBtn = page.locator('[class*="star"], [class*="favorite"], button:has-text("Star")').first();
      const visible = await starBtn.isVisible().catch(() => false);
      console.log(`Star button: ${visible}`);
    }
  });

  test('WCH-004: Vote on issue', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const voteBtn = page.locator('button:has-text("Vote"), [class*="vote"]').first();
      const visible = await voteBtn.isVisible().catch(() => false);
      console.log(`Vote button: ${visible}`);
    }
  });
});
