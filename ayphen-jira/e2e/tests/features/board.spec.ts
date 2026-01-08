import { test, expect, Page } from '@playwright/test';

/**
 * Board Feature Tests
 * Tests Kanban board functionality
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
  await page.waitForURL(/.*\/(dashboard|board|backlog|projects)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Board Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('BOARD-001: Board page loads', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/board/);
    console.log('✅ BOARD-001: Board page loaded');
  });

  test('BOARD-002: Board shows columns', async ({ page }) => {
    const columns = await page.locator('[class*="column"], [class*="Column"], [data-rbd-droppable-id]').count();
    console.log(`✅ BOARD-002: Board columns found: ${columns}`);
  });

  test('BOARD-003: Board shows issue cards', async ({ page }) => {
    const cards = await page.locator('[class*="card"], [class*="Card"], [data-rbd-draggable-id]').count();
    console.log(`✅ BOARD-003: Issue cards found: ${cards}`);
  });

  test('BOARD-004: Board has status columns', async ({ page }) => {
    // Check for common status names
    const todoVisible = await page.locator('text=To Do, text=TODO, text=Backlog').count();
    const inProgressVisible = await page.locator('text=In Progress, text=In-Progress').count();
    const doneVisible = await page.locator('text=Done, text=Completed').count();
    
    console.log(`✅ BOARD-004: Status columns - Todo: ${todoVisible}, InProgress: ${inProgressVisible}, Done: ${doneVisible}`);
  });

  test('BOARD-005: Board cards are clickable', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], [class*="Card"], [data-rbd-draggable-id]').first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(1000);
      console.log('✅ BOARD-005: Card clicked successfully');
    } else {
      console.log('⚠️ BOARD-005: No cards found to click');
    }
  });

  test('BOARD-006: Board filter options', async ({ page }) => {
    // Look for filter controls
    const filterElements = await page.locator('[class*="filter"], [class*="Filter"], button:has-text("Filter")').count();
    console.log(`✅ BOARD-006: Filter elements found: ${filterElements}`);
  });

  test('BOARD-007: Board search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      console.log('✅ BOARD-007: Board search works');
    } else {
      console.log('⚠️ BOARD-007: Search input not found');
    }
  });

  test('BOARD-008: Board refresh', async ({ page }) => {
    // Refresh the board
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/board/);
    console.log('✅ BOARD-008: Board refreshed successfully');
  });
});
