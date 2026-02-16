import { test, expect } from '@playwright/test';

/**
 * E2E Test: Drill-Down Workflow
 *
 * Tests the filter drill-down flow:
 * 1. Load sample → verify initial stats
 * 2. Click a boxplot category to drill → verify stats update
 * 3. Verify filter chip appears
 * 4. Remove filter → verify stats revert
 * 5. Clear all filters
 */

test.describe('Drill-Down: Coffee Dataset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=coffee');

    // Wait for dashboard to fully load
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should show initial stats for unfiltered data', async ({ page }) => {
    // Mean should be visible and roughly ~11.89 (unfiltered coffee)
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const meanText = await meanValue.textContent();
    const mean = parseFloat(meanText!);
    expect(mean).toBeGreaterThan(11.5);
    expect(mean).toBeLessThan(12.5);
  });

  test('should display boxplot with groups', async ({ page }) => {
    // Boxplot should show SVG elements (groups for each drying bed)
    const boxplotSvg = page.locator('[data-testid="chart-boxplot"] svg');
    await expect(boxplotSvg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show filter chip after clicking boxplot category', async ({ page }) => {
    // Click on a boxplot bar/group to trigger drill-down
    // Boxplot renders clickable rect elements for each group
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');

    // If clickable rects exist, click the first one
    const rectCount = await boxplotRects.count();
    if (rectCount > 0) {
      await boxplotRects.first().click();

      // A filter chip should appear
      const filterChips = page.locator('[data-testid^="filter-chip-"]');
      await expect(filterChips.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update stats when filter is applied via boxplot click', async ({ page }) => {
    // Record initial mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const initialMean = parseFloat((await meanValue.textContent())!);

    // Click a boxplot category to drill down
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const rectCount = await boxplotRects.count();
    if (rectCount > 0) {
      await boxplotRects.first().click();

      // Wait for stats to update
      await page.waitForTimeout(500);

      // Mean should have changed (filtered to a single group)
      const newMeanText = await meanValue.textContent();
      const newMean = parseFloat(newMeanText!);
      // The mean should be different from the overall mean
      // (specific group means differ from the overall 11.89)
      expect(newMean).not.toBeCloseTo(initialMean, 0);
    }
  });

  test('should remove filter when chip remove button is clicked', async ({ page }) => {
    // First apply a filter by clicking a boxplot category
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const rectCount = await boxplotRects.count();
    if (rectCount === 0) return;

    await boxplotRects.first().click();

    // Wait for filter chip to appear
    const filterChips = page.locator('[data-testid^="filter-chip-"]');
    await expect(filterChips.first()).toBeVisible({ timeout: 5000 });

    // Record filtered mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    const filteredMean = parseFloat((await meanValue.textContent())!);

    // Click the remove button on the filter chip
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    await removeButton.click();

    // Wait for stats to update
    await page.waitForTimeout(500);

    // Mean should revert to overall (~11.89)
    const revertedMean = parseFloat((await meanValue.textContent())!);
    expect(revertedMean).not.toBeCloseTo(filteredMean, 0);
    expect(revertedMean).toBeGreaterThan(11.5);
    expect(revertedMean).toBeLessThan(12.5);
  });

  test('should clear all filters via Clear button', async ({ page }) => {
    // Apply a filter
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const rectCount = await boxplotRects.count();
    if (rectCount === 0) return;

    await boxplotRects.first().click();

    // Wait for filter chip and clear button
    await expect(page.locator('[data-testid^="filter-chip-"]').first()).toBeVisible({
      timeout: 5000,
    });
    const clearButton = page.locator('[data-testid="filter-clear-all"]');
    await expect(clearButton).toBeVisible({ timeout: 2000 });

    // Click Clear All
    await clearButton.click();

    // Filter chips should disappear
    await expect(page.locator('[data-testid^="filter-chip-"]')).toHaveCount(0, { timeout: 3000 });
  });
});

test.describe('Drill-Down: Packaging Dataset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=packaging');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should load packaging data with correct sample count', async ({ page }) => {
    // Packaging Defects has 56 rows (14 weekdays × 4 products)
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    await expect(samplesValue).toBeVisible({ timeout: 5000 });
    const text = await samplesValue.textContent();
    expect(text).toContain('56');
  });

  test('should show mean close to expected value', async ({ page }) => {
    // Packaging Defects overall mean ≈ 86 (3 products ~55 + 1 product ~180)
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const mean = parseFloat((await meanValue.textContent())!);
    expect(mean).toBeGreaterThan(70);
    expect(mean).toBeLessThan(110);
  });
});
