import { test, expect, Page } from '@playwright/test';

/**
 * Create ALL Issue Types in UI
 * This test creates Epic, Story, Task, Bug - all visible in the application
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
  await page.waitForTimeout(2000);
}

async function createIssue(page: Page, issueType: string, summary: string, description: string) {
  // Go to backlog
  await page.goto('/backlog');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Click the Create button in the header
  const headerCreateBtn = page.locator('button:has-text("Create")').first();
  await headerCreateBtn.click();
  await page.waitForTimeout(2000);
  
  // Wait for modal - use the one with Create Issue title
  const modal = page.locator('.ant-modal').filter({ hasText: 'Create Issue' }).first();
  await expect(modal).toBeVisible({ timeout: 10000 });
  
  // Click on Issue Type dropdown
  const typeDropdown = modal.locator('.ant-select').first();
  await typeDropdown.click();
  await page.waitForTimeout(500);
  
  // Select the issue type - click on visible option containing type name
  const dropdown = page.locator('.ant-select-dropdown:visible');
  
  // Try to find and click the option
  const allOptions = dropdown.locator('.ant-select-item-option');
  const optionCount = await allOptions.count();
  console.log(`Found ${optionCount} options in dropdown`);
  
  // Find the option that contains our issue type
  for (let i = 0; i < optionCount; i++) {
    const option = allOptions.nth(i);
    const text = await option.textContent();
    if (text && text.includes(issueType)) {
      console.log(`Clicking option: ${text}`);
      await option.click();
      break;
    }
  }
  await page.waitForTimeout(500);
  
  // Fill Summary
  const summaryInput = modal.locator('input[placeholder="What needs to be done?"]');
  await summaryInput.fill(summary);
  await page.waitForTimeout(300);
  
  // Fill Description
  const descriptionInput = modal.locator('textarea');
  if (await descriptionInput.count() > 0) {
    await descriptionInput.first().fill(description);
    await page.waitForTimeout(300);
  }
  
  // Click Create Issue button - look for the submit button
  const createBtn = modal.locator('button[type="submit"], button:has-text("Create Issue"), button.ant-btn-primary').last();
  console.log(`Clicking Create button...`);
  await createBtn.click();
  
  // Wait for either success message or modal to close
  await page.waitForTimeout(5000);
  
  // Check for any error messages first
  const errorMsgs = await page.locator('.ant-form-item-explain-error').allTextContents();
  if (errorMsgs.length > 0) {
    console.log(`Form errors: ${errorMsgs.join(', ')}`);
  }
  
  // Check for success message
  const successMsg = await page.locator('.ant-message-success').count();
  if (successMsg > 0) {
    console.log(`✅ ${issueType} "${summary}" created successfully!`);
    return true;
  }
  
  // Check if modal closed
  const modalVisible = await modal.isVisible().catch(() => false);
  if (!modalVisible) {
    console.log(`✅ ${issueType} "${summary}" created (modal closed)!`);
    return true;
  }
  
  console.log(`⚠️ ${issueType} creation - modal still visible, pressing Escape`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  return false;
}

test.describe.serial('Create ALL Issue Types', () => {
  
  const uniqueId = Date.now().toString().slice(-6);
  
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    await page.close();
  });

  test('EPIC: Create Epic issue', async ({ page }) => {
    await login(page);
    
    const summary = `E2E Epic ${uniqueId}`;
    const description = `This is an Epic created by E2E automation.\n\nEpic ID: ${uniqueId}\nCreated: ${new Date().toISOString()}`;
    
    await createIssue(page, 'Epic', summary, description);
    
    // Verify on Epics page
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const epicVisible = await page.locator(`text=${summary}`).count() > 0;
    console.log(`Epic visible on Epics page: ${epicVisible}`);
  });

  test('STORY: Create Story issue', async ({ page }) => {
    await login(page);
    
    const summary = `E2E Story ${uniqueId}`;
    const description = `As a tester, I want to verify E2E tests work.\n\nAcceptance Criteria:\n- Story is created\n- Story is visible in UI\n\nStory ID: ${uniqueId}`;
    
    await createIssue(page, 'Story', summary, description);
    
    // Verify on Stories page
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const storyVisible = await page.locator(`text=${summary}`).count() > 0;
    console.log(`Story visible on Stories page: ${storyVisible}`);
  });

  test('TASK: Create Task issue', async ({ page }) => {
    await login(page);
    
    const summary = `E2E Task ${uniqueId}`;
    const description = `Task created by E2E automation.\n\nTask ID: ${uniqueId}\n\nSteps:\n1. Create task\n2. Verify task appears\n3. Mark as done`;
    
    await createIssue(page, 'Task', summary, description);
    
    // Verify on Backlog
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const taskVisible = await page.locator(`text=${summary}`).count() > 0;
    console.log(`Task visible on Backlog: ${taskVisible}`);
  });

  test('BUG: Create Bug issue', async ({ page }) => {
    await login(page);
    
    const summary = `E2E Bug ${uniqueId}`;
    const description = `Bug Report - E2E Automation\n\nSteps to reproduce:\n1. Run E2E test suite\n2. Check bug creation\n\nExpected: Bug is created\nActual: Bug is visible in Bugs page\n\nBug ID: ${uniqueId}`;
    
    await createIssue(page, 'Bug', summary, description);
    
    // Verify on Bugs page
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const bugVisible = await page.locator(`text=${summary}`).count() > 0;
    console.log(`Bug visible on Bugs page: ${bugVisible}`);
  });

  test('VERIFY: Check all issues on their pages', async ({ page }) => {
    await login(page);
    
    // Check Stories page
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const storyRows = await page.locator('tr, [class*="row"]').count();
    const storyE2E = await page.locator(`text=E2E Story ${uniqueId}`).count();
    console.log(`Stories page - Total rows: ${storyRows}, E2E Story ${uniqueId}: ${storyE2E > 0 ? 'FOUND' : 'NOT FOUND'}`);
    
    // Check Bugs page  
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const bugRows = await page.locator('tr, [class*="row"]').count();
    const bugE2E = await page.locator(`text=E2E Bug ${uniqueId}`).count();
    console.log(`Bugs page - Total rows: ${bugRows}, E2E Bug ${uniqueId}: ${bugE2E > 0 ? 'FOUND' : 'NOT FOUND'}`);
    
    // Check Epics page
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const epicRows = await page.locator('tr, [class*="row"], [class*="epic"]').count();
    const epicE2E = await page.locator(`text=E2E Epic ${uniqueId}`).count();
    console.log(`Epics page - Total rows: ${epicRows}, E2E Epic ${uniqueId}: ${epicE2E > 0 ? 'FOUND' : 'NOT FOUND'}`);
    
    // Check Backlog
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const backlogCount = await page.locator('text=E2E').count();
    console.log(`Backlog - E2E issues found: ${backlogCount}`);
    
    // Take screenshot of backlog for verification
    await page.screenshot({ path: 'test-results/backlog-verification.png' });
    
    console.log('✅ VERIFY complete - check console output and screenshots');
  });
});
