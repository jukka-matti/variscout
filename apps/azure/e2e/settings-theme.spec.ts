import { test, expect } from '@playwright/test';

/**
 * E2E Test: Azure Settings Panel & Theme Switching
 *
 * Tests:
 * - Open/close settings panel
 * - Theme toggle (light/dark/system)
 * - Accent color presets
 * - Chart text size (Compact/Normal/Large)
 */

test.describe('Azure App: Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
  });

  test('should open and close settings panel', async ({ page }) => {
    // Open settings
    const settingsBtn = page.locator('button[aria-label="Open settings"]');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // Settings panel should be visible
    await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Close via X button
    const closeBtn = page.locator('button[aria-label="Close settings"]');
    await closeBtn.click();

    // Settings panel should be hidden
    await expect(page.locator('h2:has-text("Settings")')).not.toBeVisible({ timeout: 2000 });
  });

  test('should close settings panel via backdrop click', async ({ page }) => {
    // Open settings
    await page.locator('button[aria-label="Open settings"]').click();
    await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 3000 });

    // The settings panel is a fixed overlay with a backdrop div.
    // Click on the left side of the viewport (outside the 320px panel on the right).
    // Use page.evaluate to dispatch a click on the backdrop element directly.
    await page.evaluate(() => {
      // The backdrop is the first child of the fixed overlay (absolute inset-0 bg-black/40)
      const backdrop = document.querySelector('[class*="bg-black"]');
      if (backdrop) (backdrop as HTMLElement).click();
    });

    // Settings panel should be hidden
    await expect(page.locator('h2:has-text("Settings")')).not.toBeVisible({ timeout: 2000 });
  });

  test('should switch to light theme and update data-theme attribute', async ({ page }) => {
    // Open settings
    await page.locator('button[aria-label="Open settings"]').click();
    await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 3000 });

    // Click Light theme button
    const lightBtn = page.locator('button[aria-label="Switch to Light theme"]');
    await lightBtn.click();

    // The root element should have data-theme="light"
    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-theme', 'light', { timeout: 2000 });
  });

  test('should switch to dark theme and update data-theme attribute', async ({ page }) => {
    // Open settings and first switch to light
    await page.locator('button[aria-label="Open settings"]').click();
    await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 3000 });

    await page.locator('button[aria-label="Switch to Light theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light', { timeout: 2000 });

    // Now switch back to dark
    const darkBtn = page.locator('button[aria-label="Switch to Dark theme"]');
    await darkBtn.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 2000 });
  });

  test('should show chart text size options and allow selection', async ({ page }) => {
    // Open settings
    await page.locator('button[aria-label="Open settings"]').click();
    await expect(page.locator('text=Chart Text Size')).toBeVisible({ timeout: 3000 });

    // All three options should be visible
    await expect(page.locator('button:has-text("Compact")')).toBeVisible();
    await expect(page.locator('button:has-text("Normal")')).toBeVisible();
    await expect(page.locator('button:has-text("Large")')).toBeVisible();

    // Click Compact
    await page.locator('button:has-text("Compact")').click();

    // Compact button should have active styling (blue border)
    await expect(page.locator('button:has-text("Compact")')).toHaveClass(/border-blue-500/);
  });

  test('should show accent color presets', async ({ page }) => {
    // Open settings
    await page.locator('button[aria-label="Open settings"]').click();
    await expect(page.locator('text=Company Accent')).toBeVisible({ timeout: 3000 });

    // Accent color buttons should be visible
    const accentButtons = page.locator('button[aria-label^="Set accent color"]');
    const count = await accentButtons.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});
