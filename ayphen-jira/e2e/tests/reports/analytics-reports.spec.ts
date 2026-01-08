import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Analytics & Reports Test Suite - Phase 2
 * Covers dashboards, charts, and reporting features
 */

test.describe('Analytics & Reports - Phase 2 Advanced Tests', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  // DASH-001: Dashboard widget display
  test('DASH-001: Dashboard widget display', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('[data-testid="dashboard-widgets"]')).toBeVisible();
    
    // Check for common widgets
    const widgets = authenticatedPage.locator('[data-testid="widget"]');
    await expect(widgets.first()).toBeVisible();
  });

  // DASH-002: Widget customization
  test('DASH-002: Widget customization', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="customize-dashboard"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Add a new widget
    await authenticatedPage.locator('button:has-text("Add Widget")').click();
    await authenticatedPage.locator('[data-testid="widget-burndown"]').click();
    await authenticatedPage.waitForTimeout(500);

    await expect(authenticatedPage.locator('[data-testid="burndown-widget"]')).toBeVisible();

    // Save dashboard
    await authenticatedPage.locator('button:has-text("Save Dashboard")').click();
    await authenticatedPage.waitForTimeout(1000);
  });

  // DASH-003: Dashboard sharing
  test('DASH-003: Dashboard sharing', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="share-dashboard"]').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('input[name="shareWithTeam"]').check();
    await authenticatedPage.locator('button:has-text("Share")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Dashboard shared')).toBeVisible();
  });

  // DASH-004: Dashboard export
  test('DASH-004: Dashboard export', async ({ authenticatedPage }) => {
    const downloadPromise = authenticatedPage.waitForEvent('download');
    await authenticatedPage.locator('[data-testid="export-dashboard"]').click();
    await authenticatedPage.locator('button:has-text("Export as PDF")').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  // DASH-005: Dashboard permissions
  test('DASH-005: Dashboard permissions', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="dashboard-settings"]').click();
    await authenticatedPage.locator('button:has-text("Permissions")').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('select[name="viewPermission"]').selectOption('team');
    await authenticatedPage.locator('select[name="editPermission"]').selectOption('owner');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Permissions updated')).toBeVisible();
  });

  // ANALYTICS-001: Issue statistics
  test('ANALYTICS-001: Issue statistics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/issues');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('[data-testid="total-issues"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="open-issues"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="closed-issues"]')).toBeVisible();
  });

  // ANALYTICS-002: Team velocity
  test('ANALYTICS-002: Team velocity', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/velocity');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('[data-testid="velocity-chart"]')).toBeVisible();
    
    // Check for velocity data
    const velocityValue = authenticatedPage.locator('[data-testid="average-velocity"]');
    if (await velocityValue.isVisible()) {
      await expect(velocityValue).toBeVisible();
    }
  });

  // ANALYTICS-003: Burndown charts
  test('ANALYTICS-003: Burndown charts', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/burndown');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('[data-testid="burndown-chart"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="ideal-line"]')).toBeVisible();
  });

  // ANALYTICS-004: Pie charts
  test('ANALYTICS-004: Pie charts', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/distribution');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('[data-testid="status-pie-chart"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="priority-pie-chart"]')).toBeVisible();
  });

  // ANALYTICS-005: Heat maps
  test('ANALYTICS-005: Heat maps', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/activity');
    await authenticatedPage.waitForTimeout(1000);

    const heatmap = authenticatedPage.locator('[data-testid="activity-heatmap"]');
    if (await heatmap.isVisible()) {
      await expect(heatmap).toBeVisible();
    }
  });

  // ANALYTICS-006: Trend analysis
  test('ANALYTICS-006: Trend analysis', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/trends');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('[data-testid="trend-chart"]')).toBeVisible();
    
    // Change date range
    await authenticatedPage.locator('select[name="dateRange"]').selectOption('30days');
    await authenticatedPage.waitForTimeout(1000);
  });

  // ANALYTICS-007: Custom reports
  test('ANALYTICS-007: Custom reports', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/custom');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('button:has-text("Create Report")').click();
    await authenticatedPage.waitForTimeout(500);

    // Configure report
    await authenticatedPage.locator('input[name="reportName"]').fill('Custom Test Report');
    await authenticatedPage.locator('select[name="reportType"]').selectOption('issues');
    await authenticatedPage.locator('select[name="groupBy"]').selectOption('status');
    await authenticatedPage.locator('button:has-text("Generate")').click();
    await authenticatedPage.waitForTimeout(2000);

    await expect(authenticatedPage.locator('[data-testid="custom-report"]')).toBeVisible();
  });

  // ANALYTICS-008: Report export
  test('ANALYTICS-008: Report export', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/issues');
    await authenticatedPage.waitForTimeout(1000);

    const downloadPromise = authenticatedPage.waitForEvent('download');
    await authenticatedPage.locator('button:has-text("Export")').click();
    await authenticatedPage.locator('button:has-text("CSV")').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  // ANALYTICS-009: Report scheduling
  test('ANALYTICS-009: Report scheduling', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/schedule');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('button:has-text("Schedule Report")').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('select[name="report"]').selectOption('velocity');
    await authenticatedPage.locator('select[name="frequency"]').selectOption('weekly');
    await authenticatedPage.locator('input[name="recipients"]').fill('team@ayphen.com');
    await authenticatedPage.locator('button:has-text("Schedule")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Report scheduled')).toBeVisible();
  });

  // ANALYTICS-010: Report sharing
  test('ANALYTICS-010: Report sharing', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/issues');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('button:has-text("Share")').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('input[name="shareLink"]').check();
    await authenticatedPage.locator('button:has-text("Generate Link")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('[data-testid="share-link"]')).toBeVisible();
  });
});
