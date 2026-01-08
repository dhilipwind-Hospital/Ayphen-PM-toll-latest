import { Page } from '@playwright/test';

/**
 * Shared Test Configuration
 * All tests will use this project
 */

export const TEST_USER = {
  email: 'dhilipwind+501@gmail.com',
  password: 'Demo@501'
};

export const PROJECT_NAME = 'AI Automation';

export async function loginAndSelectProject(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Enter your email"]', TEST_USER.email);
  await page.fill('input[placeholder="Enter your password"]', TEST_USER.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/(dashboard|board|backlog)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Select AI Automation project if not already selected
  try {
    const projectSelector = page.locator('.ant-select').first();
    if (await projectSelector.isVisible({ timeout: 3000 })) {
      const currentProject = await projectSelector.textContent();
      if (!currentProject?.toLowerCase().includes('ai automation')) {
        await projectSelector.click();
        await page.waitForTimeout(500);
        const aiOption = page.locator(`.ant-select-dropdown:visible .ant-select-item-option`).filter({ hasText: /AI Automation/i }).first();
        if (await aiOption.isVisible({ timeout: 2000 })) {
          await aiOption.click();
          await page.waitForTimeout(1000);
          console.log(`✅ Switched to project: ${PROJECT_NAME}`);
        }
      } else {
        console.log(`✅ Already on project: ${PROJECT_NAME}`);
      }
    }
  } catch (e) {
    console.log(`⚠️ Could not switch project, continuing with current`);
  }
}

export async function login(page: Page) {
  await loginAndSelectProject(page);
}
