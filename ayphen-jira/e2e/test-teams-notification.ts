/**
 * Simple Playwright test for Teams Notification
 * Run with: npx playwright test e2e/test-teams-notification.ts --headed
 */
import { chromium } from '@playwright/test';

const BASE_URL = 'https://ayphen-pm-toll.vercel.app';

async function testTeamsNotification() {
  console.log('🚀 Starting Teams Notification Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Go to login page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);

    // Step 2: Login (you may need to adjust selectors)
    console.log('📍 Step 2: Logging in...');
    await page.fill('input[type="email"], input[name="email"], #email', 'dhilipwind@gmail.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 3: Navigate to Board
    console.log('📍 Step 3: Navigating to board...');
    await page.goto(`${BASE_URL}/board`);
    await page.waitForTimeout(3000);

    // Step 4: Find an issue card and change its status
    console.log('📍 Step 4: Looking for issue cards...');
    
    // Try to find a card in TODO column
    const card = await page.locator('.ant-card, .issue-card, [data-testid*="issue"]').first();
    
    if (await card.isVisible()) {
      console.log('✅ Found an issue card');
      
      // Click on the card to open details
      await card.click();
      await page.waitForTimeout(2000);
      
      // Look for status selector
      const statusSelect = await page.locator('.ant-select').filter({ hasText: /status|to do|in progress|done/i }).first();
      
      if (await statusSelect.isVisible()) {
        console.log('✅ Found status selector');
        await statusSelect.click();
        await page.waitForTimeout(1000);
        
        // Click on a different status option
        const option = await page.locator('.ant-select-item-option').filter({ hasText: /in progress|done|review/i }).first();
        if (await option.isVisible()) {
          await option.click();
          console.log('✅ Status changed! Check Teams for notification.');
          await page.waitForTimeout(3000);
        }
      }
    } else {
      console.log('⚠️ No issue cards found. Creating a test scenario...');
    }

    // Step 5: Check notification bell
    console.log('📍 Step 5: Checking notifications...');
    const bell = await page.locator('.ant-badge, [data-testid*="notification"]').first();
    if (await bell.isVisible()) {
      await bell.click();
      await page.waitForTimeout(2000);
      console.log('✅ Notification panel opened');
    }

    console.log('\n🎉 Test completed! Check your Teams channel for notifications.');
    console.log('📢 Teams Channel: Ayphen PM tool-AI');
    
    // Keep browser open for 10 seconds to see results
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testTeamsNotification();
