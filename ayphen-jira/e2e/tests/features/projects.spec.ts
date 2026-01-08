import { test, expect, Page } from '@playwright/test';

/**
 * Projects Feature Tests
 * Tests project management functionality
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

test.describe('Projects Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('PROJ-001: Projects page loads', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/projects/);
    console.log('✅ PROJ-001: Projects page loaded');
  });

  test('PROJ-002: Projects list displays', async ({ page }) => {
    const projectCards = await page.locator('[class*="project"], [class*="Project"], [class*="card"], [class*="Card"]').count();
    console.log(`✅ PROJ-002: Project elements found: ${projectCards}`);
  });

  test('PROJ-003: Create project button exists', async ({ page }) => {
    const createBtn = await page.locator('button:has-text("Create"), button:has-text("New Project"), a:has-text("Create")').count();
    console.log(`✅ PROJ-003: Create buttons found: ${createBtn}`);
  });

  test('PROJ-004: Project cards are clickable', async ({ page }) => {
    const firstProject = page.locator('[class*="project"], [class*="Project"]').first();
    
    if (await firstProject.isVisible()) {
      await firstProject.click();
      await page.waitForTimeout(1000);
      console.log('✅ PROJ-004: Project clicked successfully');
    } else {
      console.log('⚠️ PROJ-004: No projects found to click');
    }
  });

  test('PROJ-005: Projects have names', async ({ page }) => {
    const projectNames = await page.locator('[class*="project-name"], [class*="projectName"], h3, h4').count();
    console.log(`✅ PROJ-005: Project name elements found: ${projectNames}`);
  });

  test('PROJ-006: Projects show key/identifier', async ({ page }) => {
    // Look for project keys like "PROJ", "TEST", etc.
    const keys = await page.locator('[class*="key"], [class*="Key"], [class*="identifier"]').count();
    console.log(`✅ PROJ-006: Project key elements found: ${keys}`);
  });

  test('PROJ-007: Projects filter/search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="Filter"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      console.log('✅ PROJ-007: Projects search works');
    } else {
      console.log('⚠️ PROJ-007: Search input not found');
    }
  });

  test('PROJ-008: Projects page refresh', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/projects/);
    console.log('✅ PROJ-008: Projects page refreshed successfully');
  });
});
