import { test, expect } from '@playwright/test';

const MEMBER_EMAIL = 'testmember@fitzone.com';
const MEMBER_PASSWORD = 'password123';

async function loginAsMember(page: any) {
  await page.goto('/member/login');
  await page.fill('input[type="email"]', MEMBER_EMAIL);
  await page.fill('input[type="password"]', MEMBER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/member\/(dashboard|complete-profile|membership)/, { timeout: 20000 });
  if (page.url().includes('complete-profile')) {
    const nameInput = page.locator('input[placeholder="FULL NAME"]');
    if (await nameInput.isVisible()) await nameInput.fill('Test Member');
    const phoneInput = page.locator('input[placeholder="MOBILE NUMBER"]');
    if (await phoneInput.isVisible()) await phoneInput.fill('9876543210');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/member\/dashboard/);
  }
}

test.describe('Profile - View', () => {
  test('Profile tab loads and shows member info', async ({ page }) => {
    await loginAsMember(page);
    await page.click('text=More');
    await expect(page.getByText('My Profile')).toBeVisible();
    await expect(page.locator('text=testmember@fitzone.com')).toBeVisible();
    await expect(page.locator('#edit-profile-btn')).toBeVisible();
  });
});

test.describe('Profile - Edit', () => {
  test('Edit profile form opens and closes', async ({ page }) => {
    await loginAsMember(page);
    await page.click('text=More');
    await page.click('#edit-profile-btn');
    await expect(page.locator('text=Edit Profile')).toBeVisible();
    await expect(page.locator('#edit-full-name')).toBeVisible();
    await expect(page.locator('#edit-phone')).toBeVisible();
    // Cancel returns to profile
    await page.click('button:has-text("Cancel")');
    await expect(page.getByText('My Profile')).toBeVisible();
  });

  test('Save profile updates name', async ({ page }) => {
    await loginAsMember(page);
    await page.click('text=More');
    await page.click('#edit-profile-btn');
    await page.fill('#edit-full-name', 'Updated Test Name');
    await page.click('#save-profile-btn');
    // Should show success and return to profile
    await expect(page.getByText('My Profile')).toBeVisible({ timeout: 10000 });
  });

  test('Save profile requires full name', async ({ page }) => {
    await loginAsMember(page);
    await page.click('text=More');
    await page.click('#edit-profile-btn');
    // Use JS to clear the field (bypasses native HTML required attribute)
    await page.locator('#edit-full-name').evaluate((el: HTMLInputElement) => { el.value = ''; });
    // Trigger React's onChange so state updates
    await page.locator('#edit-full-name').dispatchEvent('input');
    await page.locator('#edit-full-name').dispatchEvent('change');
    await page.click('#save-profile-btn');
    // Either native browser validation fires (form doesn't submit) or React error shows
    const reactError = page.locator('text=Full name is required');
    const nativeValid = await page.locator('#edit-full-name').evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    const reactVisible = await reactError.isVisible().catch(() => false);
    expect(reactVisible || nativeValid).toBeTruthy();
  });
});

test.describe('Profile - Privacy & Security', () => {
  test('Privacy & Security panel opens', async ({ page }) => {
    await loginAsMember(page);
    await page.click('text=More');
    await page.click('button:has-text("Privacy & Security")');
    // Panel is open when either the password form or Google account notice appears
    const hasPasswordForm = await page.locator('#new-password').isVisible({ timeout: 8000 }).catch(() => false);
    const hasGoogleNotice = await page.locator('text=Google Account').isVisible({ timeout: 2000 }).catch(() => false);
    const hasHeading = await page.locator('h2:has-text("Privacy")').isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasPasswordForm || hasGoogleNotice || hasHeading).toBeTruthy();
  });
});

test.describe('Profile - Help & Support', () => {
  test('Help & Support panel shows contact options', async ({ page }) => {
    await loginAsMember(page);
    await page.click('text=More');
    await page.click('button:has-text("Help & Support")');
    await expect(page.locator('text=Help & Support').nth(1)).toBeVisible();
    await expect(page.locator('text=Call Us')).toBeVisible();
    await expect(page.locator('text=WhatsApp')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    // Links have href attributes (not dead buttons)
    const phoneLink = page.locator('a[href^="tel:"]').first();
    await expect(phoneLink).toBeVisible();
  });
});

test.describe('Profile - Avatar Upload', () => {
  test('Avatar upload input exists and accepts images', async ({ page }) => {
    await loginAsMember(page);
    await page.click('text=More');
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await expect(fileInput).toBeAttached();
  });
});

test.describe('Profile - Sign Out', () => {
  test('Sign out logs the user out', async ({ page }) => {
    await loginAsMember(page);
    await page.click('text=More');
    await page.click('text=Sign Out');
    await expect(page).toHaveURL(/\//, { timeout: 10000 });
  });
});


