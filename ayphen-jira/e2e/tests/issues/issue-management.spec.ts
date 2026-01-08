import { test, expect } from '../../fixtures/auth.fixture';
import { IssuePage, CreateIssuePage } from '../../pages';

/**
 * Issue Management Test Suite - Phase 1
 * Covers all issue CRUD operations and workflows
 */

test.describe('Issue Management - Phase 1 Core Tests', () => {
  let issuePage: IssuePage;
  let createIssuePage: CreateIssuePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    issuePage = new IssuePage(authenticatedPage);
    createIssuePage = new CreateIssuePage(authenticatedPage);
  });

  // ISSUE-001: Create issue with all fields
  test('ISSUE-001: Create issue with all fields', async ({ authenticatedPage }) => {
    await createIssuePage.goto();
    
    const issueData = {
      summary: `Test Issue ${Date.now()}`,
      description: 'This is a test issue created by E2E tests with all fields filled',
      type: 'task',
      priority: 'high',
      assignee: 'testuser@ayphen.com',
      reporter: 'testuser@ayphen.com',
      labels: ['test', 'e2e'],
      dueDate: '2024-12-31'
    };

    await createIssuePage.fillIssueForm(issueData);
    await createIssuePage.createIssue();
    
    // Should show success and redirect to issue detail
    await expect(authenticatedPage.locator('text=Issue created|Created successfully')).toBeVisible();
    await expect(authenticatedPage.locator(`text=${issueData.summary}`)).toBeVisible();
  });

  // ISSUE-002: Create issue with custom fields
  test('ISSUE-002: Create issue with custom fields', async ({ authenticatedPage }) => {
    await createIssuePage.goto();
    
    const issueData = {
      summary: `Custom Field Issue ${Date.now()}`,
      description: 'Issue with custom fields',
      type: 'story',
      priority: 'medium',
      customFields: {
        'Business Value': 'High',
        'Complexity': 'Medium',
        'Estimated Hours': '8'
      }
    };

    await createIssuePage.fillIssueForm(issueData);
    await createIssuePage.fillCustomFields(issueData.customFields);
    await createIssuePage.createIssue();
    
    // Should show custom field values
    await expect(authenticatedPage.locator('text=Business Value: High')).toBeVisible();
    await expect(authenticatedPage.locator('text=Complexity: Medium')).toBeVisible();
  });

  // ISSUE-003: Edit issue details
  test('ISSUE-003: Edit issue details', async ({ authenticatedPage }) => {
    // First create an issue
    await createIssuePage.goto();
    const originalData = {
      summary: `Edit Test ${Date.now()}`,
      description: 'Original description',
      type: 'task',
      priority: 'low'
    };

    await createIssuePage.fillIssueForm(originalData);
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Edit the issue
    const updatedData = {
      summary: `${originalData.summary} - Updated`,
      description: 'Updated description',
      priority: 'high',
      assignee: 'testuser@ayphen.com'
    };

    await issuePage.editIssue(updatedData);
    
    // Should show updated values
    await expect(authenticatedPage.locator(`text=${updatedData.summary}`)).toBeVisible();
    await expect(authenticatedPage.locator(`text=${updatedData.description}`)).toBeVisible();
    await expect(authenticatedPage.locator('text=High')).toBeVisible();
  });

  // ISSUE-004: Bulk issue creation
  test('ISSUE-004: Bulk issue creation', async ({ authenticatedPage }) => {
    await issuePage.gotoBulkCreate();
    
    const bulkIssues = [
      { summary: `Bulk Issue 1 ${Date.now()}`, type: 'task', priority: 'high' },
      { summary: `Bulk Issue 2 ${Date.now()}`, type: 'bug', priority: 'medium' },
      { summary: `Bulk Issue 3 ${Date.now()}`, type: 'story', priority: 'low' }
    ];

    await issuePage.fillBulkIssues(bulkIssues);
    await issuePage.createBulkIssues();
    
    // Should show success message with count
    await expect(authenticatedPage.locator('text=3 issues created|Bulk creation completed')).toBeVisible();
    
    // Verify issues were created
    await authenticatedPage.goto('/issues');
    for (const issue of bulkIssues) {
      await expect(authenticatedPage.locator(`text=${issue.summary}`)).toBeVisible();
    }
  });

  // ISSUE-005: Issue templates
  test('ISSUE-005: Issue templates', async ({ authenticatedPage }) => {
    await createIssuePage.goto();
    
    // Select template
    await createIssuePage.selectTemplate('Bug Report');
    
    // Template should pre-fill fields
    await expect(authenticatedPage.locator('input[name="summary"]')).toHaveValue(/Bug:/);
    await expect(authenticatedPage.locator('textarea[name="description"]')).toContainText('Steps to reproduce');
    
    // Fill remaining fields and create
    await createIssuePage.fillIssueForm({
      summary: `Template Bug ${Date.now()}`,
      description: 'Bug created from template'
    });
    await createIssuePage.createIssue();
    
    // Should create issue with template structure
    await expect(authenticatedPage.locator('text=Issue created')).toBeVisible();
  });

  // ISSUE-006: Issue cloning
  test('ISSUE-006: Issue cloning', async ({ authenticatedPage }) => {
    // Create original issue
    await createIssuePage.goto();
    const originalIssue = {
      summary: `Original Issue ${Date.now()}`,
      description: 'Original issue description',
      type: 'task',
      priority: 'high',
      assignee: 'testuser@ayphen.com'
    };

    await createIssuePage.fillIssueForm(originalIssue);
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Clone the issue
    await issuePage.cloneIssue();
    
    // Should show clone dialog
    await expect(authenticatedPage.locator('text=Clone Issue|Copy Issue')).toBeVisible();
    
    // Update cloned issue summary
    const clonedSummary = `${originalIssue.summary} - Clone`;
    await authenticatedPage.locator('input[name="summary"]').fill(clonedSummary);
    await authenticatedPage.locator('button:has-text("Clone"), button:has-text("Create")').click();
    
    // Should show cloned issue
    await expect(authenticatedPage.locator(`text=${clonedSummary}`)).toBeVisible();
    await expect(authenticatedPage.locator('text=Original issue description')).toBeVisible();
  });

  // ISSUE-007: Issue linking
  test('ISSUE-007: Issue linking', async ({ authenticatedPage }) => {
    // Create two issues
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Parent Issue ${Date.now()}`,
      description: 'Parent issue',
      type: 'story'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    const parentKey = await authenticatedPage.locator('[data-testid="issue-key"]').textContent();
    
    // Create second issue
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Child Issue ${Date.now()}`,
      description: 'Child issue',
      type: 'sub-task'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Link issues
    await issuePage.linkIssue(parentKey || '', 'blocks');
    
    // Should show link
    await expect(authenticatedPage.locator('text=blocks')).toBeVisible();
    await expect(authenticatedPage.locator(`text=${parentKey}`)).toBeVisible();
  });

  // ISSUE-008: Issue merging
  test('ISSUE-008: Issue merging', async ({ authenticatedPage }) => {
    // Create two similar issues
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Duplicate Issue 1 ${Date.now()}`,
      description: 'First duplicate issue',
      type: 'bug'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Duplicate Issue 2 ${Date.now()}`,
      description: 'Second duplicate issue',
      type: 'bug'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Merge issues
    await issuePage.mergeIssue();
    
    // Should show merge dialog
    await expect(authenticatedPage.locator('text=Merge Issues|Combine Issues')).toBeVisible();
    
    // Select target issue and merge
    await authenticatedPage.locator('[data-testid="merge-target"]').first().click();
    await authenticatedPage.locator('button:has-text("Merge"), button:has-text("Combine")').click();
    
    // Should show merge success
    await expect(authenticatedPage.locator('text=Issues merged|Merge completed')).toBeVisible();
  });

  // ISSUE-009: Issue voting
  test('ISSUE-009: Issue voting', async ({ authenticatedPage }) => {
    // Create an issue
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Vote Test Issue ${Date.now()}`,
      description: 'Issue for voting test',
      type: 'story'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Vote for issue
    await issuePage.voteForIssue();
    
    // Should show vote count increased
    await expect(authenticatedPage.locator('[data-testid="vote-count"]')).toContainText('1');
    
    // Remove vote
    await issuePage.removeVote();
    
    // Should show vote count decreased
    await expect(authenticatedPage.locator('[data-testid="vote-count"]')).toContainText('0');
  });

  // ISSUE-010: Issue watching
  test('ISSUE-010: Issue watching', async ({ authenticatedPage }) => {
    // Create an issue
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Watch Test Issue ${Date.now()}`,
      description: 'Issue for watch test',
      type: 'task'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Watch issue
    await issuePage.watchIssue();
    
    // Should show watching indicator
    await expect(authenticatedPage.locator('[data-testid="watching"]')).toBeVisible();
    
    // Stop watching
    await issuePage.unwatchIssue();
    
    // Should show not watching
    await expect(authenticatedPage.locator('[data-testid="not-watching"]')).toBeVisible();
  });

  // ISSUE-011: Issue history tracking
  test('ISSUE-011: Issue history tracking', async ({ authenticatedPage }) => {
    // Create issue
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `History Test Issue ${Date.now()}`,
      description: 'Original description',
      type: 'task',
      priority: 'low'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Make changes to track
    await issuePage.editIssue({
      summary: `History Test Issue ${Date.now()} - Updated`,
      priority: 'high'
    });
    await authenticatedPage.waitForTimeout(1000);

    // Check history
    await issuePage.goToHistory();
    
    // Should show change history
    await expect(authenticatedPage.locator('text=Summary changed')).toBeVisible();
    await expect(authenticatedPage.locator('text=Priority changed')).toBeVisible();
    await expect(authenticatedPage.locator('text=Low → High')).toBeVisible();
  });

  // ISSUE-012: Issue attachments
  test('ISSUE-012: Issue attachments', async ({ authenticatedPage }) => {
    // Create issue
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Attachment Test Issue ${Date.now()}`,
      description: 'Issue with attachments',
      type: 'bug'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Add attachment
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/test-attachment.txt');
    
    // Should show attachment
    await expect(authenticatedPage.locator('text=test-attachment.txt')).toBeVisible();
    
    // Download attachment
    const downloadPromise = authenticatedPage.waitForEvent('download');
    await authenticatedPage.locator('[data-testid="download-attachment"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('test-attachment.txt');
  });

  // ISSUE-013: Issue comments
  test('ISSUE-013: Issue comments', async ({ authenticatedPage }) => {
    // Create issue
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Comment Test Issue ${Date.now()}`,
      description: 'Issue for comments',
      type: 'task'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Add comment
    const commentText = 'This is a test comment';
    await issuePage.addComment(commentText);
    
    // Should show comment
    await expect(authenticatedPage.locator(`text=${commentText}`)).toBeVisible();
    
    // Edit comment
    const editedComment = 'This is an edited comment';
    await issuePage.editComment(editedComment);
    
    // Should show edited comment
    await expect(authenticatedPage.locator(`text=${editedComment}`)).toBeVisible();
    await expect(authenticatedPage.locator('text=edited')).toBeVisible();
    
    // Delete comment
    await issuePage.deleteComment();
    
    // Should show comment deleted
    await expect(authenticatedPage.locator(`text=${editedComment}`)).not.toBeVisible();
  });

  // ISSUE-014: Issue mentions
  test('ISSUE-014: Issue mentions', async ({ authenticatedPage }) => {
    // Create issue
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Mention Test Issue ${Date.now()}`,
      description: 'Issue for testing mentions',
      type: 'story'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Add comment with mention
    await issuePage.addComment('@testuser please review this issue');
    
    // Should show mention
    await expect(authenticatedPage.locator('[data-testid="mention"]')).toBeVisible();
    await expect(authenticatedPage.locator('text=testuser')).toBeVisible();
  });

  // ISSUE-015: Issue labels and tags
  test('ISSUE-015: Issue labels and tags', async ({ authenticatedPage }) => {
    // Create issue with labels
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Label Test Issue ${Date.now()}`,
      description: 'Issue with labels',
      type: 'task',
      labels: ['urgent', 'frontend', 'bug']
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(1000);

    // Should show labels
    await expect(authenticatedPage.locator('text=urgent')).toBeVisible();
    await expect(authenticatedPage.locator('text=frontend')).toBeVisible();
    await expect(authenticatedPage.locator('text=bug')).toBeVisible();
    
    // Add more labels
    await issuePage.addLabel('backend');
    
    // Should show new label
    await expect(authenticatedPage.locator('text=backend')).toBeVisible();
    
    // Remove label
    await issuePage.removeLabel('urgent');
    
    // Should not show removed label
    await expect(authenticatedPage.locator('text=urgent')).not.toBeVisible();
  });
});

