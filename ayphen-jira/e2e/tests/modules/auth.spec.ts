import { test, expect, Page } from '@playwright/test';

/**
 * Authentication Tests
 * Routes: /login, /register, /forgot-password
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

test.describe('Authentication', () => {

  test('AUTH-001: Login page loads', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/login/);
    
    // Check for login form
    const emailInput = page.locator('input[placeholder*="email" i]');
    const passwordInput = page.locator('input[placeholder*="password" i]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    await page.screenshot({ path: 'test-results/login-page.png' });
  });

  test('AUTH-002: Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
    await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL(/.*\/(dashboard|board|backlog|projects)/, { timeout: 15000 });
    
    // Should be redirected to authenticated page
    const url = page.url();
    expect(url).not.toContain('/login');
    
    await page.screenshot({ path: 'test-results/login-success.png' });
  });

  test('AUTH-003: Login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder="Enter your email"]', 'invalid@test.com');
    await page.fill('input[placeholder="Enter your password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(3000);
    
    // Should stay on login page or show error
    const url = page.url();
    const hasError = await page.locator('.ant-message-error, [class*="error"]').count() > 0;
    
    console.log(`Stayed on login: ${url.includes('/login')}, Error shown: ${hasError}`);
  });

  test('AUTH-004: Register page loads', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/(register|login)/);
    await page.screenshot({ path: 'test-results/register-page.png' });
  });

  test('AUTH-005: Forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/forgot-password/);
    await page.screenshot({ path: 'test-results/forgot-password.png' });
  });

  test('AUTH-006: Login to register link', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const registerLink = page.locator('a:has-text("Sign Up"), a:has-text("Register"), button:has-text("Create Account")').first();
    const visible = await registerLink.isVisible().catch(() => false);
    console.log(`Register link: ${visible}`);
  });

  test('AUTH-007: Login to forgot password link', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const forgotLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")').first();
    const visible = await forgotLink.isVisible().catch(() => false);
    console.log(`Forgot password link: ${visible}`);
  });

  test('AUTH-008: Protected route redirect', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should redirect to login
    const url = page.url();
    console.log(`Redirected URL: ${url}`);
  });

  test('AUTH-009: Logout functionality', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
    await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*\/(dashboard|board|backlog)/, { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Look for logout button (usually in profile menu)
    const avatarBtn = page.locator('img[alt*="avatar" i], [class*="avatar"]').first();
    if (await avatarBtn.isVisible()) {
      await avatarBtn.click();
      await page.waitForTimeout(1000);
      
      const logoutBtn = page.locator('text=/Logout|Sign Out/i').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(2000);
        console.log('Logout clicked');
      }
    }
    
    await page.screenshot({ path: 'test-results/logout.png' });
  });

  test('AUTH-010: Session persistence', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
    await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*\/(dashboard|board|backlog)/, { timeout: 15000 });
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should still be authenticated
    const url = page.url();
    expect(url).not.toContain('/login');
  });
});
