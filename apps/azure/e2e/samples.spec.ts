import { test, expect } from '@playwright/test';
import {
  expectChartSummaryStats,
  loadSampleToCharts,
  resetToFreshAnalysis,
  startNewAnalysis,
} from './helpers';

/**
 * E2E Test: Azure Sample Datasets
 *
 * Verifies sample datasets load correctly in the Azure editor.
 */

test.describe('Azure App: Sample Datasets', () => {
  test.beforeEach(async ({ page }) => {
    await startNewAnalysis(page);
  });

  test('should show sample dataset grid in empty state', async ({ page }) => {
    // Should see sample buttons
    const sampleButtons = page.locator('[data-testid^="sample-"]');
    const count = await sampleButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should load first sample and render charts', async ({ page }) => {
    await loadSampleToCharts(page);

    // SVG should be present
    const svg = page.locator('[data-testid="chart-ichart"] svg');
    await expect(svg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show stats panel with numeric values', async ({ page }) => {
    await loadSampleToCharts(page);

    await expectChartSummaryStats(page);
  });

  test('should load multiple samples sequentially', async ({ page }) => {
    // Load first sample (coffee)
    await loadSampleToCharts(page, 'sample-coffee');

    await expectChartSummaryStats(page);

    await resetToFreshAnalysis(page);
    await loadSampleToCharts(page, 'sample-cookie-weight');

    await expectChartSummaryStats(page);
  });
});
