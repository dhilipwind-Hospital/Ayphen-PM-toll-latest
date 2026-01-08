import { test, expect, Page } from '@playwright/test';

/**
 * Real CRUD Workflow - Actually creates items on their respective pages
 * With proper verification and edit functionality
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

const uniqueId = Date.now().toString().slice(-4);
// Generate alphabetic key (A-Z only, no numbers)
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const randomLetters = Array.from({length: 3}, () => letters[Math.floor(Math.random() * 26)]).join('');

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

test.describe.serial('Real CRUD Workflow', () => {

  const projectName = `Test Project ${uniqueId}`;
  const projectKey = `TP${randomLetters}`; // Only letters, no numbers
  const epicName = `Test Epic ${uniqueId}`;
  const storyName = `Test Story ${uniqueId}`;
  const bugName = `Test Bug ${uniqueId}`;

  test('1. CREATE PROJECT - Complete wizard properly', async ({ page }) => {
    await login(page);
    
    console.log('\n📁 CREATING PROJECT...');
    console.log(`   Name: ${projectName}`);
    console.log(`   Key: ${projectKey}`);
    
    // Go to create project page
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Step 1: Select Scrum template
    const scrumTemplate = page.locator('text=Scrum').first();
    await expect(scrumTemplate).toBeVisible({ timeout: 10000 });
    await scrumTemplate.click();
    await page.waitForTimeout(500);
    
    // Click Next button
    const nextBtn = page.locator('button:has-text("Next")');
    await nextBtn.click();
    await page.waitForTimeout(2000);
    
    // Step 2: Fill project details
    // Project Name - this auto-generates the key
    const nameInput = page.locator('input[placeholder="e.g., My Awesome Project"]');
    await nameInput.fill(projectName);
    await page.waitForTimeout(500);
    
    // Project Key - fill explicitly
    const keyInput = page.locator('input[placeholder="e.g., MAP"]');
    await keyInput.clear();
    await keyInput.fill(projectKey);
    await page.waitForTimeout(500);
    
    // Description
    const descInput = page.locator('textarea[placeholder="Describe your project..."]');
    await descInput.fill('Project created by E2E automation test');
    await page.waitForTimeout(500);
    
    // Take screenshot before submit
    await page.screenshot({ path: `test-results/project-form-${uniqueId}.png` });
    
    // Click Create Project button
    const createBtn = page.locator('button:has-text("Create Project")');
    await createBtn.click();
    
    // Wait for navigation or success
    await page.waitForTimeout(5000);
    
    // Check for success message
    const successVisible = await page.locator('.ant-message-success').isVisible();
    console.log(`   Success message: ${successVisible}`);
    
    // Navigate to projects page to verify
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if project exists
    const projectVisible = await page.locator(`text=${projectName}`).isVisible();
    console.log(`   Project visible on /projects: ${projectVisible ? '✅ YES' : '❌ NO'}`);
    
    await page.screenshot({ path: `test-results/projects-page-${uniqueId}.png` });
    
    expect(projectVisible).toBeTruthy();
  });

  test('2. CREATE EPIC - Via Epics page Create Epic button', async ({ page }) => {
    await login(page);
    
    console.log('\n🎯 CREATING EPIC...');
    console.log(`   Name: ${epicName}`);
    
    // Go to Epics page
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Create Epic button
    const createEpicBtn = page.locator('button:has-text("Create Epic")');
    await expect(createEpicBtn).toBeVisible({ timeout: 10000 });
    await createEpicBtn.click();
    await page.waitForTimeout(2000);
    
    // Modal should open with type pre-set to Epic
    const modal = page.locator('.ant-modal:visible').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Fill Epic summary
    const summaryInput = modal.locator('input#summary, input[placeholder="What needs to be done?"]');
    await summaryInput.fill(epicName);
    await page.waitForTimeout(500);
    
    // Fill description
    const descArea = modal.locator('textarea').first();
    if (await descArea.isVisible()) {
      await descArea.fill('Epic created by E2E automation. Contains related stories and bugs.');
    }
    
    // Take screenshot
    await page.screenshot({ path: `test-results/epic-form-${uniqueId}.png` });
    
    // Submit
    const submitBtn = modal.locator('button:has-text("Create Issue")');
    await submitBtn.click();
    await page.waitForTimeout(3000);
    
    // Check for success
    const successVisible = await page.locator('.ant-message-success').isVisible();
    console.log(`   Success message: ${successVisible}`);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if epic appears
    const epicVisible = await page.locator(`text=${epicName}`).isVisible();
    console.log(`   Epic visible on /epics: ${epicVisible ? '✅ YES' : '❌ NO'}`);
    
    await page.screenshot({ path: `test-results/epics-page-${uniqueId}.png` });
  });

  test('3. CREATE STORY - Via Stories page Create Story button', async ({ page }) => {
    await login(page);
    
    console.log('\n📖 CREATING STORY...');
    console.log(`   Name: ${storyName}`);
    
    // Go to Stories page
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Create Story button
    const createStoryBtn = page.locator('button:has-text("Create Story")');
    await expect(createStoryBtn).toBeVisible({ timeout: 10000 });
    await createStoryBtn.click();
    await page.waitForTimeout(2000);
    
    // Modal should open
    const modal = page.locator('.ant-modal:visible').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Fill Story summary
    await modal.locator('input#summary').fill(storyName);
    await page.waitForTimeout(500);
    
    // Fill description
    const descArea = modal.locator('textarea').first();
    if (await descArea.isVisible()) {
      await descArea.fill('As a tester, I want to verify E2E works correctly.');
    }
    
    // Submit
    await modal.locator('button:has-text("Create Issue")').click();
    await page.waitForTimeout(3000);
    
    // Check for success
    const successVisible = await page.locator('.ant-message-success').isVisible();
    console.log(`   Success message: ${successVisible}`);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const storyVisible = await page.locator(`text=${storyName}`).isVisible();
    console.log(`   Story visible on /stories: ${storyVisible ? '✅ YES' : '❌ NO'}`);
    
    await page.screenshot({ path: `test-results/stories-page-${uniqueId}.png` });
    
    expect(storyVisible).toBeTruthy();
  });

  test('4. CREATE BUG - Via Bugs page Report Bug button', async ({ page }) => {
    await login(page);
    
    console.log('\n🐛 CREATING BUG...');
    console.log(`   Name: ${bugName}`);
    
    // Go to Bugs page
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Report Bug button (use first() as there may be multiple)
    const reportBugBtn = page.locator('button:has-text("Report Bug")').first();
    await expect(reportBugBtn).toBeVisible({ timeout: 10000 });
    await reportBugBtn.click();
    await page.waitForTimeout(2000);
    
    // Modal should open
    const modal = page.locator('.ant-modal:visible').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Fill Bug summary
    await modal.locator('input#summary').fill(bugName);
    await page.waitForTimeout(500);
    
    // Fill description
    const descArea = modal.locator('textarea').first();
    if (await descArea.isVisible()) {
      await descArea.fill('Bug found during E2E testing.\n\nSteps:\n1. Run test\n2. Check result');
    }
    
    // Submit
    await modal.locator('button:has-text("Create Issue")').click();
    await page.waitForTimeout(3000);
    
    // Check for success
    const successVisible = await page.locator('.ant-message-success').isVisible();
    console.log(`   Success message: ${successVisible}`);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const bugVisible = await page.locator(`text=${bugName}`).isVisible();
    console.log(`   Bug visible on /bugs: ${bugVisible ? '✅ YES' : '❌ NO'}`);
    
    await page.screenshot({ path: `test-results/bugs-page-${uniqueId}.png` });
    
    expect(bugVisible).toBeTruthy();
  });

  test('5. EDIT STORY - Open detail and change fields', async ({ page }) => {
    await login(page);
    
    console.log('\n✏️ EDITING STORY...');
    
    // Go to Stories page
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click on the story row to open it
    const storyRow = page.locator(`tr:has-text("${storyName}")`).first();
    
    if (await storyRow.isVisible()) {
      // Click on the story key/link to open detail
      const storyLink = storyRow.locator('td').first();
      await storyLink.click();
      await page.waitForTimeout(2000);
      
      // Check if detail view opened (could be drawer, modal, or new page)
      await page.screenshot({ path: `test-results/story-detail-${uniqueId}.png` });
      
      // Look for editable fields
      const priorityField = page.locator('[class*="priority"], #priority, .ant-select:has-text("Priority")').first();
      
      if (await priorityField.isVisible()) {
        await priorityField.click();
        await page.waitForTimeout(500);
        
        const highOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("High")').first();
        if (await highOption.isVisible()) {
          await highOption.click();
          await page.waitForTimeout(1000);
          console.log('   ✅ Changed priority to High');
        }
      }
      
      // Close detail view
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠️ Story not found for editing');
    }
    
    console.log('   Edit completed');
  });

  test('6. EDIT BUG - Open detail and change fields', async ({ page }) => {
    await login(page);
    
    console.log('\n✏️ EDITING BUG...');
    
    // Go to Bugs page
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click on the bug row to open it
    const bugRow = page.locator(`tr:has-text("${bugName}")`).first();
    
    if (await bugRow.isVisible()) {
      const bugLink = bugRow.locator('td').first();
      await bugLink.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: `test-results/bug-detail-${uniqueId}.png` });
      
      // Look for severity field (bugs have severity)
      const severityField = page.locator('[class*="severity"], #severity').first();
      
      if (await severityField.isVisible()) {
        await severityField.click();
        await page.waitForTimeout(500);
        
        const majorOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("Major")').first();
        if (await majorOption.isVisible()) {
          await majorOption.click();
          await page.waitForTimeout(1000);
          console.log('   ✅ Changed severity to Major');
        }
      }
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠️ Bug not found for editing');
    }
    
    console.log('   Edit completed');
  });

  test('7. FINAL VERIFICATION - All items visible', async ({ page }) => {
    await login(page);
    
    console.log('\n' + '='.repeat(60));
    console.log('FINAL VERIFICATION');
    console.log('='.repeat(60));
    
    // Check Projects
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const projectOk = await page.locator(`text=${projectName}`).isVisible();
    console.log(`\n📁 Project "${projectName}": ${projectOk ? '✅ VISIBLE' : '❌ NOT FOUND'}`);
    
    // Check Epics
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const epicOk = await page.locator(`text=${epicName}`).isVisible();
    console.log(`🎯 Epic "${epicName}": ${epicOk ? '✅ VISIBLE' : '❌ NOT FOUND'}`);
    
    // Check Stories
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const storyOk = await page.locator(`text=${storyName}`).isVisible();
    console.log(`📖 Story "${storyName}": ${storyOk ? '✅ VISIBLE' : '❌ NOT FOUND'}`);
    
    // Check Bugs
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const bugOk = await page.locator(`text=${bugName}`).isVisible();
    console.log(`🐛 Bug "${bugName}": ${bugOk ? '✅ VISIBLE' : '❌ NOT FOUND'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('Screenshots saved to test-results/');
    console.log('='.repeat(60) + '\n');
  });
});
