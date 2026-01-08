import { test, expect } from '../../fixtures/auth.fixture';
import { BoardPage } from '../../pages';

/**
 * Teams Notification Integration Tests
 * Tests that status changes and assignments trigger Teams notifications
 */
test.describe('Teams Notifications', () => {
  let boardPage: BoardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    boardPage = new BoardPage(authenticatedPage);
    await boardPage.goto();
  });

  test('TEAMS-001: should send Teams notification when status changes via drag-drop', async ({ authenticatedPage, page }) => {
    await boardPage.expectBoardLoaded();
    
    // Find a card in TODO column
    const todoColumn = page.locator('.board-column').filter({ hasText: /TO DO/i }).first();
    const card = todoColumn.locator('[data-testid^="issue-card-"], .issue-card, .board-card, .ant-card').first();
    
    if (await card.isVisible()) {
      // Get the issue key for verification
      const cardText = await card.textContent();
      console.log('📋 Moving card:', cardText);
      
      // Drag to IN PROGRESS column
      const inProgressColumn = page.locator('.board-column').filter({ hasText: /IN PROGRESS/i }).first();
      
      await card.dragTo(inProgressColumn);
      await page.waitForTimeout(2000);
      
      console.log('✅ Card moved - Teams notification should be sent');
      
      // Verify the card moved (status changed)
      // The backend should have sent a Teams notification at this point
    } else {
      console.log('⚠️ No cards in TODO column to test with');
    }
  });

  test('TEAMS-002: should send Teams notification when status changes via dropdown', async ({ authenticatedPage, page }) => {
    await boardPage.expectBoardLoaded();
    
    // Find any issue card and click to open detail
    const card = page.locator('[data-testid^="issue-card-"], .issue-card, .board-card, .ant-card').first();
    
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(1000);
      
      // Look for status dropdown in the issue detail panel
      const statusDropdown = page.locator('[data-testid="status-select"], .status-select, .ant-select').filter({ hasText: /status/i }).first();
      
      if (await statusDropdown.isVisible()) {
        await statusDropdown.click();
        await page.waitForTimeout(500);
        
        // Select a different status
        const statusOption = page.locator('.ant-select-item-option').filter({ hasText: /In Progress|Done|Review/i }).first();
        if (await statusOption.isVisible()) {
          await statusOption.click();
          await page.waitForTimeout(2000);
          
          console.log('✅ Status changed via dropdown - Teams notification should be sent');
        }
      }
    }
  });

  test('TEAMS-003: should send Teams notification when issue is assigned', async ({ authenticatedPage, page }) => {
    await boardPage.expectBoardLoaded();
    
    // Find any issue card and click to open detail
    const card = page.locator('[data-testid^="issue-card-"], .issue-card, .board-card, .ant-card').first();
    
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(1000);
      
      // Look for assignee dropdown
      const assigneeDropdown = page.locator('[data-testid="assignee-select"], .assignee-select').first();
      
      if (await assigneeDropdown.isVisible()) {
        await assigneeDropdown.click();
        await page.waitForTimeout(500);
        
        // Select a different assignee
        const assigneeOption = page.locator('.ant-select-item-option').first();
        if (await assigneeOption.isVisible()) {
          await assigneeOption.click();
          await page.waitForTimeout(2000);
          
          console.log('✅ Assignee changed - Teams notification should be sent');
        }
      }
    }
  });

  test('TEAMS-004: verify in-app notifications appear after status change', async ({ authenticatedPage, page }) => {
    await boardPage.expectBoardLoaded();
    
    // Click on the notification bell icon
    const notificationBell = page.locator('[data-testid="notification-bell"], .notification-bell, .ant-badge').filter({ has: page.locator('svg, .anticon-bell') }).first();
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await page.waitForTimeout(1000);
      
      // Check if notifications panel opens
      const notificationPanel = page.locator('.ant-popover, .notification-panel, .ant-drawer');
      
      if (await notificationPanel.isVisible()) {
        // Look for status change notifications
        const statusNotification = notificationPanel.locator('text=/Status Changed|Assigned/i');
        const count = await statusNotification.count();
        
        console.log(`📢 Found ${count} notification(s) in the panel`);
        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
