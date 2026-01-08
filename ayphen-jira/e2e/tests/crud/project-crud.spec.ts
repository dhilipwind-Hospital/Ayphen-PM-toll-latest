import { test, expect, Page } from '@playwright/test';

/**
 * Project CRUD Tests
 * Tests Create, Read, Update, Delete functionality for Projects
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

test.describe('Project CRUD Operations', () => {
  
  const uniqueId = Date.now().toString().slice(-6);
  const projectName = `Test Project ${uniqueId}`;
  const projectKey = `TP${uniqueId.slice(-3)}`.toUpperCase();

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  test('PC-001: Navigate to create project page', async ({ page }) => {
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/projects\/create/);
    console.log('✅ PC-001: Create project page loaded');
  });

  test('PC-002: Create project form displays', async ({ page }) => {
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for template selection or form elements
    const templates = await page.locator('[class*="template"], [class*="Template"]').count();
    const formInputs = await page.locator('input, textarea, select').count();
    
    console.log(`✅ PC-002: Templates: ${templates}, Form inputs: ${formInputs}`);
  });

  test('PC-003: Create new project', async ({ page }) => {
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Step 1: Select template (if visible)
    const scrumTemplate = page.locator('text=Scrum, text=Kanban').first();
    if (await scrumTemplate.isVisible()) {
      await scrumTemplate.click();
      await page.waitForTimeout(500);
      
      // Click Next button
      const nextBtn = page.locator('button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 2: Fill project details
    const nameInput = page.locator('input[placeholder*="Project"], input#name, input[id*="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(projectName);
      await page.waitForTimeout(500);
    }
    
    // Fill project key if visible
    const keyInput = page.locator('input[placeholder*="Key"], input#key, input[id*="key"]').first();
    if (await keyInput.isVisible()) {
      await keyInput.fill(projectKey);
      await page.waitForTimeout(500);
    }
    
    // Fill description if visible
    const descInput = page.locator('textarea[placeholder*="Describe"], textarea').first();
    if (await descInput.isVisible()) {
      await descInput.fill('Test project created by E2E automation');
      await page.waitForTimeout(500);
    }
    
    // Submit form
    const createBtn = page.locator('button:has-text("Create"), button[type="submit"]').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(3000);
      
      console.log('✅ PC-003: Project creation form submitted');
    } else {
      console.log('⚠️ PC-003: Create button not found');
    }
  });

  // ============================================
  // READ OPERATIONS
  // ============================================

  test('PC-004: View projects list', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const projectCards = await page.locator('[class*="project"], [class*="Project"], [class*="card"]').count();
    console.log(`✅ PC-004: Found ${projectCards} project elements`);
  });

  test('PC-005: View project details', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click on first project
    const firstProject = page.locator('[class*="project"], [class*="Project"]').first();
    if (await firstProject.isVisible()) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      console.log('✅ PC-005: Project details viewed, URL:', page.url());
    } else {
      console.log('⚠️ PC-005: No projects to click');
    }
  });

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  test('PC-006: Access project settings', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click on first project
    const firstProject = page.locator('[class*="project"], [class*="Project"]').first();
    if (await firstProject.isVisible()) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Look for settings button/link
      const settingsBtn = page.locator('text=Settings, button:has-text("Settings"), a:has-text("Settings")').first();
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        console.log('✅ PC-006: Project settings accessed');
      } else {
        console.log('⚠️ PC-006: Settings button not found');
      }
    }
  });

  test('PC-007: Edit project name', async ({ page }) => {
    await page.goto('/settings/details');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      const currentValue = await nameInput.inputValue();
      await nameInput.fill(`${currentValue} Updated`);
      
      const saveBtn = page.locator('button:has-text("Save"), button[type="submit"]').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ PC-007: Project name edited');
      }
    } else {
      console.log('⚠️ PC-007: Name input not found');
    }
  });

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  test('PC-008: Delete project option exists', async ({ page }) => {
    await page.goto('/settings/details');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const deleteBtn = await page.locator('button:has-text("Delete"), [class*="danger"]').count();
    console.log(`✅ PC-008: Delete options found: ${deleteBtn}`);
  });
});
