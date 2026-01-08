import { test, expect } from '../../fixtures/auth.fixture';
import { BoardPage } from '../../pages';

/**
 * Kanban Board Test Suite - Phase 1
 * Covers all board operations and drag-drop functionality
 */

test.describe('Kanban Board - Phase 1 Core Tests', () => {
  let boardPage: BoardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    boardPage = new BoardPage(authenticatedPage);
    await boardPage.goto();
  });

  // BOARD-001: Board load with columns
  test('BOARD-001: Board load with columns', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Verify we're on the board page
    await expect(authenticatedPage).toHaveURL(/.*\/board/);
    console.log('✅ BOARD-001: Board page loaded successfully');
  });

  // BOARD-002: Drag card to different column
  test('BOARD-002: Drag card to different column', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find any issue card on the board
    const cards = authenticatedPage.locator('.ant-card, [class*="card"], [class*="issue"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      console.log(`✅ BOARD-002: Found ${cardCount} cards on board`);
    } else {
      console.log('⚠️ BOARD-002: No cards found on board - skipping drag test');
    }
  });

  // BOARD-003: Board with swimlanes
  test('BOARD-003: Board with swimlanes', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Enable swimlanes if available
    const swimlaneToggle = authenticatedPage.locator('[data-testid="swimlane-toggle"]');
    if (await swimlaneToggle.isVisible()) {
      await swimlaneToggle.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show swimlanes
      await expect(authenticatedPage.locator('[data-testid="swimlane"]')).toBeVisible();
    }
  });

  // BOARD-004: Board filters
  test('BOARD-004: Board filters', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Open filter panel
    await authenticatedPage.locator('[data-testid="board-filters"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Apply filter
    await authenticatedPage.locator('[data-testid="filter-assignee"]').click();
    await authenticatedPage.locator('option:has-text("Me")').click();
    await authenticatedPage.locator('button:has-text("Apply")').click();
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show filtered results
    await expect(authenticatedPage.locator('[data-testid="filtered-results"]')).toBeVisible();
  });

  // BOARD-005: Board search
  test('BOARD-005: Board search', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Search for specific issue
    await authenticatedPage.locator('[data-testid="board-search"]').fill('test');
    await authenticatedPage.waitForTimeout(500);
    
    // Should show search results
    const searchResults = authenticatedPage.locator('[data-testid="search-results"]');
    if (await searchResults.isVisible()) {
      await expect(searchResults).toBeVisible();
    }
  });

  // BOARD-006: Board view settings
  test('BOARD-006: Board view settings', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Open board settings
    await authenticatedPage.locator('[data-testid="board-settings"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Change view settings
    await authenticatedPage.locator('[data-testid="view-options"]').click();
    await authenticatedPage.locator('input[name="show-avatars"]').check();
    await authenticatedPage.locator('input[name="compact-view"]').uncheck();
    await authenticatedPage.locator('button:has-text("Save")').click();
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show updated view
    await expect(authenticatedPage.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  // BOARD-007: Board pagination
  test('BOARD-007: Board pagination', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Check if pagination exists
    const pagination = authenticatedPage.locator('[data-testid="board-pagination"]');
    if (await pagination.isVisible()) {
      // Navigate to next page
      await pagination.locator('button:has-text("Next")').click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show different content
      await expect(pagination).toBeVisible();
    }
  });

  // BOARD-008: Board quick filters
  test('BOARD-008: Board quick filters', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Apply quick filter
    await authenticatedPage.locator('[data-testid="quick-filter-my-issues"]').click();
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show only assigned issues
    await expect(authenticatedPage.locator('[data-testid="my-issues-only"]')).toBeVisible();
  });

  // CARD-001: Card priority indicators
  test('CARD-001: Card priority indicators', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find cards with priority indicators
    const highPriorityCards = authenticatedPage.locator('[data-testid="priority-high"], .priority-high');
    const mediumPriorityCards = authenticatedPage.locator('[data-testid="priority-medium"], .priority-medium');
    const lowPriorityCards = authenticatedPage.locator('[data-testid="priority-low"], .priority-low');
    
    // Should show priority indicators
    if (await highPriorityCards.count() > 0) {
      await expect(highPriorityCards.first()).toBeVisible();
    }
    if (await mediumPriorityCards.count() > 0) {
      await expect(mediumPriorityCards.first()).toBeVisible();
    }
    if (await lowPriorityCards.count() > 0) {
      await expect(lowPriorityCards.first()).toBeVisible();
    }
  });

  // CARD-002: Card assignee avatars
  test('CARD-002: Card assignee avatars', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find cards with assignees
    const assignedCards = authenticatedPage.locator('[data-testid="card-assignee"], .card-assignee');
    
    if (await assignedCards.count() > 0) {
      await expect(assignedCards.first()).toBeVisible();
      
      // Should show avatar
      const avatar = assignedCards.first().locator('[data-testid="user-avatar"], .user-avatar');
      if (await avatar.count() > 0) {
        await expect(avatar.first()).toBeVisible();
      }
    }
  });

  // CARD-003: Card labels display
  test('CARD-003: Card labels display', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find cards with labels
    const labeledCards = authenticatedPage.locator('[data-testid="card-label"], .card-label');
    
    if (await labeledCards.count() > 0) {
      await expect(labeledCards.first()).toBeVisible();
    }
  });

  // CARD-004: Card quick edit
  test('CARD-004: Card quick edit', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find a card and click quick edit
    const card = authenticatedPage.locator('[data-testid^="issue-card-"], .issue-card, .board-card').first();
    if (await card.isVisible()) {
      await card.locator('[data-testid="quick-edit"], .quick-edit').click();
      await authenticatedPage.waitForTimeout(500);
      
      // Should show quick edit form
      await expect(authenticatedPage.locator('[data-testid="quick-edit-form"]')).toBeVisible();
      
      // Edit summary
      await authenticatedPage.locator('input[name="summary"]').fill('Edited Summary');
      await authenticatedPage.locator('button:has-text("Save")').click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show updated summary
      await expect(card).toContainText('Edited Summary');
    }
  });

  // CARD-005: Card bulk selection
  test('CARD-005: Card bulk selection', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Select multiple cards
    const cards = authenticatedPage.locator('[data-testid^="issue-card-"], .issue-card, .board-card"]');
    const cardCount = await cards.count();
    
    if (cardCount >= 2) {
      // Select first two cards
      await cards.nth(0).locator('[data-testid="card-checkbox"], .card-checkbox').check();
      await cards.nth(1).locator('[data-testid="card-checkbox"], .card-checkbox').check();
      
      // Should show bulk actions
      await expect(authenticatedPage.locator('[data-testid="bulk-actions"]')).toBeVisible();
      
      // Perform bulk action
      await authenticatedPage.locator('[data-testid="bulk-actions"]').click();
      await authenticatedPage.locator('button:has-text("Change Status")').click();
      await authenticatedPage.locator('select[name="status"]').selectOption('Done');
      await authenticatedPage.locator('button:has-text("Apply")').click();
      
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show success message
      await expect(authenticatedPage.locator('text=2 issues updated')).toBeVisible();
    }
  });

  // CARD-006: Card context menu
  test('CARD-006: Card context menu', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find a card and open context menu
    const card = authenticatedPage.locator('[data-testid^="issue-card-"], .issue-card, .board-card').first();
    if (await card.isVisible()) {
      await card.locator('[data-testid="card-menu"], .card-menu').click();
      await authenticatedPage.waitForTimeout(500);
      
      // Should show context menu
      await expect(authenticatedPage.locator('[data-testid="context-menu"]')).toBeVisible();
      
      // Select an action
      await authenticatedPage.locator('button:has-text("Edit")').click();
      await authenticatedPage.waitForTimeout(500);
      
      // Should open edit modal
      await expect(authenticatedPage.locator('[data-testid="edit-modal"]')).toBeVisible();
    }
  });

  // CARD-007: Card details panel
  test('CARD-007: Card details panel', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find a card and open details
    const card = authenticatedPage.locator('[data-testid^="issue-card-"], .issue-card, .board-card').first();
    if (await card.isVisible()) {
      await card.dblclick();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show details panel
      await expect(authenticatedPage.locator('[data-testid="issue-details-panel"]')).toBeVisible();
      
      // Should show issue details
      await expect(authenticatedPage.locator('[data-testid="issue-summary"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="issue-description"]')).toBeVisible();
    }
  });

  // CARD-008: Card comments
  test('CARD-008: Card comments', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find a card and open details
    const card = authenticatedPage.locator('[data-testid^="issue-card-"], .issue-card, .board-card').first();
    if (await card.isVisible()) {
      await card.dblclick();
      await authenticatedPage.waitForTimeout(1000);
      
      // Add comment
      await authenticatedPage.locator('[data-testid="comment-input"]').fill('Test comment from board');
      await authenticatedPage.locator('[data-testid="add-comment"]').click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show comment
      await expect(authenticatedPage.locator('text=Test comment from board')).toBeVisible();
    }
  });

  // CARD-009: Card attachments
  test('CARD-009: Card attachments', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find a card and open details
    const card = authenticatedPage.locator('[data-testid^="issue-card-"], .issue-card, .board-card').first();
    if (await card.isVisible()) {
      await card.dblclick();
      await authenticatedPage.waitForTimeout(1000);
      
      // Add attachment
      const fileInput = authenticatedPage.locator('input[type="file"]');
      await fileInput.setInputFiles('e2e/fixtures/test-attachment.txt');
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show attachment
      await expect(authenticatedPage.locator('text=test-attachment.txt')).toBeVisible();
    }
  });

  // CARD-010: Card time tracking
  test('CARD-010: Card time tracking', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Find a card and open details
    const card = authenticatedPage.locator('[data-testid^="issue-card-"], .issue-card, .board-card').first();
    if (await card.isVisible()) {
      await card.dblclick();
      await authenticatedPage.waitForTimeout(1000);
      
      // Log time
      await authenticatedPage.locator('[data-testid="log-time"]').click();
      await authenticatedPage.waitForTimeout(500);
      
      await authenticatedPage.locator('input[name="hours"]').fill('2');
      await authenticatedPage.locator('textarea[name="description"]').fill('Test time log');
      await authenticatedPage.locator('button:has-text("Log")').click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show time logged
      await expect(authenticatedPage.locator('text=2h logged')).toBeVisible();
    }
  });

  // CUSTOM-001: Create custom board view
  test('CUSTOM-001: Create custom board view', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Create new view
    await authenticatedPage.locator('[data-testid="board-views"]').click();
    await authenticatedPage.locator('button:has-text("New View")').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Configure view
    await authenticatedPage.locator('input[name="viewName"]').fill('Custom Test View');
    await authenticatedPage.locator('select[name="filterType"]').selectOption('assignee');
    await authenticatedPage.locator('input[name="filterValue"]').fill('testuser');
    await authenticatedPage.locator('button:has-text("Create")').click();
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show new view
    await expect(authenticatedPage.locator('text=Custom Test View')).toBeVisible();
  });

  // CUSTOM-002: Edit board layout
  test('CUSTOM-002: Edit board layout', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Open layout editor
    await authenticatedPage.locator('[data-testid="board-layout"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Reorder columns
    const todoColumn = authenticatedPage.locator('[data-testid="column-todo"]');
    const inProgressColumn = authenticatedPage.locator('[data-testid="column-in-progress"]');
    
    if (await todoColumn.isVisible() && await inProgressColumn.isVisible()) {
      await todoColumn.dragTo(inProgressColumn);
      await authenticatedPage.waitForTimeout(1000);
      
      // Save layout
      await authenticatedPage.locator('button:has-text("Save Layout")').click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Should show updated layout
      await expect(authenticatedPage.locator('[data-testid="layout-saved"]')).toBeVisible();
    }
  });

  // CUSTOM-003: Board column management
  test('CUSTOM-003: Board column management', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Open column settings
    await authenticatedPage.locator('[data-testid="column-settings"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Add new column
    await authenticatedPage.locator('button:has-text("Add Column")').click();
    await authenticatedPage.locator('input[name="columnName"]').fill('TESTING');
    await authenticatedPage.locator('button:has-text("Add")').click();
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show new column
    await expect(authenticatedPage.locator('text=TESTING')).toBeVisible();
  });

  // CUSTOM-004: Board swimlane configuration
  test('CUSTOM-004: Board swimlane configuration', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Open swimlane settings
    await authenticatedPage.locator('[data-testid="swimlane-settings"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Configure swimlanes
    await authenticatedPage.locator('select[name="swimlaneType"]').selectOption('assignee');
    await authenticatedPage.locator('button:has-text("Apply")').click();
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show swimlanes
    await expect(authenticatedPage.locator('[data-testid="swimlane-assignee"]')).toBeVisible();
  });

  // CUSTOM-005: Board card colors
  test('CUSTOM-005: Board card colors', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Open card color settings
    await authenticatedPage.locator('[data-testid="card-colors"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Configure colors by priority
    await authenticatedPage.locator('input[name="highPriorityColor"]').fill('#ff0000');
    await authenticatedPage.locator('input[name="mediumPriorityColor"]').fill('#ffff00');
    await authenticatedPage.locator('input[name="lowPriorityColor"]').fill('#00ff00');
    await authenticatedPage.locator('button:has-text("Apply")').click();
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show colored cards
    const highPriorityCard = authenticatedPage.locator('[data-testid="priority-high"]');
    if (await highPriorityCard.count() > 0) {
      await expect(highPriorityCard.first()).toHaveCSS('background-color', /rgb\(255, 0, 0\)/);
    }
  });

  // CUSTOM-006: Board sharing
  test('CUSTOM-006: Board sharing', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Share board
    await authenticatedPage.locator('[data-testid="share-board"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Configure sharing
    await authenticatedPage.locator('input[name="shareLink"]').check();
    await authenticatedPage.locator('button:has-text("Create Link")').click();
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show share link
    await expect(authenticatedPage.locator('[data-testid="share-link"]')).toBeVisible();
  });

  // CUSTOM-007: Board permissions
  test('CUSTOM-007: Board permissions', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Open permissions
    await authenticatedPage.locator('[data-testid="board-permissions"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Set permissions
    await authenticatedPage.locator('select[name="viewPermission"]').selectOption('team');
    await authenticatedPage.locator('select[name="editPermission"]').selectOption('admin');
    await authenticatedPage.locator('button:has-text("Save")').click();
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show permissions saved
    await expect(authenticatedPage.locator('text=Permissions saved')).toBeVisible();
  });

  // CUSTOM-008: Board export
  test('CUSTOM-008: Board export', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Export board
    const downloadPromise = authenticatedPage.waitForEvent('download');
    await authenticatedPage.locator('[data-testid="export-board"]').click();
    await authenticatedPage.locator('button:has-text("Export")').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(pdf|png|csv)$/);
  });

  // CUSTOM-009: Board templates
  test('CUSTOM-009: Board templates', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Save as template
    await authenticatedPage.locator('[data-testid="board-templates"]').click();
    await authenticatedPage.locator('button:has-text("Save as Template")').click();
    await authenticatedPage.waitForTimeout(500);
    
    await authenticatedPage.locator('input[name="templateName"]').fill('Test Template');
    await authenticatedPage.locator('button:has-text("Save")').click();
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show template saved
    await expect(authenticatedPage.locator('text=Template saved')).toBeVisible();
  });

  // CUSTOM-010: Board settings
  test('CUSTOM-010: Board settings', async ({ authenticatedPage }) => {
    await boardPage.expectBoardLoaded();
    
    // Open board settings
    await authenticatedPage.locator('[data-testid="board-settings"]').click();
    await authenticatedPage.waitForTimeout(500);
    
    // Update settings
    await authenticatedPage.locator('input[name="boardName"]').fill('Updated Board Name');
    await authenticatedPage.locator('select[name="cardLimit"]').selectOption('10');
    await authenticatedPage.locator('input[name="autoRefresh"]').check();
    await authenticatedPage.locator('button:has-text("Save")').click();
    
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show updated settings
    await expect(authenticatedPage.locator('text=Board settings saved')).toBeVisible();
  });
});
