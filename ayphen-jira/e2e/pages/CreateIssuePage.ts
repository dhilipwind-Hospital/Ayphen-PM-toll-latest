import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type IssueType = 'Epic' | 'Story' | 'Task' | 'Bug' | 'Subtask';
export type Priority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';

/**
 * Create Issue Modal Page Object
 */
export class CreateIssuePage extends BasePage {
  // Modal
  readonly modal: Locator;
  readonly modalTitle: Locator;

  // Form fields
  readonly typeSelect: Locator;
  readonly summaryInput: Locator;
  readonly descriptionInput: Locator;
  readonly assigneeSelect: Locator;
  readonly prioritySelect: Locator;
  readonly labelsSelect: Locator;
  readonly sprintSelect: Locator;
  readonly epicLinkSelect: Locator;
  readonly storyPointsInput: Locator;
  readonly dueDatePicker: Locator;

  // Buttons
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly createAnotherCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    
    this.modal = page.locator('.ant-modal');
    this.modalTitle = page.locator('.ant-modal-title');

    // Form fields - using common patterns
    this.typeSelect = page.locator('[data-testid="issue-type-select"], #type, .issue-type-select').first();
    this.summaryInput = page.locator('[data-testid="summary-input"], input[name="summary"], input[placeholder*="summary" i]');
    this.descriptionInput = page.locator('[data-testid="description-input"], textarea[name="description"], .description-editor');
    this.assigneeSelect = page.locator('[data-testid="assignee-select"], #assignee, .assignee-select');
    this.prioritySelect = page.locator('[data-testid="priority-select"], #priority, .priority-select');
    this.labelsSelect = page.locator('[data-testid="labels-select"], #labels, .labels-select');
    this.sprintSelect = page.locator('[data-testid="sprint-select"], #sprint, .sprint-select');
    this.epicLinkSelect = page.locator('[data-testid="epic-link-select"], #epicLink, .epic-link-select');
    this.storyPointsInput = page.locator('[data-testid="story-points-input"], input[name="storyPoints"], #storyPoints');
    this.dueDatePicker = page.locator('[data-testid="due-date-picker"], #dueDate');

    // Buttons
    this.createButton = page.locator('.ant-modal-footer button.ant-btn-primary, button:has-text("Create")').last();
    this.cancelButton = page.locator('.ant-modal-footer button:not(.ant-btn-primary)').first();
    this.createAnotherCheckbox = page.locator('input[type="checkbox"]:near(:text("Create another"))');
  }

  /**
   * Wait for modal to be visible
   */
  async waitForModal() {
    await this.modal.waitFor({ state: 'visible' });
  }

  /**
   * Select issue type
   */
  async selectType(type: IssueType) {
    await this.typeSelect.click();
    await this.page.locator(`.ant-select-dropdown .ant-select-item:has-text("${type}")`).click();
  }

  /**
   * Fill summary
   */
  async fillSummary(summary: string) {
    await this.summaryInput.fill(summary);
  }

  /**
   * Fill description
   */
  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  /**
   * Select assignee
   */
  async selectAssignee(assigneeName: string) {
    await this.assigneeSelect.click();
    await this.page.locator(`.ant-select-dropdown .ant-select-item:has-text("${assigneeName}")`).click();
  }

  /**
   * Select priority
   */
  async selectPriority(priority: Priority) {
    await this.prioritySelect.click();
    await this.page.locator(`.ant-select-dropdown .ant-select-item:has-text("${priority}")`).click();
  }

  /**
   * Select sprint
   */
  async selectSprint(sprintName: string) {
    await this.sprintSelect.click();
    await this.page.locator(`.ant-select-dropdown .ant-select-item:has-text("${sprintName}")`).click();
  }

  /**
   * Select epic link
   */
  async selectEpicLink(epicName: string) {
    await this.epicLinkSelect.click();
    await this.page.locator(`.ant-select-dropdown .ant-select-item:has-text("${epicName}")`).click();
  }

  /**
   * Set story points
   */
  async setStoryPoints(points: number) {
    await this.storyPointsInput.fill(points.toString());
  }

  /**
   * Create issue with basic info
   */
  async createIssue(type: IssueType, summary: string, description?: string) {
    await this.waitForModal();
    await this.selectType(type);
    await this.fillSummary(summary);
    if (description) {
      await this.fillDescription(description);
    }
    await this.createButton.click();
  }

  /**
   * Create Epic
   */
  async createEpic(summary: string, description?: string) {
    await this.createIssue('Epic', summary, description);
  }

  /**
   * Create Story
   */
  async createStory(summary: string, options?: {
    description?: string;
    storyPoints?: number;
    assignee?: string;
    priority?: Priority;
    epicLink?: string;
  }) {
    await this.waitForModal();
    await this.selectType('Story');
    await this.fillSummary(summary);
    
    if (options?.description) {
      await this.fillDescription(options.description);
    }
    if (options?.storyPoints) {
      await this.setStoryPoints(options.storyPoints);
    }
    if (options?.assignee) {
      await this.selectAssignee(options.assignee);
    }
    if (options?.priority) {
      await this.selectPriority(options.priority);
    }
    if (options?.epicLink) {
      await this.selectEpicLink(options.epicLink);
    }
    
    await this.createButton.click();
  }

  /**
   * Create Bug
   */
  async createBug(summary: string, options?: {
    description?: string;
    priority?: Priority;
    assignee?: string;
  }) {
    await this.waitForModal();
    await this.selectType('Bug');
    await this.fillSummary(summary);
    
    if (options?.description) {
      await this.fillDescription(options.description);
    }
    if (options?.priority) {
      await this.selectPriority(options.priority);
    }
    if (options?.assignee) {
      await this.selectAssignee(options.assignee);
    }
    
    await this.createButton.click();
  }

  /**
   * Create Task
   */
  async createTask(summary: string, description?: string) {
    await this.createIssue('Task', summary, description);
  }

  /**
   * Cancel creation
   */
  async cancel() {
    await this.cancelButton.click();
  }

  /**
   * Assert modal is visible
   */
  async expectModalVisible() {
    await expect(this.modal).toBeVisible();
  }

  /**
   * Assert modal is closed
   */
  async expectModalClosed() {
    await expect(this.modal).not.toBeVisible();
  }

  /**
   * Assert validation error
   */
  async expectValidationError(fieldName: string, message?: string) {
    const error = this.page.locator(`.ant-form-item:has([name="${fieldName}"]) .ant-form-item-explain-error`);
    await expect(error).toBeVisible();
    if (message) {
      await expect(error).toContainText(message);
    }
  }
}