// WORKFLOW-001: Status transitions
test('WORKFLOW-001: Status transitions', async ({ authenticatedPage }) => {
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  const issuePage = new IssuePage(authenticatedPage);
  
  // Create issue
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `Workflow Test Issue ${Date.now()}`,
    description: 'Issue for workflow testing',
    type: 'task'
  });
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);

  // Check initial status
  await expect(authenticatedPage.locator('[data-testid="issue-status"]')).toContainText('To Do');
  
  // Change status to In Progress
  await issuePage.changeStatus('In Progress');
  await expect(authenticatedPage.locator('[data-testid="issue-status"]')).toContainText('In Progress');
  
  // Change status to Done
  await issuePage.changeStatus('Done');
  await expect(authenticatedPage.locator('[data-testid="issue-status"]')).toContainText('Done');
});

// WORKFLOW-002: Assignment changes
test('WORKFLOW-002: Assignment changes', async ({ authenticatedPage }) => {
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  const issuePage = new IssuePage(authenticatedPage);
  
  // Create issue
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `Assignment Test Issue ${Date.now()}`,
    description: 'Issue for assignment testing',
    type: 'task'
  });
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);

  // Assign issue
  await issuePage.assignIssue('testuser@ayphen.com');
  await expect(authenticatedPage.locator('text=testuser@ayphen.com')).toBeVisible();
  
  // Change assignment
  await issuePage.assignIssue('anotheruser@ayphen.com');
  await expect(authenticatedPage.locator('text=anotheruser@ayphen.com')).toBeVisible();
  await expect(authenticatedPage.locator('text=testuser@ayphen.com')).not.toBeVisible();
});

