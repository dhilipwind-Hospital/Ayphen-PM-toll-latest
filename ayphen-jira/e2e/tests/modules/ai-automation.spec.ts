import { test, expect, Page } from '@playwright/test';

/**
 * AI Test Automation Tests
 * Route: /ai-test-automation/*
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

test.describe('AI Test Automation', () => {

  test('AIT-001: Requirements page', async ({ page }) => {
    await login(page);
    await page.goto('/ai-test-automation/requirements');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/ai-requirements.png' });
  });

  test('AIT-002: Generated stories page', async ({ page }) => {
    await login(page);
    await page.goto('/ai-test-automation/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/ai-stories.png' });
  });

  test('AIT-003: Test cases page', async ({ page }) => {
    await login(page);
    await page.goto('/ai-test-automation/test-cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/ai-test-cases.png' });
  });

  test('AIT-004: Test suites page', async ({ page }) => {
    await login(page);
    await page.goto('/ai-test-automation/test-suites');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/ai-test-suites.png' });
  });

  test('AIT-005: Test execution page', async ({ page }) => {
    await login(page);
    await page.goto('/ai-test-automation/execution');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/ai-execution.png' });
  });

  test('AIT-006: Test reports page', async ({ page }) => {
    await login(page);
    await page.goto('/ai-test-automation/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/ai-reports.png' });
  });

  test('AIT-007: AI insights page', async ({ page }) => {
    await login(page);
    await page.goto('/ai-test-automation/insights');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/ai-insights.png' });
  });

  test('AIT-008: Sync status page', async ({ page }) => {
    await login(page);
    await page.goto('/ai-test-automation/sync');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/ai-sync.png' });
  });

  test('AIT-009: Manual test cases', async ({ page }) => {
    await login(page);
    await page.goto('/test-cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/test-cases/);
    await page.screenshot({ path: 'test-results/manual-test-cases.png' });
  });

  test('AIT-010: Test suites standalone', async ({ page }) => {
    await login(page);
    await page.goto('/test-suites');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/test-suites/);
    await page.screenshot({ path: 'test-results/test-suites.png' });
  });

  test('AIT-011: Test runs page', async ({ page }) => {
    await login(page);
    await page.goto('/test-runs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/test-runs/);
    await page.screenshot({ path: 'test-results/test-runs.png' });
  });
});
