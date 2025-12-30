import { test as setup } from '@playwright/test';
import { TEST_USERS } from '../utils/test-data';

/**
 * Global Setup - runs once before all tests
 * Used to set up test users and initial data
 */
setup('create test users', async ({ page }) => {
  console.log('🚀 Running global setup...');
  
  // Try to register test user if not exists
  try {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Check if register page
    const registerButton = page.locator('button:has-text("Register"), button:has-text("Sign up")');
    
    if (await registerButton.isVisible({ timeout: 5000 })) {
      // Fill registration form
      await page.locator('input[name="name"], input[placeholder*="name" i]').fill(TEST_USERS.user1.name);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USERS.user1.email);
      await page.locator('input[type="password"]').first().fill(TEST_USERS.user1.password);
      
      // If there's a confirm password field
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(TEST_USERS.user1.password);
      }
      
      await registerButton.click();
      
      // Wait for redirect
      await page.waitForURL(/.*\/(login|dashboard|board)/, { timeout: 10000 });
      console.log('✅ Test user created successfully');
    }
  } catch (error) {
    console.log('ℹ️ User might already exist or registration page not available');
  }
  
  console.log('✅ Global setup complete');
});
