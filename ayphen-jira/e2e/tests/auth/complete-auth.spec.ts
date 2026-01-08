import { test, expect } from '../../fixtures/auth.fixture';
import { LoginPage, RegisterPage } from '../../pages';

/**
 * Complete Authentication Test Suite - Phase 1
 * Covers all authentication flows for Ayphen PM Tool
 */

test.describe('Authentication - Phase 1 Core Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  // AUTH-001: Valid credentials login
  test('AUTH-001: Valid credentials login', async ({ authenticatedPage }) => {
    // Wait for page to fully load
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);
    
    // User should be redirected to dashboard after successful login
    // Check URL contains dashboard, board, backlog, or projects
    await expect(authenticatedPage).toHaveURL(/.*\/(dashboard|board|backlog|projects)/);
    
    // Login successful - page loaded
    console.log('✅ AUTH-001: Login successful - redirected to:', authenticatedPage.url());
  });

  // AUTH-002: Invalid credentials error
  test('AUTH-002: Invalid credentials error', async ({ page }) => {
    await loginPage.goto();
    
    // Try to login with invalid credentials
    await loginPage.login('invalid@test.com', 'wrongpassword');
    await page.waitForTimeout(2000);
    
    // Should stay on login page (not redirect to dashboard)
    await expect(page).toHaveURL(/.*\/login/);
    console.log('✅ AUTH-002: Invalid login stayed on login page');
  });

  // AUTH-003: Remember me functionality
  test('AUTH-003: Remember me functionality', async ({ page }) => {
    await loginPage.goto();
    
    // Login with remember me checked
    await loginPage.loginWithRememberMe(TEST_USERS.user1.email, TEST_USERS.user1.password);
    
    // Check if token is stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    
    // Navigate away and back - should stay logged in
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // Should redirect to dashboard (already logged in)
    await expect(page).toHaveURL(/.*\/(dashboard|board|backlog|projects)/);
  });

  // AUTH-004: Password reset flow
  test('AUTH-004: Password reset flow', async ({ page }) => {
    await loginPage.goto();
    
    // Click forgot password link
    await loginPage.goToForgotPassword();
    
    // Should show password reset form
    await expect(page.locator('[data-testid="reset-password-form"], form:has(input[type="email"])')).toBeVisible();
    
    // Enter email for password reset
    await page.fill('input[type="email"], input[name="email"]', TEST_USERS.user1.email);
    await page.click('button[type="submit"], button:has-text("Send"), button:has-text("Reset")');
    
    // Should show success message
    await expect(page.locator('text=Reset link sent|Check your email|Email sent')).toBeVisible();
  });

  // AUTH-005: Session timeout and re-authentication
  test('AUTH-005: Session timeout', async ({ authenticatedPage }) => {
    // Clear localStorage to simulate session timeout
    await authenticatedPage.evaluate(() => localStorage.clear());
    
    // Try to access protected route
    await authenticatedPage.goto('/dashboard');
    
    // Should redirect to login
    await expect(authenticatedPage).toHaveURL(/.*\/login/);
    
    // Should show session expired message
    await expect(authenticatedPage.locator('text=Session expired|Please login again')).toBeVisible();
  });

  // AUTH-006: Multi-tab session handling
  test('AUTH-006: Multi-tab session handling', async ({ context }) => {
    // Create two tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Login in first tab
    const loginPage1 = new LoginPage(page1);
    await loginPage1.goto();
    await loginPage1.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
    
    // Second tab should also be authenticated (shared context)
    await page2.goto('/dashboard');
    await expect(page2.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Logout from first tab
    await page1.locator('[data-testid="user-menu"]').click();
    await page1.locator('text=Logout').click();
    
    // Second tab should also be logged out
    await page2.reload();
    await expect(page2).toHaveURL(/.*\/login/);
    
    await page1.close();
    await page2.close();
  });

  // AUTH-007: Logout from all devices
  test('AUTH-007: Logout from all devices', async ({ authenticatedPage }) => {
    // Go to settings
    await authenticatedPage.goto('/settings');
    
    // Find logout from all devices option
    await authenticatedPage.locator('[data-testid="security-settings"]').click();
    await authenticatedPage.locator('[data-testid="logout-all-devices"]').click();
    
    // Confirm logout
    await authenticatedPage.locator('[data-testid="confirm-logout-all"]').click();
    
    // Should be redirected to login
    await expect(authenticatedPage).toHaveURL(/.*\/login/);
  });

  // AUTH-008: Role-based access control
  test('AUTH-008: Role-based access control', async ({ authenticatedPage }) => {
    // Try to access admin panel (should fail for regular user)
    await authenticatedPage.goto('/admin');
    
    // Should show access denied or redirect
    await expect(authenticatedPage.locator('text=Access denied|Not authorized|403')).toBeVisible();
  });

  // AUTH-009: JWT token refresh
  test('AUTH-009: JWT token refresh', async ({ authenticatedPage }) => {
    // Wait for token refresh (happens automatically)
    await authenticatedPage.waitForTimeout(60000); // Wait 1 minute
    
    // Try to access protected route - should still work
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  // AUTH-010: Login with expired token
  test('AUTH-010: Login with expired token', async ({ page }) => {
    // Set expired token in localStorage
    await page.evaluate(() => {
      localStorage.setItem('token', 'expired_token_123');
    });
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login with expired token message
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('text=Token expired|Session expired')).toBeVisible();
  });

  // REG-001: New user registration with valid data
  test('REG-001: New user registration', async ({ page }) => {
    await loginPage.goToRegister();
    
    const registerPage = new RegisterPage(page);
    
    // Fill registration form with valid data
    const newUser = {
      name: 'Test User',
      email: `testuser${Date.now()}@test.com`,
      password: 'Test@123456'
    };
    
    await registerPage.register(newUser.name, newUser.email, newUser.password);
    
    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/.*\/(dashboard|board|backlog|projects)/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  // REG-002: Registration with duplicate email
  test('REG-002: Registration with duplicate email', async ({ page }) => {
    await loginPage.goToRegister();
    
    const registerPage = new RegisterPage(page);
    
    // Try to register with existing email
    await registerPage.register('Test User', TEST_USERS.user1.email, 'Test@123456');
    
    // Should show email already exists error
    await expect(page.locator('text=Email already exists|User already registered')).toBeVisible();
  });

  // REG-003: Registration with weak password
  test('REG-003: Registration with weak password', async ({ page }) => {
    await loginPage.goToRegister();
    
    const registerPage = new RegisterPage(page);
    
    // Try to register with weak password
    await registerPage.register('Test User', 'weak@test.com', '123');
    
    // Should show password strength error
    await expect(page.locator('text=Password too weak|Password must contain')).toBeVisible();
  });

  // REG-004: Email verification flow
  test('REG-004: Email verification flow', async ({ page }) => {
    await loginPage.goToRegister();
    
    const registerPage = new RegisterPage(page);
    
    // Register new user
    const newUser = {
      name: 'Verify User',
      email: `verify${Date.now()}@test.com`,
      password: 'Test@123456'
    };
    
    await registerPage.register(newUser.name, newUser.email, newUser.password);
    
    // Should show verification required message
    await expect(page.locator('text=Verification email sent|Please verify your email')).toBeVisible();
  });

  // REG-005: Social login integration (if available)
  test('REG-005: Social login integration', async ({ page }) => {
    await loginPage.goto();
    
    // Check if social login buttons are present
    const googleButton = page.locator('[data-testid="google-login"]');
    const microsoftButton = page.locator('[data-testid="microsoft-login"]');
    
    if (await googleButton.isVisible()) {
      await googleButton.click();
      // Would need to handle OAuth flow - for now just check redirect
      await expect(page).toHaveURL(/.*\/accounts\.google\.com|.*\/login\.google/);
    }
    
    if (await microsoftButton.isVisible()) {
      await page.goto('/login'); // Go back
      await microsoftButton.click();
      // Would need to handle OAuth flow
      await expect(page).toHaveURL(/.*\/login\.microsoftonline\.com|.*\/microsoft\.com/);
    }
  });
});

// Test data constant
const TEST_USERS = {
  user1: {
    name: 'Demo User',
    email: 'dhilipwind+501@gmail.com',
    password: 'Demo@501'
  }
};
