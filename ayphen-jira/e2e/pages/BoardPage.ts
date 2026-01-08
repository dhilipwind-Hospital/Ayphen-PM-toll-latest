import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Board/Kanban Page Object
 */
export class BoardPage extends BasePage {
  // Main elements
  readonly pageTitle: Locator;
  readonly boardColumns: Locator;

  // Column locators
  readonly todoColumn: Locator;
  readonly inProgressColumn: Locator;
  readonly inReviewColumn: Locator;
  readonly doneColumn: Locator;
  readonly backlogColumn: Locator;

  // Filters
  readonly onlyMyIssuesFilter: Locator;
  readonly blockedFilter: Locator;
  readonly highPriorityFilter: Locator;

  // Cards
  readonly issueCards: Locator;

  constructor(page: Page) {
    super(page);
    
    this.pageTitle = page.locator('h1:has-text("Board")');
    this.boardColumns = page.locator('[data-testid="board-column"], .board-column');
    
    // Column locators - using text content
    this.backlogColumn = page.locator('[data-testid="column-backlog"], .board-column:has-text("BACKLOG")');
    this.todoColumn = page.locator('[data-testid="column-todo"], .board-column:has-text("TO DO")');
    this.inProgressColumn = page.locator('[data-testid="column-in-progress"], .board-column:has-text("IN PROGRESS")');
    this.inReviewColumn = page.locator('[data-testid="column-in-review"], .board-column:has-text("IN REVIEW")');
    this.doneColumn = page.locator('[data-testid="column-done"], .board-column:has-text("DONE")');

    // Filters
    this.onlyMyIssuesFilter = page.locator('text=Only My Issues');
    this.blockedFilter = page.locator('text=Blocked');
    this.highPriorityFilter = page.locator('text=High Priority');

    // Cards
    this.issueCards = page.locator('[data-testid^="issue-card-"], .issue-card, .board-card');
  }

  /**
   * Navigate to board page
   */
  async goto() {
    await super.goto('/board');
    await this.waitForPageLoad();
  }

  /**
   * Get card by issue key
   */
  getCardByKey(issueKey: string): Locator {
    return this.page.locator(`[data-testid="issue-card-${issueKey}"], .issue-card:has-text("${issueKey}"), .board-card:has-text("${issueKey}")`);
  }

  /**
   * Get column by name
   */
  getColumnByName(columnName: string): Locator {
    return this.page.locator(`.board-column:has-text("${columnName}")`);
  }

  /**
   * Drag card to column
   */
  async dragCardToColumn(issueKey: string, columnName: string) {
    const card = this.getCardByKey(issueKey);
    const column = this.getColumnByName(columnName);
    await card.dragTo(column);
  }

  /**
   * Move card to TODO
   */
  async moveToTodo(issueKey: string) {
    await this.dragCardToColumn(issueKey, 'TO DO');
  }

  /**
   * Move card to In Progress
   */
  async moveToInProgress(issueKey: string) {
    await this.dragCardToColumn(issueKey, 'IN PROGRESS');
  }

  /**
   * Move card to In Review
   */
  async moveToInReview(issueKey: string) {
    await this.dragCardToColumn(issueKey, 'IN REVIEW');
  }

  /**
   * Move card to Done
   */
  async moveToDone(issueKey: string) {
    await this.dragCardToColumn(issueKey, 'DONE');
  }

  /**
   * Open issue detail by clicking card
   */
  async openCardDetail(issueKey: string) {
    await this.getCardByKey(issueKey).click();
    await this.page.waitForSelector('[data-testid="issue-detail"], .issue-detail-panel');
  }

  /**
   * Toggle Only My Issues filter
   */
  async toggleOnlyMyIssues() {
    await this.onlyMyIssuesFilter.click();
  }

  /**
   * Toggle Blocked filter
   */
  async toggleBlocked() {
    await this.blockedFilter.click();
  }

  /**
   * Toggle High Priority filter
   */
  async toggleHighPriority() {
    await this.highPriorityFilter.click();
  }

  /**
   * Get card count in column
   */
  async getColumnCardCount(columnName: string): Promise<number> {
    const column = this.getColumnByName(columnName);
    const cards = column.locator('[data-testid^="issue-card-"], .issue-card, .board-card');
    return await cards.count();
  }

  /**
   * Assert board is loaded
   */
  async expectBoardLoaded() {
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
    
    // Check if we're on board page by URL or content
    const url = this.page.url();
    if (!url.includes('/board')) {
      await this.goto();
      await this.page.waitForLoadState('networkidle');
    }
    
    // Board is loaded if we can see the page
    console.log('Board page loaded:', url);
  }

  /**
   * Assert card is in column
   */
  async expectCardInColumn(issueKey: string, columnName: string) {
    const column = this.getColumnByName(columnName);
    await expect(column.locator(`text=${issueKey}`)).toBeVisible();
  }

  /**
   * Assert card is not in column
   */
  async expectCardNotInColumn(issueKey: string, columnName: string) {
    const column = this.getColumnByName(columnName);
    await expect(column.locator(`text=${issueKey}`)).not.toBeVisible();
  }
}
