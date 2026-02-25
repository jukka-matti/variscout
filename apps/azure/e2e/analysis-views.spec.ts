import { test, expect } from '@playwright/test';

/**
 * E2E Test: Azure Analysis View Switching
 *
 * Tests that the analysis tab renders correctly with charts.
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
});
