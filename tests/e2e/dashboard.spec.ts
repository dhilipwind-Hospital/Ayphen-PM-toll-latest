import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('2.1 View Dashboard', async ({ page }) => {
    await expect(page.locator('text=Total Issues')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('2.2 Dashboard Time Range Filter', async ({ page }) => {
    await page.selectOption('select[name="timeRange"]', 'month');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Total Issues')).toBeVisible();
  });

  test('2.3 Navigate from Dashboard', async ({ page }) => {
    await page.click('text=View Board');
    await expect(page).toHaveURL(/.*board/);
  });
});
