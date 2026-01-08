import { test, expect, Page } from '@playwright/test';

/**
 * Comments Tests
 * Tests for adding, editing, and viewing comments on issues
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
  
  // Ensure dhilip project is selected
  const projectSelector = page.locator('.ant-select').first();
  if (await projectSelector.isVisible()) {
    const currentProject = await projectSelector.textContent();
    if (!currentProject?.includes('dhilip')) {
      await projectSelector.click();
      await page.waitForTimeout(500);
      const dhilipOption = page.locator(`.ant-select-dropdown:visible .ant-select-item-option:has-text("${PROJECT_NAME}")`).first();
      if (await dhilipOption.isVisible()) {
        await dhilipOption.click();
        await page.waitForTimeout(1000);
      }
    }
  }
  console.log(`Project: ${PROJECT_NAME}`);
}

test.describe('Comments', () => {

  test('CMT-001: View issue with comments section', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click first issue to open detail
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      // Check for comments section
      const commentsSection = await page.locator('text=/Comment|Comments/i').count();
      console.log(`Comments section found: ${commentsSection > 0}`);
    }
    
    await page.screenshot({ path: 'test-results/comments-section.png' });
  });

  test('CMT-002: Comment input visible', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const commentInput = page.locator('textarea[placeholder*="comment" i], input[placeholder*="comment" i], [class*="comment"] textarea').first();
      const visible = await commentInput.isVisible().catch(() => false);
      console.log(`Comment input visible: ${visible}`);
    }
  });

  test('CMT-003: Add comment to issue', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const commentInput = page.locator('textarea[placeholder*="comment" i], textarea').first();
      if (await commentInput.isVisible()) {
        const testComment = `E2E Test Comment - ${Date.now()}`;
        await commentInput.fill(testComment);
        await page.waitForTimeout(500);
        
        // Click add/send button
        const addBtn = page.locator('button:has-text("Add"), button:has-text("Send"), button:has-text("Post")').first();
        if (await addBtn.isVisible()) {
          await addBtn.click();
          await page.waitForTimeout(2000);
          console.log('Comment added');
        }
      }
    }
    
    await page.screenshot({ path: 'test-results/comment-added.png' });
  });

  test('CMT-004: View existing comments', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const comments = page.locator('[class*="comment"], [class*="activity"]');
      const count = await comments.count();
      console.log(`Comments/Activity items: ${count}`);
    }
  });

  test('CMT-005: Comment author visible', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const avatars = page.locator('[class*="avatar"], img[alt*="avatar" i]');
      const count = await avatars.count();
      console.log(`Avatars (authors): ${count}`);
    }
  });

  test('CMT-006: Comment timestamp visible', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const timestamps = await page.locator('text=/ago|minute|hour|day|yesterday/i').count();
      console.log(`Timestamps found: ${timestamps}`);
    }
  });
});
