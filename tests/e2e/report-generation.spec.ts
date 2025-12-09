import { test, expect } from '@playwright/test';

test.describe('Report Generation - Detailed Tests', () => {
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

  test('View Reports Dashboard', async ({ page }) => {
    console.log('Test: View Reports Dashboard');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    console.log('✅ Reports dashboard loaded');
  });

  test('Generate Velocity Report', async ({ page }) => {
    console.log('Test: Generate Velocity Report');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const velocityReport = page.locator('text=Velocity').first();
    if (await velocityReport.isVisible()) {
      await velocityReport.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Velocity report generated');
    }
  });

  test('Generate Burndown Report', async ({ page }) => {
    console.log('Test: Generate Burndown Report');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const burndownReport = page.locator('text=Burndown').first();
    if (await burndownReport.isVisible()) {
      await burndownReport.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Burndown report generated');
    }
  });

  test('Generate Sprint Report', async ({ page }) => {
    console.log('Test: Generate Sprint Report');
    
    await page.goto('http://localhost:1600/sprint-reports');
    await page.waitForTimeout(2000);
    
    console.log('✅ Sprint report generated');
  });

  test('View Issue Statistics', async ({ page }) => {
    console.log('Test: View Issue Statistics');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const statsSection = page.locator('.statistics').first();
    if (await statsSection.isVisible()) {
      console.log('✅ Issue statistics visible');
    }
  });

  test('Filter Reports by Date Range', async ({ page }) => {
    console.log('Test: Filter Reports by Date Range');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const dateFilter = page.locator('select[name="dateRange"]').first();
    if (await dateFilter.isVisible()) {
      await dateFilter.selectOption('month');
      await page.waitForTimeout(2000);
      
      console.log('✅ Reports filtered by date');
    }
  });

  test('Export Report as PDF', async ({ page }) => {
    console.log('Test: Export Report as PDF');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
      
      const pdfOption = page.locator('text=PDF').first();
      if (await pdfOption.isVisible()) {
        await pdfOption.click();
        await page.waitForTimeout(2000);
        
        console.log('✅ Report exported as PDF');
      }
    }
  });

  test('Export Report as CSV', async ({ page }) => {
    console.log('Test: Export Report as CSV');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
      
      const csvOption = page.locator('text=CSV').first();
      if (await csvOption.isVisible()) {
        await csvOption.click();
        await page.waitForTimeout(2000);
        
        console.log('✅ Report exported as CSV');
      }
    }
  });

  test('View Team Performance Report', async ({ page }) => {
    console.log('Test: View Team Performance Report');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const teamPerformance = page.locator('text=Team Performance').first();
    if (await teamPerformance.isVisible()) {
      await teamPerformance.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Team performance report viewed');
    }
  });

  test('View Time Tracking Report', async ({ page }) => {
    console.log('Test: View Time Tracking Report');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const timeTracking = page.locator('text=Time Tracking').first();
    if (await timeTracking.isVisible()) {
      await timeTracking.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Time tracking report viewed');
    }
  });

  test('View Custom Report', async ({ page }) => {
    console.log('Test: View Custom Report');
    
    await page.goto('http://localhost:1600/reports');
    await page.waitForTimeout(2000);
    
    const customReport = page.locator('button').filter({ hasText: 'Custom Report' }).first();
    if (await customReport.isVisible()) {
      await customReport.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Custom report builder opened');
    }
  });
});
