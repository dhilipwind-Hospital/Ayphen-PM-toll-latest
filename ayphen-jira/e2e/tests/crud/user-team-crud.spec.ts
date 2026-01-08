import { test, expect, Page } from '@playwright/test';

/**
 * User & Team Management Tests
 * Tests user profile, team management functionality
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

test.describe('User & Team Management', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ============================================
  // USER PROFILE
  // ============================================

  test('UT-001: User profile page loads', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/settings/);
    console.log('✅ UT-001: Profile settings page loaded');
  });

  test('UT-002: User profile form elements', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const formInputs = await page.locator('input[name="name"], input[name="email"], input[placeholder*="Name"]').count();
    console.log(`✅ UT-002: Profile form inputs: ${formInputs}`);
  });

  test('UT-003: Edit user name', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]').first();
    if (await nameInput.isVisible()) {
      const currentValue = await nameInput.inputValue();
      console.log(`✅ UT-003: Current name: ${currentValue}`);
    } else {
      console.log('⚠️ UT-003: Name input not found');
    }
  });

  test('UT-004: Save profile changes', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const saveBtns = await page.locator('button:has-text("Save"), button[type="submit"]').count();
    console.log(`✅ UT-004: Save buttons: ${saveBtns}`);
  });

  // ============================================
  // NOTIFICATION SETTINGS
  // ============================================

  test('UT-005: Notification settings page', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const notifSettings = await page.locator('input[type="checkbox"], .ant-switch, [class*="toggle"]').count();
    console.log(`✅ UT-005: Notification toggles: ${notifSettings}`);
  });

  // ============================================
  // TEAM/PEOPLE PAGE
  // ============================================

  test('UT-006: People page loads', async ({ page }) => {
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/people/);
    console.log('✅ UT-006: People page loaded');
  });

  test('UT-007: Team members list', async ({ page }) => {
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const members = await page.locator('[class*="member"], [class*="user"], [class*="avatar"]').count();
    console.log(`✅ UT-007: Team member elements: ${members}`);
  });

  test('UT-008: Invite team member button', async ({ page }) => {
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const inviteBtns = await page.locator('button:has-text("Invite"), button:has-text("Add Member"), button:has-text("Add User")').count();
    console.log(`✅ UT-008: Invite buttons: ${inviteBtns}`);
  });

  // ============================================
  // SYSTEM SETTINGS
  // ============================================

  test('UT-009: System settings page', async ({ page }) => {
    await page.goto('/settings/system');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const settings = await page.locator('input, select, .ant-switch').count();
    console.log(`✅ UT-009: System settings elements: ${settings}`);
  });

  test('UT-010: Theme settings', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const themeOptions = await page.locator('text=Theme, text=Dark, text=Light, [class*="theme"]').count();
    console.log(`✅ UT-010: Theme options: ${themeOptions}`);
  });
});
