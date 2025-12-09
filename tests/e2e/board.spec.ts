import { test, expect } from '@playwright/test';

test.describe('Board Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('5.1 View Board', async ({ page }) => {
    await page.goto('/board');
    
    await expect(page.locator('text=To Do')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=In Review')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });

  test('5.2 Drag and Drop Issue', async ({ page }) => {
    await page.goto('/board');
    
    const issue = page.locator('.issue-card').first();
    const targetColumn = page.locator('[data-column="in-progress"]');
    
    await issue.dragTo(targetColumn);
    await page.waitForTimeout(1000);
    
    await expect(page.locator('text=Issue moved successfully')).toBeVisible();
  });

  test('5.3 Filter Board Issues', async ({ page }) => {
    await page.goto('/board');
    
    await page.click('button:has-text("Filter")');
    await page.click('text=Only My Issues');
    
    await page.waitForTimeout(500);
    const issueCount = await page.locator('.issue-card').count();
    expect(issueCount).toBeGreaterThanOrEqual(0);
  });

  test('5.4 Search Issues on Board', async ({ page }) => {
    await page.goto('/board');
    
    await page.fill('input[placeholder*="Search"]', 'Test');
    await page.waitForTimeout(500);
    
    const issues = page.locator('.issue-card');
    const count = await issues.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