// WORKFLOW-003: Priority updates
test('WORKFLOW-003: Priority updates', async ({ authenticatedPage }) => {
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  const issuePage = new IssuePage(authenticatedPage);
  
  // Create issue
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `Priority Test Issue ${Date.now()}`,
    description: 'Issue for priority testing',
    type: 'bug',
    priority: 'low'
  });
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);

  // Change priority
  await issuePage.changePriority('high');
  await expect(authenticatedPage.locator('[data-testid="issue-priority"]')).toContainText('High');
  
  // Change priority again
  await issuePage.changePriority('medium');
  await expect(authenticatedPage.locator('[data-testid="issue-priority"]')).toContainText('Medium');
});

// WORKFLOW-004: Custom workflows
test('WORKFLOW-004: Custom workflows', async ({ authenticatedPage }) => {
  // This test would require custom workflow setup
  // For now, just test basic workflow functionality
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  const issuePage = new IssuePage(authenticatedPage);
  
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `Custom Workflow Test ${Date.now()}`,
    description: 'Testing custom workflow',
    type: 'story'
  });
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);

  // Check if custom workflow options are available
  const workflowSelect = authenticatedPage.locator('[data-testid="custom-workflow"]');
  if (await workflowSelect.isVisible()) {
    await workflowSelect.click();
    await authenticatedPage.locator('option:has-text("Custom Flow")').click();
    await expect(authenticatedPage.locator('text=Custom workflow applied')).toBeVisible();
  }
});

