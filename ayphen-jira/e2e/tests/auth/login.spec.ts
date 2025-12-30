import { test, expect } from '../../fixtures/auth.fixture';
import { createTestUser, TEST_USERS } from '../../utils/test-data';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('LOG-001: should display login page correctly', async ({ loginPage }) => {
    await loginPage.expectLoginPage();
  });

  test('LOG-002: should login with valid credentials', async ({ loginPage }) => {
    // First ensure user exists - you might need to register first in a real scenario
    await loginPage.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
    
    // Should redirect away from login
    await loginPage.expectLoggedIn();
  });

  test('LOG-003: should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login('invalid@email.com', 'wrongpassword');
    
    // Should show error message
    await loginPage.expectError();
  });

  test('LOG-004: should show error for wrong password', async ({ loginPage }) => {
    await loginPage.login(TEST_USERS.user1.email, 'wrongpassword123');
    
    await loginPage.expectError();
  });

  test('LOG-005: should show validation error for empty email', async ({ loginPage, page }) => {
    await loginPage.passwordInput.fill('somepassword');
    await loginPage.loginButton.click();
    
    // Check for validation error
    const emailError = await loginPage.getFieldError('email');
    expect(emailError).toBeTruthy();
  });

  test('LOG-006: should show validation error for empty password', async ({ loginPage, page }) => {
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.loginButton.click();
    
    // Check for validation error
    const passwordError = await loginPage.getFieldError('password');
    expect(passwordError).toBeTruthy();
  });

  test('LOG-007: should navigate to register page', async ({ loginPage, page }) => {
    await loginPage.goToRegister();
    
    await expect(page).toHaveURL(/.*register/);
  });

  test('LOG-008: should persist session after login', async ({ loginPage, page }) => {
    await loginPage.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
    await loginPage.expectLoggedIn();
    
    // Reload page
    await page.reload();
    
    // Should still be logged in (not on login page)
    await expect(page).not.toHaveURL(/.*login/);
  });
});
