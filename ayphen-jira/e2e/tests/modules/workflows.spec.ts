import { test, expect, Page } from '@playwright/test';

/**
 * Workflows Tests
 * Routes: /workflows, /automation
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

test.describe('Workflows', () => {

  test('WRK-001: View workflows page', async ({ page }) => {
    await login(page);
    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/workflows/);
    await page.screenshot({ path: 'test-results/workflows.png' });
  });

  test('WRK-002: Workflows list', async ({ page }) => {
    await login(page);
    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const workflows = page.locator('[class*="workflow"], tr, [class*="card"]');
    const count = await workflows.count();
    console.log(`Workflows: ${count}`);
  });

  test('WRK-003: Create workflow button', async ({ page }) => {
    await login(page);
    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
    const visible = await createBtn.isVisible().catch(() => false);
    console.log(`Create workflow button: ${visible}`);
  });

  test('WRK-004: Automation rules page', async ({ page }) => {
    await login(page);
    await page.goto('/automation');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/automation/);
    await page.screenshot({ path: 'test-results/automation.png' });
  });

  test('WRK-005: Automation rules list', async ({ page }) => {
    await login(page);
    await page.goto('/automation');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const rules = page.locator('[class*="rule"], tr, [class*="card"]');
    const count = await rules.count();
    console.log(`Automation rules: ${count}`);
  });

  test('WRK-006: Workflows refresh', async ({ page }) => {
    await login(page);
    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/workflows/);
  });
});
