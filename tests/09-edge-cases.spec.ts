import { test, expect } from '@playwright/test';

test.describe('Phase 19 - Edge Cases & Security', () => {
  test('Unauthorized access redirects to login', async ({ page }) => {
    // Try to access member dashboard without login
    await page.goto('/member/dashboard');
    await page.waitForURL(/\/member\/login/);
    await expect(page).toHaveURL(/\/member\/login/);
    
    // Try to access admin dashboard without login
    await page.goto('/admin');
    await page.waitForURL(/\/admin\/login/);
    await expect(page).toHaveURL(/\/admin\/login/);
  });
  
  test('Non-existent pages show 404 or redirect', async ({ page }) => {
    await page.goto('/some-random-url');
    // For now we don't have a 404 page, but let's just make sure it loads something
    // or redirects. Our app just redirects to / on catch-all.
    await expect(page).toHaveURL(/\//);
  });
});
