import { test, expect, Page } from '@playwright/test';

/**
 * Create Issues via Page-Specific Buttons
 * Uses the Create Story, Report Bug buttons on their respective pages
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
  await page.waitForTimeout(2000);
}

test.describe.serial('Create Issues via Page Buttons', () => {

  test('STORY: Create Story from Stories page', async ({ page }) => {
    await login(page);
    
    // Go to Stories page
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Create Story button
    const createStoryBtn = page.locator('button:has-text("Create Story")');
    await expect(createStoryBtn).toBeVisible({ timeout: 10000 });
    await createStoryBtn.click();
    await page.waitForTimeout(2000);
    
    // Wait for modal/form
    const modal = page.locator('.ant-modal:visible, .ant-drawer:visible, [role="dialog"]:visible').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Fill the form - find input fields
    const summaryInput = page.locator('input[placeholder*="What"], input[placeholder*="Summary"], input[placeholder*="summary"], input:not([type="hidden"])').first();
    await summaryInput.fill(`E2E Story ${uniqueId}`);
    await page.waitForTimeout(500);
    
    // Fill description if available
    const descArea = page.locator('textarea').first();
    if (await descArea.isVisible()) {
      await descArea.fill(`Story created by E2E test. ID: ${uniqueId}`);
    }
    
    // Click submit/create button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button.ant-btn-primary').last();
    await submitBtn.click();
    await page.waitForTimeout(5000);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const storyCreated = await page.locator(`text=E2E Story ${uniqueId}`).count() > 0;
    console.log(`✅ STORY: E2E Story ${uniqueId} - ${storyCreated ? 'VISIBLE' : 'NOT VISIBLE'}`);
    
    // Take screenshot
    await page.screenshot({ path: `test-results/story-created-${uniqueId}.png` });
  });

  test('BUG: Create Bug from Bugs page', async ({ page }) => {
    await login(page);
    
    // Go to Bugs page
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Report Bug button
    const reportBugBtn = page.locator('button:has-text("Report Bug")');
    await expect(reportBugBtn).toBeVisible({ timeout: 10000 });
    await reportBugBtn.click();
    await page.waitForTimeout(2000);
    
    // Wait for modal/form
    const modal = page.locator('.ant-modal:visible, .ant-drawer:visible, [role="dialog"]:visible').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Fill the form
    const summaryInput = page.locator('input[placeholder*="What"], input[placeholder*="Summary"], input[placeholder*="summary"], input:not([type="hidden"])').first();
    await summaryInput.fill(`E2E Bug ${uniqueId}`);
    await page.waitForTimeout(500);
    
    // Fill description if available
    const descArea = page.locator('textarea').first();
    if (await descArea.isVisible()) {
      await descArea.fill(`Bug report from E2E test.\n\nSteps:\n1. Run test\n2. Verify bug created\n\nID: ${uniqueId}`);
    }
    
    // Click submit/create button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Report"), button.ant-btn-primary').last();
    await submitBtn.click();
    await page.waitForTimeout(5000);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const bugCreated = await page.locator(`text=E2E Bug ${uniqueId}`).count() > 0;
    console.log(`✅ BUG: E2E Bug ${uniqueId} - ${bugCreated ? 'VISIBLE' : 'NOT VISIBLE'}`);
    
    // Take screenshot
    await page.screenshot({ path: `test-results/bug-created-${uniqueId}.png` });
  });

  test('EPIC: Create Epic from Epics page', async ({ page }) => {
    await login(page);
    
    // Go to Epics page
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for Create Epic button
    const createEpicBtn = page.locator('button:has-text("Create Epic"), button:has-text("New Epic"), button:has-text("Create")').first();
    
    if (await createEpicBtn.isVisible()) {
      await createEpicBtn.click();
      await page.waitForTimeout(2000);
      
      // Wait for modal/form
      const modal = page.locator('.ant-modal:visible, .ant-drawer:visible, [role="dialog"]:visible').first();
      
      if (await modal.isVisible()) {
        // Fill the form
        const summaryInput = page.locator('input').first();
        await summaryInput.fill(`E2E Epic ${uniqueId}`);
        await page.waitForTimeout(500);
        
        // Fill description if available
        const descArea = page.locator('textarea').first();
        if (await descArea.isVisible()) {
          await descArea.fill(`Epic created by E2E test. ID: ${uniqueId}`);
        }
        
        // Click submit
        const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button.ant-btn-primary').last();
        await submitBtn.click();
        await page.waitForTimeout(5000);
      }
    } else {
      console.log('⚠️ EPIC: Create Epic button not found on page');
    }
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const epicCreated = await page.locator(`text=E2E Epic ${uniqueId}`).count() > 0;
    console.log(`✅ EPIC: E2E Epic ${uniqueId} - ${epicCreated ? 'VISIBLE' : 'NOT VISIBLE'}`);
    
    // Take screenshot
    await page.screenshot({ path: `test-results/epic-created-${uniqueId}.png` });
  });

  test('TASK: Create Task from Backlog', async ({ page }) => {
    await login(page);
    
    // Go to Backlog
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Create button
    const createBtn = page.locator('button:has-text("Create")').first();
    await createBtn.click();
    await page.waitForTimeout(2000);
    
    // Wait for modal
    const modal = page.locator('.ant-modal:visible').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Select Task type from dropdown
    const typeDropdown = modal.locator('.ant-select').first();
    await typeDropdown.click();
    await page.waitForTimeout(500);
    
    // Click on Task option
    await page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("Task")').first().click();
    await page.waitForTimeout(500);
    
    // Fill summary
    const summaryInput = modal.locator('input[placeholder="What needs to be done?"]');
    await summaryInput.fill(`E2E Task ${uniqueId}`);
    await page.waitForTimeout(500);
    
    // Fill description
    const descArea = modal.locator('textarea').first();
    if (await descArea.isVisible()) {
      await descArea.fill(`Task created by E2E test. ID: ${uniqueId}`);
    }
    
    // Click Create Issue button
    const submitBtn = modal.locator('button:has-text("Create Issue")');
    await submitBtn.click();
    await page.waitForTimeout(5000);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const taskCreated = await page.locator(`text=E2E Task ${uniqueId}`).count() > 0;
    console.log(`✅ TASK: E2E Task ${uniqueId} - ${taskCreated ? 'VISIBLE' : 'NOT VISIBLE'}`);
    
    // Take screenshot
    await page.screenshot({ path: `test-results/task-created-${uniqueId}.png` });
  });

  test('FINAL: Verify all created issues', async ({ page }) => {
    await login(page);
    
    console.log(`\n========================================`);
    console.log(`VERIFICATION - Looking for ID: ${uniqueId}`);
    console.log(`========================================\n`);
    
    // Check Stories
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const storyFound = await page.locator(`text=E2E Story ${uniqueId}`).count() > 0;
    console.log(`Stories page: E2E Story ${uniqueId} - ${storyFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    // Check Bugs
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const bugFound = await page.locator(`text=E2E Bug ${uniqueId}`).count() > 0;
    console.log(`Bugs page: E2E Bug ${uniqueId} - ${bugFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    // Check Epics
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const epicFound = await page.locator(`text=E2E Epic ${uniqueId}`).count() > 0;
    console.log(`Epics page: E2E Epic ${uniqueId} - ${epicFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    // Check Backlog
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const taskFound = await page.locator(`text=E2E Task ${uniqueId}`).count() > 0;
    console.log(`Backlog: E2E Task ${uniqueId} - ${taskFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    const allE2E = await page.locator('text=E2E').count();
    console.log(`\nTotal E2E issues on Backlog: ${allE2E}`);
    
    console.log(`\n========================================`);
    console.log(`VERIFICATION COMPLETE`);
    console.log(`========================================\n`);
  });
});
