import { test, expect } from '@playwright/test';
import { expectChartSummaryStats, loadSampleToCharts, startNewAnalysis } from './helpers';

/**
 * E2E Test: Azure Stats Panel & ANOVA Display
 *
 * Tests statistics display and ANOVA results in the Azure app:
 * 1. Load sample → verify mean, sigma, sample count
 * 2. Maximize boxplot → verify ANOVA results section
 * 3. Verify F-stat, p-value, eta-squared
 *
 * Uses the coffee sample (has categorical factors → ANOVA displays).
 * ANOVA is shown in the focused boxplot view (after maximizing the boxplot card).
 */

test.describe('Azure Stats Panel', () => {
  test.beforeEach(async ({ page }) => {
    await startNewAnalysis(page);
    await loadSampleToCharts(page, 'sample-coffee');
  });

  test('should display numeric mean value', async ({ page }) => {
    await expect(page.locator('text=/x̄\\d/').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display sample count', async ({ page }) => {
    await expect(page.locator('text=/n\\d/').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display std dev value', async ({ page }) => {
    await expect(page.locator('text=/σ\\d/').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display ANOVA results when groups exist', async ({ page }) => {
    // Maximize the boxplot card to see focused view with ANOVA
    const boxplotMaxBtn = page
      .locator('[data-testid="chart-boxplot"]')
      .locator('button[aria-label="Maximize chart"]');
    await expect(boxplotMaxBtn).toBeVisible({ timeout: 5000 });
    await boxplotMaxBtn.click();

    // ANOVA should display in the focused boxplot view
    const anovaResults = page.locator('[data-testid="anova-results"]');
    await expect(anovaResults).toBeVisible({ timeout: 5000 });
  });

  test('should display F-stat and p-value in ANOVA', async ({ page }) => {
    // Maximize the boxplot card to see focused view with ANOVA
    const boxplotMaxBtn = page
      .locator('[data-testid="chart-boxplot"]')
      .locator('button[aria-label="Maximize chart"]');
    await boxplotMaxBtn.click();

    const anovaSignificance = page.locator('[data-testid="anova-significance"]');
    await expect(anovaSignificance).toBeVisible({ timeout: 5000 });

    await expect(anovaSignificance).toContainText(/\d/);
  });

  test('should display eta-squared in ANOVA', async ({ page }) => {
    // Maximize the boxplot card to see focused view with ANOVA
    const boxplotMaxBtn = page
      .locator('[data-testid="chart-boxplot"]')
      .locator('button[aria-label="Maximize chart"]');
    await boxplotMaxBtn.click();

    const etaSquared = page.locator('[data-testid="anova-eta-squared"]');
    await expect(etaSquared).toBeVisible({ timeout: 5000 });

    const text = await etaSquared.textContent();
    expect(text).toContain('η²');
  });

  test('should display all chart summary statistics', async ({ page }) => {
    await expectChartSummaryStats(page);
  });
});
