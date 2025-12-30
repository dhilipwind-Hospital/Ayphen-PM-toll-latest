import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly errorMessage: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    this.registerLink = page.locator('a:has-text("Register"), a:has-text("Sign up"), a:has-text("Create account")');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]');
    this.errorMessage = page.locator('.ant-message-error, .ant-form-item-explain-error, [role="alert"]');
    this.pageTitle = page.locator('h1, h2').first();
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Login and wait for dashboard
   */
  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL(/.*\/(dashboard|board|backlog|projects)/);
  }

  /**
   * Check remember me and login
   */
  async loginWithRememberMe(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.rememberMeCheckbox.check();
    await this.loginButton.click();
  }

  /**
   * Navigate to register page
   */
  async goToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/.*register/);
  }

  /**
   * Navigate to forgot password
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Assert login page is displayed
   */
  async expectLoginPage() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Assert error message is displayed
   */
  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Assert successful login (redirected away from login)
   */
  async expectLoggedIn() {
    await expect(this.page).not.toHaveURL(/.*login/);
  }

  /**
   * Get validation error for a field
   */
  async getFieldError(fieldName: string): Promise<string | null> {
    const error = this.page.locator(`.ant-form-item:has([name="${fieldName}"]) .ant-form-item-explain-error`);
    if (await error.isVisible()) {
      return await error.textContent();
    }
    return null;
  }
}
