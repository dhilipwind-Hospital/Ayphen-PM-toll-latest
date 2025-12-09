import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1600/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('Navigate All Routes', async ({ page }) => {
    const routes = [
      { path: '/dashboard', text: 'Dashboard' },
      { path: '/board', text: 'To Do' },
      { path: '/backlog', text: 'Backlog' },
      { path: '/projects', text: 'Projects' },
      { path: '/reports', text: 'Reports' },
      { path: '/settings/profile', text: 'Profile' }
    ];

    for (const route of routes) {
      console.log(`Testing route: ${route.path}`);
      await page.goto(`http://localhost:1600${route.path}`);
      await page.waitForTimeout(1000);
      await expect(page.locator(`text=${route.text}`)).toBeVisible({ timeout: 5000 });
    }
  });
});
