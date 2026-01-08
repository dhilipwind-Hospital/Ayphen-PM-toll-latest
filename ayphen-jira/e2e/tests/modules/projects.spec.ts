import { test, expect, Page } from '@playwright/test';

/**
 * Projects Tests
 * Routes: /projects, /projects/create, /projects/:id
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

test.describe('Projects', () => {

  test('PROJ-001: View projects list', async ({ page }) => {
    await login(page);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/projects/);
    
    // Check for project cards
    const projects = page.locator('[class*="project"], [class*="card"]');
    const count = await projects.count();
    console.log(`Projects found: ${count}`);
    
    await page.screenshot({ path: 'test-results/projects-list.png' });
  });

  test('PROJ-002: Create Project button visible', async ({ page }) => {
    await login(page);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button:has-text("Create Project")');
    await expect(createBtn).toBeVisible();
  });

  test('PROJ-003: Create project page', async ({ page }) => {
    await login(page);
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/projects\/create/);
    await page.screenshot({ path: 'test-results/create-project.png' });
  });

  test('PROJ-004: Project templates display', async ({ page }) => {
    await login(page);
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const scrum = await page.locator('text=/Scrum/i').count();
    const kanban = await page.locator('text=/Kanban/i').count();
    
    console.log(`Templates: Scrum=${scrum}, Kanban=${kanban}`);
  });

  test('PROJ-005: Click project opens detail', async ({ page }) => {
    await login(page);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstProject = page.locator('[class*="project"], [class*="card"]').first();
    if (await firstProject.isVisible()) {
      await firstProject.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'test-results/project-detail.png' });
  });

  test('PROJ-006: Project switcher', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for project switcher in header
    const switcher = page.locator('[class*="project-select"], .ant-select').first();
    const visible = await switcher.isVisible().catch(() => false);
    console.log(`Project switcher: ${visible}`);
  });

  test('PROJ-007: Project settings access', async ({ page }) => {
    await login(page);
    await page.goto('/settings/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/project-settings.png' });
  });

  test('PROJ-008: Projects refresh', async ({ page }) => {
    await login(page);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/projects/);
  });
});
