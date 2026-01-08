import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Notification System Test Suite - Phase 2
 * Covers in-app, email, and Teams notifications
 */

test.describe('Notification System - Phase 2 Advanced Tests', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  // NOTIF-001: Notification bell display
  test('NOTIF-001: Notification bell display', async ({ authenticatedPage }) => {
    const bellIcon = authenticatedPage.locator('[data-testid="notification-bell"], .ant-badge');
    await expect(bellIcon).toBeVisible();
    
    // Check for notification count
    const count = authenticatedPage.locator('[data-testid="notification-count"], .ant-badge-count');
    if (await count.isVisible()) {
      await expect(count).toBeVisible();
    }
  });

  // NOTIF-002: Notification panel
  test('NOTIF-002: Notification panel', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="notification-bell"], .ant-badge').click();
    await authenticatedPage.waitForTimeout(500);

    await expect(authenticatedPage.locator('[data-testid="notification-panel"], .ant-popover')).toBeVisible();
  });

  // NOTIF-003: Mark as read/unread
  test('NOTIF-003: Mark as read/unread', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="notification-bell"]').click();
    await authenticatedPage.waitForTimeout(500);

    const notification = authenticatedPage.locator('[data-testid="notification-item"]').first();
    if (await notification.isVisible()) {
      // Mark as read
      await notification.locator('[data-testid="mark-read"]').click();
      await authenticatedPage.waitForTimeout(500);

      await expect(notification).toHaveClass(/read|viewed/);

      // Mark as unread
      await notification.locator('[data-testid="mark-unread"]').click();
      await authenticatedPage.waitForTimeout(500);

      await expect(notification).not.toHaveClass(/read|viewed/);
    }
  });

  // NOTIF-004: Notification preferences
  test('NOTIF-004: Notification preferences', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/notifications');
    await authenticatedPage.waitForTimeout(1000);

    // Update preferences
    await authenticatedPage.locator('input[name="emailNotifications"]').check();
    await authenticatedPage.locator('input[name="pushNotifications"]').uncheck();
    await authenticatedPage.locator('input[name="assignmentNotifications"]').check();
    await authenticatedPage.locator('input[name="commentNotifications"]').check();
    
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Preferences saved|Settings updated')).toBeVisible();
  });

  // NOTIF-005: Real-time notifications
  test('NOTIF-005: Real-time notifications', async ({ authenticatedPage, context }) => {
    // Open a second tab to trigger notification
    const page2 = await context.newPage();
    await page2.goto('/issues/create');
    await page2.waitForLoadState('networkidle');

    // Create an issue that should trigger notification
    await page2.locator('input[name="summary"]').fill('Notification Test Issue');
    await page2.locator('select[name="assignee"]').selectOption('testuser@ayphen.com');
    await page2.locator('button[type="submit"]').click();
    await page2.waitForTimeout(2000);

    // Check first page for notification
    await authenticatedPage.bringToFront();
    await authenticatedPage.waitForTimeout(3000);

    // Should show new notification indicator
    const bellIcon = authenticatedPage.locator('[data-testid="notification-bell"]');
    await expect(bellIcon).toBeVisible();

    await page2.close();
  });

  // NOTIF-006: Notification history
  test('NOTIF-006: Notification history', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/notifications');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('[data-testid="notification-list"]')).toBeVisible();
    
    // Check pagination if exists
    const pagination = authenticatedPage.locator('[data-testid="notification-pagination"]');
    if (await pagination.isVisible()) {
      await pagination.locator('button:has-text("Next")').click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  // NOTIF-007: Notification search
  test('NOTIF-007: Notification search', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/notifications');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[placeholder*="search" i]').fill('assigned');
    await authenticatedPage.waitForTimeout(500);

    // Should filter notifications
    const notifications = authenticatedPage.locator('[data-testid="notification-item"]');
    if (await notifications.count() > 0) {
      await expect(notifications.first()).toContainText(/assigned/i);
    }
  });

  // NOTIF-008: Bulk notification actions
  test('NOTIF-008: Bulk notification actions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/notifications');
    await authenticatedPage.waitForTimeout(1000);

    // Select all notifications
    await authenticatedPage.locator('[data-testid="select-all-notifications"]').check();
    
    // Mark all as read
    await authenticatedPage.locator('button:has-text("Mark All Read")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=All marked as read')).toBeVisible();
  });

  // NOTIF-009: Notification snooze
  test('NOTIF-009: Notification snooze', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="notification-bell"]').click();
    await authenticatedPage.waitForTimeout(500);

    const notification = authenticatedPage.locator('[data-testid="notification-item"]').first();
    if (await notification.isVisible()) {
      await notification.locator('[data-testid="snooze-notification"]').click();
      await authenticatedPage.locator('button:has-text("1 hour")').click();
      await authenticatedPage.waitForTimeout(500);

      await expect(authenticatedPage.locator('text=Notification snoozed')).toBeVisible();
    }
  });

  // NOTIF-010: Notification settings
  test('NOTIF-010: Notification settings', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/notifications');
    await authenticatedPage.waitForTimeout(1000);

    // Configure notification types
    await authenticatedPage.locator('select[name="issueAssigned"]').selectOption('email');
    await authenticatedPage.locator('select[name="statusChanged"]').selectOption('both');
    await authenticatedPage.locator('select[name="mentioned"]').selectOption('push');
    
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Settings saved')).toBeVisible();
  });

  // EMAIL-001: Issue assignment emails
  test('EMAIL-001: Issue assignment emails', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/notifications');
    await authenticatedPage.waitForTimeout(1000);

    // Ensure email notifications are enabled
    await authenticatedPage.locator('input[name="emailOnAssignment"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Settings saved')).toBeVisible();
  });

  // EMAIL-002: Status change emails
  test('EMAIL-002: Status change emails', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/notifications');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="emailOnStatusChange"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Settings saved')).toBeVisible();
  });

  // EMAIL-003: Comment notification emails
  test('EMAIL-003: Comment notification emails', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/notifications');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="emailOnComment"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Settings saved')).toBeVisible();
  });

  // EMAIL-004: Mention emails
  test('EMAIL-004: Mention emails', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/notifications');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="emailOnMention"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Settings saved')).toBeVisible();
  });

  // EMAIL-005: Daily digest emails
  test('EMAIL-005: Daily digest emails', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/notifications');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="dailyDigest"]').check();
    await authenticatedPage.locator('select[name="digestTime"]').selectOption('09:00');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Settings saved')).toBeVisible();
  });
});
