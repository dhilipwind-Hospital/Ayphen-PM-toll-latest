import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Dashboard/Home Page Object
 */
export class DashboardPage extends BasePage {
  // Navigation
  readonly sidebar: Locator;
  readonly projectSelector: Locator;
  readonly userMenu: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;

  // Navigation items
  readonly boardLink: Locator;
  readonly backlogLink: Locator;
  readonly sprintPlanningLink: Locator;
  readonly roadmapLink: Locator;
  readonly reportsLink: Locator;
  readonly timeTrackingLink: Locator;

  // User menu items
  readonly logoutButton: Locator;
  readonly profileLink: Locator;
  readonly settingsLink: Locator;

  constructor(page: Page) {
    super(page);
    
    // Navigation
    this.sidebar = page.locator('aside, [data-testid="sidebar"], .sidebar');
    this.projectSelector = page.locator('[data-testid="project-selector"], .project-selector');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu, .ant-avatar');
    this.createButton = page.locator('button:has-text("Create"), button:has-text("+ Create")');
    this.searchInput = page.locator('input[placeholder*="Search" i]');

    // Navigation links
    this.boardLink = page.locator('a:has-text("Board"), [data-testid="board-link"]');
    this.backlogLink = page.locator('a:has-text("Backlog"), [data-testid="backlog-link"]');
    this.sprintPlanningLink = page.locator('a:has-text("Sprint"), [data-testid="sprint-link"]');
    this.roadmapLink = page.locator('a:has-text("Roadmap"), [data-testid="roadmap-link"]');
    this.reportsLink = page.locator('a:has-text("Reports"), [data-testid="reports-link"]');
    this.timeTrackingLink = page.locator('a:has-text("Time Tracking"), [data-testid="time-tracking-link"]');

    // User menu
    this.logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]');
    this.profileLink = page.locator('a:has-text("Profile"), [data-testid="profile-link"]');
    this.settingsLink = page.locator('a:has-text("Settings"), [data-testid="settings-link"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await super.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Open create issue modal
   */
  async openCreateModal() {
    await this.createButton.click();
    await this.page.waitForSelector('.ant-modal', { state: 'visible' });
  }

  /**
   * Navigate to Board
   */
  async goToBoard() {
    await this.boardLink.click();
    await this.page.waitForURL(/.*board/);
  }

  /**
   * Navigate to Backlog
   */
  async goToBacklog() {
    await this.backlogLink.click();
    await this.page.waitForURL(/.*backlog/);
  }

  /**
   * Navigate to Sprint Planning
   */
  async goToSprintPlanning() {
    await this.sprintPlanningLink.click();
    await this.page.waitForURL(/.*sprint/);
  }

  /**
   * Navigate to Time Tracking
   */
  async goToTimeTracking() {
    await this.timeTrackingLink.click();
    await this.page.waitForURL(/.*time-tracking/);
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.userMenu.click();
  }

  /**
   * Logout from user menu
   */
  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
    await this.page.waitForURL(/.*login/);
  }

  /**
   * Select a project
   */
  async selectProject(projectName: string) {
    await this.projectSelector.click();
    await this.page.locator(`text=${projectName}`).click();
  }

  /**
   * Search for issues/items
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Assert dashboard is loaded
   */
  async expectDashboardLoaded() {
    await expect(this.sidebar).toBeVisible();
    await expect(this.createButton).toBeVisible();
  }

  /**
   * Assert user is logged in
   */
  async expectLoggedIn() {
    await expect(this.userMenu).toBeVisible();
  }

  /**
   * Get current project name
   */
  async getCurrentProjectName(): Promise<string | null> {
    return await this.projectSelector.textContent();
  }
}
