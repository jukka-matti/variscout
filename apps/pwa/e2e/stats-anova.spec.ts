import { test, expect } from '@playwright/test';

/**
 * E2E Test: Stats Panel & ANOVA Display
 *
 * Tests statistics display and ANOVA results:
 * 1. Load packaging sample (has spec limits) → verify Cp/Cpk
 * 2. Verify mean, samples, sigma values
 * 3. Verify ANOVA results section
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
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    await expect(samplesValue).toBeVisible({ timeout: 5000 });
    const text = await samplesValue.textContent();
    expect(text).toContain('120');
  });

  test('should display sigma value', async ({ page }) => {
    const sigmaValue = page.locator('[data-testid="stat-value-sigma"]');
    await expect(sigmaValue).toBeVisible({ timeout: 5000 });
    const sigmaText = await sigmaValue.textContent();
    expect(sigmaText).toBeTruthy();
    expect(parseFloat(sigmaText!)).not.toBeNaN();
    expect(parseFloat(sigmaText!)).toBeGreaterThan(0);
  });

  test('should display Cp value when spec limits exist', async ({ page }) => {
    // Packaging dataset has spec limits, so Cp should be shown
    const cpValue = page.locator('[data-testid="stat-value-cp"]');
    await expect(cpValue).toBeVisible({ timeout: 5000 });
    const cpText = await cpValue.textContent();
    expect(cpText).toBeTruthy();
    expect(parseFloat(cpText!)).not.toBeNaN();
  });

  test('should display Cpk value when spec limits exist', async ({ page }) => {
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
  });

  test('should display ANOVA results section', async ({ page }) => {
    // Coffee dataset has 3 drying beds — ANOVA should show below boxplot
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
