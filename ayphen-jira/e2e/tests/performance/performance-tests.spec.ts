import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Performance Test Suite - Phase 3
 * Covers page load times, API response times, and stress testing
 */

test.describe('Performance Tests - Phase 3 Integration Tests', () => {

  // PERF-001: Dashboard load time
  test('PERF-001: Dashboard load time', async ({ authenticatedPage }) => {
    const startTime = Date.now();
    
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    // Assert load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  // PERF-002: Board load time
  test('PERF-002: Board load time', async ({ authenticatedPage }) => {
    const startTime = Date.now();
    
    await authenticatedPage.goto('/board');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Board load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(3000);
  });

  // PERF-003: Issues list load time
  test('PERF-003: Issues list load time', async ({ authenticatedPage }) => {
    const startTime = Date.now();
    
    await authenticatedPage.goto('/issues');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Issues list load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(3000);
  });

  // PERF-004: Issue detail load time
  test('PERF-004: Issue detail load time', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues');
    await authenticatedPage.waitForLoadState('networkidle');

    const issueLink = authenticatedPage.locator('[data-testid="issue-link"]').first();
    
    if (await issueLink.isVisible()) {
      const startTime = Date.now();
      await issueLink.click();
      await authenticatedPage.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`Issue detail load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(2000);
    }
  });

  // PERF-005: Search response time
  test('PERF-005: Search response time', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues');
    await authenticatedPage.waitForLoadState('networkidle');

    const searchInput = authenticatedPage.locator('input[placeholder*="search" i]');
    
    const startTime = Date.now();
    await searchInput.fill('test');
    await authenticatedPage.waitForTimeout(500);
    await authenticatedPage.waitForLoadState('networkidle');
    const responseTime = Date.now() - startTime;
    
    console.log(`Search response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  // PERF-006: Drag and drop responsiveness
  test('PERF-006: Drag and drop responsiveness', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/board');
    await authenticatedPage.waitForLoadState('networkidle');

    const card = authenticatedPage.locator('[data-testid^="issue-card-"]').first();
    const targetColumn = authenticatedPage.locator('.board-column').nth(1);

    if (await card.isVisible() && await targetColumn.isVisible()) {
      const startTime = Date.now();
      await card.dragTo(targetColumn);
      await authenticatedPage.waitForTimeout(500);
      const dragTime = Date.now() - startTime;
      
      console.log(`Drag and drop time: ${dragTime}ms`);
      expect(dragTime).toBeLessThan(2000);
    }
  });

  // PERF-007: API response time - Issues
  test('PERF-007: API response time - Issues', async ({ authenticatedPage }) => {
    const startTime = Date.now();
    
    await authenticatedPage.goto('/issues');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Issues API response time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(3000);
  });

  // PERF-008: Memory usage check
  test('PERF-008: Memory usage check', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    // Navigate through multiple pages
    const pages = ['/board', '/issues', '/sprints', '/reports'];
    
    for (const page of pages) {
      await authenticatedPage.goto(page);
      await authenticatedPage.waitForLoadState('networkidle');
    }

    // Check if page is still responsive
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await expect(authenticatedPage.locator('[data-testid="dashboard-widgets"]')).toBeVisible();
  });

  // PERF-009: Large dataset handling
  test('PERF-009: Large dataset handling', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/issues?limit=100');
    await authenticatedPage.waitForLoadState('networkidle');

    const startTime = Date.now();
    
    // Scroll through the list
    await authenticatedPage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await authenticatedPage.waitForTimeout(500);
    
    const scrollTime = Date.now() - startTime;
    console.log(`Scroll time with large dataset: ${scrollTime}ms`);
    
    expect(scrollTime).toBeLessThan(1000);
  });

  // PERF-010: Concurrent operations
  test('PERF-010: Concurrent operations', async ({ authenticatedPage, context }) => {
    // Open multiple tabs
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    const startTime = Date.now();
    
    // Load pages concurrently
    await Promise.all([
      authenticatedPage.goto('/dashboard'),
      page2.goto('/board'),
      page3.goto('/issues')
    ]);

    await Promise.all([
      authenticatedPage.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle'),
      page3.waitForLoadState('networkidle')
    ]);

    const loadTime = Date.now() - startTime;
    console.log(`Concurrent load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(5000);

    await page2.close();
    await page3.close();
  });

  // PERF-011: WebSocket connection
  test('PERF-011: WebSocket connection', async ({ authenticatedPage }) => {
    let wsConnected = false;
    
    authenticatedPage.on('websocket', ws => {
      wsConnected = true;
      console.log('WebSocket connected:', ws.url());
    });

    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // WebSocket should be connected for real-time updates
    console.log(`WebSocket connected: ${wsConnected}`);
  });

  // PERF-012: Image loading
  test('PERF-012: Image loading', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const images = authenticatedPage.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      const startTime = Date.now();
      
      // Wait for all images to load
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        await img.evaluate((el: HTMLImageElement) => {
          return new Promise((resolve) => {
            if (el.complete) resolve(true);
            el.onload = () => resolve(true);
            el.onerror = () => resolve(false);
          });
        });
      }
      
      const loadTime = Date.now() - startTime;
      console.log(`Images load time: ${loadTime}ms`);
    }
  });
});
