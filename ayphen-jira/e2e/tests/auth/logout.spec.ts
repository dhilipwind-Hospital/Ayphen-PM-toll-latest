import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Logout', () => {
  test('LGO-001: should logout successfully', async ({ authenticatedPage, page }) => {
    const dashboardPage = await import('../../pages').then(m => new m.DashboardPage(page));
    
    // Verify we're logged in first
    await dashboardPage.expectLoggedIn();
    
    // Perform logout
    await dashboardPage.logout();
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('LGO-002: should not access protected routes after logout', async ({ authenticatedPage, page }) => {
    const dashboardPage = await import('../../pages').then(m => new m.DashboardPage(page));
    
    // Logout
    await dashboardPage.logout();
    
    // Try to access protected route
    await page.goto('/backlog');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('LGO-003: should clear session data on logout', async ({ authenticatedPage, page }) => {
    const dashboardPage = await import('../../pages').then(m => new m.DashboardPage(page));
    
    // Logout
    await dashboardPage.logout();
    
    // Check that token is cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('LGO-004: should redirect to login when session expires', async ({ authenticatedPage, page }) => {
    // Clear the token to simulate session expiry
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    });
    
    // Try to navigate
    await page.goto('/backlog');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });
});
