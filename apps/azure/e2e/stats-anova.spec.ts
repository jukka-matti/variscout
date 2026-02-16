import { test, expect } from '@playwright/test';

/**
 * E2E Test: Azure Stats Panel & ANOVA Display
 *
 * Tests statistics display and ANOVA results in the Azure app:
 * 1. Load sample → verify mean, sigma, sample count
 * 2. Verify ANOVA results section
 * 3. Verify F-stat, p-value, eta-squared
 */

test.describe('Azure Stats Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Navigate to editor
    await page.locator('text=New Analysis').click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Load first sample dataset
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await expect(sampleButton).toBeVisible({ timeout: 5000 });
    await sampleButton.click();

    // Wait for charts to render
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
    expect(text).toBeTruthy();
    // Sample count should be a positive number
    expect(parseInt(text!, 10)).toBeGreaterThan(0);
  });

  test('should display sigma value', async ({ page }) => {
    const sigmaValue = page.locator('[data-testid="stat-value-sigma"]');
    await expect(sigmaValue).toBeVisible({ timeout: 5000 });
    const sigmaText = await sigmaValue.textContent();
    expect(sigmaText).toBeTruthy();
    expect(parseFloat(sigmaText!)).not.toBeNaN();
    expect(parseFloat(sigmaText!)).toBeGreaterThan(0);
  });

  test('should display ANOVA results when groups exist', async ({ page }) => {
    // ANOVA should display when boxplot has groups
    const anovaResults = page.locator('[data-testid="anova-results"]');
    await expect(anovaResults).toBeVisible({ timeout: 5000 });
  });

  test('should display F-stat and p-value in ANOVA', async ({ page }) => {
    const anovaSignificance = page.locator('[data-testid="anova-significance"]');
    await expect(anovaSignificance).toBeVisible({ timeout: 5000 });

    const text = await anovaSignificance.textContent();
    expect(text).toContain('F =');
    expect(text).toContain('p =');
  });

  test('should display eta-squared in ANOVA', async ({ page }) => {
    const etaSquared = page.locator('[data-testid="anova-eta-squared"]');
    await expect(etaSquared).toBeVisible({ timeout: 5000 });

    const text = await etaSquared.textContent();
    expect(text).toContain('η²');
  });
});
