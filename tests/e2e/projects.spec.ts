import { test, expect } from '@playwright/test';

test.describe('Project Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('3.1 Create New Project', async ({ page }) => {
    const timestamp = Date.now();
    const projectName = `Test Project ${timestamp}`;
    const projectKey = `TP${timestamp}`.substring(0, 10);

    await page.goto('/projects');
    await page.click('text=Create Project');
    await page.fill('input[name="name"]', projectName);
    await page.fill('input[name="key"]', projectKey);
    await page.selectOption('select[name="type"]', 'scrum');
    await page.fill('textarea[name="description"]', 'Test project description');
    await page.click('button[type="submit"]');
    
    await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
  });

  test('3.2 View Project List', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('.project-card')).toHaveCount.greaterThan(0);
  });

  test('3.3 Search Projects', async ({ page }) => {
    await page.goto('/projects');
    await page.fill('input[placeholder*="Search"]', 'Test');
    await expect(page.locator('.project-card')).toBeVisible();
  });
});
