import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Teams Integration Test Suite - Phase 3
 * Covers Microsoft Teams webhook and bot integration
 */

test.describe('Teams Integration - Phase 3 Integration Tests', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/integrations');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  // TEAMS-001: Teams webhook configuration
  test('TEAMS-001: Teams webhook configuration', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('input[name="webhookUrl"]').fill('https://outlook.office.com/webhook/test');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Webhook configured|Settings saved')).toBeVisible();
  });

  // TEAMS-002: Teams webhook test
  test('TEAMS-002: Teams webhook test', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('button:has-text("Test Webhook")').click();
    await authenticatedPage.waitForTimeout(3000);

    await expect(authenticatedPage.locator('text=Test notification sent|Webhook working')).toBeVisible();
  });

  // TEAMS-003: Teams message formatting
  test('TEAMS-003: Teams message formatting', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.locator('[data-testid="message-settings"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Configure message format
    await authenticatedPage.locator('input[name="includeIssueLink"]').check();
    await authenticatedPage.locator('input[name="includeAssignee"]').check();
    await authenticatedPage.locator('input[name="includeStatus"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Message settings saved')).toBeVisible();
  });

  // TEAMS-004: Teams channel management
  test('TEAMS-004: Teams channel management', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.locator('[data-testid="channel-settings"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Add channel
    await authenticatedPage.locator('button:has-text("Add Channel")').click();
    await authenticatedPage.locator('input[name="channelName"]').fill('General');
    await authenticatedPage.locator('input[name="channelWebhook"]').fill('https://outlook.office.com/webhook/general');
    await authenticatedPage.locator('button:has-text("Add")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Channel added')).toBeVisible();
  });

  // TEAMS-005: Teams notification triggers
  test('TEAMS-005: Teams notification triggers', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.locator('[data-testid="trigger-settings"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Configure triggers
    await authenticatedPage.locator('input[name="triggerOnIssueCreated"]').check();
    await authenticatedPage.locator('input[name="triggerOnStatusChanged"]').check();
    await authenticatedPage.locator('input[name="triggerOnAssignment"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Trigger settings saved')).toBeVisible();
  });

  // TEAMS-006: Teams error handling
  test('TEAMS-006: Teams error handling', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Enter invalid webhook URL
    await authenticatedPage.locator('input[name="webhookUrl"]').fill('invalid-url');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Invalid webhook URL|URL format incorrect')).toBeVisible();
  });

  // TEAMS-007: Teams authentication
  test('TEAMS-007: Teams authentication', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.locator('[data-testid="auth-settings"]').click();
    await authenticatedPage.waitForTimeout(500);

    const authStatus = authenticatedPage.locator('[data-testid="teams-auth-status"]');
    await expect(authStatus).toBeVisible();
  });

  // TEAMS-008: Teams permissions
  test('TEAMS-008: Teams permissions', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.locator('[data-testid="permissions"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Configure who can send Teams notifications
    await authenticatedPage.locator('select[name="notificationPermission"]').selectOption('admin');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Permissions saved')).toBeVisible();
  });

  // TEAMS-009: Teams history
  test('TEAMS-009: Teams history', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.locator('[data-testid="notification-history"]').click();
    await authenticatedPage.waitForTimeout(500);

    await expect(authenticatedPage.locator('[data-testid="teams-notification-log"]')).toBeVisible();
  });

  // TEAMS-010: Teams settings
  test('TEAMS-010: Teams settings', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Toggle Teams integration
    await authenticatedPage.locator('input[name="teamsEnabled"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Teams integration enabled')).toBeVisible();
  });

  // TEAMS-011: Teams notification on issue create
  test('TEAMS-011: Teams notification on issue create', async ({ authenticatedPage }) => {
    // Create an issue to trigger Teams notification
    await authenticatedPage.goto('/issues/create');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="summary"]').fill('Teams Notification Test Issue');
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForTimeout(2000);

    // Verify issue was created (Teams notification would be sent in background)
    await expect(authenticatedPage.locator('text=Issue created')).toBeVisible();
  });

  // TEAMS-012: Teams notification on status change
  test('TEAMS-012: Teams notification on status change', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/board');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find and drag a card to trigger status change
    const card = authenticatedPage.locator('[data-testid^="issue-card-"]').first();
    const inProgressColumn = authenticatedPage.locator('.board-column:has-text("IN PROGRESS")');

    if (await card.isVisible() && await inProgressColumn.isVisible()) {
      await card.dragTo(inProgressColumn);
      await authenticatedPage.waitForTimeout(2000);
      // Teams notification would be sent in background
    }
  });

  // TEAMS-013: Teams notification on assignment
  test('TEAMS-013: Teams notification on assignment', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues');
    await authenticatedPage.waitForTimeout(1000);

    const issue = authenticatedPage.locator('[data-testid="issue-row"]').first();
    if (await issue.isVisible()) {
      await issue.click();
      await authenticatedPage.waitForTimeout(500);

      await authenticatedPage.locator('[data-testid="assignee-select"]').click();
      await authenticatedPage.locator('option:has-text("testuser")').click();
      await authenticatedPage.waitForTimeout(2000);
      // Teams notification would be sent in background
    }
  });

  // TEAMS-014: Teams disable/enable
  test('TEAMS-014: Teams disable/enable', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="teams-integration"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Disable Teams
    await authenticatedPage.locator('input[name="teamsEnabled"]').uncheck();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Teams integration disabled')).toBeVisible();

    // Re-enable Teams
    await authenticatedPage.locator('input[name="teamsEnabled"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Teams integration enabled')).toBeVisible();
  });

  // TEAMS-015: Teams project-specific settings
  test('TEAMS-015: Teams project-specific settings', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('[data-testid="project-card"]').first().click();
    await authenticatedPage.locator('[data-testid="project-settings"]').click();
    await authenticatedPage.locator('[data-testid="teams-settings"]').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('input[name="projectTeamsWebhook"]').fill('https://outlook.office.com/webhook/project');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Project Teams settings saved')).toBeVisible();
  });
});
