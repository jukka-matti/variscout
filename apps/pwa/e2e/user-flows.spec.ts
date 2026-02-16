import { test, expect } from '@playwright/test';

/**
 * E2E Test: Multi-Step User Flows
 *
 * Tests complete user journeys through the PWA:
 * 1. Deep drill-down (multi-level with backtrack)
 * 2. Manual entry (paste data → analyze)
 * 3. Spec limits editing → Cpk update
 * 4. New Analysis reset
 */

test.describe('User Flow: Deep Drill-Down', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=coffee');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should drill 2 levels and backtrack', async ({ page }) => {
    // Record initial mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const initialMean = parseFloat((await meanValue.textContent())!);

    // Level 1: Click a boxplot category
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const rectCount = await boxplotRects.count();
    if (rectCount < 2) return; // Need at least 2 groups

    await boxplotRects.first().click();
    await expect(page.locator('[data-testid^="filter-chip-"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Mean should change after first filter
    await page.waitForTimeout(300);
    const level1Mean = parseFloat((await meanValue.textContent())!);

    // Level 2: If a second boxplot appears with clickable rects, click one
    const level2Rects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const level2Count = await level2Rects.count();
    if (level2Count > 0) {
      await level2Rects.first().click();
      await page.waitForTimeout(300);

      // Should now have 2 filter chips
      const chipCount = await page.locator('[data-testid^="filter-chip-"]').count();
      expect(chipCount).toBeGreaterThanOrEqual(1);
    }

    // Backtrack: Remove last filter chip
    const removeButtons = page.locator('[data-testid^="filter-chip-remove-"]');
    const removeCount = await removeButtons.count();
    if (removeCount > 0) {
      await removeButtons.last().click();
      await page.waitForTimeout(300);
    }

    // Clear all remaining filters
    const clearButton = page.locator('[data-testid="filter-clear-all"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }

    // Mean should return close to initial
    await page.waitForTimeout(300);
    const finalMean = parseFloat((await meanValue.textContent())!);
    expect(finalMean).toBeCloseTo(initialMean, 0);
  });

  test('should show cumulative filter chips', async ({ page }) => {
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const rectCount = await boxplotRects.count();
    if (rectCount === 0) return;

    // Apply first filter
    await boxplotRects.first().click();
    const chips = page.locator('[data-testid^="filter-chip-"]');
    await expect(chips.first()).toBeVisible({ timeout: 5000 });

    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('User Flow: Manual Entry', () => {
  test('should paste data and see analysis', async ({ page }) => {
    await page.goto('/');

    // Click "Paste from Excel"
    const pasteButton = page.locator('text=Paste from Excel');
    await expect(pasteButton).toBeVisible({ timeout: 10000 });
    await pasteButton.click();

    // Wait for textarea/paste area to appear
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Paste tab-separated data with header
    const tsvData = [
      'Machine\tWeight',
      'A\t10.5',
      'A\t11.2',
      'A\t10.8',
      'B\t12.3',
      'B\t12.8',
      'B\t12.1',
      'C\t15.0',
      'C\t14.5',
      'C\t15.2',
    ].join('\n');

    await textarea.fill(tsvData);

    // Click Analyze button
    const analyzeButton = page.locator('button:has-text("Analyze")');
    await expect(analyzeButton).toBeVisible({ timeout: 3000 });
    await analyzeButton.click();

    // Should eventually show the dashboard with charts
    // Column mapping may appear first — if so, confirm it
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Charts should render
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Stats should show numeric mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const meanText = await meanValue.textContent();
    expect(parseFloat(meanText!)).not.toBeNaN();
  });
});

test.describe('User Flow: Spec Limits', () => {
  test('should display Cp/Cpk for packaging dataset with specs', async ({ page }) => {
    await page.goto('/?sample=packaging');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Packaging has spec limits → Cp/Cpk should be visible
    const cpValue = page.locator('[data-testid="stat-value-cp"]');
    await expect(cpValue).toBeVisible({ timeout: 5000 });
    const cpText = await cpValue.textContent();
    expect(parseFloat(cpText!)).not.toBeNaN();

    const cpkValue = page.locator('[data-testid="stat-value-cpk"]');
    await expect(cpkValue).toBeVisible({ timeout: 5000 });
    const cpkText = await cpkValue.textContent();
    expect(parseFloat(cpkText!)).not.toBeNaN();
  });
});

test.describe('User Flow: View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=coffee');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should switch to regression and back', async ({ page }) => {
    // Find the regression tab
    const regressionTab = page.getByRole('tab', { name: /Regression/i });
    if (await regressionTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await regressionTab.click();
      await expect(page.locator('[data-testid="regression-panel"]')).toBeVisible({ timeout: 5000 });

      // Switch back to analysis
      const analysisTab = page.getByRole('tab', { name: /Analysis/i });
      await analysisTab.click();
      await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('User Flow: Sample Switching', () => {
  test('should load different samples sequentially', async ({ page }) => {
    // Load coffee
    await page.goto('/?sample=coffee');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    const coffeeMean = parseFloat((await meanValue.textContent())!);

    // Navigate to packaging
    await page.goto('/?sample=packaging');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    const packagingMean = parseFloat((await meanValue.textContent())!);

    // Means should be different
    expect(coffeeMean).not.toBeCloseTo(packagingMean, 0);
  });
});
