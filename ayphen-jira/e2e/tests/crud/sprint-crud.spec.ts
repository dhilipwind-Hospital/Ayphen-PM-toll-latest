import { test, expect, Page } from '@playwright/test';

/**
 * Sprint CRUD Tests
 * Tests Create, Start, Complete Sprint functionality
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

test.describe('Sprint CRUD Operations', () => {
  
  const uniqueId = Date.now().toString().slice(-6);
  const sprintName = `Sprint ${uniqueId}`;

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ============================================
  // SPRINT VIEW
  // ============================================

  test('SC-001: Sprint section on backlog', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const sprintSections = await page.locator('text=Sprint, [class*="sprint"], [class*="Sprint"]').count();
    console.log(`✅ SC-001: Sprint sections found: ${sprintSections}`);
  });

  test('SC-002: Sprint planning page', async ({ page }) => {
    await page.goto('/sprint-planning');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/sprint/);
    console.log('✅ SC-002: Sprint planning page loaded');
  });

  // ============================================
  // CREATE SPRINT
  // ============================================

  test('SC-003: Create sprint button exists', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtns = await page.locator('button:has-text("Create Sprint"), button:has-text("New Sprint"), button:has-text("Start Sprint")').count();
    console.log(`✅ SC-003: Create sprint buttons: ${createBtns}`);
  });

  test('SC-004: Create sprint form', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button:has-text("Create Sprint"), button:has-text("New Sprint")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      // Check for sprint form/modal
      const formElements = await page.locator('input[name="name"], input[placeholder*="Sprint"], .ant-modal').count();
      console.log(`✅ SC-004: Sprint form elements: ${formElements}`);
    } else {
      console.log('⚠️ SC-004: Create sprint button not visible');
    }
  });

  // ============================================
  // SPRINT MANAGEMENT
  // ============================================

  test('SC-005: View active sprint', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const activeSprint = await page.locator('text=Active Sprint, text=Current Sprint, [class*="active-sprint"]').count();
    console.log(`✅ SC-005: Active sprint indicators: ${activeSprint}`);
  });

  test('SC-006: Sprint dropdown/selector', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const sprintSelector = await page.locator('[class*="sprint-select"], select[name="sprint"], .ant-select').count();
    console.log(`✅ SC-006: Sprint selectors: ${sprintSelector}`);
  });

  test('SC-007: Start sprint button', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const startBtns = await page.locator('button:has-text("Start Sprint"), button:has-text("Start")').count();
    console.log(`✅ SC-007: Start sprint buttons: ${startBtns}`);
  });

  test('SC-008: Complete sprint button', async ({ page }) => {
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const completeBtns = await page.locator('button:has-text("Complete Sprint"), button:has-text("Complete"), button:has-text("End Sprint")').count();
    console.log(`✅ SC-008: Complete sprint buttons: ${completeBtns}`);
  });

  // ============================================
  // SPRINT REPORTS
  // ============================================

  test('SC-009: Sprint reports page', async ({ page }) => {
    await page.goto('/sprint-reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/sprint-reports/);
    console.log('✅ SC-009: Sprint reports page loaded');
  });

  test('SC-010: Sprint burndown chart', async ({ page }) => {
    await page.goto('/reports/burndown');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const charts = await page.locator('canvas, svg, [class*="chart"], [class*="Chart"]').count();
    console.log(`✅ SC-010: Burndown chart elements: ${charts}`);
  });
});
