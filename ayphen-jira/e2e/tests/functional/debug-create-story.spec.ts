import { test, expect, Page } from '@playwright/test';

/**
 * Debug Story Creation
 * Step-by-step debugging of story creation process
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

test('DEBUG: Create Story step by step', async ({ page }) => {
  const uniqueId = Date.now().toString().slice(-6);
  
  // Login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
  await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/(dashboard|board|backlog|projects)/, { timeout: 15000 });
  console.log('✅ Step 1: Logged in');
  
  // Go to Stories page
  await page.goto('/stories');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('✅ Step 2: On Stories page');
  
  // Take screenshot before clicking create
  await page.screenshot({ path: 'test-results/debug-1-stories-page.png' });
  
  // Find and click Create Story button
  const createBtn = page.locator('button:has-text("Create Story")');
  const btnVisible = await createBtn.isVisible();
  console.log(`Step 3: Create Story button visible: ${btnVisible}`);
  
  if (!btnVisible) {
    console.log('❌ Create Story button not found, trying alternate selectors');
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons on page:', allButtons);
    return;
  }
  
  await createBtn.click();
  console.log('✅ Step 3: Clicked Create Story button');
  await page.waitForTimeout(2000);
  
  // Take screenshot of modal
  await page.screenshot({ path: 'test-results/debug-2-modal-open.png' });
  
  // Check for modal
  const modal = page.locator('.ant-modal:visible');
  const modalVisible = await modal.isVisible();
  console.log(`Step 4: Modal visible: ${modalVisible}`);
  
  if (!modalVisible) {
    console.log('❌ Modal not visible');
    return;
  }
  
  // Log all inputs in modal
  const inputs = await modal.locator('input').all();
  console.log(`Found ${inputs.length} inputs in modal`);
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');
    const type = await input.getAttribute('type');
    console.log(`  Input ${i}: id=${id}, type=${type}, placeholder=${placeholder}`);
  }
  
  // Find summary input
  const summaryInput = modal.locator('input[placeholder="What needs to be done?"]');
  const summaryVisible = await summaryInput.isVisible();
  console.log(`Step 5: Summary input visible: ${summaryVisible}`);
  
  if (summaryVisible) {
    await summaryInput.fill(`E2E Debug Story ${uniqueId}`);
    console.log('✅ Step 5: Filled summary');
  } else {
    // Try first visible input
    const firstInput = modal.locator('input:visible').first();
    await firstInput.fill(`E2E Debug Story ${uniqueId}`);
    console.log('✅ Step 5: Filled first input');
  }
  
  await page.waitForTimeout(500);
  
  // Fill description
  const textarea = modal.locator('textarea').first();
  if (await textarea.isVisible()) {
    await textarea.fill('Debug story description');
    console.log('✅ Step 6: Filled description');
  }
  
  await page.waitForTimeout(500);
  
  // Take screenshot before submit
  await page.screenshot({ path: 'test-results/debug-3-form-filled.png' });
  
  // Find and log all buttons in modal
  const modalButtons = await modal.locator('button').allTextContents();
  console.log('Buttons in modal:', modalButtons);
  
  // Click submit button
  const submitBtn = modal.locator('button:has-text("Create Issue"), button:has-text("Create Story"), button[type="submit"]').first();
  const submitVisible = await submitBtn.isVisible();
  console.log(`Step 7: Submit button visible: ${submitVisible}`);
  
  if (submitVisible) {
    const btnText = await submitBtn.textContent();
    console.log(`Clicking button: "${btnText}"`);
    await submitBtn.click();
    console.log('✅ Step 7: Clicked submit button');
  }
  
  // Wait for response
  await page.waitForTimeout(5000);
  
  // Take screenshot after submit
  await page.screenshot({ path: 'test-results/debug-4-after-submit.png' });
  
  // Check for errors
  const errors = await page.locator('.ant-form-item-explain-error').allTextContents();
  if (errors.length > 0) {
    console.log('❌ Form errors:', errors);
  }
  
  // Check for success message
  const successMsg = await page.locator('.ant-message-success').isVisible();
  console.log(`Step 8: Success message visible: ${successMsg}`);
  
  // Check if modal closed
  const modalStillOpen = await modal.isVisible();
  console.log(`Step 8: Modal still open: ${modalStillOpen}`);
  
  if (modalStillOpen) {
    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }
  
  // Reload and check for story
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/debug-5-final-check.png' });
  
  // Check if story was created
  const storyCreated = await page.locator(`text=E2E Debug Story ${uniqueId}`).isVisible();
  console.log(`\n========================================`);
  console.log(`RESULT: Story created: ${storyCreated ? '✅ YES' : '❌ NO'}`);
  console.log(`Story ID: ${uniqueId}`);
  console.log(`========================================\n`);
  
  // List all visible stories
  const allRows = await page.locator('tr').allTextContents();
  console.log(`Total rows on page: ${allRows.length}`);
});
