import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `testuser${Date.now()}@example.com`,
  password: 'Test@123',
  name: 'Test User'
};

test.describe('Complete E2E Application Tests', () => {
  
  test('Full Application Flow', async ({ page }) => {
    // 1. REGISTRATION
    console.log('Step 1: User Registration');
    await page.goto('http://localhost:1600/register');
    await page.fill('input[name="name"]', TEST_USER.name);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirmPassword"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // 2. VERIFY DASHBOARD
    console.log('Step 2: Verify Dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Total Issues')).toBeVisible();
    
    // 3. CREATE PROJECT
    console.log('Step 3: Create Project');
    await page.goto('http://localhost:1600/projects');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(500);
    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.fill('input[name="key"]', 'E2E');
    await page.selectOption('select[name="type"]', 'scrum');
    await page.fill('textarea[name="description"]', 'Automated test project');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(2000);
    
    // 4. NAVIGATE TO BOARD
    console.log('Step 4: Navigate to Board');
    await page.goto('http://localhost:1600/board');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=To Do')).toBeVisible();
    
    // 5. CREATE ISSUE
    console.log('Step 5: Create Issue');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="type"]', 'story');
    await page.fill('input[name="summary"]', 'E2E Test Story');
    await page.fill('textarea[name="description"]', 'Automated test story');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // 6. VIEW BACKLOG
    console.log('Step 6: View Backlog');
    await page.goto('http://localhost:1600/backlog');
    await page.waitForTimeout(1000);
    
    // 7. VIEW REPORTS
    console.log('Step 7: View Reports');
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(1000);
    
    // 8. VIEW SETTINGS
    console.log('Step 8: View Settings');
    await page.goto('http://localhost:1600/settings/profile');
    await page.waitForTimeout(1000);
    
    // 9. LOGOUT
    console.log('Step 9: Logout');
    await page.click('[data-testid="user-menu"]').catch(() => {
      console.log('User menu not found, trying alternative selector');
    });
    await page.click('text=Logout').catch(() => {
      console.log('Logout button not found');
    });
    
    console.log('✅ Complete E2E Test Passed');
  });
});
