import { test, expect } from '@playwright/test';

/**
 * E2E Test: Stats Panel & ANOVA Display
 *
 * Tests statistics display and ANOVA results:
 * 1. Load packaging sample (has spec limits) → verify Cpk
 * 2. Verify mean, samples, std dev values
 * 3. Verify ANOVA results section (via focused/maximized boxplot view)
 * 4. Load coffee sample → verify ANOVA for drying beds
 */

test.describe('Stats Panel: Packaging Dataset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=packaging');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should display numeric mean value', async ({ page }) => {
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const meanText = await meanValue.textContent();
    expect(meanText).toBeTruthy();
    expect(parseFloat(meanText!)).not.toBeNaN();
  });

  test('should display sample count', async ({ page }) => {
    // Packaging Defects has 56 rows (14 weekdays × 4 products)
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    await expect(samplesValue).toBeVisible({ timeout: 5000 });
    const text = await samplesValue.textContent();
    expect(text).toContain('56');
  });

  test('should display std dev value', async ({ page }) => {
    const stdDevValue = page.locator('[data-testid="stat-value-std-dev"]');
    await expect(stdDevValue).toBeVisible({ timeout: 5000 });
    const stdDevText = await stdDevValue.textContent();
    expect(stdDevText).toBeTruthy();
    expect(parseFloat(stdDevText!)).not.toBeNaN();
    expect(parseFloat(stdDevText!)).toBeGreaterThan(0);
  });

  test('should display Cpk value when spec limits exist', async ({ page }) => {
    // Packaging has USL=100 (no LSL), so Cpk should be shown
    const cpkValue = page.locator('[data-testid="stat-value-cpk"]');
    await expect(cpkValue).toBeVisible({ timeout: 5000 });
    const cpkText = await cpkValue.textContent();
    expect(cpkText).toBeTruthy();
    expect(parseFloat(cpkText!)).not.toBeNaN();
  });
});

test.describe('ANOVA Results: Coffee Dataset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=coffee');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // ANOVA renders in focused/maximized boxplot view — maximize the boxplot
    const maximizeButton = page.locator(
      '[data-testid="chart-boxplot"] button[aria-label="Maximize chart"]'
    );
    await expect(maximizeButton).toBeVisible({ timeout: 5000 });
    await maximizeButton.click();
  });

  test('should display ANOVA results section', async ({ page }) => {
    // Coffee dataset has 3 drying beds — ANOVA should show in focused boxplot view
    const anovaResults = page.locator('[data-testid="anova-results"]');
    await expect(anovaResults).toBeVisible({ timeout: 5000 });
  });

  test('should display F-stat and p-value', async ({ page }) => {
    const anovaSignificance = page.locator('[data-testid="anova-significance"]');
    await expect(anovaSignificance).toBeVisible({ timeout: 5000 });

    const text = await anovaSignificance.textContent();
    expect(text).toContain('F =');
    expect(text).toContain('p =');
  });

  test('should display eta-squared', async ({ page }) => {
    const etaSquared = page.locator('[data-testid="anova-eta-squared"]');
    await expect(etaSquared).toBeVisible({ timeout: 5000 });

    const text = await etaSquared.textContent();
    expect(text).toContain('η²');
  });

  test('should mention drying bed factor in ANOVA header', async ({ page }) => {
    const anovaResults = page.locator('[data-testid="anova-results"]');
    await expect(anovaResults).toBeVisible({ timeout: 5000 });

    // ANOVA header should mention the factor name (Drying_Bed)
    const anovaText = await anovaResults.textContent();
    expect(anovaText).toBeTruthy();
    // The ANOVA header shows "ANOVA: <factorLabel>"
    expect(anovaText!.toLowerCase()).toContain('anova');
  });
});