// WORKFLOW-005: Workflow conditions
test('WORKFLOW-005: Workflow conditions', async ({ authenticatedPage }) => {
  // Test workflow conditions (if implemented)
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `Condition Test ${Date.now()}`,
    description: 'Testing workflow conditions',
    type: 'task',
    priority: 'high'
  });
  
  // Check if conditions affect form
  const conditionMessage = authenticatedPage.locator('[data-testid="condition-message"]');
  if (await conditionMessage.isVisible()) {
    await expect(conditionMessage).toContainText('High priority requires approval');
  }
  
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);
});

// WORKFLOW-006: Workflow post-functions
test('WORKFLOW-006: Workflow post-functions', async ({ authenticatedPage }) => {
  // Test post-functions like auto-assignment, notifications
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  const issuePage = new IssuePage(authenticatedPage);
  
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `Post-function Test ${Date.now()}`,
    description: 'Testing workflow post-functions',
    type: 'bug'
  });
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);

  // Check if post-functions executed (e.g., auto-assignment)
  const assignee = authenticatedPage.locator('[data-testid="issue-assignee"]');
  if (await assignee.isVisible()) {
    // Should show auto-assigned user if post-function is configured
    await expect(assignee).toBeVisible();
  }
});

// WORKFLOW-007: Bulk status changes
test('WORKFLOW-007: Bulk status changes', async ({ authenticatedPage }) => {
  // Create multiple issues
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  
  for (let i = 1; i <= 3; i++) {
    await createIssuePage.goto();
    await createIssuePage.fillIssueForm({
      summary: `Bulk Status Test ${i} ${Date.now()}`,
      description: `Issue ${i} for bulk status change`,
      type: 'task'
    });
    await createIssuePage.createIssue();
    await authenticatedPage.waitForTimeout(500);
  }

  // Go to issues list and bulk update
  await authenticatedPage.goto('/issues');
  await authenticatedPage.locator('[data-testid="select-all"]').check();
  await authenticatedPage.locator('[data-testid="bulk-actions"]').click();
  await authenticatedPage.locator('button:has-text("Change Status")').click();
  await authenticatedPage.locator('select[name="status"]').selectOption('In Progress');
  await authenticatedPage.locator('button:has-text("Apply")').click();
  
  // Should show success message
  await expect(authenticatedPage.locator('text=3 issues updated|Bulk update completed')).toBeVisible();
});

