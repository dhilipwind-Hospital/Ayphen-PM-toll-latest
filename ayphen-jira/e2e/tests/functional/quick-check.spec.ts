import { test } from '@playwright/test';

test('Quick check for E2E issues', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[placeholder="Enter your email"]', 'dhilipwind+501@gmail.com');
  await page.fill('input[placeholder="Enter your password"]', 'Demo@501');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  
  console.log('\n=== CHECKING ALL PAGES FOR E2E ISSUES ===\n');
  
  // Stories
  await page.goto('/stories');
  await page.waitForTimeout(3000);
  const storyRows = await page.locator('tr').count();
  const e2eStories = await page.locator('td:has-text("E2E")').count();
  console.log(`STORIES: ${storyRows} total rows, ${e2eStories} with "E2E"`);
  
  // Bugs
  await page.goto('/bugs');
  await page.waitForTimeout(3000);
  const bugRows = await page.locator('tr').count();
  const e2eBugs = await page.locator('td:has-text("E2E")').count();
  console.log(`BUGS: ${bugRows} total rows, ${e2eBugs} with "E2E"`);
  
  // Epics
  await page.goto('/epics');
  await page.waitForTimeout(3000);
  const epicCount = await page.locator('[class*="epic"], [class*="Epic"], tr').count();
  const e2eEpics = await page.locator('text=E2E Epic').count();
  console.log(`EPICS: ${epicCount} elements, ${e2eEpics} with "E2E Epic"`);
  
  // Backlog
  await page.goto('/backlog');
  await page.waitForTimeout(3000);
  const backlogItems = await page.locator('[class*="issue"], [data-rbd-draggable-id]').count();
  const e2eBacklog = await page.locator('text=E2E').count();
  console.log(`BACKLOG: ${backlogItems} items, ${e2eBacklog} with "E2E"`);
  
  console.log('\n=== CHECK COMPLETE ===\n');
});
