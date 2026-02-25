import { test, expect } from '@playwright/test';
import { confirmColumnMapping } from './helpers';

/**
 * E2E Test: Azure Sample Datasets
 *
 * Verifies sample datasets load correctly in the Azure editor.
 */

test.describe('Azure App: Sample Datasets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Navigate to editor
    const newAnalysisBtn = page.getByRole('button', { name: 'New Analysis' }).first();
    await expect(newAnalysisBtn).toBeVisible({ timeout: 5000 });
    await newAnalysisBtn.click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });
  });

  test('should show sample dataset grid in empty state', async ({ page }) => {
    // Should see sample buttons
    const sampleButtons = page.locator('[data-testid^="sample-"]');
    const count = await sampleButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should load first sample and render charts', async ({ page }) => {
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();

    // Confirm column mapping
    await confirmColumnMapping(page);

    // Charts should render
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // SVG should be present
    const svg = page.locator('[data-testid="chart-ichart"] svg');
    await expect(svg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show stats panel with numeric values', async ({ page }) => {
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();

    await confirmColumnMapping(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Mean value should be numeric
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const text = await meanValue.textContent();
    expect(parseFloat(text!)).not.toBeNaN();

    // Std Dev should be numeric
    const stdDevValue = page.locator('[data-testid="stat-value-std-dev"]');
    await expect(stdDevValue).toBeVisible();
    const stdText = await stdDevValue.textContent();
    expect(parseFloat(stdText!)).not.toBeNaN();
  });

  test('should load multiple samples sequentially', async ({ page }) => {
    // Load first sample (coffee)
    const coffeeSample = page.locator('[data-testid="sample-coffee"]');
    await coffeeSample.click();
    await confirmColumnMapping(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Record first sample stats
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const firstMean = await meanValue.textContent();

    // Navigate fresh to load a different sample
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Load bottleneck sample
    const bottleneckSample = page.locator('[data-testid="sample-bottleneck"]');
    await bottleneckSample.click();
    await confirmColumnMapping(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Stats should be visible for second sample
    await expect(meanValue).toBeVisible({ timeout: 5000 });
  });
});
