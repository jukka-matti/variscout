import { test, expect } from '@playwright/test';

/**
 * E2E Test: Analysis View Switching
 *
 * Tests that the dashboard view renders correctly with charts.
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
});
