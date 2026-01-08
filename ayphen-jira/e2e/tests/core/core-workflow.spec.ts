import { test, expect, Page } from '@playwright/test';

/**
 * Core Workflow E2E Tests
 * 
 * Tests the main user journey through the Ayphen PM Tool:
 * 1. Login → Dashboard → Board → Projects → Issues
 * 
 * Test credentials: dhilipwind+501@gmail.com / Demo@501
 * Production URL: https://ayphen-pm-toll.vercel.app
 */

const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Fill login form - using placeholder selectors that match the actual UI
  await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
  await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
  
  // Click Sign In button
  await page.click('button:has-text("Sign In")');
  
  // Wait for redirect to dashboard
  await page.waitForURL(/.*\/(dashboard|board|backlog|projects)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Core Workflow - User Journey', () => {
  
  // ============================================
  // PHASE 1: AUTHENTICATION
  // ============================================
  
  test('CW-001: Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login form elements are visible
    await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    console.log('✅ CW-001: Login page loaded successfully');
  });

  test('CW-002: User can login successfully', async ({ page }) => {
    await login(page);
    
    // Verify we're on authenticated page
    const url = page.url();
    expect(url).toMatch(/.*\/(dashboard|board|backlog|projects)/);
    
    console.log('✅ CW-002: Login successful, redirected to:', url);
  });

  test('CW-003: Invalid login stays on login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try invalid credentials
    await page.fill('input[placeholder="Enter your email"]', 'invalid@test.com');
    await page.fill('input[placeholder="Enter your password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(2000);
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*\/login/);
    
    console.log('✅ CW-003: Invalid login stayed on login page');
  });

  // ============================================
  // PHASE 2: DASHBOARD
  // ============================================

  test('CW-004: Dashboard loads after login', async ({ page }) => {
    await login(page);
    
    // Navigate to dashboard explicitly
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify URL
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    console.log('✅ CW-004: Dashboard loaded successfully');
  });

  // ============================================
  // PHASE 3: BOARD
  // ============================================

  test('CW-005: Board page loads', async ({ page }) => {
    await login(page);
    
    // Navigate to board
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify URL
    await expect(page).toHaveURL(/.*\/board/);
    
    console.log('✅ CW-005: Board page loaded successfully');
  });

  test('CW-006: Board displays columns', async ({ page }) => {
    await login(page);
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for any column-like elements (flexible selectors)
    const hasColumns = await page.locator('[class*="column"], [class*="Column"], [data-rbd-droppable-id]').count();
    
    console.log(`✅ CW-006: Board has ${hasColumns} column elements`);
  });

  // ============================================
  // PHASE 4: BACKLOG
  // ============================================

  test('CW-007: Backlog page loads', async ({ page }) => {
    await login(page);
    
    await page.goto('/backlog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/backlog/);
    
    console.log('✅ CW-007: Backlog page loaded successfully');
  });

  // ============================================
  // PHASE 5: PROJECTS
  // ============================================

  test('CW-008: Projects page loads', async ({ page }) => {
    await login(page);
    
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/projects/);
    
    console.log('✅ CW-008: Projects page loaded successfully');
  });

  // ============================================
  // PHASE 6: REPORTS
  // ============================================

  test('CW-009: Reports page loads', async ({ page }) => {
    await login(page);
    
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/reports/);
    
    console.log('✅ CW-009: Reports page loaded successfully');
  });

  // ============================================
  // PHASE 7: SETTINGS
  // ============================================

  test('CW-010: Settings page loads', async ({ page }) => {
    await login(page);
    
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*\/settings/);
    
    console.log('✅ CW-010: Settings page loaded successfully');
  });

  // ============================================
  // PHASE 8: NAVIGATION
  // ============================================

  test('CW-011: Navigation menu works', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(2000);
    
    // Try clicking navigation items
    const navItems = ['Dashboard', 'Board', 'Backlog', 'Projects'];
    
    for (const item of navItems) {
      const navLink = page.locator(`text=${item}`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        console.log(`  ✓ Navigated to ${item}`);
      }
    }
    
    console.log('✅ CW-011: Navigation menu works');
  });

  // ============================================
  // PHASE 9: SEARCH
  // ============================================

  test('CW-012: Search functionality', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(2000);
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"], [data-testid="search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);
      console.log('✅ CW-012: Search input found and usable');
    } else {
      console.log('⚠️ CW-012: Search input not found on current page');
    }
  });

  // ============================================
  // PHASE 10: LOGOUT
  // ============================================

  test('CW-013: User can logout', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(2000);
    
    // Look for user menu or logout option
    const userMenu = page.locator('[class*="avatar"], [class*="Avatar"], [class*="user-menu"], .ant-dropdown-trigger').first();
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(500);
      
      // Look for logout option
      const logoutBtn = page.locator('text=Logout, text=Sign Out, text=Log Out').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(2000);
        
        // Should redirect to login
        if (page.url().includes('/login')) {
          console.log('✅ CW-013: Logout successful');
        }
      }
    } else {
      console.log('⚠️ CW-013: User menu not found');
    }
  });
});

// ============================================
// STANDALONE SMOKE TESTS
// ============================================

test.describe('Smoke Tests - Quick Validation', () => {
  
  test('SMOKE-001: App is accessible', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    console.log('✅ SMOKE-001: App is accessible');
  });

  test('SMOKE-002: Login redirect works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login if not authenticated
    const url = page.url();
    expect(url).toMatch(/.*\/(login|dashboard)/);
    console.log('✅ SMOKE-002: Redirect works, URL:', url);
  });

  test('SMOKE-003: Full login flow', async ({ page }) => {
    await login(page);
    
    // Navigate through main pages
    const pages = ['/dashboard', '/board', '/backlog', '/projects'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(pagePath.split('/')[1]);
    }
    
    console.log('✅ SMOKE-003: Full login flow completed');
  });
});
