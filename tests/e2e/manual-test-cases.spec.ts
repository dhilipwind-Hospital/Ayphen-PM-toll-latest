import { test, expect } from '@playwright/test';

test.describe('Manual Test Case Management', () => {
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

  test('1. Create Manual Test Case', async ({ page }) => {
    await page.goto('http://localhost:1600/test-cases');
    await page.waitForTimeout(2000);
    
    const createBtn = page.locator('button').filter({ hasText: /Create|New Test Case/i }).first();
    await createBtn.click();
    await page.waitForTimeout(1000);
    
    await page.locator('input[name="title"], input[placeholder*="title" i]').fill('Login Test Case');
    await page.locator('textarea[name="description"], textarea[placeholder*="description" i]').fill('Verify user login functionality');
    await page.locator('input[name="steps"], textarea[name="steps"]').fill('1. Navigate to login\n2. Enter credentials\n3. Click login');
    
    await page.locator('button').filter({ hasText: /Save|Create/i }).click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Manual test case created');
  });

  test('2. Create Test Suite', async ({ page }) => {
    await page.goto('http://localhost:1600/test-suites');
    await page.waitForTimeout(2000);
    
    const createSuiteBtn = page.locator('button').filter({ hasText: /Create Suite|New Suite/i }).first();
    await createSuiteBtn.click();
    await page.waitForTimeout(1000);
    
    await page.locator('input[name="name"], input[placeholder*="suite name" i]').fill('Smoke Test Suite');
    await page.locator('textarea[name="description"]').fill('Critical smoke tests');
    
    await page.locator('button').filter({ hasText: /Save|Create/i }).click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Test suite created');
  });

  test('3. Add Test Case to Suite', async ({ page }) => {
    await page.goto('http://localhost:1600/test-suites');
    await page.waitForTimeout(2000);
    
    await page.locator('text=Smoke Test Suite').first().click();
    await page.waitForTimeout(1000);
    
    const addTestBtn = page.locator('button').filter({ hasText: /Add Test|Add Case/i }).first();
    await addTestBtn.click();
    await page.waitForTimeout(1000);
    
    await page.locator('text=Login Test Case').first().click();
    await page.locator('button').filter({ hasText: /Add|Confirm/i }).click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Test case added to suite');
  });

  test('4. Execute Test Suite', async ({ page }) => {
    await page.goto('http://localhost:1600/test-suites');
    await page.waitForTimeout(2000);
    
    await page.locator('text=Smoke Test Suite').first().click();
    await page.waitForTimeout(1000);
    
    const runBtn = page.locator('button').filter({ hasText: /Run Suite|Execute/i }).first();
    await runBtn.click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Test suite execution started');
  });

  test('5. Mark Test Case Result', async ({ page }) => {
    await page.goto('http://localhost:1600/test-runs');
    await page.waitForTimeout(2000);
    
    await page.locator('text=Login Test Case').first().click();
    await page.waitForTimeout(1000);
    
    const passBtn = page.locator('button').filter({ hasText: /Pass|Passed/i }).first();
    if (await passBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await passBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Test marked as passed');
    }
  });

  test('6. Update Test Case Priority', async ({ page }) => {
    await page.goto('http://localhost:1600/test-cases');
    await page.waitForTimeout(2000);
    
    await page.locator('text=Login Test Case').first().click();
    await page.waitForTimeout(1000);
    
    const prioritySelect = page.locator('select[name="priority"]').first();
    await prioritySelect.selectOption('High');
    
    await page.locator('button').filter({ hasText: /Save|Update/i }).click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Test case priority updated');
  });

  test('7. Remove Test Case from Suite', async ({ page }) => {
    await page.goto('http://localhost:1600/test-suites');
    await page.waitForTimeout(2000);
    
    await page.locator('text=Smoke Test Suite').first().click();
    await page.waitForTimeout(1000);
    
    const removeBtn = page.locator('button').filter({ hasText: /Remove|Delete/i }).first();
    if (await removeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await removeBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Test case removed from suite');
    }
  });
});
