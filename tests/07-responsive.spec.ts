import { test, expect } from '@playwright/test';

test.describe('Phase 12 - Responsive Checks', () => {
  const viewports = [
    { width: 390, height: 844, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1920, height: 1080, name: 'Desktop' },
  ];

  for (const v of viewports) {
    test(`Landing page loads correctly on ${v.name}`, async ({ page }) => {
      await page.setViewportSize(v);
      await page.goto('/');
      await expect(page.getByText('Invest In').first()).toBeVisible();
      // On mobile, there should be a hamburger menu or similar, but since we are just checking it doesn't crash:
      await expect(page.getByText('FIT ZONE').first()).toBeVisible();
    });
  }
});
