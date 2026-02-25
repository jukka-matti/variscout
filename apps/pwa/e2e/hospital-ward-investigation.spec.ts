import { test, expect } from '@playwright/test';

/**
 * E2E Test: Hospital Ward Investigation Flow
 *
 * Validates the aggregation trap discovery journey:
 * 1. Load hospital-ward sample → verify overall mean looks "fine"
 * 2. Drill into Night (crisis at ~94%) → verify filtered stats
 * 3. Drill into Afternoon (waste at ~48%) → verify contrast
 * 4. Demonstrate the aggregation trap: Night-Afternoon gap > 30 points
 *
 * Dataset: 672 observations (28 days × 24 hours).
 * Actual values (seeded PRNG): overall mean=75.16, std=17.12
 * Night: mean~94, n=252 (crisis). Afternoon: mean~46, n=84 (waste).
 *
 * Note: hospital-ward has featured: false — no home screen card.
 * Load via URL param only.
 */

test.describe('Hospital Ward: Sample Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=hospital-ward');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should load with correct sample count', async ({ page }) => {
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    await expect(samplesValue).toBeVisible({ timeout: 5000 });
    const text = await samplesValue.textContent();
    expect(text).toContain('672');
  });

  test('should show overall mean in expected range', async ({ page }) => {
    // The aggregation mean: mixed time periods → overall ~75%
    // Night (~94) + Morning (~70) + Afternoon (~48) + Evening (~65), weighted by hours
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const mean = parseFloat((await meanValue.textContent())!);
    expect(mean).toBeGreaterThan(68);
    expect(mean).toBeLessThan(80);
  });

  test('should render all chart containers', async ({ page }) => {
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-stats"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Hospital Ward: Time Period Drill-Down', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=hospital-ward');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should show clickable boxplot groups for all 4 time periods', async ({ page }) => {
    const boxplot = page.locator('[data-testid="chart-boxplot"]');
    for (const period of ['Afternoon', 'Evening', 'Morning', 'Night']) {
      await expect(
        boxplot.getByRole('button', { name: new RegExp(`Select ${period}`) })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should drill into Night and show crisis-level stats', async ({ page }) => {
    // Click Night group in boxplot
    await page
      .locator('[data-testid="chart-boxplot"]')
      .getByRole('button', { name: /Select Night/ })
      .click();

    // Verify filter chip appears
    const filterChip = page.locator('[data-testid^="filter-chip-"]');
    await expect(filterChip.first()).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(500);

    // Night mean should be ~94% (range 88–100 accounting for PRNG + clamping)
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    const mean = parseFloat((await meanValue.textContent())!);
    expect(mean).toBeGreaterThan(88);
    expect(mean).toBeLessThan(100);

    // Night has 9 hours/day × 28 days = 252 observations
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    const samplesText = await samplesValue.textContent();
    const nMatch = samplesText!.match(/n=(\d+)/);
    expect(nMatch).toBeTruthy();
    const n = parseInt(nMatch![1]);
    expect(n).toBeGreaterThanOrEqual(240);
    expect(n).toBeLessThanOrEqual(260);
  });

  test('should show contribution % in Night filter chip', async ({ page }) => {
    await page
      .locator('[data-testid="chart-boxplot"]')
      .getByRole('button', { name: /Select Night/ })
      .click();

    const filterChip = page.locator('[data-testid^="filter-chip-"]');
    await expect(filterChip.first()).toBeVisible({ timeout: 5000 });

    const chipText = await filterChip.first().textContent();
    expect(chipText).toMatch(/\d+%/);
  });

  test('should revert stats when Night filter is removed', async ({ page }) => {
    // Record overall mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const overallMean = parseFloat((await meanValue.textContent())!);

    // Drill into Night
    await page
      .locator('[data-testid="chart-boxplot"]')
      .getByRole('button', { name: /Select Night/ })
      .click();
    await page.waitForTimeout(500);

    // Verify mean changed to crisis level
    const nightMean = parseFloat((await meanValue.textContent())!);
    expect(nightMean).toBeGreaterThan(overallMean + 10);

    // Remove filter
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Verify mean reverts to overall range
    const revertedMean = parseFloat((await meanValue.textContent())!);
    expect(revertedMean).toBeGreaterThan(68);
    expect(revertedMean).toBeLessThan(80);
  });
});

test.describe('Hospital Ward: Aggregation Trap', () => {
  test('should reveal Night-Afternoon gap exceeding 30 points', async ({ page }) => {
    await page.goto('/?sample=hospital-ward');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    const boxplot = page.locator('[data-testid="chart-boxplot"]');
    const meanValue = page.locator('[data-testid="stat-value-mean"]');

    // Click Night
    await boxplot.getByRole('button', { name: /Select Night/ }).click();
    await page.waitForTimeout(500);
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const nightMean = parseFloat((await meanValue.textContent())!);
    expect(nightMean).toBeGreaterThan(88);

    // Remove filter — boxplot switches to Day_of_Week view after drill
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Switch boxplot back to Time_Period factor view
    await boxplot.getByRole('button', { name: /Time.Period/, exact: false }).click();
    await page.waitForTimeout(500);

    // Click Afternoon
    await boxplot.getByRole('button', { name: /Select Afternoon/ }).click();
    await page.waitForTimeout(500);
    const afternoonMean = parseFloat((await meanValue.textContent())!);
    expect(afternoonMean).toBeLessThan(55);

    // The hidden gap: Night (~94) - Afternoon (~46) > 30 points
    // This is the aggregation trap — the overall mean (~75) represents neither
    expect(nightMean - afternoonMean).toBeGreaterThan(30);
  });

  test('should show overall mean is less than Night mean by at least 10 points', async ({
    page,
  }) => {
    await page.goto('/?sample=hospital-ward');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });

    // Record overall mean (~75)
    const overallMean = parseFloat((await meanValue.textContent())!);

    // Drill into Night
    const boxplot = page.locator('[data-testid="chart-boxplot"]');
    await boxplot.getByRole('button', { name: /Select Night/ }).click();
    await page.waitForTimeout(500);

    // Night mean (~94) should be well above overall (~75)
    const nightMean = parseFloat((await meanValue.textContent())!);
    expect(nightMean - overallMean).toBeGreaterThan(10);

    // Remove filter — boxplot switches to Day_of_Week view after drill
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Verify overall mean restored
    const restoredMean = parseFloat((await meanValue.textContent())!);

    // Switch boxplot back to Time_Period factor view
    await boxplot.getByRole('button', { name: /Time.Period/, exact: false }).click();
    await page.waitForTimeout(500);

    await boxplot.getByRole('button', { name: /Select Afternoon/ }).click();
    await page.waitForTimeout(500);

    // Afternoon mean (~46) should be well below overall (~75)
    const afternoonMean = parseFloat((await meanValue.textContent())!);
    expect(restoredMean - afternoonMean).toBeGreaterThan(10);
  });
});
