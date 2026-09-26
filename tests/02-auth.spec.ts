import { test, expect } from '@playwright/test';

test.describe('Phase 4 - Authentication', () => {
  let errors: any[] = [];
  
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
  });

  test('Member Login - correct credentials', async ({ page }) => {
    await page.goto('/member/login');
    await page.fill('input[type="email"]', 'testmember@fitzone.com');
    await page.fill('input[type="password"]', 'password123'); // Assuming standard test password
    await page.click('button[type="submit"]');
    
    // May redirect to complete-profile if profile is incomplete
    await page.waitForURL(/\/member\/(dashboard|complete-profile)/);
    
    if (page.url().includes('complete-profile')) {
      const nameInput = page.locator('input[placeholder="FULL NAME"]');
      if (await nameInput.isVisible()) await nameInput.fill('Test Member');
      
      const phoneInput = page.locator('input[placeholder="MOBILE NUMBER"]');
      if (await phoneInput.isVisible()) await phoneInput.fill('1234567890');
      
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/member\/dashboard/);
    }
    
    // Check session persistence by reloading
    await page.reload();
    await expect(page).toHaveURL(/\/member\/dashboard/);
    
    // Logout
    await page.click('text=More');
    await page.click('text=Sign Out');
    await expect(page).toHaveURL(/\//); // Redirects to home
  });

  test('Member Login - wrong password', async ({ page }) => {
    await page.goto('/member/login');
    await page.fill('input[type="email"]', 'testmember@fitzone.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Look for error message
    await expect(page.locator('text=Invalid login credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/member\/login/);
  });

  test('Admin Login - correct credentials', async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'testadmin@fitzone.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/);
    
    // Logout
    await page.click('text=Sign Out');
    await expect(page).toHaveURL(/\//); 
  });

  test('Member Login - admin credentials rejected', async ({ page }) => {
    await page.goto('/member/login');
    await page.fill('input[type="email"]', 'testadmin@fitzone.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should display access denied error
    await expect(page.locator('text=Admin accounts cannot sign in through Member Login')).toBeVisible();
    // Must NOT navigate to /admin
    await expect(page).toHaveURL(/\/member\/login/);
  });

  test('Admin Login - member credentials rejected', async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'testmember@fitzone.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should display access denied error
    await expect(page.locator('text=Member accounts cannot sign in through the Admin Portal')).toBeVisible();
    // Must NOT navigate to admin dashboard or member dashboard
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
