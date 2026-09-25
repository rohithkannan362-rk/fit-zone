import { test, expect } from '@playwright/test';

test.describe('Phase 11-18 - Admin Flows', () => {
  let errors: any[] = [];
  
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    // Login before each test
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'testadmin@fitzone.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('Admin Dashboard loads correctly', async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await expect(page.locator('text=Total Members').or(page.locator('text=Active Members'))).toBeVisible();
    await expect(errors).toEqual([]);
  });

  test('Admin navigation works', async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    // We assume the sidebar has links for Members, Payments, Packages, etc.
    const links = ['Members', 'Payments', 'Packages', 'Reminders', 'Reports', 'Settings'];
    for (const link of links) {
      await page.goto('/admin');
      const navLink = page.getByRole('link', { name: link, exact: true }).first();
      await expect(navLink).toBeVisible();
      await navLink.click();
      await expect(page).toHaveURL(new RegExp(`/admin/${link.toLowerCase()}`));
    }
  });
});
