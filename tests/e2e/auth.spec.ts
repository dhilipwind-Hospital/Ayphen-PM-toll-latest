import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1.1 User Registration', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test@123');
    await page.fill('input[name="confirmPassword"]', 'Test@123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('1.2 User Login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('1.3 User Logout', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('1.4 Invalid Login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Login failed')).toBeVisible();
  });
});
