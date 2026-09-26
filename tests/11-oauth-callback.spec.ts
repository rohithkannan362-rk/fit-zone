import { test, expect } from "@playwright/test";

test.describe("Phase 19 - Google OAuth & Callback Architecture", () => {
  test("Auth callback route loads without 404 on deep-link", async ({ page }) => {
    // Navigate directly to /auth/callback (simulating OAuth provider return)
    const response = await page.goto("/auth/callback");
    expect(response?.status()).toBeLessThan(400);

    // Should render the callback screen (either loading spinner or message)
    await expect(page.locator("text=Authenticating").or(page.locator("text=Authentication"))).toBeVisible({ timeout: 5000 });
  });

  test("Auth callback handles URL error parameters properly", async ({ page }) => {
    // Simulate OAuth failure redirect with error_description parameter
    await page.goto("/auth/callback?error=access_denied&error_description=User+cancelled+Google+sign+in");

    // Must display error message and not crash
    await expect(page.getByText("User cancelled Google sign in")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("link", { name: /Back to Login/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Return Home/i })).toBeVisible();
  });

  test("Google Login triggers OAuth with valid callback URL", async ({ page }) => {
    await page.goto("/member/login");

    let interceptedRedirectTo: string | null = null;

    // Intercept OAuth authorize request to verify redirect_to option
    await page.route("**/auth/v1/authorize?*", (route) => {
      const url = new URL(route.request().url());
      interceptedRedirectTo = url.searchParams.get("redirect_to");
      // Abort so we don't actually leave to external Google
      route.abort();
    });

    const googleBtn = page.getByRole("button", { name: /Continue with Google/i });
    await expect(googleBtn).toBeVisible();
    await googleBtn.click();

    // Verify redirect_to was captured and points to /auth/callback
    await expect.poll(() => interceptedRedirectTo, { timeout: 5000 }).toBeTruthy();
    expect(interceptedRedirectTo).toContain("/auth/callback");
  });

  test("Deep-link reload on /auth/callback does not 404", async ({ page }) => {
    await page.goto("/auth/callback");
    await page.reload();
    await expect(page.locator("body")).toBeVisible();
    // Must not show standard 404 error page
    await expect(page.getByText("404")).not.toBeVisible();
  });

  test("authUtils constants and callback structure are valid", async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(async () => {
      const mod = await import("/src/utils/authUtils.ts");
      return {
        productionUrl: mod.PRODUCTION_APP_URL,
        localUrl: mod.LOCAL_DEV_APP_URL,
        callbackUrl: mod.getOAuthCallbackUrl(),
      };
    });
    expect(result.productionUrl).toBe("https://fit-zone-7d3n.vercel.app");
    expect(result.localUrl).toBe("http://localhost:5173");
    expect(result.callbackUrl).toContain("/auth/callback");
  });
});
