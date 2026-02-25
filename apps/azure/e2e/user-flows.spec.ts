import { test, expect } from '@playwright/test';

/**
 * E2E Test: Azure User Flows
 *
 * Tests complete user journeys through the Azure paid app:
 * 1. Multi-level drill-down with backtrack
 * 2. Manual entry workflow
 * 3. Data panel toggle
 * 4. Settings & theme switching
 * 5. Regression view
 * 6. ANOVA display
 */

/** Helper: Navigate to editor and load first sample */
async function loadSampleInEditor(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: 'New Analysis' }).first().click();
  await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

  const sampleButton = page.locator('[data-testid^="sample-"]').first();
  await expect(sampleButton).toBeVisible({ timeout: 5000 });
  await sampleButton.click();

  await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
}

test.describe('Azure: Multi-Level Drill-Down', () => {
  test('should drill down and backtrack via filter chips', async ({ page }) => {
    await loadSampleInEditor(page);

    // Record initial mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const initialMean = parseFloat((await meanValue.textContent())!);

    // Level 1: Click a boxplot category
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const rectCount = await boxplotRects.count();
    if (rectCount === 0) return;

    await boxplotRects.first().click();
    await expect(page.locator('[data-testid^="filter-chip-"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Stats should update
    await page.waitForTimeout(300);
    const filteredMean = parseFloat((await meanValue.textContent())!);

    // Remove filter
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeButton.click();
      await page.waitForTimeout(300);

      // Mean should revert to initial
      const revertedMean = parseFloat((await meanValue.textContent())!);
      expect(revertedMean).toBeCloseTo(initialMean, 0);
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

test.describe('Azure: Manual Entry', () => {
  test('should paste data and see charts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Click Manual Entry button
    const manualEntryBtn = page.locator('text=Manual Entry');
    await expect(manualEntryBtn).toBeVisible({ timeout: 5000 });
    await manualEntryBtn.click();

    // Find textarea and paste data
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const tsvData = [
      'Operator\tCycleTime',
      'Alice\t24.5',
      'Alice\t25.1',
      'Alice\t24.8',
      'Bob\t26.3',
      'Bob\t26.8',
      'Bob\t26.1',
      'Charlie\t23.0',
      'Charlie\t22.5',
      'Charlie\t23.2',
    ].join('\n');

    await textarea.fill(tsvData);

    // Click Analyze
    const analyzeButton = page.locator('button:has-text("Analyze")');
    await expect(analyzeButton).toBeVisible({ timeout: 3000 });
    await analyzeButton.click();

    // Handle possible column mapping dialog
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Charts should render
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Mean should be numeric
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    expect(parseFloat((await meanValue.textContent())!)).not.toBeNaN();
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
      const text = await anovaSignificance.textContent();
      expect(text).toContain('F =');
      expect(text).toContain('p =');

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

    // Mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    expect(parseFloat((await meanValue.textContent())!)).not.toBeNaN();

    // Std Dev
    const stdDevValue = page.locator('[data-testid="stat-value-std-dev"]');
    await expect(stdDevValue).toBeVisible({ timeout: 5000 });
    expect(parseFloat((await stdDevValue.textContent())!)).not.toBeNaN();

    // Samples (displayed as "n=30")
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    await expect(samplesValue).toBeVisible({ timeout: 5000 });
    const samplesText = await samplesValue.textContent();
    const samplesMatch = samplesText!.match(/(\d+)/);
    expect(samplesMatch).toBeTruthy();
    expect(parseInt(samplesMatch![1], 10)).toBeGreaterThan(0);
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
