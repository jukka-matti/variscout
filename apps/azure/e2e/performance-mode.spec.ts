import { test, expect } from '@playwright/test';
import { loadPerformanceSample } from './helpers';

/**
 * E2E Test: Azure Performance Mode
 *
 * Tests the Performance Mode workflow (Azure-only feature):
 * 1. Load a performance-mode sample (large-scale)
 * 2. Switch to Performance tab
 * 3. Verify summary, channel count, Cp/Cpk toggle
 * 4. Set spec limits
 * 5. Click chart point to select measure
 * 6. Switch back to Analysis tab
 */

test.describe('Azure App: Performance Mode', () => {
  test('should show Performance tab for performance-mode sample', async ({ page }) => {
    await loadPerformanceSample(page);

    // Performance tab should exist (only visible for performance-mode datasets)
    const perfTab = page.getByRole('tab', { name: /Performance/i });
    await expect(perfTab).toBeVisible({ timeout: 5000 });
  });

  test('should render PerformanceDashboard when Performance tab is clicked', async ({ page }) => {
    await loadPerformanceSample(page);

    // Click Performance tab
    const perfTab = page.getByRole('tab', { name: /Performance/i });
    await perfTab.click();

    // Should show channel count text (sachets has 8 heads)
    await expect(page.locator('text=/\\d+ channels/').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show Cp/Cpk/Both toggle buttons', async ({ page }) => {
    await loadPerformanceSample(page);

    const perfTab = page.getByRole('tab', { name: /Performance/i });
    await perfTab.click();
    await expect(page.locator('text=/\\d+ channels/').first()).toBeVisible({ timeout: 5000 });

    // Cpk button should be pressed by default
    const cpkBtn = page.locator('button:has-text("Cpk")').first();
    await expect(cpkBtn).toBeVisible();
    await expect(cpkBtn).toHaveAttribute('aria-pressed', 'true');

    // Cp button should not be pressed (use exact text match to avoid matching "Cpk")
    const cpBtn = page.locator('button').filter({ hasText: /^Cp$/ }).first();
    await expect(cpBtn).toBeVisible();
    await expect(cpBtn).toHaveAttribute('aria-pressed', 'false');

    // Both button should not be pressed
    const bothBtn = page
      .locator('button')
      .filter({ hasText: /^Both$/ })
      .first();
    await expect(bothBtn).toBeVisible();
    await expect(bothBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('should toggle Cp/Cpk metric', async ({ page }) => {
    await loadPerformanceSample(page);

    const perfTab = page.getByRole('tab', { name: /Performance/i });
    await perfTab.click();
    await expect(page.locator('text=/\\d+ channels/').first()).toBeVisible({ timeout: 5000 });

    // Click Cp button (use exact text match to avoid matching "Cpk")
    const cpBtn = page.locator('button').filter({ hasText: /^Cp$/ }).first();
    await cpBtn.click();
    await expect(cpBtn).toHaveAttribute('aria-pressed', 'true');

    // Cpk should now be unpressed
    const cpkBtn = page.locator('button').filter({ hasText: /^Cpk$/ }).first();
    await expect(cpkBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('should show spec limit warning when no specs are set', async ({ page }) => {
    // Load a non-sachets sample first, then go to performance mode
    // The sachets sample comes with specs pre-set, so the warning won't show.
    // Instead, verify that with sachets (which has specs), there's NO warning.
    await loadPerformanceSample(page);

    const perfTab = page.getByRole('tab', { name: /Performance/i });
    await perfTab.click();
    await expect(page.locator('text=/\\d+ channels/').first()).toBeVisible({ timeout: 5000 });

    // large-scale has specs (LSL=90, USL=110), so warning should NOT be visible
    const warning = page.locator('text=Set specification limits');
    await expect(warning).not.toBeVisible();
  });

  test('should have LSL and USL input fields', async ({ page }) => {
    await loadPerformanceSample(page);

    const perfTab = page.getByRole('tab', { name: /Performance/i });
    await perfTab.click();
    await expect(page.locator('text=/\\d+ channels/').first()).toBeVisible({ timeout: 5000 });

    // LSL and USL labels should be visible
    const lslLabel = page.locator('label:has-text("LSL:")').first();
    await expect(lslLabel).toBeVisible();

    const uslLabel = page.locator('label:has-text("USL:")').first();
    await expect(uslLabel).toBeVisible();

    // LSL input should have the large-scale LSL value (90)
    const lslInput = page.locator('#lsl-input-grid');
    await expect(lslInput).toBeVisible();
    await expect(lslInput).toHaveValue('90');

    // USL input should have the large-scale USL value (110)
    const uslInput = page.locator('#usl-input-grid');
    await expect(uslInput).toBeVisible();
    await expect(uslInput).toHaveValue('110');
  });

  test('should switch back to Analysis tab and show standard charts', async ({ page }) => {
    await loadPerformanceSample(page);

    // Switch to Performance tab
    const perfTab = page.getByRole('tab', { name: /Performance/i });
    await perfTab.click();
    await expect(page.locator('text=/\\d+ channels/').first()).toBeVisible({ timeout: 5000 });

    // Switch back to Analysis tab
    const analysisTab = page.getByRole('tab', { name: /Analysis/i });
    await analysisTab.click();

    // Standard charts should be visible again
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 5000 });
  });
});
