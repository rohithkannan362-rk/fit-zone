import { test, expect } from '@playwright/test';

test.describe('Phase 5 - Member Flows', () => {
  let errors: any[] = [];
  
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    // Login before each test
    await page.goto('/member/login');
    await page.fill('input[type="email"]', 'testmember@fitzone.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/member\/(dashboard|complete-profile)/);
    
    if (page.url().includes('complete-profile')) {
      const nameInput = page.locator('input[placeholder="FULL NAME"]');
      if (await nameInput.isVisible()) await nameInput.fill('Test Member');
      
      const phoneInput = page.locator('input[placeholder="MOBILE NUMBER"]');
      if (await phoneInput.isVisible()) await phoneInput.fill('1234567890');
      
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/member\/dashboard/);
    }
  });

  test('Member Dashboard loads correctly', async ({ page }) => {
    await expect(page.getByText('Hello,')).toBeVisible();
    await expect(page.locator('text=Current Membership').or(page.locator('text=No active membership'))).toBeVisible();
    await expect(errors).toEqual([]);
  });

  test('Package Selection navigation works', async ({ page }) => {
    await page.click('text=Plan'); // Navigate to Plan tab
    await expect(page.getByText('My Plans')).toBeVisible();
    
    // Explicitly navigate to the package selection page
    await page.goto('/member/membership');
    await expect(page).toHaveURL(/\/member\/membership/);
    await expect(page.getByText('Select a membership package')).toBeVisible();
  });
});
