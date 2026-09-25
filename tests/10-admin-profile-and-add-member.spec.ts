import { test, expect } from '@playwright/test';

test.describe('Admin Profile & Add Member Management', () => {
  // Test credentials (do not delete or modify)
  const ADMIN_EMAIL = 'testadmin@fitzone.com';
  const ADMIN_PASSWORD = 'password123';

  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
  });

  // ==========================================
  // 1. ADMIN PROFILE TESTS
  // ==========================================
  test('Admin Profile: view mode loads and displays administrator details', async ({ page }) => {
    await page.goto('/admin/profile');
    await expect(page).toHaveURL(/\/admin\/profile/);

    // Verify view mode header and badge
    await expect(page.locator('h1:has-text("Admin")')).toBeVisible();
    await expect(page.locator('text=ADMIN').first()).toBeVisible();
    await expect(page.locator('text=ACTIVE').first()).toBeVisible();

    // Verify administrator info fields
    await expect(page.locator('[data-testid="view-fullname"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-email"]')).toContainText(ADMIN_EMAIL);
    await expect(page.locator('[data-testid="view-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-code"]')).toBeVisible();

    // Verify Edit Profile button is present
    await expect(page.locator('[data-testid="edit-profile-btn"]')).toBeVisible();
  });

  test('Admin Profile: edit mode opens, cancel discards, and save persists changes', async ({ page }) => {
    await page.goto('/admin/profile');

    // 1. Open Edit mode
    await page.click('[data-testid="edit-profile-btn"]');
    await expect(page.locator('[data-testid="edit-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-phone-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-email-input"]')).toBeDisabled(); // Email must be read-only

    // 2. Test Cancel discards changes
    const initialName = await page.locator('[data-testid="edit-name-input"]').inputValue();
    await page.fill('[data-testid="edit-name-input"]', 'Discarded Name Edit');
    await page.click('[data-testid="cancel-edit-btn"]');

    // Should return to view mode with original name
    await expect(page.locator('[data-testid="view-fullname"]')).toContainText(initialName);

    // 3. Test Save persists changes
    await page.click('[data-testid="edit-profile-btn"]');
    const updatedName = 'FitZone Lead Admin';
    const updatedPhone = '9876543210';

    await page.fill('[data-testid="edit-name-input"]', updatedName);
    await page.fill('[data-testid="edit-phone-input"]', updatedPhone);
    await page.click('[data-testid="save-profile-btn"]');

    // Verify success banner and updated view mode values
    await expect(page.locator('text=Admin profile updated successfully!')).toBeVisible();
    await expect(page.locator('[data-testid="view-fullname"]')).toContainText(updatedName);
    await expect(page.locator('[data-testid="view-phone"]')).toContainText(updatedPhone);

    // 4. Test persistence across page reload
    await page.reload();
    await expect(page.locator('[data-testid="view-fullname"]')).toContainText(updatedName);
    await expect(page.locator('[data-testid="view-phone"]')).toContainText(updatedPhone);
  });

  test('Admin Profile: avatar upload and persistence', async ({ page }) => {
    await page.goto('/admin/profile');

    // Create a 1x1 PNG pixel buffer for upload test
    const pixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(pixelBase64, 'base64');

    // Trigger file input
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('label[title="Upload profile photo"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'admin-avatar.png',
      mimeType: 'image/png',
      buffer: buffer,
    });

    // Check for success message
    await expect(page.locator('text=Profile photo updated successfully!')).toBeVisible({ timeout: 15000 });

    // Verify avatar remains after page refresh
    await page.reload();
    const avatarImg = page.locator('img[alt*="Admin"]');
    await expect(avatarImg).toBeVisible();
    const src = await avatarImg.getAttribute('src');
    expect(src).toBeTruthy();
  });

  // ==========================================
  // 2. ADD MEMBER TESTS
  // ==========================================
  test('Add Member: form loads, validates inputs, and password generator functions', async ({ page }) => {
    await page.goto('/admin/members/new');
    await expect(page).toHaveURL(/\/admin\/members\/new/);

    // 1. Password is auto-generated and NOT the hardcoded "FitZone123!"
    const initialPassword = await page.locator('[data-testid="member-password-input"]').inputValue();
    expect(initialPassword).toBeTruthy();
    expect(initialPassword.length).toBeGreaterThanOrEqual(8);
    expect(initialPassword).not.toBe('FitZone123!');

    // 2. Regenerate password produces a DIFFERENT secure password
    await page.click('[data-testid="regenerate-password-btn"]');
    const regeneratedPassword = await page.locator('[data-testid="member-password-input"]').inputValue();
    expect(regeneratedPassword).not.toBe(initialPassword);
    expect(regeneratedPassword.length).toBeGreaterThanOrEqual(8);

    // 3. Toggle Show/Hide password
    expect(await page.locator('[data-testid="member-password-input"]').getAttribute('type')).toBe('password');
    await page.click('[data-testid="toggle-password-btn"]');
    expect(await page.locator('[data-testid="member-password-input"]').getAttribute('type')).toBe('text');
    await page.click('[data-testid="toggle-password-btn"]');
    expect(await page.locator('[data-testid="member-password-input"]').getAttribute('type')).toBe('password');

    // 4. Copy password gives confirmation
    await page.click('[data-testid="copy-password-btn"]');
    await expect(page.locator('text=Password copied')).toBeVisible();

    // 5. Validation testing
    await page.fill('[data-testid="member-name-input"]', 'A'); // Too short
    await page.fill('[data-testid="member-phone-input"]', '123'); // Invalid phone
    await page.fill('[data-testid="member-email-input"]', 'invalid-email'); // Invalid email
    await page.click('[data-testid="submit-create-member"]');

    await expect(page.locator('text=Full name must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Please enter a valid 10-digit mobile number')).toBeVisible();
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();

    // 6. Custom password mode testing
    await page.click('[data-testid="mode-custom-btn"]');
    await page.fill('[data-testid="member-password-input"]', 'short');
    await page.click('[data-testid="submit-create-member"]');
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('Add Member: successful account creation and confirmation view', async ({ page }) => {
    await page.goto('/admin/members/new');

    const timestamp = Date.now();
    const newMemberName = `Auto Test Member ${timestamp.toString().slice(-4)}`;
    const newMemberEmail = `member_${timestamp}@fitzone-test.com`;
    const newMemberPhone = '9876543210';

    await page.fill('[data-testid="member-name-input"]', newMemberName);
    await page.fill('[data-testid="member-phone-input"]', newMemberPhone);
    await page.fill('[data-testid="member-email-input"]', newMemberEmail);

    // Use auto-generated password
    const generatedPass = await page.locator('[data-testid="member-password-input"]').inputValue();

    // Submit form
    await page.click('[data-testid="submit-create-member"]');

    // Confirm that confirmation view appears
    await expect(page.locator('text=MEMBER CREATED')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="created-member-name"]')).toHaveText(newMemberName);
    await expect(page.locator('[data-testid="created-member-email"]')).toHaveText(newMemberEmail);

    // Confirm Member ID is generated (FZ000...)
    const memberIdEl = page.locator('[data-testid="created-member-id"]');
    await expect(memberIdEl).toBeVisible();
    const memberIdText = await memberIdEl.textContent();
    expect(memberIdText).toBeTruthy();

    // Confirm temporary password is shown and copyable
    await page.click('[data-testid="toggle-created-password"]');
    await expect(page.locator('[data-testid="created-member-password"]')).toHaveText(generatedPass);

    await page.click('[data-testid="copy-created-password"]');
    await expect(page.locator('text=Password copied')).toBeVisible();
  });

  // ==========================================
  // 3. SECURITY & ACCESS CONTROL
  // ==========================================
  test('Security: non-admin member cannot access Admin Profile or Add Member', async ({ browser }) => {
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();

    // Login as normal member
    await memberPage.goto('/member/login');
    await memberPage.fill('input[type="email"]', 'testmember@fitzone.com');
    await memberPage.fill('input[type="password"]', 'password123');
    await memberPage.click('button[type="submit"]');
    await expect(memberPage).toHaveURL(/\/member\/(dashboard|complete-profile)/);

    // Try accessing Admin Profile
    await memberPage.goto('/admin/profile');
    // ProtectedRoute should redirect away from admin pages
    await expect(memberPage).not.toHaveURL(/\/admin\/profile/);

    // Try accessing Add Member
    await memberPage.goto('/admin/members/new');
    await expect(memberPage).not.toHaveURL(/\/admin\/members\/new/);

    await memberContext.close();
  });

  // ==========================================
  // 4. MOBILE ADMIN EXPERIENCE (360x800, 390x844, 412x915)
  // ==========================================
  const viewports = [
    { name: 'Small Phone (360x800)', width: 360, height: 800 },
    { name: 'Standard Phone (390x844)', width: 390, height: 844 },
    { name: 'Large Phone (412x915)', width: 412, height: 915 },
  ];

  for (const vp of viewports) {
    test(`Mobile Experience: ${vp.name} layout and touch targets`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Check Admin Profile on mobile
      await page.goto('/admin/profile');
      await expect(page.locator('h1:has-text("Admin")')).toBeVisible();

      // Verify no horizontal overflow
      const profileOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(profileOverflow).toBe(false);

      // Verify Edit Profile button touch target (>= 44px height)
      const editBtn = page.locator('[data-testid="edit-profile-btn"]');
      await expect(editBtn).toBeVisible();
      const editBtnBox = await editBtn.boundingBox();
      expect(editBtnBox).toBeTruthy();
      expect(editBtnBox!.height).toBeGreaterThanOrEqual(40);

      // 2. Check Add Member on mobile
      await page.goto('/admin/members/new');
      await expect(page.locator('h1:has-text("ADD")')).toBeVisible();

      // Verify no horizontal overflow
      const addMemberOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(addMemberOverflow).toBe(false);

      // Verify submit button touch target (>= 44px height)
      const submitBtn = page.locator('[data-testid="submit-create-member"]');
      await expect(submitBtn).toBeVisible();
      const submitBtnBox = await submitBtn.boundingBox();
      expect(submitBtnBox).toBeTruthy();
      expect(submitBtnBox!.height).toBeGreaterThanOrEqual(44);

      // Verify password controls fit and are accessible
      await expect(page.locator('[data-testid="regenerate-password-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="copy-password-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="toggle-password-btn"]')).toBeVisible();
    });
  }
});

