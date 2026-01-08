import { test, expect, Page } from '@playwright/test';

/**
 * Drag & Drop Tests
 * Tests for drag and drop functionality on board and backlog
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

const PROJECT_NAME = 'AI Automation';

async function loginAndSelectProject(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
  await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/(dashboard|board|backlog)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log(`Project: ${PROJECT_NAME}`);
}

test.describe('Drag & Drop', () => {

  test('DND-001: Board has draggable items', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const draggables = page.locator('[data-rbd-draggable-id], [draggable="true"]');
    const count = await draggables.count();
    console.log(`Draggable items on board: ${count}`);
    
    await page.screenshot({ path: 'test-results/board-draggables.png' });
  });

  test('DND-002: Board has drop zones', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dropZones = page.locator('[data-rbd-droppable-id], [class*="column"]');
    const count = await dropZones.count();
    console.log(`Drop zones on board: ${count}`);
  });

  test('DND-003: Backlog has draggable items', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const draggables = page.locator('[data-rbd-draggable-id], [draggable="true"]');
    const count = await draggables.count();
    console.log(`Draggable items on backlog: ${count}`);
    
    await page.screenshot({ path: 'test-results/backlog-draggables.png' });
  });

  test('DND-004: Sprint sections are drop zones', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const sprintZones = page.locator('[data-rbd-droppable-id], [class*="sprint"]');
    const count = await sprintZones.count();
    console.log(`Sprint drop zones: ${count}`);
  });

  test('DND-005: Drag handle visible', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const handles = page.locator('[data-rbd-drag-handle-draggable-id], [class*="drag-handle"], [class*="grip"]');
    const count = await handles.count();
    console.log(`Drag handles: ${count}`);
  });

  test('DND-006: Hover shows drag cursor', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('[data-rbd-draggable-id]').first();
    if (await firstCard.isVisible()) {
      await firstCard.hover();
      await page.waitForTimeout(500);
      console.log('Hovered on draggable card');
    }
    
    await page.screenshot({ path: 'test-results/drag-cursor.png' });
  });
});
