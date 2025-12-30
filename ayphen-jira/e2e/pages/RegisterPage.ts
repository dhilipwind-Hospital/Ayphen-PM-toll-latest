import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Register Page Object
 */
export class RegisterPage extends BasePage {
  // Locators
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="full name" i]');
    this.emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.registerButton = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign up"), button:has-text("Create")');
    this.loginLink = page.locator('a:has-text("Login"), a:has-text("Sign in"), a:has-text("Already have")');
    this.errorMessage = page.locator('.ant-message-error, .ant-form-item-explain-error, [role="alert"]');
    this.successMessage = page.locator('.ant-message-success');
  }

  /**
   * Navigate to register page
   */
  async goto() {
    await super.goto('/register');
    await this.waitForPageLoad();
  }

  /**
   * Fill registration form
   */
  async fillForm(name: string, email: string, password: string, confirmPassword?: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (this.confirmPasswordInput && await this.confirmPasswordInput.isVisible()) {
      await this.confirmPasswordInput.fill(confirmPassword || password);
    }
  }

  /**
   * Submit registration
   */
  async submit() {
    await this.registerButton.click();
  }

  /**
   * Register with all details
   */
  async register(name: string, email: string, password: string, confirmPassword?: string) {
    await this.fillForm(name, email, password, confirmPassword);
    await this.submit();
  }

  /**
   * Register and wait for redirect to login
   */
  async registerAndWaitForLogin(name: string, email: string, password: string) {
    await this.register(name, email, password);
    await this.page.waitForURL(/.*login/);
  }

  /**
   * Navigate to login page
   */
  async goToLogin() {
    await this.loginLink.click();
    await this.page.waitForURL(/.*login/);
  }

  /**
   * Assert register page is displayed
   */
  async expectRegisterPage() {
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /**
   * Assert error message is displayed
   */
  async expectError(message?: string) {
    await expect(this.errorMessage.first()).toBeVisible();
    if (message) {
      await expect(this.errorMessage.first()).toContainText(message);
    }
  }

  /**
   * Assert success message is displayed
   */
  async expectSuccess(message?: string) {
    await expect(this.successMessage).toBeVisible();
    if (message) {
      await expect(this.successMessage).toContainText(message);
    }
  }

  /**
   * Assert redirected to login after registration
   */
  async expectRedirectToLogin() {
    await expect(this.page).toHaveURL(/.*login/);
  }
}
