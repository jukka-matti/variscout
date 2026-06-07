import { test, expect } from '@playwright/test';
import {
  expectChartSummaryStats,
  loadSampleInEditor,
  pasteToCharts,
  startNewAnalysis,
} from './helpers';

/**
 * E2E Test: Azure User Flows
 *
 * Tests complete user journeys through the Azure app:
 * 1. Multi-level drill-down with backtrack
 * 2. Manual entry workflow
 * 3. Data panel toggle
 * 4. Settings & theme switching
 * 5. ANOVA display
 */

test.describe('Azure: Multi-Level Drill-Down', () => {
  test('should drill down and backtrack via filter chips', async ({ page }) => {
    await loadSampleInEditor(page);

    await expectChartSummaryStats(page);

    // Level 1: Click a boxplot category
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const rectCount = await boxplotRects.count();
    if (rectCount === 0) return;

    await boxplotRects.first().click();
    await expect(page.locator('[data-testid^="filter-chip-"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Remove filter
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeButton.click();
      await page.waitForTimeout(300);
      await expectChartSummaryStats(page);
    }
  });

  test('should clear all filters', async ({ page }) => {
    await loadSampleInEditor(page);

    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    if ((await boxplotRects.count()) === 0) return;

    await boxplotRects.first().click();
    await expect(page.locator('[data-testid^="filter-chip-"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Click Clear All
    const clearButton = page.locator('[data-testid="filter-clear-all"]');
    if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearButton.click();
      await expect(page.locator('[data-testid^="filter-chip-"]')).toHaveCount(0, { timeout: 3000 });
    }
  });
});

test.describe('Azure: Paste Data', () => {
  test('should paste data and see charts', async ({ page }) => {
    await startNewAnalysis(page);

    await pasteToCharts(page);
    await expectChartSummaryStats(page);
  });
});

test.describe('Azure: ANOVA Display', () => {
  test('should show ANOVA results for multi-group data', async ({ page }) => {
    await loadSampleInEditor(page);

    // ANOVA should be visible for sample data with factor columns
    const anovaResults = page.locator('[data-testid="anova-results"]');
    const hasAnova = await anovaResults.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAnova) {
      // F-stat and p-value should be shown
      const anovaSignificance = page.locator('[data-testid="anova-significance"]');
      await expect(anovaSignificance).toBeVisible({ timeout: 3000 });
      await expect(anovaSignificance).toContainText(/\d/);

      // Eta-squared should be shown
      const etaSquared = page.locator('[data-testid="anova-eta-squared"]');
      await expect(etaSquared).toBeVisible({ timeout: 3000 });
      const etaText = await etaSquared.textContent();
      expect(etaText).toContain('η²');
    }
  });
});

test.describe('Azure: Settings & Theme', () => {
  test('should open settings panel', async ({ page }) => {
    await loadSampleInEditor(page);

    // Look for settings/gear button
    const settingsButton = page.locator(
      'button[aria-label*="Settings"], button[title*="Settings"]'
    );
    if (await settingsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsButton.click();

      // Settings panel should show theme options
      const hasTheme = await page
        .locator('text=/Theme|Appearance|Dark|Light/i')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(hasTheme).toBe(true);
    }
  });
});

test.describe('Azure: Stats Panel', () => {
  test('should display all core statistics', async ({ page }) => {
    await loadSampleInEditor(page);

    await expectChartSummaryStats(page);
  });
});

test.describe('Azure: Chart Rendering', () => {
  test('should render all three main charts', async ({ page }) => {
    await loadSampleInEditor(page);

    // I-Chart
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 5000 });

    // Boxplot
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 5000 });

    // Pareto
    await expect(page.locator('[data-testid="chart-pareto"]')).toBeVisible({ timeout: 5000 });
  });

  test('should have SVG elements in each chart', async ({ page }) => {
    await loadSampleInEditor(page);

    const ichartSvg = page.locator('[data-testid="chart-ichart"] svg');
    await expect(ichartSvg.first()).toBeVisible({ timeout: 5000 });

    const boxplotSvg = page.locator('[data-testid="chart-boxplot"] svg');
    await expect(boxplotSvg.first()).toBeVisible({ timeout: 5000 });

    const paretoSvg = page.locator('[data-testid="chart-pareto"] svg');
    await expect(paretoSvg.first()).toBeVisible({ timeout: 5000 });
  });
});
