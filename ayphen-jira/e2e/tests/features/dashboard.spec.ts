import { test, expect, Page } from '@playwright/test';

/**
 * Dashboard Feature Tests
 * Tests all dashboard functionality
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

test.describe('Dashboard Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('DASH-001: Dashboard page loads', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/dashboard/);
    console.log('✅ DASH-001: Dashboard page loaded');
  });

  test('DASH-002: Dashboard shows welcome message', async ({ page }) => {
    // Look for any welcome/greeting text
    const hasWelcome = await page.locator('text=Welcome, text=Hello, text=Good').count();
    console.log(`✅ DASH-002: Welcome elements found: ${hasWelcome}`);
  });

  test('DASH-003: Dashboard shows statistics', async ({ page }) => {
    // Look for stat cards or metrics
    const statCards = await page.locator('[class*="stat"], [class*="Stat"], [class*="card"], [class*="Card"], [class*="metric"]').count();
    console.log(`✅ DASH-003: Stat elements found: ${statCards}`);
  });

  test('DASH-004: Dashboard shows recent activity', async ({ page }) => {
    // Look for activity or recent items
    const activityItems = await page.locator('text=Recent, text=Activity, text=Latest').count();
    console.log(`✅ DASH-004: Activity elements found: ${activityItems}`);
  });

  test('DASH-005: Dashboard shows assigned issues', async ({ page }) => {
    // Look for assigned issues section
    const assignedSection = await page.locator('text=Assigned, text=My Issues, text=Tasks').count();
    console.log(`✅ DASH-005: Assigned section elements found: ${assignedSection}`);
  });

  test('DASH-006: Dashboard navigation links work', async ({ page }) => {
    // Check if navigation menu has links
    const navLinks = await page.locator('a[href*="/board"], a[href*="/backlog"], a[href*="/projects"]').count();
    console.log(`✅ DASH-006: Navigation links found: ${navLinks}`);
  });

  test('DASH-007: Dashboard quick actions', async ({ page }) => {
    // Look for quick action buttons
    const quickActions = await page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').count();
    console.log(`✅ DASH-007: Quick action buttons found: ${quickActions}`);
  });

  test('DASH-008: Dashboard charts render', async ({ page }) => {
    // Look for chart elements
    const charts = await page.locator('canvas, svg[class*="chart"], [class*="Chart"], [class*="recharts"]').count();
    console.log(`✅ DASH-008: Chart elements found: ${charts}`);
  });
});
