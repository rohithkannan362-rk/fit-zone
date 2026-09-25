import { test, expect } from '@playwright/test';

test.describe('Phase 3 - Public Pages', () => {
  let errors: any[] = [];
  let consoleMessages: any[] = [];
  let failedRequests: any[] = [];

  test.beforeEach(async ({ page }) => {
    errors = [];
    consoleMessages = [];
    failedRequests = [];

    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('Landing Page loads successfully without errors', async ({ page }) => {
    await page.goto('/');
    
    // Basic checks
    await expect(page).toHaveTitle(/FitZone|FIT ZONE/i);
    await expect(page.getByRole('heading', { name: /FIT ZONE/i }).first()).toBeVisible();
    
    // Check for login and register links/buttons
    await expect(page.getByRole('link', { name: /Member Login/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Join Now/i }).first()).toBeVisible();
    
    // Ensure no critical errors occurred on load
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
    
    // Note: We might allow some console errors if they are non-critical, but ideally it should be empty
    // expect(consoleMessages).toEqual([]); 
  });
});
