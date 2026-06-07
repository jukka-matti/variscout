import { test, expect } from '@playwright/test';
import { loadSampleToCharts, startNewAnalysis } from './helpers';

/**
 * E2E Test: Azure Analysis View Switching
 *
 * Tests that the analysis tab renders correctly with charts.
 */

test.describe('Azure Analysis View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await startNewAnalysis(page);
    await loadSampleToCharts(page);
  });

  test('should render analysis tab by default', async ({ page }) => {
    // Analysis tab charts should be visible
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible();
  });
});
