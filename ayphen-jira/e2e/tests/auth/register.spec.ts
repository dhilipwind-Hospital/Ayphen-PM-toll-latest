import { test, expect } from '../../fixtures/auth.fixture';
import { createTestUser } from '../../utils/test-data';

test.describe('Registration', () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test('REG-001: should display registration page correctly', async ({ registerPage }) => {
    await registerPage.expectRegisterPage();
  });

  test('REG-002: should register a new user successfully', async ({ registerPage, page }) => {
    const user = createTestUser();
    
    await registerPage.register(user.name, user.email, user.password);
    
    // Should redirect to login or dashboard
    await expect(page).toHaveURL(/.*\/(login|dashboard|board)/);
  });

  test('REG-003: should show error for existing email', async ({ registerPage, page }) => {
    // First register a user
    const user = createTestUser();
    await registerPage.register(user.name, user.email, user.password);
    
    // Go back to register and try same email
    await registerPage.goto();
    await registerPage.register('Another User', user.email, 'differentpassword123');
    
    // Should show error
    await registerPage.expectError();
  });

  test('REG-004: should validate required fields', async ({ registerPage, page }) => {
    // Try to submit empty form
    await registerPage.submit();
    
    // Should show validation errors
    await registerPage.expectError();
  });

  test('REG-005: should validate email format', async ({ registerPage }) => {
    await registerPage.fillForm('Test User', 'invalid-email', 'password123');
    await registerPage.submit();
    
    await registerPage.expectError();
  });

  test('REG-006: should validate password length', async ({ registerPage }) => {
    const user = createTestUser();
    
    // Use a short password
    await registerPage.fillForm(user.name, user.email, '123');
    await registerPage.submit();
    
    await registerPage.expectError();
  });

  test('REG-007: should navigate to login page', async ({ registerPage, page }) => {
    await registerPage.goToLogin();
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('REG-008: should trim whitespace from inputs', async ({ registerPage, page }) => {
    const user = createTestUser();
    
    // Add whitespace around email
    await registerPage.fillForm(user.name, `  ${user.email}  `, user.password);
    await registerPage.submit();
    
    // Should still work (email trimmed)
    await expect(page).toHaveURL(/.*\/(login|dashboard|board)/);
  });
});
