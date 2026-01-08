import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Issue Page Object
 * Handles issue viewing, editing, and management
 */
export class IssuePage extends BasePage {
  // Locators
  readonly issueSummary: Locator;
  readonly issueDescription: Locator;
  readonly issueStatus: Locator;
  readonly issuePriority: Locator;
  readonly issueAssignee: Locator;
  readonly issueReporter: Locator;
  readonly issueType: Locator;
  readonly editButton: Locator;
  readonly assignButton: Locator;
  readonly commentTextarea: Locator;
  readonly addCommentButton: Locator;
  readonly attachmentInput: Locator;
  readonly watchButton: Locator;
  readonly voteButton: Locator;
  readonly historyButton: Locator;
  readonly linkButton: Locator;
  readonly cloneButton: Locator;
  readonly mergeButton: Locator;
  readonly labelInput: Locator;
  readonly statusSelect: Locator;
  readonly prioritySelect: Locator;
  readonly assigneeSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.issueSummary = page.locator('[data-testid="issue-summary"], h1');
    this.issueDescription = page.locator('[data-testid="issue-description"], .issue-description');
    this.issueStatus = page.locator('[data-testid="issue-status"], .issue-status');
    this.issuePriority = page.locator('[data-testid="issue-priority"], .issue-priority');
    this.issueAssignee = page.locator('[data-testid="issue-assignee"], .issue-assignee');
    this.issueReporter = page.locator('[data-testid="issue-reporter"], .issue-reporter');
    this.issueType = page.locator('[data-testid="issue-type"], .issue-type');
    this.editButton = page.locator('button:has-text("Edit"), [data-testid="edit-issue"]');
    this.assignButton = page.locator('button:has-text("Assign"), [data-testid="assign-issue"]');
    this.commentTextarea = page.locator('textarea[placeholder*="comment" i], [data-testid="comment-input"]');
    this.addCommentButton = page.locator('button:has-text("Add Comment"), [data-testid="add-comment"]');
    this.attachmentInput = page.locator('input[type="file"], [data-testid="attachment-input"]');
    this.watchButton = page.locator('button:has-text("Watch"), [data-testid="watch-issue"]');
    this.voteButton = page.locator('button:has-text("Vote"), [data-testid="vote-issue"]');
    this.historyButton = page.locator('button:has-text("History"), [data-testid="issue-history"]');
    this.linkButton = page.locator('button:has-text("Link"), [data-testid="link-issue"]');
    this.cloneButton = page.locator('button:has-text("Clone"), [data-testid="clone-issue"]');
    this.mergeButton = page.locator('button:has-text("Merge"), [data-testid="merge-issue"]');
    this.labelInput = page.locator('input[placeholder*="label" i], [data-testid="label-input"]');
    this.statusSelect = page.locator('select[name="status"], [data-testid="status-select"]');
    this.prioritySelect = page.locator('select[name="priority"], [data-testid="priority-select"]');
    this.assigneeSelect = page.locator('select[name="assignee"], [data-testid="assignee-select"]');
  }

  /**
   * Navigate to issues page
   */
  async goto() {
    await super.goto('/issues');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to specific issue
   */
  async gotoIssue(issueKey: string) {
    await super.goto(`/issues/${issueKey}`);
    await this.waitForPageLoad();
  }

  /**
   * Edit issue
   */
  async editIssue(updatedData: any) {
    await this.editButton.click();
    await this.page.waitForTimeout(500);

    if (updatedData.summary) {
      await this.page.locator('input[name="summary"]').fill(updatedData.summary);
    }
    if (updatedData.description) {
      await this.page.locator('textarea[name="description"]').fill(updatedData.description);
    }
    if (updatedData.priority) {
      await this.page.locator('select[name="priority"]').selectOption(updatedData.priority);
    }
    if (updatedData.assignee) {
      await this.page.locator('select[name="assignee"]').selectOption(updatedData.assignee);
    }

    await this.page.locator('button[type="submit"], button:has-text("Save")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Assign issue to user
   */
  async assignIssue(assignee: string) {
    await this.assignButton.click();
    await this.page.waitForTimeout(500);
    await this.page.locator('select[name="assignee"], input[placeholder*="assignee" i]').fill(assignee);
    await this.page.locator('button:has-text("Assign"), button:has-text("Save")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Change issue status
   */
  async changeStatus(status: string) {
    const statusDropdown = this.page.locator('[data-testid="status-dropdown"], .status-dropdown');
    await statusDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.locator(`option:has-text("${status}")`).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Change issue priority
   */
  async changePriority(priority: string) {
    const priorityDropdown = this.page.locator('[data-testid="priority-dropdown"], .priority-dropdown');
    await priorityDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.locator(`option:has-text("${priority}")`).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Add comment to issue
   */
  async addComment(comment: string) {
    await this.commentTextarea.fill(comment);
    await this.addCommentButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Edit comment
   */
  async editComment(newComment: string) {
    const commentMenu = this.page.locator('[data-testid="comment-menu"]').first();
    await commentMenu.click();
    await this.page.locator('button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
    
    const editTextarea = this.page.locator('textarea[placeholder*="comment" i]').first();
    await editTextarea.clear();
    await editTextarea.fill(newComment);
    await this.page.locator('button:has-text("Save"), button:has-text("Update")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Delete comment
   */
  async deleteComment() {
    const commentMenu = this.page.locator('[data-testid="comment-menu"]').first();
    await commentMenu.click();
    await this.page.locator('button:has-text("Delete")').click();
    await this.page.locator('button:has-text("Confirm"), button:has-text("Delete")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Watch issue
   */
  async watchIssue() {
    await this.watchButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Unwatch issue
   */
  async unwatchIssue() {
    const unwatchButton = this.page.locator('button:has-text("Unwatch"), [data-testid="unwatch-issue"]');
    await unwatchButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Vote for issue
   */
  async voteForIssue() {
    await this.voteButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Remove vote
   */
  async removeVote() {
    const removeVoteButton = this.page.locator('button:has-text("Remove Vote"), [data-testid="remove-vote"]');
    await removeVoteButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to issue history
   */
  async goToHistory() {
    await this.historyButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Link issue to another issue
   */
  async linkIssue(issueKey: string, linkType: string) {
    await this.linkButton.click();
    await this.page.waitForTimeout(500);
    
    await this.page.locator('input[name="linkedIssue"], input[placeholder*="issue" i]').fill(issueKey);
    await this.page.locator('select[name="linkType"]').selectOption(linkType);
    await this.page.locator('button:has-text("Link"), button:has-text("Add")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clone issue
   */
  async cloneIssue() {
    await this.cloneButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Merge issue
   */
  async mergeIssue() {
    await this.mergeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Add label to issue
   */
  async addLabel(label: string) {
    await this.labelInput.fill(label);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  /**
   * Remove label from issue
   */
  async removeLabel(label: string) {
    const labelElement = this.page.locator(`[data-testid="label-${label}"], .ant-tag:has-text("${label}")`);
    await labelElement.locator('button, .anticon-close').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to bulk create
   */
  async gotoBulkCreate() {
    await this.page.locator('button:has-text("Bulk Create"), [data-testid="bulk-create"]').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill bulk issues
   */
  async fillBulkIssues(issues: any[]) {
    const bulkTextarea = this.page.locator('textarea[placeholder*="issues" i], [data-testid="bulk-input"]');
    const bulkText = issues.map(issue => 
      `${issue.summary}\nType: ${issue.type}\nPriority: ${issue.priority}`
    ).join('\n---\n');
    
    await bulkTextarea.fill(bulkText);
  }

  /**
   * Create bulk issues
   */
  async createBulkIssues() {
    await this.page.locator('button:has-text("Create Issues"), button:has-text("Create")').click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Assert issue summary is visible
   */
  async expectIssueSummary(summary: string) {
    await expect(this.issueSummary).toContainText(summary);
  }

  /**
   * Assert issue status
   */
  async expectIssueStatus(status: string) {
    await expect(this.issueStatus).toContainText(status);
  }

  /**
   * Assert issue is assigned to user
   */
  async expectIssueAssignedTo(assignee: string) {
    await expect(this.issueAssignee).toContainText(assignee);
  }
}
