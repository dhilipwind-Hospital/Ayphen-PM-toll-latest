import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object - contains common methods for all pages
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a path
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for URL to contain a specific path
   */
  async waitForUrl(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }

  /**
   * Click and wait for navigation
   */
  async clickAndWaitForNavigation(locator: Locator) {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      locator.click(),
    ]);
  }

  /**
   * Fill input with clear first
   */
  async clearAndFill(locator: Locator, text: string) {
    await locator.clear();
    await locator.fill(text);
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(locator: Locator, timeout: number = 10000) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for toast/message to appear and verify text
   */
  async expectToastMessage(message: string) {
    const toast = this.page.locator('.ant-message-notice-content');
    await expect(toast).toContainText(message, { timeout: 10000 });
  }

  /**
   * Wait for success message
   */
  async expectSuccessMessage(message: string) {
    const toast = this.page.locator('.ant-message-success');
    await expect(toast).toContainText(message, { timeout: 10000 });
  }

  /**
   * Wait for error message
   */
  async expectErrorMessage(message: string) {
    const toast = this.page.locator('.ant-message-error');
    await expect(toast).toContainText(message, { timeout: 10000 });
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Close any open modals
   */
  async closeModal() {
    const closeButton = this.page.locator('.ant-modal-close');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  /**
   * Confirm modal action
   */
  async confirmModal() {
    await this.page.locator('.ant-modal-footer button.ant-btn-primary').click();
  }

  /**
   * Cancel modal action
   */
  async cancelModal() {
    await this.page.locator('.ant-modal-footer button:not(.ant-btn-primary)').first().click();
  }
}
