import { test, expect } from '@playwright/test';

/**
 * E2E Test: Analysis View Switching
 *
 * Tests switching between Dashboard and Regression views via tab navigation:
 * 1. Load sample → verify dashboard charts render
 * 2. Click Regression tab → verify panel
 * 3. Click Dashboard tab → verify charts return
 */

test.describe('Analysis View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=coffee');

    // Wait for dashboard to fully load
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should render dashboard view by default', async ({ page }) => {
    // I-Chart, Boxplot, and Stats should all be visible
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-stats"]')).toBeVisible();
  });

  test('should switch to regression view via tab', async ({ page }) => {
    // Click the Regression tab
    const regressionTab = page.getByRole('tab', { name: /Regression/i });
    await expect(regressionTab).toBeVisible({ timeout: 3000 });
    await regressionTab.click();

    // Regression panel should be visible
    await expect(page.locator('[data-testid="regression-panel"]')).toBeVisible({ timeout: 5000 });

    // Dashboard charts should not be visible
    await expect(page.locator('[data-testid="chart-ichart"]')).not.toBeVisible();
  });

  test('should render scatter plot SVG in regression view', async ({ page }) => {
    // Switch to regression view via tab
    await page.getByRole('tab', { name: /Regression/i }).click();

    // Wait for regression panel
    await expect(page.locator('[data-testid="regression-panel"]')).toBeVisible({ timeout: 5000 });

    // Regression panel should contain SVG chart elements (scatter plots)
    const regressionSvg = page.locator('[data-testid="regression-panel"] svg');
    await expect(regressionSvg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch back to dashboard from regression', async ({ page }) => {
    // Switch to regression via tab
    await page.getByRole('tab', { name: /Regression/i }).click();
    await expect(page.locator('[data-testid="regression-panel"]')).toBeVisible({ timeout: 5000 });

    // Switch back to Dashboard via tab
    await page.getByRole('tab', { name: /Dashboard/i }).click();

    // Dashboard charts should be visible again
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible();
  });
});