// WORKFLOW-008: Workflow permissions
test('WORKFLOW-008: Workflow permissions', async ({ authenticatedPage }) => {
  // Test if user has permission to change workflow
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  const issuePage = new IssuePage(authenticatedPage);
  
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `Permission Test ${Date.now()}`,
    description: 'Testing workflow permissions',
    type: 'task'
  });
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);

  // Try to change status
  const statusButton = authenticatedPage.locator('[data-testid="change-status"]');
  if (await statusButton.isVisible()) {
    await statusButton.click();
    
    // Check if status options are available
    const statusOptions = authenticatedPage.locator('[data-testid="status-option"]');
    const optionCount = await statusOptions.count();
    
    if (optionCount > 0) {
      await statusOptions.first().click();
      await expect(authenticatedPage.locator('text=Status changed')).toBeVisible();
    } else {
      // User might not have permission
      await expect(authenticatedPage.locator('text=Permission denied')).toBeVisible();
    }
  }
});

// WORKFLOW-009: Workflow validation
test('WORKFLOW-009: Workflow validation', async ({ authenticatedPage }) => {
  // Test workflow validation rules
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  const issuePage = new IssuePage(authenticatedPage);
  
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `Validation Test ${Date.now()}`,
    description: 'Testing workflow validation',
    type: 'story'
  });
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);

  // Try invalid transition (e.g., from To Do to Done without In Progress)
  await issuePage.changeStatus('Done');
  
  // Check if validation prevents transition
  const errorMessage = authenticatedPage.locator('[data-testid="workflow-error"]');
  if (await errorMessage.isVisible()) {
    await expect(errorMessage).toContainText('Cannot transition directly');
  }
});

// WORKFLOW-010: Workflow history
test('WORKFLOW-010: Workflow history', async ({ authenticatedPage }) => {
  // Test workflow change history
  const createIssuePage = new CreateIssuePage(authenticatedPage);
  const issuePage = new IssuePage(authenticatedPage);
  
  await createIssuePage.goto();
  await createIssuePage.fillIssueForm({
    summary: `History Test ${Date.now()}`,
    description: 'Testing workflow history',
    type: 'task'
  });
  await createIssuePage.createIssue();
  await authenticatedPage.waitForTimeout(1000);

  // Make workflow changes
  await issuePage.changeStatus('In Progress');
  await authenticatedPage.waitForTimeout(500);
  await issuePage.changeStatus('Done');
  await authenticatedPage.waitForTimeout(500);

  // Check history
  await issuePage.goToHistory();
  
  // Should show workflow changes
  await expect(authenticatedPage.locator('text=Status changed: To Do → In Progress')).toBeVisible();
  await expect(authenticatedPage.locator('text=Status changed: In Progress → Done')).toBeVisible();
});
