import { test, expect } from '@playwright/test';

/**
 * E2E Test: Bottleneck Investigation Flow
 *
 * Validates the core bottleneck detection journey:
 * 1. Load bottleneck sample → verify initial stats
 * 2. Verify boxplot shows clickable Step groups
 * 3. Drill into Step 2 (high variation) → verify filtered stats
 * 4. Compare Step 2 vs Step 3 (variation vs mean contrast)
 *
 * Dataset: 150 observations, 5 process steps, 2 shifts.
 * Actual values (seeded PRNG): overall mean=35.42, std=7.08
 * Step 2: mean~37, std~9 (hidden bottleneck — high variance)
 * Step 3: mean~45, std~2 (decoy — high mean, low variance)
 */

test.describe('Bottleneck: Sample Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=bottleneck');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should load with correct sample count', async ({ page }) => {
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    await expect(samplesValue).toBeVisible({ timeout: 5000 });
    const text = await samplesValue.textContent();
    expect(text).toContain('150');
  });

  test('should show overall mean in expected range', async ({ page }) => {
    // Mixed steps: means 30–45, weighted equally → overall ~35.4
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const mean = parseFloat((await meanValue.textContent())!);
    expect(mean).toBeGreaterThan(32);
    expect(mean).toBeLessThan(40);
  });

  test('should render all chart containers', async ({ page }) => {
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-stats"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Bottleneck: The Hidden Variation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=bottleneck');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should show clickable boxplot groups for all 5 steps', async ({ page }) => {
    // Boxplot renders accessible buttons for each group
    const boxplot = page.locator('[data-testid="chart-boxplot"]');
    for (const step of ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']) {
      await expect(boxplot.getByRole('button', { name: new RegExp(`Select ${step}`) })).toBeVisible(
        { timeout: 5000 }
      );
    }
  });

  test('should drill into Step 2 and show filter chip', async ({ page }) => {
    // Click Step 2 group in the boxplot
    await page
      .locator('[data-testid="chart-boxplot"]')
      .getByRole('button', { name: /Select Step 2/ })
      .click();

    // Verify filter chip appears for Step
    const filterChip = page.locator('[data-testid^="filter-chip-"]');
    await expect(filterChip.first()).toBeVisible({ timeout: 5000 });

    // Verify the chip text contains "Step"
    const chipText = await filterChip.first().textContent();
    expect(chipText!.toLowerCase()).toContain('step');
  });

  test('should show filtered stats for Step 2', async ({ page }) => {
    await page
      .locator('[data-testid="chart-boxplot"]')
      .getByRole('button', { name: /Select Step 2/ })
      .click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify n=30 (5 days × 2 shifts × 3 reps)
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    await expect(samplesValue).toBeVisible({ timeout: 5000 });
    const samplesText = await samplesValue.textContent();
    expect(samplesText).toContain('30');

    // Step 2 mean should be ~37 (range 33–45 accounting for PRNG + clamping)
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    const mean = parseFloat((await meanValue.textContent())!);
    expect(mean).toBeGreaterThan(33);
    expect(mean).toBeLessThan(45);

    // Step 2 std dev should be high (~9, range 6–13)
    const stdDevValue = page.locator('[data-testid="stat-value-std-dev"]');
    await expect(stdDevValue).toBeVisible({ timeout: 5000 });
    const stdDev = parseFloat((await stdDevValue.textContent())!);
    expect(stdDev).toBeGreaterThan(6);
    expect(stdDev).toBeLessThan(13);
  });

  test('should show contribution % in filter chip', async ({ page }) => {
    await page
      .locator('[data-testid="chart-boxplot"]')
      .getByRole('button', { name: /Select Step 2/ })
      .click();

    const filterChip = page.locator('[data-testid^="filter-chip-"]');
    await expect(filterChip.first()).toBeVisible({ timeout: 5000 });

    // Chip text should contain a percentage
    const chipText = await filterChip.first().textContent();
    expect(chipText).toMatch(/\d+%/);
  });

  test('should revert stats when filter is removed', async ({ page }) => {
    // Record overall mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const overallMean = parseFloat((await meanValue.textContent())!);

    // Drill into Step 2
    await page
      .locator('[data-testid="chart-boxplot"]')
      .getByRole('button', { name: /Select Step 2/ })
      .click();
    await page.waitForTimeout(500);

    // Verify mean changed
    const filteredMean = parseFloat((await meanValue.textContent())!);
    expect(filteredMean).not.toBeCloseTo(overallMean, 0);

    // Remove filter
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Verify mean reverts to overall range
    const revertedMean = parseFloat((await meanValue.textContent())!);
    expect(revertedMean).toBeGreaterThan(32);
    expect(revertedMean).toBeLessThan(40);
  });
});

test.describe('Bottleneck: Step 2 vs Step 3 Contrast', () => {
  test('should reveal that Step 2 has higher variation than Step 3', async ({ page }) => {
    await page.goto('/?sample=bottleneck');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    const boxplot = page.locator('[data-testid="chart-boxplot"]');
    const stdDevValue = page.locator('[data-testid="stat-value-std-dev"]');

    // Click Step 2 → record std dev
    await boxplot.getByRole('button', { name: /Select Step 2/ }).click();
    await page.waitForTimeout(500);
    await expect(stdDevValue).toBeVisible({ timeout: 5000 });
    const step2StdDev = parseFloat((await stdDevValue.textContent())!);

    // Remove filter — boxplot switches to Shift view after drill
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Switch boxplot back to Step factor view
    await boxplot.getByRole('button', { name: 'Step', exact: true }).click();
    await page.waitForTimeout(500);

    // Click Step 3 → record std dev
    await boxplot.getByRole('button', { name: /Select Step 3/ }).click();
    await page.waitForTimeout(500);
    const step3StdDev = parseFloat((await stdDevValue.textContent())!);

    // Step 2 std dev should be at least 2x Step 3 std dev
    // (designed: Step 2 std~10, Step 3 std~2 → ~5x ratio)
    expect(step2StdDev).toBeGreaterThan(2 * step3StdDev);
  });

  test('should reveal that Step 3 has higher mean than Step 2 (the decoy)', async ({ page }) => {
    await page.goto('/?sample=bottleneck');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    const boxplot = page.locator('[data-testid="chart-boxplot"]');
    const meanValue = page.locator('[data-testid="stat-value-mean"]');

    // Click Step 2 → record mean
    await boxplot.getByRole('button', { name: /Select Step 2/ }).click();
    await page.waitForTimeout(500);
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const step2Mean = parseFloat((await meanValue.textContent())!);

    // Remove filter — boxplot switches to Shift view after drill
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Switch boxplot back to Step factor view
    await boxplot.getByRole('button', { name: 'Step', exact: true }).click();
    await page.waitForTimeout(500);

    // Click Step 3 → record mean
    await boxplot.getByRole('button', { name: /Select Step 3/ }).click();
    await page.waitForTimeout(500);
    const step3Mean = parseFloat((await meanValue.textContent())!);

    // Step 3 mean (~45) should be higher than Step 2 mean (~37)
    // This is the "decoy" — higher average looks like the bottleneck
    expect(step3Mean).toBeGreaterThan(step2Mean);
  });
});
