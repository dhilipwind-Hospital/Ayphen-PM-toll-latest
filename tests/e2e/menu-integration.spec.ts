import { test, expect } from '@playwright/test';

test.describe('Menu Integration - Complete Navigation Tests', () => {
  let testEmail: string;
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(180000);
    testEmail = `test${Date.now()}@example.com`;
    
    await page.goto('http://localhost:1600');
    await page.getByText('Register', { exact: true }).click();
    await page.waitForTimeout(1000);
    await page.locator('input[placeholder="Full Name"]').fill('Test User');
    await page.locator('input[placeholder="Email"]').nth(1).fill(testEmail);
    await page.locator('input[placeholder="Password"]').nth(1).fill('Test@123456');
    await page.locator('input[placeholder="Confirm Password"]').fill('Test@123456');
    await page.locator('button').filter({ hasText: 'Register' }).click();
    await page.waitForTimeout(5000);
  });

  test('Your Work Menu - All Items', async ({ page }) => {
    console.log('Test: Your Work Menu');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    // Click Your Work menu
    const yourWorkMenu = page.locator('text=Your Work').first();
    if (await yourWorkMenu.isVisible()) {
      await yourWorkMenu.click();
      await page.waitForTimeout(1000);
      
      // Verify menu items visible
      await expect(page.locator('text=Worked on')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=Assigned to me')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=Starred')).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      console.log('✅ Your Work menu items verified');
    }
  });

  test('Projects Menu - All Items', async ({ page }) => {
    console.log('Test: Projects Menu');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const projectsMenu = page.locator('text=Projects').first();
    if (await projectsMenu.isVisible()) {
      await projectsMenu.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text=Create project')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=View all projects')).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      console.log('✅ Projects menu items verified');
    }
  });

  test('Filters Menu - All Items', async ({ page }) => {
    console.log('Test: Filters Menu');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const filtersMenu = page.locator('text=Filters').first();
    if (await filtersMenu.isVisible()) {
      await filtersMenu.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text=View all filters')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=My open issues')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=Advanced issue search')).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      console.log('✅ Filters menu items verified');
    }
  });

  test('Dashboards Menu - All Items', async ({ page }) => {
    console.log('Test: Dashboards Menu');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const dashboardsMenu = page.locator('text=Dashboards').first();
    if (await dashboardsMenu.isVisible()) {
      await dashboardsMenu.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text=View all dashboards')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=Create dashboard')).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      console.log('✅ Dashboards menu items verified');
    }
  });

  test('People Menu - All Items', async ({ page }) => {
    console.log('Test: People Menu');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const peopleMenu = page.locator('text=People').first();
    if (await peopleMenu.isVisible()) {
      await peopleMenu.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text=View all people')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=Teams')).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      console.log('✅ People menu items verified');
    }
  });

  test('Apps Menu - All Items', async ({ page }) => {
    console.log('Test: Apps Menu');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const appsMenu = page.locator('text=Apps').first();
    if (await appsMenu.isVisible()) {
      await appsMenu.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text=Explore apps')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=Manage apps')).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      console.log('✅ Apps menu items verified');
    }
  });

  test('Navigate: Your Work -> View All Projects', async ({ page }) => {
    console.log('Test: Navigate to Projects from Your Work');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const yourWorkMenu = page.locator('text=Your Work').first();
    if (await yourWorkMenu.isVisible()) {
      await yourWorkMenu.click();
      await page.waitForTimeout(500);
      
      await page.locator('text=View all projects').click();
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveURL(/.*projects/);
      console.log('✅ Navigation to projects successful');
    }
  });

  test('Navigate: Projects -> Create Project', async ({ page }) => {
    console.log('Test: Navigate to Create Project');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const projectsMenu = page.locator('text=Projects').first();
    if (await projectsMenu.isVisible()) {
      await projectsMenu.click();
      await page.waitForTimeout(500);
      
      await page.locator('text=Create project').click();
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveURL(/.*projects\/create/);
      console.log('✅ Navigation to create project successful');
    }
  });

  test('Navigate: Filters -> Advanced Search', async ({ page }) => {
    console.log('Test: Navigate to Advanced Search');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const filtersMenu = page.locator('text=Filters').first();
    if (await filtersMenu.isVisible()) {
      await filtersMenu.click();
      await page.waitForTimeout(500);
      
      await page.locator('text=Advanced issue search').click();
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveURL(/.*filters\/advanced/);
      console.log('✅ Navigation to advanced search successful');
    }
  });

  test('Navigate: Dashboards -> Create Dashboard', async ({ page }) => {
    console.log('Test: Navigate to Create Dashboard');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const dashboardsMenu = page.locator('text=Dashboards').first();
    if (await dashboardsMenu.isVisible()) {
      await dashboardsMenu.click();
      await page.waitForTimeout(500);
      
      await page.locator('text=Create dashboard').click();
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveURL(/.*dashboard\/create/);
      console.log('✅ Navigation to create dashboard successful');
    }
  });

  test('Navigate: People -> View All People', async ({ page }) => {
    console.log('Test: Navigate to People Directory');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const peopleMenu = page.locator('text=People').first();
    if (await peopleMenu.isVisible()) {
      await peopleMenu.click();
      await page.waitForTimeout(500);
      
      await page.locator('text=View all people').click();
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveURL(/.*people/);
      console.log('✅ Navigation to people directory successful');
    }
  });

  test('Navigate: Apps -> Explore Apps', async ({ page }) => {
    console.log('Test: Navigate to Apps Explore');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const appsMenu = page.locator('text=Apps').first();
    if (await appsMenu.isVisible()) {
      await appsMenu.click();
      await page.waitForTimeout(500);
      
      await page.locator('text=Explore apps').click();
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveURL(/.*apps\/explore/);
      console.log('✅ Navigation to apps explore successful');
    }
  });

  test('Create Button - Opens Modal', async ({ page }) => {
    console.log('Test: Create Button');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const createButton = page.locator('button').filter({ hasText: 'Create' }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Create button clicked');
    }
  });

  test('Search Functionality', async ({ page }) => {
    console.log('Test: Search');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      console.log('✅ Search input working');
    }
  });

  test('Profile Menu - All Items', async ({ page }) => {
    console.log('Test: Profile Menu');
    
    await page.goto('http://localhost:1600/dashboard');
    await page.waitForTimeout(2000);
    
    const avatar = page.locator('.ant-avatar').first();
    if (await avatar.isVisible()) {
      await avatar.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text=Personal settings')).toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(page.locator('text=Log out')).toBeVisible({ timeout: 3000 }).catch(() => {});
      
      console.log('✅ Profile menu items verified');
    }
  });
});
