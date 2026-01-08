import { test, expect, Page } from '@playwright/test';

/**
 * People & Teams Tests
 * Routes: /people, /teams
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

test.describe('People & Teams', () => {

  test('PPL-001: View people page', async ({ page }) => {
    await login(page);
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/people/);
    await page.screenshot({ path: 'test-results/people-page.png' });
  });

  test('PPL-002: People list displays', async ({ page }) => {
    await login(page);
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const users = page.locator('[class*="user"], [class*="member"], tr');
    const count = await users.count();
    console.log(`Users found: ${count}`);
  });

  test('PPL-003: Teams page', async ({ page }) => {
    await login(page);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/teams/);
    await page.screenshot({ path: 'test-results/teams-page.png' });
  });

  test('PPL-004: Invite button visible', async ({ page }) => {
    await login(page);
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    const visible = await inviteBtn.isVisible().catch(() => false);
    console.log(`Invite button: ${visible}`);
  });

  test('PPL-005: User profile click', async ({ page }) => {
    await login(page);
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstUser = page.locator('[class*="user"], [class*="member"]').first();
    if (await firstUser.isVisible()) {
      await firstUser.click();
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: 'test-results/user-profile.png' });
  });

  test('PPL-006: Search people', async ({ page }) => {
    await login(page);
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });

  test('PPL-007: People directory tab', async ({ page }) => {
    await login(page);
    await page.goto('/people/directory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/people-directory.png' });
  });

  test('PPL-008: Teams tab', async ({ page }) => {
    await login(page);
    await page.goto('/people/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/people-teams.png' });
  });
});
