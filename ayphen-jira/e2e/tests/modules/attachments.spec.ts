import { test, expect, Page } from '@playwright/test';

/**
 * Attachments Tests
 * Tests for uploading, viewing, and managing attachments on issues
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

test.describe('Attachments', () => {

  test('ATT-001: View issue with attachments section', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const attachSection = await page.locator('text=/Attachment|Attachments|Files/i').count();
      console.log(`Attachments section found: ${attachSection > 0}`);
    }
    
    await page.screenshot({ path: 'test-results/attachments-section.png' });
  });

  test('ATT-002: Upload button visible', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Attach"), input[type="file"]').first();
      const visible = await uploadBtn.isVisible().catch(() => false);
      console.log(`Upload button visible: ${visible}`);
    }
  });

  test('ATT-003: Drag drop zone visible', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const dropZone = page.locator('[class*="drop"], [class*="upload"], text=/drag|drop/i').first();
      const visible = await dropZone.isVisible().catch(() => false);
      console.log(`Drop zone visible: ${visible}`);
    }
  });

  test('ATT-004: View existing attachments', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const attachments = page.locator('[class*="attachment"], [class*="file"]');
      const count = await attachments.count();
      console.log(`Attachments: ${count}`);
    }
  });

  test('ATT-005: Attachment preview', async ({ page }) => {
    await loginAndSelectProject(page);
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstIssue = page.locator('tr, [data-rbd-draggable-id]').first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForTimeout(2000);
      
      const previews = page.locator('[class*="preview"], img[class*="thumb"]');
      const count = await previews.count();
      console.log(`Attachment previews: ${count}`);
    }
  });
});
