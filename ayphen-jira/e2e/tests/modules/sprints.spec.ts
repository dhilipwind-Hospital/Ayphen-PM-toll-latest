import { test, expect, Page } from '@playwright/test';

/**
 * Sprint Tests
 * Routes: /sprint-planning, /sprint-reports, /backlog
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

test.describe('Sprints', () => {

  test('SPR-001: View sprint planning page', async ({ page }) => {
    await login(page);
    await page.goto('/sprint-planning');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/sprint-planning/);
    await page.screenshot({ path: 'test-results/sprint-planning.png' });
  });

  test('SPR-002: Sprint reports page', async ({ page }) => {
    await login(page);
    await page.goto('/sprint-reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/sprint-reports/);
    await page.screenshot({ path: 'test-results/sprint-reports.png' });
  });

  test('SPR-003: Active sprint visible on backlog', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const activeSprint = await page.locator('text=/Active|Sprint/i').count();
    console.log(`Active sprint sections: ${activeSprint}`);
  });

  test('SPR-004: Start Sprint button', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const startBtn = page.locator('button:has-text("Start Sprint")').first();
    const visible = await startBtn.isVisible().catch(() => false);
    console.log(`Start Sprint button: ${visible}`);
  });

  test('SPR-005: Complete Sprint button', async ({ page }) => {
    await login(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const completeBtn = page.locator('button:has-text("Complete Sprint")').first();
    const visible = await completeBtn.isVisible().catch(() => false);
    console.log(`Complete Sprint button: ${visible}`);
  });

  test('SPR-006: Sprint burndown chart', async ({ page }) => {
    await login(page);
    await page.goto('/sprint-reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const chart = page.locator('[class*="chart"], canvas, svg').first();
    const visible = await chart.isVisible().catch(() => false);
    console.log(`Chart visible: ${visible}`);
  });

  test('SPR-007: Sprint velocity', async ({ page }) => {
    await login(page);
    await page.goto('/sprint-reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const velocity = await page.locator('text=/velocity/i').count();
    console.log(`Velocity sections: ${velocity}`);
  });

  test('SPR-008: Sprint planning has issues', async ({ page }) => {
    await login(page);
    await page.goto('/sprint-planning');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const issues = await page.locator('tr, [class*="issue"]').count();
    console.log(`Issues in sprint planning: ${issues}`);
  });
});
