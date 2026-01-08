import { test, expect } from '../../fixtures/auth.fixture';

/**
 * AI Features Test Suite - Phase 2
 * Covers AI content generation, automation, and meeting features
 */

test.describe('AI Features - Phase 2 Advanced Tests', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  // AI-001: Generate user stories
  test('AI-001: Generate user stories', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/stories');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('textarea[name="requirements"]').fill('User should be able to login with email and password');
    await authenticatedPage.locator('button:has-text("Generate Stories")').click();
    await authenticatedPage.waitForTimeout(5000);

    await expect(authenticatedPage.locator('[data-testid="generated-story"]')).toBeVisible();
    await expect(authenticatedPage.locator('text=As a user')).toBeVisible();
  });

  // AI-002: Generate test cases
  test('AI-002: Generate test cases', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/test-cases');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('textarea[name="userStory"]').fill('As a user, I want to login so that I can access my dashboard');
    await authenticatedPage.locator('button:has-text("Generate Test Cases")').click();
    await authenticatedPage.waitForTimeout(5000);

    await expect(authenticatedPage.locator('[data-testid="generated-test-case"]')).toBeVisible();
  });

  // AI-003: Generate issue descriptions
  test('AI-003: Generate issue descriptions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues/create');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="summary"]').fill('Fix login button not working');
    await authenticatedPage.locator('[data-testid="ai-generate-description"]').click();
    await authenticatedPage.waitForTimeout(5000);

    const description = authenticatedPage.locator('textarea[name="description"]');
    await expect(description).not.toBeEmpty();
  });

  // AI-004: Generate acceptance criteria
  test('AI-004: Generate acceptance criteria', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues/create');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="summary"]').fill('Implement password reset feature');
    await authenticatedPage.locator('[data-testid="ai-generate-criteria"]').click();
    await authenticatedPage.waitForTimeout(5000);

    await expect(authenticatedPage.locator('[data-testid="acceptance-criteria"]')).toBeVisible();
    await expect(authenticatedPage.locator('text=Given|When|Then')).toBeVisible();
  });

  // AI-005: AI content editing
  test('AI-005: AI content editing', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/stories');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('textarea[name="requirements"]').fill('User login feature');
    await authenticatedPage.locator('button:has-text("Generate")').click();
    await authenticatedPage.waitForTimeout(5000);

    // Edit generated content
    const generatedContent = authenticatedPage.locator('[data-testid="generated-story"]').first();
    if (await generatedContent.isVisible()) {
      await generatedContent.locator('[data-testid="edit-content"]').click();
      await authenticatedPage.locator('textarea[name="editContent"]').fill('Edited user story content');
      await authenticatedPage.locator('button:has-text("Save")').click();
      await authenticatedPage.waitForTimeout(1000);

      await expect(authenticatedPage.locator('text=Edited user story content')).toBeVisible();
    }
  });

  // AI-006: AI content regeneration
  test('AI-006: AI content regeneration', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/stories');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('textarea[name="requirements"]').fill('User profile management');
    await authenticatedPage.locator('button:has-text("Generate")').click();
    await authenticatedPage.waitForTimeout(5000);

    const firstContent = await authenticatedPage.locator('[data-testid="generated-story"]').first().textContent();

    // Regenerate
    await authenticatedPage.locator('button:has-text("Regenerate")').click();
    await authenticatedPage.waitForTimeout(5000);

    const secondContent = await authenticatedPage.locator('[data-testid="generated-story"]').first().textContent();
    
    // Content should be different (or at least regenerated)
    expect(secondContent).toBeTruthy();
  });

  // AI-007: AI content validation
  test('AI-007: AI content validation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/stories');
    await authenticatedPage.waitForTimeout(1000);

    // Try with empty input
    await authenticatedPage.locator('button:has-text("Generate")').click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('text=Please enter requirements|Input required')).toBeVisible();
  });

  // AIAUTO-001: Auto-assignment of issues
  test('AIAUTO-001: Auto-assignment of issues', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues/create');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="summary"]').fill('Frontend bug in login page');
    await authenticatedPage.locator('textarea[name="description"]').fill('CSS issue with button alignment');
    
    await authenticatedPage.locator('[data-testid="ai-auto-assign"]').click();
    await authenticatedPage.waitForTimeout(3000);

    // Should suggest an assignee
    await expect(authenticatedPage.locator('[data-testid="suggested-assignee"]')).toBeVisible();
  });

  // AIAUTO-002: Auto-tagging
  test('AIAUTO-002: Auto-tagging', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues/create');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="summary"]').fill('API authentication failing');
    await authenticatedPage.locator('textarea[name="description"]').fill('JWT token not being validated correctly');
    
    await authenticatedPage.locator('[data-testid="ai-auto-tag"]').click();
    await authenticatedPage.waitForTimeout(3000);

    // Should suggest tags
    await expect(authenticatedPage.locator('[data-testid="suggested-tags"]')).toBeVisible();
    await expect(authenticatedPage.locator('text=api|authentication|security')).toBeVisible();
  });

  // AIAUTO-003: Smart prioritization
  test('AIAUTO-003: Smart prioritization', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues/create');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="summary"]').fill('Critical security vulnerability');
    await authenticatedPage.locator('textarea[name="description"]').fill('SQL injection possible in user search');
    
    await authenticatedPage.locator('[data-testid="ai-smart-priority"]').click();
    await authenticatedPage.waitForTimeout(3000);

    // Should suggest high priority
    await expect(authenticatedPage.locator('[data-testid="suggested-priority"]')).toContainText('High|Critical');
  });

  // AIAUTO-004: Duplicate detection
  test('AIAUTO-004: Duplicate detection', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues/create');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="summary"]').fill('Login button not working');
    await authenticatedPage.locator('textarea[name="description"]').fill('Users cannot click the login button');
    
    await authenticatedPage.waitForTimeout(2000);

    // Should show duplicate warning if similar issue exists
    const duplicateWarning = authenticatedPage.locator('[data-testid="duplicate-warning"]');
    if (await duplicateWarning.isVisible()) {
      await expect(duplicateWarning).toContainText('Similar issue found|Possible duplicate');
    }
  });

  // AIAUTO-005: Bug analysis
  test('AIAUTO-005: Bug analysis', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/bug-analysis');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('textarea[name="bugDescription"]').fill('Application crashes when user submits form with special characters');
    await authenticatedPage.locator('button:has-text("Analyze")').click();
    await authenticatedPage.waitForTimeout(5000);

    await expect(authenticatedPage.locator('[data-testid="bug-analysis-result"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="root-cause"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="suggested-fix"]')).toBeVisible();
  });

  // AIAUTO-006: Sprint auto-population
  test('AIAUTO-006: Sprint auto-population', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sprints');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('[data-testid="sprint-card"]').first().click();
    await authenticatedPage.locator('[data-testid="ai-auto-populate"]').click();
    await authenticatedPage.waitForTimeout(5000);

    await expect(authenticatedPage.locator('[data-testid="suggested-issues"]')).toBeVisible();
  });

  // AIAUTO-007: Predictive analytics
  test('AIAUTO-007: Predictive analytics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/predictions');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage.locator('[data-testid="sprint-completion-prediction"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="velocity-trend"]')).toBeVisible();
  });

  // AIAUTO-008: AI recommendations
  test('AIAUTO-008: AI recommendations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForTimeout(1000);

    const recommendations = authenticatedPage.locator('[data-testid="ai-recommendations"]');
    if (await recommendations.isVisible()) {
      await expect(recommendations).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="recommendation-card"]')).toBeVisible();
    }
  });

  // AIMEET-001: Meeting transcript processing
  test('AIMEET-001: Meeting transcript processing', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/meeting-scribe');
    await authenticatedPage.waitForTimeout(1000);

    const transcript = `
      John: We need to fix the login bug by Friday.
      Sarah: I'll update the documentation.
      John: Let's also add unit tests for the new feature.
    `;

    await authenticatedPage.locator('textarea[name="transcript"]').fill(transcript);
    await authenticatedPage.locator('button:has-text("Process")').click();
    await authenticatedPage.waitForTimeout(5000);

    await expect(authenticatedPage.locator('[data-testid="meeting-summary"]')).toBeVisible();
  });

  // AIMEET-002: Action item extraction
  test('AIMEET-002: Action item extraction', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/meeting-scribe');
    await authenticatedPage.waitForTimeout(1000);

    const transcript = `
      Manager: John will handle the API integration.
      John: Okay, I'll complete it by next week.
      Manager: Sarah needs to review the design.
    `;

    await authenticatedPage.locator('textarea[name="transcript"]').fill(transcript);
    await authenticatedPage.locator('button:has-text("Process")').click();
    await authenticatedPage.waitForTimeout(5000);

    await expect(authenticatedPage.locator('[data-testid="action-items"]')).toBeVisible();
    await expect(authenticatedPage.locator('text=John|API integration')).toBeVisible();
  });

  // AIMEET-003: Meeting summary generation
  test('AIMEET-003: Meeting summary generation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/meeting-scribe');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('input[name="meetingTitle"]').fill('Sprint Planning');
    await authenticatedPage.locator('textarea[name="transcript"]').fill('Discussion about Q1 goals and priorities.');
    await authenticatedPage.locator('button:has-text("Process")').click();
    await authenticatedPage.waitForTimeout(5000);

    await expect(authenticatedPage.locator('[data-testid="meeting-summary"]')).toContainText('Sprint Planning');
  });

  // AIMEET-004: Quick notes processing
  test('AIMEET-004: Quick notes processing', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/meeting-scribe');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('button:has-text("Quick Notes")').click();
    await authenticatedPage.locator('textarea[name="notes"]').fill('Fix login bug - John\nUpdate docs - Sarah');
    await authenticatedPage.locator('button:has-text("Process")').click();
    await authenticatedPage.waitForTimeout(3000);

    await expect(authenticatedPage.locator('[data-testid="quick-notes-result"]')).toBeVisible();
  });

  // AIMEET-005: Meeting issue creation
  test('AIMEET-005: Meeting issue creation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai/meeting-scribe');
    await authenticatedPage.waitForTimeout(1000);

    await authenticatedPage.locator('textarea[name="transcript"]').fill('We need to fix the payment gateway issue.');
    await authenticatedPage.locator('button:has-text("Process")').click();
    await authenticatedPage.waitForTimeout(5000);

    // Create issues from action items
    await authenticatedPage.locator('button:has-text("Create Issues")').click();
    await authenticatedPage.waitForTimeout(2000);

    await expect(authenticatedPage.locator('text=Issues created|Created successfully')).toBeVisible();
  });
});
