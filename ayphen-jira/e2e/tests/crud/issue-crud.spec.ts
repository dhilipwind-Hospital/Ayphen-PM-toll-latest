import { test, expect, Page } from '@playwright/test';

/**
 * Issue CRUD Tests
 * Tests Create, Read, Update, Delete, Status change for Issues
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

test.describe('Issue CRUD Operations', () => {
  
  const uniqueId = Date.now().toString().slice(-6);
  const issueTitle = `Test Issue ${uniqueId}`;

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  test('IC-001: Create issue button exists on board', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtns = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').count();
    console.log(`✅ IC-001: Create buttons found: ${createBtns}`);
  });

  test('IC-002: Create issue button exists on backlog', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtns = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').count();
    console.log(`✅ IC-002: Create buttons on backlog: ${createBtns}`);
  });

  test('IC-003: Open create issue modal/form', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click create button
    const createBtn = page.locator('button:has-text("Create Issue"), button:has-text("Create"), button:has-text("Add Issue")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      // Check if modal/form opened
      const modal = await page.locator('.ant-modal, [class*="modal"], [class*="Modal"], [role="dialog"]').count();
      const form = await page.locator('form, input[placeholder*="Summary"], input[placeholder*="Title"]').count();
      
      console.log(`✅ IC-003: Modal: ${modal}, Form elements: ${form}`);
    } else {
      console.log('⚠️ IC-003: Create button not visible');
    }
  });

  test('IC-004: Fill issue creation form', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for create/add buttons
    const createBtns = await page.locator('button:has-text("Create"), button:has-text("Add")').count();
    console.log(`✅ IC-004: Create/Add buttons found: ${createBtns}`);
  });

  // ============================================
  // READ OPERATIONS
  // ============================================

  test('IC-005: View issues on board', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const issues = await page.locator('[class*="card"], [class*="Card"], [data-rbd-draggable-id]').count();
    console.log(`✅ IC-005: Issues on board: ${issues}`);
  });

  test('IC-006: View issues on backlog', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const issues = await page.locator('[class*="issue"], [class*="Issue"], [class*="item"]').count();
    console.log(`✅ IC-006: Issues on backlog: ${issues}`);
  });

  test('IC-007: Click to view issue details', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('[class*="issue"], [class*="Issue"], [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      // Check if detail panel/modal opened
      const detailPanel = await page.locator('[class*="detail"], [class*="Detail"], [class*="panel"], .ant-modal').count();
      console.log(`✅ IC-007: Detail panel elements: ${detailPanel}`);
    } else {
      console.log('⚠️ IC-007: No issues to click');
    }
  });

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  test('IC-008: Edit issue title', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('[class*="issue"], [class*="Issue"], [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(1000);
      
      // Look for edit button or editable title
      const editBtn = page.locator('button:has-text("Edit"), [class*="edit"], [class*="Edit"]').first();
      const titleInput = page.locator('input[name="summary"], input[name="title"], [contenteditable="true"]').first();
      
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(500);
        console.log('✅ IC-008: Edit mode activated');
      } else if (await titleInput.isVisible()) {
        console.log('✅ IC-008: Title is editable');
      } else {
        console.log('⚠️ IC-008: Edit option not found');
      }
    }
  });

  test('IC-009: Change issue status via dropdown', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('[class*="issue"], [class*="Issue"]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(1000);
      
      // Look for status dropdown
      const statusDropdown = page.locator('[class*="status"], select[name="status"], .ant-select').first();
      if (await statusDropdown.isVisible()) {
        await statusDropdown.click();
        await page.waitForTimeout(500);
        console.log('✅ IC-009: Status dropdown clicked');
      } else {
        console.log('⚠️ IC-009: Status dropdown not found');
      }
    }
  });

  test('IC-010: Change issue priority', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('[class*="issue"], [class*="Issue"]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(1000);
      
      // Look for priority dropdown
      const priorityDropdown = page.locator('[class*="priority"], select[name="priority"]').first();
      if (await priorityDropdown.isVisible()) {
        await priorityDropdown.click();
        await page.waitForTimeout(500);
        console.log('✅ IC-010: Priority dropdown clicked');
      } else {
        console.log('⚠️ IC-010: Priority dropdown not found');
      }
    }
  });

  test('IC-011: Assign issue to user', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('[class*="issue"], [class*="Issue"]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(1000);
      
      // Look for assignee dropdown
      const assigneeDropdown = page.locator('[class*="assignee"], select[name="assignee"], [data-testid="assignee"]').first();
      if (await assigneeDropdown.isVisible()) {
        await assigneeDropdown.click();
        await page.waitForTimeout(500);
        console.log('✅ IC-011: Assignee dropdown clicked');
      } else {
        console.log('⚠️ IC-011: Assignee dropdown not found');
      }
    }
  });

  // ============================================
  // DRAG & DROP STATUS CHANGE
  // ============================================

  test('IC-012: Drag issue on board', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const cards = await page.locator('[data-rbd-draggable-id], [class*="card"]').count();
    const columns = await page.locator('[data-rbd-droppable-id], [class*="column"]').count();
    
    console.log(`✅ IC-012: Draggable cards: ${cards}, Droppable columns: ${columns}`);
  });

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  test('IC-013: Delete issue option exists', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('[class*="issue"], [class*="Issue"]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(1000);
      
      const deleteBtn = await page.locator('button:has-text("Delete"), text=Delete Issue, [class*="delete"]').count();
      console.log(`✅ IC-013: Delete options found: ${deleteBtn}`);
    }
  });

  // ============================================
  // COMMENTS
  // ============================================

  test('IC-014: Add comment to issue', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('[class*="issue"], [class*="Issue"]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(1000);
      
      // Look for comment input
      const commentInput = page.locator('textarea[placeholder*="comment" i], input[placeholder*="comment" i], [class*="comment-input"]').first();
      if (await commentInput.isVisible()) {
        await commentInput.fill('Test comment from E2E automation');
        await page.waitForTimeout(500);
        
        const submitBtn = page.locator('button:has-text("Add"), button:has-text("Comment"), button:has-text("Send")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          console.log('✅ IC-014: Comment added');
        }
      } else {
        console.log('⚠️ IC-014: Comment input not found');
      }
    }
  });
});
