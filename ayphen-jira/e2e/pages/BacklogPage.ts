import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Backlog Page Object
 */
export class BacklogPage extends BasePage {
  // Main elements
  readonly pageTitle: Locator;
  readonly createIssueButton: Locator;
  readonly createSprintButton: Locator;

  // Sprint containers
  readonly sprintContainers: Locator;
  readonly backlogContainer: Locator;

  // Issue list
  readonly issueItems: Locator;

  constructor(page: Page) {
    super(page);
    
    this.pageTitle = page.locator('h1:has-text("Backlog")');
    this.createIssueButton = page.locator('button:has-text("Create Issue")');
    this.createSprintButton = page.locator('button:has-text("Create Sprint")');
    
    this.sprintContainers = page.locator('.ant-card').filter({ hasText: /Sprint/ });
    this.backlogContainer = page.locator('.ant-card').filter({ hasText: /Backlog/ });
    
    this.issueItems = page.locator('[data-testid^="issue-"], .issue-item');
  }

  /**
   * Navigate to backlog page
   */
  async goto() {
    await super.goto('/backlog');
    await this.waitForPageLoad();
  }

  /**
   * Open create issue modal
   */
  async openCreateIssueModal() {
    await this.createIssueButton.click();
    await this.page.waitForSelector('.ant-modal', { state: 'visible' });
  }

  /**
   * Create a new sprint
   */
  async createSprint() {
    await this.createSprintButton.click();
    await this.page.waitForSelector('.ant-modal', { state: 'visible' });
  }

  /**
   * Get issue by key
   */
  getIssueByKey(key: string): Locator {
    return this.page.locator(`text=${key}`).first();
  }

  /**
   * Get sprint by name
   */
  getSprintByName(name: string): Locator {
    return this.sprintContainers.filter({ hasText: name });
  }

  /**
   * Drag issue to sprint
   */
  async dragIssueToSprint(issueKey: string, sprintName: string) {
    const issue = this.getIssueByKey(issueKey);
    const sprint = this.getSprintByName(sprintName);
    await issue.dragTo(sprint);
  }

  /**
   * Drag issue to backlog
   */
  async dragIssueToBacklog(issueKey: string) {
    const issue = this.getIssueByKey(issueKey);
    await issue.dragTo(this.backlogContainer);
  }

  /**
   * Click on issue to open detail
   */
  async openIssueDetail(issueKey: string) {
    await this.getIssueByKey(issueKey).click();
    await this.page.waitForSelector('[data-testid="issue-detail"], .issue-detail-panel');
  }

  /**
   * Start a sprint
   */
  async startSprint(sprintName: string) {
    const sprint = this.getSprintByName(sprintName);
    await sprint.locator('button:has-text("Start Sprint")').click();
    await this.page.waitForSelector('.ant-modal', { state: 'visible' });
  }

  /**
   * Complete a sprint
   */
  async completeSprint(sprintName: string) {
    const sprint = this.getSprintByName(sprintName);
    await sprint.locator('button:has-text("Complete Sprint")').click();
    await this.page.waitForSelector('.ant-modal', { state: 'visible' });
  }

  /**
   * Get issue count in sprint
   */
  async getSprintIssueCount(sprintName: string): Promise<number> {
    const sprint = this.getSprintByName(sprintName);
    const issues = sprint.locator('[data-testid^="issue-"], .issue-item');
    return await issues.count();
  }

  /**
   * Get backlog issue count
   */
  async getBacklogIssueCount(): Promise<number> {
    const issues = this.backlogContainer.locator('[data-testid^="issue-"], .issue-item');
    return await issues.count();
  }

  /**
   * Assert backlog page is loaded
   */
  async expectBacklogLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.createIssueButton).toBeVisible();
  }

  /**
   * Assert issue exists in sprint
   */
  async expectIssueInSprint(issueKey: string, sprintName: string) {
    const sprint = this.getSprintByName(sprintName);
    await expect(sprint.locator(`text=${issueKey}`)).toBeVisible();
  }

  /**
   * Assert issue exists in backlog
   */
  async expectIssueInBacklog(issueKey: string) {
    await expect(this.backlogContainer.locator(`text=${issueKey}`)).toBeVisible();
  }
}
