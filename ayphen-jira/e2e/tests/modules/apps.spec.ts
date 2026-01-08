import { test, expect, Page } from '@playwright/test';

/**
 * Apps & Integrations Tests
 * Routes: /apps/*
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

test.describe('Apps & Integrations', () => {

  test('APP-001: Apps explore page', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/apps/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/apps-explore.png' });
  });

  test('APP-002: Apps manage page', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/apps/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/apps-manage.png' });
  });

  test('APP-003: Installed apps', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/apps/installed');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/apps-installed.png' });
  });

  test('APP-004: Apps marketplace', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/apps/marketplace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/apps-marketplace.png' });
  });

  test('APP-005: AI Features page', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/ai-features');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/ai-features/);
    await page.screenshot({ path: 'test-results/ai-features.png' });
  });
});
