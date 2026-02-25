import { test, expect } from '@playwright/test';
import { confirmColumnMapping } from './helpers';

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
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Navigate to editor
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Load coffee sample (has categorical factors for ANOVA)
    const sampleButton = page.locator('[data-testid="sample-coffee"]');
    await expect(sampleButton).toBeVisible({ timeout: 5000 });
    await sampleButton.click();

    // Confirm column mapping
    await confirmColumnMapping(page);

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
    // Sample count is displayed as "n=30" — extract the number
    const match = text!.match(/(\d+)/);
    expect(match).toBeTruthy();
    expect(parseInt(match![1], 10)).toBeGreaterThan(0);
  });

  test('should display std dev value', async ({ page }) => {
    const stdDevValue = page.locator('[data-testid="stat-value-std-dev"]');
    await expect(stdDevValue).toBeVisible({ timeout: 5000 });
    const stdDevText = await stdDevValue.textContent();
    expect(stdDevText).toBeTruthy();
    expect(parseFloat(stdDevText!)).not.toBeNaN();
    expect(parseFloat(stdDevText!)).toBeGreaterThan(0);
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

    const text = await anovaSignificance.textContent();
    expect(text).toContain('F =');
    expect(text).toContain('p =');
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
});
