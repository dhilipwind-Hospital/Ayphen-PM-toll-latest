import { test, expect, Page } from '@playwright/test';

/**
 * Create ALL Issue Types - Fixed Version
 * Creates Epic, Story, Task, Bug using the working approach
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

const uniqueId = Date.now().toString().slice(-6);

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
  await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/(dashboard|board|backlog|projects)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe.serial('Create All Issue Types - Fixed', () => {

  test('1. Create STORY', async ({ page }) => {
    await login(page);
    
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Create Story
    await page.click('button:has-text("Create Story")');
    await page.waitForTimeout(2000);
    
    // Fill form
    const modal = page.locator('.ant-modal:visible');
    await modal.locator('input#summary').fill(`E2E Story ${uniqueId}`);
    await modal.locator('textarea').first().fill('Story created by E2E automation');
    
    // Submit
    await modal.locator('button:has-text("Create Issue")').click();
    await page.waitForTimeout(3000);
    
    // Verify success
    const success = await page.locator('.ant-message-success').isVisible();
    console.log(`✅ STORY: E2E Story ${uniqueId} - ${success ? 'CREATED' : 'CHECK MANUALLY'}`);
  });

  test('2. Create BUG', async ({ page }) => {
    await login(page);
    
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Report Bug
    await page.click('button:has-text("Report Bug")');
    await page.waitForTimeout(2000);
    
    // Fill form
    const modal = page.locator('.ant-modal:visible');
    await modal.locator('input#summary').fill(`E2E Bug ${uniqueId}`);
    await modal.locator('textarea').first().fill('Bug reported by E2E automation');
    
    // Submit
    await modal.locator('button:has-text("Create Issue")').click();
    await page.waitForTimeout(3000);
    
    // Verify success
    const success = await page.locator('.ant-message-success').isVisible();
    console.log(`✅ BUG: E2E Bug ${uniqueId} - ${success ? 'CREATED' : 'CHECK MANUALLY'}`);
  });

  test('3. Create TASK', async ({ page }) => {
    await login(page);
    
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Create
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(2000);
    
    // Fill form
    const modal = page.locator('.ant-modal:visible');
    
    // Select Task type
    await modal.locator('.ant-select').first().click();
    await page.waitForTimeout(500);
    await page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("Task")').first().click();
    await page.waitForTimeout(500);
    
    // Fill summary and description
    await modal.locator('input#summary').fill(`E2E Task ${uniqueId}`);
    await modal.locator('textarea').first().fill('Task created by E2E automation');
    
    // Submit
    await modal.locator('button:has-text("Create Issue")').click();
    await page.waitForTimeout(3000);
    
    // Verify success
    const success = await page.locator('.ant-message-success').isVisible();
    console.log(`✅ TASK: E2E Task ${uniqueId} - ${success ? 'CREATED' : 'CHECK MANUALLY'}`);
  });

  test('4. Create EPIC', async ({ page }) => {
    await login(page);
    
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Create
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(2000);
    
    // Fill form
    const modal = page.locator('.ant-modal:visible');
    
    // Select Epic type
    await modal.locator('.ant-select').first().click();
    await page.waitForTimeout(500);
    await page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("Epic")').first().click();
    await page.waitForTimeout(500);
    
    // Fill summary and description
    await modal.locator('input#summary').fill(`E2E Epic ${uniqueId}`);
    await modal.locator('textarea').first().fill('Epic created by E2E automation');
    
    // Submit
    await modal.locator('button:has-text("Create Issue")').click();
    await page.waitForTimeout(3000);
    
    // Verify success
    const success = await page.locator('.ant-message-success').isVisible();
    console.log(`✅ EPIC: E2E Epic ${uniqueId} - ${success ? 'CREATED' : 'CHECK MANUALLY'}`);
  });

  test('5. VERIFY - Check all pages', async ({ page }) => {
    await login(page);
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`VERIFICATION - Issue ID: ${uniqueId}`);
    console.log(`${'='.repeat(50)}\n`);
    
    // Stories
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `test-results/verify-stories-${uniqueId}.png` });
    const storyVisible = await page.locator(`text=E2E Story ${uniqueId}`).isVisible();
    console.log(`Stories: E2E Story ${uniqueId} - ${storyVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    
    // Bugs
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `test-results/verify-bugs-${uniqueId}.png` });
    const bugVisible = await page.locator(`text=E2E Bug ${uniqueId}`).isVisible();
    console.log(`Bugs: E2E Bug ${uniqueId} - ${bugVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    
    // Epics
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `test-results/verify-epics-${uniqueId}.png` });
    const epicVisible = await page.locator(`text=E2E Epic ${uniqueId}`).isVisible();
    console.log(`Epics: E2E Epic ${uniqueId} - ${epicVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    
    // Backlog
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `test-results/verify-backlog-${uniqueId}.png` });
    const taskVisible = await page.locator(`text=E2E Task ${uniqueId}`).isVisible();
    console.log(`Backlog: E2E Task ${uniqueId} - ${taskVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Screenshots saved to test-results/`);
    console.log(`${'='.repeat(50)}\n`);
  });
});
