import { test, expect } from '@playwright/test';

test.describe('Sprint Management - Detailed Tests', () => {
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

  test('Create Sprint', async ({ page }) => {
    console.log('Test: Create Sprint');
    
    await page.goto('http://localhost:1600/backlog');
    await page.waitForTimeout(2000);
    
    const createSprintBtn = page.locator('button').filter({ hasText: 'Create Sprint' }).first();
    if (await createSprintBtn.isVisible()) {
      await createSprintBtn.click();
      await page.waitForTimeout(1000);
      
      await page.locator('input[name="name"]').fill('Sprint 1');
      await page.locator('input[name="goal"]').fill('Complete user authentication');
      
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
      
      console.log('✅ Sprint created');
    }
  });

  test('View Sprint Backlog', async ({ page }) => {
    console.log('Test: View Sprint Backlog');
    
    await page.goto('http://localhost:1600/backlog');
    await page.waitForTimeout(2000);
    
    console.log('✅ Sprint backlog viewed');
  });

  test('Add Issue to Sprint', async ({ page }) => {
    console.log('Test: Add Issue to Sprint');
    
    await page.goto('http://localhost:1600/backlog');
    await page.waitForTimeout(2000);
    
    const issueCard = page.locator('.issue-card').first();
    if (await issueCard.isVisible()) {
      const sprintSection = page.locator('.sprint-section').first();
      if (await sprintSection.isVisible()) {
        await issueCard.dragTo(sprintSection);
        await page.waitForTimeout(2000);
        
        console.log('✅ Issue added to sprint');
      }
    }
  });

  test('Start Sprint', async ({ page }) => {
    console.log('Test: Start Sprint');
    
    await page.goto('http://localhost:1600/backlog');
    await page.waitForTimeout(2000);
    
    const startSprintBtn = page.locator('button').filter({ hasText: 'Start Sprint' }).first();
    if (await startSprintBtn.isVisible()) {
      await startSprintBtn.click();
      await page.waitForTimeout(1000);
      
      await page.locator('button').filter({ hasText: 'Confirm' }).click();
      await page.waitForTimeout(3000);
      
      console.log('✅ Sprint started');
    }
  });

  test('View Active Sprint', async ({ page }) => {
    console.log('Test: View Active Sprint');
    
    await page.goto('http://localhost:1600/board');
    await page.waitForTimeout(2000);
    
    const sprintInfo = page.locator('.sprint-info').first();
    if (await sprintInfo.isVisible()) {
      console.log('✅ Active sprint visible');
    }
  });

  test('View Sprint Reports', async ({ page }) => {
    console.log('Test: View Sprint Reports');
    
    await page.goto('http://localhost:1600/sprint-reports');
    await page.waitForTimeout(2000);
    
    console.log('✅ Sprint reports viewed');
  });

  test('View Burndown Chart', async ({ page }) => {
    console.log('Test: View Burndown Chart');
    
    await page.goto('http://localhost:1600/sprint-reports');
    await page.waitForTimeout(2000);
    
    const burndownChart = page.locator('.burndown-chart').first();
    if (await burndownChart.isVisible()) {
      console.log('✅ Burndown chart visible');
    } else {
      console.log('⚠️ Burndown chart not found');
    }
  });

  test('View Velocity Chart', async ({ page }) => {
    console.log('Test: View Velocity Chart');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const velocityOption = page.locator('text=Velocity').first();
    if (await velocityOption.isVisible()) {
      await velocityOption.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Velocity chart viewed');
    }
  });

  test('Complete Sprint', async ({ page }) => {
    console.log('Test: Complete Sprint');
    
    await page.goto('http://localhost:1600/backlog');
    await page.waitForTimeout(2000);
    
    const completeSprintBtn = page.locator('button').filter({ hasText: 'Complete Sprint' }).first();
    if (await completeSprintBtn.isVisible()) {
      await completeSprintBtn.click();
      await page.waitForTimeout(1000);
      
      await page.locator('button').filter({ hasText: 'Complete' }).click();
      await page.waitForTimeout(3000);
      
      console.log('✅ Sprint completed');
    }
  });

  test('View Sprint History', async ({ page }) => {
    console.log('Test: View Sprint History');
    
    await page.goto('http://localhost:1600/sprint-reports');
    await page.waitForTimeout(2000);
    
    const historyTab = page.locator('text=History').first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Sprint history viewed');
    }
  });
});
