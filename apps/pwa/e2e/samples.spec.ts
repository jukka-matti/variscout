import { test, expect } from '@playwright/test';

/**
 * E2E Test: Sample Datasets
 *
 * Verifies that featured samples load correctly,
 * charts render, and stats panel shows numeric values.
 */

// Featured samples with their URL keys
const FEATURED_SAMPLES = ['coffee', 'packaging', 'bottleneck'];

test.describe('Sample Loading via URL', () => {
  for (const sampleKey of FEATURED_SAMPLES) {
    test(`should load "${sampleKey}" sample via URL param`, async ({ page }) => {
      await page.goto(`/?sample=${sampleKey}`);

      // Dashboard should render with chart containers
      await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="chart-stats"]')).toBeVisible({ timeout: 5000 });

      // SVG charts should render inside containers
      const ichartSvg = page.locator('[data-testid="chart-ichart"] svg');
      await expect(ichartSvg.first()).toBeVisible({ timeout: 5000 });

      const boxplotSvg = page.locator('[data-testid="chart-boxplot"] svg');
      await expect(boxplotSvg.first()).toBeVisible({ timeout: 5000 });

      // Stats panel should show numeric mean value
      const meanValue = page.locator('[data-testid="stat-value-mean"]');
      await expect(meanValue).toBeVisible({ timeout: 5000 });
      const meanText = await meanValue.textContent();
      expect(meanText).toBeTruthy();
      expect(parseFloat(meanText!)).not.toBeNaN();

      // Samples count should be > 0
      const samplesValue = page.locator('[data-testid="stat-value-samples"]');
      await expect(samplesValue).toBeVisible();
      const samplesText = await samplesValue.textContent();
      expect(samplesText).toMatch(/n=\d+/);
    });
  }
});

test.describe('Sample Loading via Home Screen Click', () => {
  test('should load featured coffee sample by clicking card', async ({ page }) => {
    await page.goto('/');

    // Wait for home screen
    await expect(page.locator('text=Try a Sample Dataset')).toBeVisible({ timeout: 10000 });

    // Click the featured coffee sample button
    const coffeeSample = page.locator('[data-testid="sample-featured-coffee"]');
    await expect(coffeeSample).toBeVisible({ timeout: 5000 });
    await coffeeSample.click();

    // Dashboard should appear with charts
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Stats should show values
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
  });

  test('should load featured bottleneck sample by clicking card', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=Try a Sample Dataset')).toBeVisible({ timeout: 10000 });

    const bottleneckSample = page.locator('[data-testid="sample-featured-bottleneck"]');
    await expect(bottleneckSample).toBeVisible({ timeout: 5000 });
    await bottleneckSample.click();

    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Invalid Sample Handling', () => {
  test('should show home screen for unknown sample key', async ({ page }) => {
    await page.goto('/?sample=nonexistent');

    // Should fall back to home screen (no data loaded)
    await expect(page.locator('text=Try a Sample Dataset')).toBeVisible({ timeout: 10000 });
  });
});
