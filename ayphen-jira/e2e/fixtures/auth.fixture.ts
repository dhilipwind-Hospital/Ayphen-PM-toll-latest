import { test as base, Page } from '@playwright/test';
import { LoginPage, RegisterPage, DashboardPage } from '../pages';
import { TEST_USERS, createTestUser } from '../utils/test-data';

/**
 * Authentication Fixture
 * Provides authenticated and unauthenticated page contexts
 */

// Extend base test with custom fixtures
type AuthFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  dashboardPage: DashboardPage;
  authenticatedPage: Page;
  testUser: typeof TEST_USERS.user1;
};

export const test = base.extend<AuthFixtures>({
  // Login page fixture
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Register page fixture
  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },

  // Dashboard page fixture
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // Test user data
  testUser: async ({}, use) => {
    await use(TEST_USERS.user1);
  },

  // Pre-authenticated page
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Try to login with test user
    try {
      await loginPage.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
      await page.waitForURL(/.*\/(dashboard|board|backlog|projects)/, { timeout: 10000 });
    } catch (error) {
      console.log('Login failed, user might not exist. Attempting to register...');
      
      // If login fails, try to register first
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register(
        TEST_USERS.user1.name,
        TEST_USERS.user1.email,
        TEST_USERS.user1.password
      );
      
      // Then login
      await loginPage.goto();
      await loginPage.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
      await page.waitForURL(/.*\/(dashboard|board|backlog|projects)/, { timeout: 10000 });
    }
    
    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper function to login programmatically via API
 * Can be used for faster test setup
 */
export async function loginViaApi(page: Page, email: string, password: string) {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password },
  });
  
  if (response.ok()) {
    const data = await response.json();
    // Store auth token in localStorage
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, data.token);
    return data;
  }
  
  throw new Error('API login failed');
}

/**
 * Helper to store authentication state
 */
export async function saveAuthState(page: Page, path: string) {
  await page.context().storageState({ path });
}

/**
 * Helper to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  return !!token;
}
