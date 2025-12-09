import { test, expect } from '@playwright/test';

test.describe('Issue Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('4.1 Create Issue from Board', async ({ page }) => {
    await page.goto('/board');
    await page.click('button:has-text("Create")');
    
    await page.selectOption('select[name="type"]', 'story');
    await page.fill('input[name="summary"]', 'Test Story Issue');
    await page.fill('textarea[name="description"]', 'This is a test story');
    await page.selectOption('select[name="priority"]', 'high');
    await page.fill('input[name="storyPoints"]', '5');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Test Story Issue')).toBeVisible({ timeout: 10000 });
  });

  test('4.2 View Issue Detail', async ({ page }) => {
    await page.goto('/board');
    await page.click('.issue-card').first();
    
    await expect(page.locator('.issue-detail')).toBeVisible();
    await expect(page.locator('text=Summary')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
  });

  test('4.3 Edit Issue', async ({ page }) => {
    await page.goto('/board');
    await page.click('.issue-card').first();
    await page.click('button:has-text("Edit")');
    
    await page.fill('input[name="summary"]', 'Updated Test Story');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Updated Test Story')).toBeVisible();
  });

  test('4.4 Add Comment to Issue', async ({ page }) => {
    await page.goto('/board');
    await page.click('.issue-card').first();
    
    await page.fill('textarea[placeholder*="comment"]', 'This is a test comment');
    await page.click('button:has-text("Add Comment")');
    
    await expect(page.locator('text=This is a test comment')).toBeVisible();
  });

  test('4.5 Delete Issue', async ({ page }) => {
    await page.goto('/board');
    const issueCard = page.locator('.issue-card').first();
    const issueText = await issueCard.textContent();
    
    await issueCard.click();
    await page.click('button[aria-label="More"]');
    await page.click('text=Delete');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator(`text=${issueText}`)).not.toBeVisible();
  });
});
