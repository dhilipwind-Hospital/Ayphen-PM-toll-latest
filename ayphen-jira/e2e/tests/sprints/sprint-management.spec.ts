import { test, expect } from '../../fixtures/auth.fixture';
import { BoardPage } from '../../pages';

/**
 * Sprint Management Test Suite - Phase 2
 * Covers sprint lifecycle, planning, and reporting
 */

test.describe('Sprint Management - Phase 2 Advanced Tests', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sprints');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  // SPRINT-001: Create new sprint
  test('SPRINT-001: Create new sprint', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="create-sprint"], button:has-text("Create Sprint")').click();
    await authenticatedPage.waitForTimeout(500);

    const sprintName = `Test Sprint ${Date.now()}`;
    await authenticatedPage.locator('input[name="name"]').fill(sprintName);
    await authenticatedPage.locator('input[name="startDate"]').fill('2024-01-01');
    await authenticatedPage.locator('input[name="endDate"]').fill('2024-01-14');
    await authenticatedPage.locator('textarea[name="goal"]').fill('Complete all test cases');
    
    await authenticatedPage.locator('button[type="submit"], button:has-text("Create")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator(`text=${sprintName}`)).toBeVisible();
  });

  // SPRINT-002: Sprint planning - add issues
  test('SPRINT-002: Sprint planning - add issues', async ({ authenticatedPage }) => {
    // Open sprint planning
    await authenticatedPage.locator('[data-testid="sprint-card"]').first().click();
    await authenticatedPage.locator('button:has-text("Plan Sprint")').click();
    await authenticatedPage.waitForTimeout(500);

    // Add issues from backlog
    const backlogIssue = authenticatedPage.locator('[data-testid="backlog-issue"]').first();
    if (await backlogIssue.isVisible()) {
      await backlogIssue.dragTo(authenticatedPage.locator('[data-testid="sprint-issues"]'));
      await authenticatedPage.waitForTimeout(500);

      await expect(authenticatedPage.locator('[data-testid="sprint-issues"] [data-testid="issue-card"]')).toBeVisible();
    }
  });

  // SPRINT-003: Start active sprint
  test('SPRINT-003: Start active sprint', async ({ authenticatedPage }) => {
    // Find a planned sprint
    const plannedSprint = authenticatedPage.locator('[data-testid="sprint-status-planned"]').first();
    
    if (await plannedSprint.isVisible()) {
      await plannedSprint.click();
      await authenticatedPage.locator('button:has-text("Start Sprint")').click();
      await authenticatedPage.waitForTimeout(500);

      // Confirm start
      await authenticatedPage.locator('button:has-text("Confirm"), button:has-text("Start")').click();
      await authenticatedPage.waitForTimeout(1000);

      await expect(authenticatedPage.locator('text=Sprint started|Active')).toBeVisible();
    }
  });

  // SPRINT-004: Sprint progress tracking
  test('SPRINT-004: Sprint progress tracking', async ({ authenticatedPage }) => {
    // Open active sprint
    const activeSprint = authenticatedPage.locator('[data-testid="sprint-status-active"]').first();
    
    if (await activeSprint.isVisible()) {
      await activeSprint.click();
      await authenticatedPage.waitForTimeout(500);

      // Check progress indicators
      await expect(authenticatedPage.locator('[data-testid="sprint-progress"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="completed-issues"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="remaining-issues"]')).toBeVisible();
    }
  });

  // SPRINT-005: Complete sprint
  test('SPRINT-005: Complete sprint', async ({ authenticatedPage }) => {
    const activeSprint = authenticatedPage.locator('[data-testid="sprint-status-active"]').first();
    
    if (await activeSprint.isVisible()) {
      await activeSprint.click();
      await authenticatedPage.locator('button:has-text("Complete Sprint")').click();
      await authenticatedPage.waitForTimeout(500);

      // Handle incomplete issues
      await authenticatedPage.locator('select[name="incompleteAction"]').selectOption('moveToBacklog');
      await authenticatedPage.locator('button:has-text("Complete")').click();
      await authenticatedPage.waitForTimeout(1000);

      await expect(authenticatedPage.locator('text=Sprint completed|Completed')).toBeVisible();
    }
  });

  // SPRINT-006: Sprint retrospective
  test('SPRINT-006: Sprint retrospective', async ({ authenticatedPage }) => {
    const completedSprint = authenticatedPage.locator('[data-testid="sprint-status-completed"]').first();
    
    if (await completedSprint.isVisible()) {
      await completedSprint.click();
      await authenticatedPage.locator('button:has-text("Retrospective")').click();
      await authenticatedPage.waitForTimeout(500);

      // Add retrospective items
      await authenticatedPage.locator('textarea[name="whatWentWell"]').fill('Team collaboration was excellent');
      await authenticatedPage.locator('textarea[name="whatToImprove"]').fill('Need better estimation');
      await authenticatedPage.locator('textarea[name="actionItems"]').fill('Review estimation process');
      
      await authenticatedPage.locator('button:has-text("Save Retrospective")').click();
      await authenticatedPage.waitForTimeout(1000);

      await expect(authenticatedPage.locator('text=Retrospective saved')).toBeVisible();
    }
  });

  // SPRINT-007: Sprint burndown chart
  test('SPRINT-007: Sprint burndown chart', async ({ authenticatedPage }) => {
    const activeSprint = authenticatedPage.locator('[data-testid="sprint-status-active"]').first();
    
    if (await activeSprint.isVisible()) {
      await activeSprint.click();
      await authenticatedPage.locator('button:has-text("Reports")').click();
      await authenticatedPage.waitForTimeout(500);

      await expect(authenticatedPage.locator('[data-testid="burndown-chart"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="ideal-line"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="actual-line"]')).toBeVisible();
    }
  });

  // SPRINT-008: Active sprint management
  test('SPRINT-008: Active sprint management', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/board');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check active sprint indicator
    await expect(authenticatedPage.locator('[data-testid="active-sprint-indicator"]')).toBeVisible();
    
    // View sprint details
    await authenticatedPage.locator('[data-testid="sprint-dropdown"]').click();
    await expect(authenticatedPage.locator('[data-testid="sprint-info"]')).toBeVisible();
  });

  // SPRINT-009: Sprint backlog
  test('SPRINT-009: Sprint backlog', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/backlog');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check sprint sections
    await expect(authenticatedPage.locator('[data-testid="sprint-section"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="backlog-section"]')).toBeVisible();

    // Drag issue to sprint
    const backlogIssue = authenticatedPage.locator('[data-testid="backlog-issue"]').first();
    const sprintSection = authenticatedPage.locator('[data-testid="sprint-section"]').first();
    
    if (await backlogIssue.isVisible() && await sprintSection.isVisible()) {
      await backlogIssue.dragTo(sprintSection);
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  // SPRINT-010: Sprint capacity planning
  test('SPRINT-010: Sprint capacity planning', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="sprint-card"]').first().click();
    await authenticatedPage.locator('button:has-text("Capacity")').click();
    await authenticatedPage.waitForTimeout(500);

    // Set team capacity
    await authenticatedPage.locator('input[name="teamCapacity"]').fill('40');
    await authenticatedPage.locator('button:has-text("Save Capacity")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Capacity saved|40 hours')).toBeVisible();
  });

  // SPRINT-011: Velocity chart
  test('SPRINT-011: Velocity chart', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reports/velocity');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage.locator('[data-testid="velocity-chart"]')).toBeVisible();
    
    // Check chart data
    const chartBars = authenticatedPage.locator('[data-testid="velocity-bar"]');
    if (await chartBars.count() > 0) {
      await expect(chartBars.first()).toBeVisible();
    }
  });

  // SPRINT-012: Sprint goal setting
  test('SPRINT-012: Sprint goal setting', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="sprint-card"]').first().click();
    await authenticatedPage.locator('button:has-text("Edit Goal")').click();
    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.locator('textarea[name="goal"]').fill('Complete all user stories for v2.0 release');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Goal updated|Complete all user stories')).toBeVisible();
  });

  // SPRINT-013: Sprint issue allocation
  test('SPRINT-013: Sprint issue allocation', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="sprint-card"]').first().click();
    await authenticatedPage.locator('button:has-text("Allocate")').click();
    await authenticatedPage.waitForTimeout(500);

    // Allocate issues to team members
    const unassignedIssue = authenticatedPage.locator('[data-testid="unassigned-issue"]').first();
    if (await unassignedIssue.isVisible()) {
      await unassignedIssue.locator('select[name="assignee"]').selectOption('testuser@ayphen.com');
      await authenticatedPage.waitForTimeout(500);

      await expect(unassignedIssue.locator('text=testuser')).toBeVisible();
    }
  });

  // SPRINT-014: Sprint time tracking
  test('SPRINT-014: Sprint time tracking', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="sprint-card"]').first().click();
    await authenticatedPage.locator('button:has-text("Time Tracking")').click();
    await authenticatedPage.waitForTimeout(500);

    await expect(authenticatedPage.locator('[data-testid="time-logged"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="time-remaining"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="time-estimated"]')).toBeVisible();
  });

  // SPRINT-015: Sprint notifications
  test('SPRINT-015: Sprint notifications', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="sprint-card"]').first().click();
    await authenticatedPage.locator('button:has-text("Notifications")').click();
    await authenticatedPage.waitForTimeout(500);

    // Configure sprint notifications
    await authenticatedPage.locator('input[name="dailyStandupReminder"]').check();
    await authenticatedPage.locator('input[name="sprintEndReminder"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Notifications configured')).toBeVisible();
  });
});
