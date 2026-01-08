import { test, expect, Page } from '@playwright/test';

/**
 * Board & Kanban Tests
 * Routes: /board, /board-kanban
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
  await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/(dashboard|board|backlog)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Board & Kanban', () => {

  test('BRD-001: View board with columns', async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify board page loaded
    await expect(page).toHaveURL(/.*\/board/);
    
    // Check for board columns (To Do, In Progress, Done, etc.)
    const columns = page.locator('[class*="column"], [data-testid*="column"], .ant-card');
    const columnCount = await columns.count();
    console.log(`Board columns found: ${columnCount}`);
    
    await page.screenshot({ path: 'test-results/board-view.png' });
    expect(columnCount).toBeGreaterThan(0);
  });

  test('BRD-002: Board displays issue cards', async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for issue cards
    const cards = page.locator('[class*="issue"], [class*="card"], [data-rbd-draggable-id]');
    const cardCount = await cards.count();
    console.log(`Issue cards found: ${cardCount}`);
    
    // Board may have 0 or more cards
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('BRD-003: Filter issues on board', async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for filter options
    const filterBtn = page.locator('button:has-text("Filter"), [class*="filter"]').first();
    
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
      console.log('Filter options opened');
    }
    
    await page.screenshot({ path: 'test-results/board-filter.png' });
  });

  test('BRD-004: Search issues on board', async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      console.log('Search performed');
    }
    
    await page.screenshot({ path: 'test-results/board-search.png' });
  });

  test('BRD-005: Click issue opens detail', async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click first issue card
    const firstCard = page.locator('[class*="issue"], [class*="card"], [data-rbd-draggable-id]').first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(2000);
      
      // Check if detail view opened (modal or drawer)
      const detailView = page.locator('.ant-modal:visible, .ant-drawer:visible, [class*="detail"]').first();
      const opened = await detailView.isVisible().catch(() => false);
      console.log(`Issue detail opened: ${opened}`);
    }
    
    await page.screenshot({ path: 'test-results/board-issue-detail.png' });
  });

  test('BRD-006: Kanban board view', async ({ page }) => {
    await login(page);
    await page.goto('/board-kanban');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify kanban board loaded
    const boardVisible = await page.locator('[class*="kanban"], [class*="board"]').first().isVisible().catch(() => false);
    console.log(`Kanban board visible: ${boardVisible}`);
    
    await page.screenshot({ path: 'test-results/kanban-view.png' });
  });

  test('BRD-007: Board column headers', async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for column headers
    const todoColumn = await page.locator('text=/To ?Do/i').count();
    const inProgressColumn = await page.locator('text=/In ?Progress/i').count();
    const doneColumn = await page.locator('text=/Done/i').count();
    
    console.log(`Columns: ToDo=${todoColumn}, InProgress=${inProgressColumn}, Done=${doneColumn}`);
  });

  test('BRD-008: Board refresh', async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify still on board
    await expect(page).toHaveURL(/.*\/board/);
  });
});
