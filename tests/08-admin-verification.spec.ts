import { test, expect } from '@playwright/test';

test.describe('Phase 14 - Admin Payment Verification', () => {
  test('Admin can view payments', async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    // 1. Admin logs in
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'testadmin@fitzone.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/);
    
    // 2. Navigate to Payments
    await page.goto('/admin/payments');
    await expect(page).toHaveURL(/\/admin\/payments/);
    
    // Wait for the submitted tab to become visible
    const submittedBtn = page.locator('button:has-text("submitted")');
    await expect(submittedBtn).toBeVisible({ timeout: 15000 });
    
    // Switch to submitted tab
    await submittedBtn.click();
    
    // Search doesn't exist on this page right now, we can skip search.
    
    // Switch to verified tab
    await page.click('button:has-text("verified")');
    
    // Log out
    await page.click('text=Settings');
    await page.click('text=Sign Out');
    
    // Ensure we are redirected to public page or login
    await expect(page).toHaveURL(/\//);
  });
});
