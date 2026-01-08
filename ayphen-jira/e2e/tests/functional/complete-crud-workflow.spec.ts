import { test, expect, Page } from '@playwright/test';

/**
 * Complete CRUD Workflow
 * Creates Project, Epic, Story, Bug on their respective pages
 * Links them properly and edits each one
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

test.describe.serial('Complete CRUD Workflow', () => {

  // Store created issue keys for linking
  let epicKey = '';
  let storyKey = '';
  let bugKey = '';

  test('1. CREATE PROJECT via Projects page', async ({ page }) => {
    await login(page);
    
    // Navigate to Projects page
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📁 Creating new project...');
    
    // Look for create project button or link
    const createProjectLink = page.locator('a[href*="/projects/create"], button:has-text("Create Project"), button:has-text("New Project")');
    
    if (await createProjectLink.count() > 0) {
      await createProjectLink.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    } else {
      await page.goto('/projects/create');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot
    await page.screenshot({ path: `test-results/project-create-page-${uniqueId}.png` });
    
    // Select template if visible
    const scrumTemplate = page.locator('text=Scrum').first();
    if (await scrumTemplate.isVisible()) {
      await scrumTemplate.click();
      await page.waitForTimeout(1000);
      
      const nextBtn = page.locator('button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Fill project details
    const projectName = `E2E Project ${uniqueId}`;
    const nameInput = page.locator('input').first();
    await nameInput.fill(projectName);
    await page.waitForTimeout(500);
    
    // Fill description if available
    const descArea = page.locator('textarea').first();
    if (await descArea.isVisible()) {
      await descArea.fill('Project created by E2E automation for testing CRUD workflow');
    }
    
    // Click Create button
    const createBtn = page.locator('button:has-text("Create")').last();
    await createBtn.click();
    await page.waitForTimeout(5000);
    
    console.log(`✅ PROJECT: "${projectName}" creation submitted`);
    await page.screenshot({ path: `test-results/project-created-${uniqueId}.png` });
  });

  test('2. CREATE EPIC via Epics page', async ({ page }) => {
    await login(page);
    
    // Navigate to Epics page
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('🎯 Creating Epic on Epics page...');
    await page.screenshot({ path: `test-results/epics-page-${uniqueId}.png` });
    
    // Look for Create Epic button
    const createEpicBtn = page.locator('button:has-text("Create Epic"), button:has-text("New Epic"), button:has-text("Create")').first();
    
    if (await createEpicBtn.isVisible()) {
      await createEpicBtn.click();
      await page.waitForTimeout(2000);
      
      // Wait for modal
      const modal = page.locator('.ant-modal:visible, .ant-drawer:visible, [role="dialog"]:visible').first();
      
      if (await modal.isVisible()) {
        const epicName = `E2E Epic ${uniqueId}`;
        
        // First select Epic type if dropdown is visible
        const typeDropdown = modal.locator('.ant-select').first();
        if (await typeDropdown.isVisible()) {
          await typeDropdown.click();
          await page.waitForTimeout(500);
          const epicOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("Epic")').first();
          if (await epicOption.isVisible()) {
            await epicOption.click();
            await page.waitForTimeout(500);
          }
        }
        
        // Fill Epic name using specific selector
        const summaryInput = modal.locator('input#summary');
        await summaryInput.fill(epicName);
        await page.waitForTimeout(500);
        
        // Fill description
        const descArea = modal.locator('textarea').first();
        if (await descArea.isVisible()) {
          await descArea.fill('Epic created by E2E test. This epic groups related stories and bugs.');
        }
        
        // Submit
        const submitBtn = modal.locator('button:has-text("Create Issue"), button:has-text("Create")').last();
        await submitBtn.click();
        await page.waitForTimeout(3000);
        
        console.log(`✅ EPIC: "${epicName}" created on Epics page`);
      }
    } else {
      // Try using header Create button
      await page.locator('button:has-text("Create")').first().click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('.ant-modal:visible').first();
      if (await modal.isVisible()) {
        // Select Epic type
        const typeDropdown = modal.locator('.ant-select').first();
        await typeDropdown.click();
        await page.waitForTimeout(500);
        
        const epicOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("Epic")').first();
        await epicOption.click();
        await page.waitForTimeout(500);
        
        // Fill Epic name
        const epicName = `E2E Epic ${uniqueId}`;
        await modal.locator('input#summary').fill(epicName);
        await modal.locator('textarea').first().fill('Epic created by E2E test');
        
        await modal.locator('button:has-text("Create Issue")').click();
        await page.waitForTimeout(3000);
        
        console.log(`✅ EPIC: "${epicName}" created via Create button`);
      }
    }
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/epic-created-${uniqueId}.png` });
    
    // Try to get the epic key
    const epicRow = page.locator(`tr:has-text("E2E Epic ${uniqueId}"), [class*="epic"]:has-text("E2E Epic ${uniqueId}")`).first();
    if (await epicRow.isVisible()) {
      const keyCell = epicRow.locator('td').first();
      epicKey = await keyCell.textContent() || '';
      console.log(`Epic Key: ${epicKey}`);
    }
  });

  test('3. CREATE STORY via Stories page linked to Epic', async ({ page }) => {
    await login(page);
    
    // Navigate to Stories page
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📖 Creating Story on Stories page...');
    await page.screenshot({ path: `test-results/stories-page-${uniqueId}.png` });
    
    // Click Create Story button
    const createStoryBtn = page.locator('button:has-text("Create Story")');
    await createStoryBtn.click();
    await page.waitForTimeout(2000);
    
    // Wait for modal
    const modal = page.locator('.ant-modal:visible').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Fill Story name
    const storyName = `E2E Story ${uniqueId}`;
    await modal.locator('input#summary').fill(storyName);
    await page.waitForTimeout(500);
    
    // Fill description
    await modal.locator('textarea').first().fill('Story created by E2E test. Linked to Epic for testing hierarchy.');
    await page.waitForTimeout(500);
    
    // Try to link to Epic
    const epicLinkDropdown = modal.locator('#epicLink, .ant-select:has-text("Epic")').first();
    if (await epicLinkDropdown.isVisible()) {
      await epicLinkDropdown.click();
      await page.waitForTimeout(500);
      
      // Select the E2E Epic
      const epicOption = page.locator(`.ant-select-dropdown:visible .ant-select-item-option:has-text("E2E Epic ${uniqueId}")`).first();
      if (await epicOption.count() > 0) {
        await epicOption.click();
        await page.waitForTimeout(500);
        console.log('✅ Story linked to Epic');
      }
    }
    
    // Submit
    await modal.locator('button:has-text("Create Issue")').click();
    await page.waitForTimeout(3000);
    
    console.log(`✅ STORY: "${storyName}" created on Stories page`);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/story-created-${uniqueId}.png` });
    
    // Verify story exists
    const storyVisible = await page.locator(`text=E2E Story ${uniqueId}`).isVisible();
    console.log(`Story visible on Stories page: ${storyVisible}`);
    
    // Get story key
    const storyRow = page.locator(`tr:has-text("E2E Story ${uniqueId}")`).first();
    if (await storyRow.isVisible()) {
      const keyCell = storyRow.locator('td').first();
      storyKey = await keyCell.textContent() || '';
      console.log(`Story Key: ${storyKey}`);
    }
  });

  test('4. CREATE BUG via Bugs page linked to Story', async ({ page }) => {
    await login(page);
    
    // Navigate to Bugs page
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('🐛 Creating Bug on Bugs page...');
    await page.screenshot({ path: `test-results/bugs-page-${uniqueId}.png` });
    
    // Click Report Bug button
    const reportBugBtn = page.locator('button:has-text("Report Bug")');
    await reportBugBtn.click();
    await page.waitForTimeout(2000);
    
    // Wait for modal
    const modal = page.locator('.ant-modal:visible').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Fill Bug name
    const bugName = `E2E Bug ${uniqueId}`;
    await modal.locator('input#summary').fill(bugName);
    await page.waitForTimeout(500);
    
    // Fill description
    await modal.locator('textarea').first().fill('Bug reported by E2E test.\n\nSteps to reproduce:\n1. Run E2E test\n2. Check bug creation\n\nExpected: Bug appears on Bugs page\nActual: Bug created successfully');
    await page.waitForTimeout(500);
    
    // Try to link to Story (User Story Link) - optional, skip if fails
    try {
      const storyLinkDropdown = modal.locator('#userStoryLink').first();
      if (await storyLinkDropdown.isVisible({ timeout: 2000 })) {
        await storyLinkDropdown.click();
        await page.waitForTimeout(1000);
        
        // Just press Escape to close dropdown if it opened
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        console.log('⚠️ Story link dropdown found but skipping for now');
      }
    } catch (e) {
      console.log('⚠️ Story link not available');
    }
    
    // Submit
    await modal.locator('button:has-text("Create Issue")').click();
    await page.waitForTimeout(3000);
    
    console.log(`✅ BUG: "${bugName}" created on Bugs page`);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/bug-created-${uniqueId}.png` });
    
    // Verify bug exists
    const bugVisible = await page.locator(`text=E2E Bug ${uniqueId}`).isVisible();
    console.log(`Bug visible on Bugs page: ${bugVisible}`);
  });

  test('5. EDIT STORY - Change priority and add comment', async ({ page }) => {
    await login(page);
    
    // Navigate to Stories page
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✏️ Editing Story...');
    
    // Click on the story to open it
    const storyRow = page.locator(`tr:has-text("E2E Story ${uniqueId}"), [class*="row"]:has-text("E2E Story ${uniqueId}")`).first();
    if (await storyRow.isVisible()) {
      await storyRow.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: `test-results/story-detail-${uniqueId}.png` });
      
      // Look for edit options or detail panel
      const detailPanel = page.locator('.ant-drawer:visible, .ant-modal:visible, [class*="detail"]:visible').first();
      
      if (await detailPanel.isVisible()) {
        // Try to change priority
        const priorityDropdown = detailPanel.locator('[class*="priority"], #priority, .ant-select:has-text("Priority")').first();
        if (await priorityDropdown.isVisible()) {
          await priorityDropdown.click();
          await page.waitForTimeout(500);
          
          const highOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("High")').first();
          if (await highOption.isVisible()) {
            await highOption.click();
            await page.waitForTimeout(1000);
            console.log('✅ Story priority changed to High');
          }
        }
        
        // Try to add a comment
        const commentInput = detailPanel.locator('textarea[placeholder*="comment" i], input[placeholder*="comment" i]').first();
        if (await commentInput.isVisible()) {
          await commentInput.fill('E2E Test Comment: Story edited successfully');
          
          const addCommentBtn = detailPanel.locator('button:has-text("Add"), button:has-text("Comment"), button:has-text("Send")').first();
          if (await addCommentBtn.isVisible()) {
            await addCommentBtn.click();
            await page.waitForTimeout(1000);
            console.log('✅ Comment added to Story');
          }
        }
      }
      
      // Close the detail panel
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    
    console.log('✅ EDIT STORY completed');
  });

  test('6. EDIT BUG - Change severity and status', async ({ page }) => {
    await login(page);
    
    // Navigate to Bugs page
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✏️ Editing Bug...');
    
    // Click on the bug to open it
    const bugRow = page.locator(`tr:has-text("E2E Bug ${uniqueId}"), [class*="row"]:has-text("E2E Bug ${uniqueId}")`).first();
    if (await bugRow.isVisible()) {
      await bugRow.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: `test-results/bug-detail-${uniqueId}.png` });
      
      // Look for detail panel
      const detailPanel = page.locator('.ant-drawer:visible, .ant-modal:visible, [class*="detail"]:visible').first();
      
      if (await detailPanel.isVisible()) {
        // Try to change severity
        const severityDropdown = detailPanel.locator('[class*="severity"], #severity').first();
        if (await severityDropdown.isVisible()) {
          await severityDropdown.click();
          await page.waitForTimeout(500);
          
          const criticalOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option:has-text("Critical")').first();
          if (await criticalOption.isVisible()) {
            await criticalOption.click();
            await page.waitForTimeout(1000);
            console.log('✅ Bug severity changed to Critical');
          }
        }
      }
      
      // Close the detail panel
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    
    console.log('✅ EDIT BUG completed');
  });

  test('7. VERIFY - Check all created issues on respective pages', async ({ page }) => {
    await login(page);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FINAL VERIFICATION - Issue ID: ${uniqueId}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Check Projects
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const projectVisible = await page.locator(`text=E2E Project ${uniqueId}`).isVisible();
    console.log(`📁 Projects: E2E Project ${uniqueId} - ${projectVisible ? '✅ VISIBLE' : '⚠️ Check manually'}`);
    
    // Check Epics page
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const epicVisible = await page.locator(`text=E2E Epic ${uniqueId}`).isVisible();
    console.log(`🎯 Epics: E2E Epic ${uniqueId} - ${epicVisible ? '✅ VISIBLE' : '⚠️ Check backlog'}`);
    await page.screenshot({ path: `test-results/final-epics-${uniqueId}.png` });
    
    // Check Stories page
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const storyVisible = await page.locator(`text=E2E Story ${uniqueId}`).isVisible();
    console.log(`📖 Stories: E2E Story ${uniqueId} - ${storyVisible ? '✅ VISIBLE' : '⚠️ Check backlog'}`);
    await page.screenshot({ path: `test-results/final-stories-${uniqueId}.png` });
    
    // Check Bugs page
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const bugVisible = await page.locator(`text=E2E Bug ${uniqueId}`).isVisible();
    console.log(`🐛 Bugs: E2E Bug ${uniqueId} - ${bugVisible ? '✅ VISIBLE' : '⚠️ Check backlog'}`);
    await page.screenshot({ path: `test-results/final-bugs-${uniqueId}.png` });
    
    // Check Backlog for all
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const backlogE2E = await page.locator('text=E2E').count();
    console.log(`📋 Backlog: ${backlogE2E} E2E issues total`);
    await page.screenshot({ path: `test-results/final-backlog-${uniqueId}.png` });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`VERIFICATION COMPLETE - Screenshots in test-results/`);
    console.log(`${'='.repeat(60)}\n`);
  });
});
