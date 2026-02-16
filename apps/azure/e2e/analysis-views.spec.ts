import { test, expect } from '@playwright/test';

/**
 * E2E Test: Azure Analysis View Switching
 *
 * Tests switching between Analysis and Regression tabs:
 * 1. Auth → New Analysis → load sample → verify charts
 * 2. Switch to Regression tab → verify panel
 * 3. Switch back to Analysis → verify charts return
 */

test.describe('Azure Analysis View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Navigate to editor with new analysis
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Load first sample dataset
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await expect(sampleButton).toBeVisible({ timeout: 5000 });
    await sampleButton.click();

    // Wait for dashboard to fully load
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should render analysis tab by default', async ({ page }) => {
    // Analysis tab charts should be visible
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible();
  });

  test('should switch to regression tab', async ({ page }) => {
    // Click the Regression tab button
    const regressionTab = page.getByRole('tab', { name: /Regression/i });
    await expect(regressionTab).toBeVisible({ timeout: 3000 });
    await regressionTab.click();

    // Regression panel should be visible
    await expect(page.locator('[data-testid="regression-panel"]')).toBeVisible({ timeout: 5000 });

    // Analysis charts should not be visible
    await expect(page.locator('[data-testid="chart-ichart"]')).not.toBeVisible();
  });

  test('should render SVG elements in regression view', async ({ page }) => {
    // Switch to regression tab
    await page.getByRole('tab', { name: /Regression/i }).click();
    await expect(page.locator('[data-testid="regression-panel"]')).toBeVisible({ timeout: 5000 });

    // Regression panel should contain SVG chart elements
    const regressionSvg = page.locator('[data-testid="regression-panel"] svg');
    await expect(regressionSvg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch back to analysis from regression', async ({ page }) => {
    // Switch to regression
    await page.getByRole('tab', { name: /Regression/i }).click();
    await expect(page.locator('[data-testid="regression-panel"]')).toBeVisible({ timeout: 5000 });

    // Switch back to analysis
    await page.getByRole('tab', { name: /Analysis/i }).click();

    // Charts should be visible again
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible();
  });
});
