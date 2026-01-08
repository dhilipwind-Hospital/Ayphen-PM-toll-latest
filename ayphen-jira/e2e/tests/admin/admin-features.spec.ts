import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Admin Features Test Suite - Phase 3
 * Covers user management, system settings, and audit logs
 */

test.describe('Admin Features - Phase 3 Integration Tests', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  // ADMIN-001: User creation
  test('ADMIN-001: User creation', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="users-management"]').click();
    await authenticatedPage.locator('button:has-text("Add User")').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('input[name="name"]').fill('New Test User');
    await authenticatedPage.locator('input[name="email"]').fill(`newuser${Date.now()}@test.com`);
    await authenticatedPage.locator('select[name="role"]').selectOption('developer');
    await authenticatedPage.locator('button:has-text("Create")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=User created|User added successfully')).toBeVisible();
  });

  // ADMIN-002: User deactivation
  test('ADMIN-002: User deactivation', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="users-management"]').click();
    await authenticatedPage.waitForTimeout(500);

    const userRow = authenticatedPage.locator('[data-testid="user-row"]').first();
    if (await userRow.isVisible()) {
      await userRow.locator('[data-testid="user-actions"]').click();
      await authenticatedPage.locator('button:has-text("Deactivate")').click();
      await authenticatedPage.locator('button:has-text("Confirm")').click();
      await authenticatedPage.waitForTimeout(1000);

      await expect(authenticatedPage.locator('text=User deactivated')).toBeVisible();
    }
  });

  // ADMIN-003: Role management
  test('ADMIN-003: Role management', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="roles-management"]').click();
    await authenticatedPage.locator('button:has-text("Create Role")').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('input[name="roleName"]').fill('Custom Role');
    await authenticatedPage.locator('input[name="viewIssues"]').check();
    await authenticatedPage.locator('input[name="createIssues"]').check();
    await authenticatedPage.locator('input[name="editIssues"]').check();
    await authenticatedPage.locator('button:has-text("Create")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Role created')).toBeVisible();
  });

  // ADMIN-004: Permission management
  test('ADMIN-004: Permission management', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="permissions-management"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Update permissions for a role
    const roleRow = authenticatedPage.locator('[data-testid="role-row"]').first();
    await roleRow.locator('[data-testid="edit-permissions"]').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('input[name="canDeleteIssues"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Permissions updated')).toBeVisible();
  });

  // ADMIN-005: System settings
  test('ADMIN-005: System settings', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="system-settings"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Update system settings
    await authenticatedPage.locator('input[name="siteName"]').fill('Ayphen PM Tool');
    await authenticatedPage.locator('select[name="defaultLanguage"]').selectOption('en');
    await authenticatedPage.locator('select[name="timezone"]').selectOption('UTC');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Settings saved')).toBeVisible();
  });

  // ADMIN-006: Backup/restore
  test('ADMIN-006: Backup/restore', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="backup-restore"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Create backup
    await authenticatedPage.locator('button:has-text("Create Backup")').click();
    await authenticatedPage.waitForTimeout(3000);

    await expect(authenticatedPage.locator('text=Backup created|Backup in progress')).toBeVisible();
  });

  // ADMIN-007: Audit logs
  test('ADMIN-007: Audit logs', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="audit-logs"]').click();
    await authenticatedPage.waitForTimeout(500);

    await expect(authenticatedPage.locator('[data-testid="audit-log-table"]')).toBeVisible();

    // Filter logs
    await authenticatedPage.locator('select[name="logType"]').selectOption('user');
    await authenticatedPage.locator('button:has-text("Filter")').click();
    await authenticatedPage.waitForTimeout(500);
  });

  // ADMIN-008: System health
  test('ADMIN-008: System health', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="system-health"]').click();
    await authenticatedPage.waitForTimeout(500);

    await expect(authenticatedPage.locator('[data-testid="health-status"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="database-status"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="api-status"]')).toBeVisible();
  });

  // ADMIN-009: License management
  test('ADMIN-009: License management', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="license-management"]').click();
    await authenticatedPage.waitForTimeout(500);

    await expect(authenticatedPage.locator('[data-testid="license-info"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="license-expiry"]')).toBeVisible();
  });

  // ADMIN-010: Security settings
  test('ADMIN-010: Security settings', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="security-settings"]').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('input[name="enforcePasswordPolicy"]').check();
    await authenticatedPage.locator('select[name="sessionTimeout"]').selectOption('30');
    await authenticatedPage.locator('input[name="enableTwoFactor"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Security settings saved')).toBeVisible();
  });
});
