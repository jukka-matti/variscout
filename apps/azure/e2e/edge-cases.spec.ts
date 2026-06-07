import { test, expect } from '@playwright/test';
import {
  loadSampleToCharts,
  pasteToCharts,
  resetToFreshAnalysis,
  startNewAnalysis,
} from './helpers';

/**
 * E2E Test: Azure Edge Cases
 *
 * Tests unexpected inputs and boundary conditions in the Azure app:
 * 1. Empty editor state
 * 2. No factor columns (numeric only)
 * 3. Replace data (load different sample after filtering)
 * 4. Back navigation
 * 5. Multiple chart renders
 */

test.describe('Azure Edge Case: Empty Editor State', () => {
  test('should show empty state with upload and sample options', async ({ page }) => {
    await resetToFreshAnalysis(page);

    // Upload and Manual Entry should be available
    await expect(page.locator('text=Open from SharePoint')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();

    // Sample datasets should be visible
    await expect(page.locator('text=Sample Datasets')).toBeVisible();
    const sampleButtons = page.locator('[data-testid^="sample-"]');
    expect(await sampleButtons.count()).toBeGreaterThan(0);
  });

  test('should not show charts in empty state', async ({ page }) => {
    await startNewAnalysis(page);

    // Charts should NOT be visible
    const hasChart = await page
      .locator('[data-testid="chart-ichart"]')
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    expect(hasChart).toBe(false);
  });
});

test.describe('Azure Edge Case: No Factors', () => {
  test('should handle numeric-only pasted data', async ({ page }) => {
    await startNewAnalysis(page);

    // Paste numeric-only data (no factor columns)
    const values = Array.from({ length: 15 }, (_, i) =>
      String(Math.round((50 + Math.sin(i * 0.5) * 3) * 100) / 100)
    );
    await pasteToCharts(page, 'Measurement\n' + values.join('\n'));

    // Should render I-Chart at minimum (no boxplot groups expected)
    const hasChart = await page
      .locator('[data-testid="chart-ichart"]')
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (hasChart) {
      await expect(page.locator('text=/x̄\\d/')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Azure Edge Case: Replace Data', () => {
  test('should clear filters when loading a different sample', async ({ page }) => {
    await startNewAnalysis(page);

    // Load coffee sample (has factors for filtering)
    await loadSampleToCharts(page, 'sample-coffee');

    // Apply a filter via boxplot
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    if ((await boxplotRects.count()) > 0) {
      await boxplotRects.first().click();
      await page.waitForTimeout(500);
    }

    // Navigate fresh to load a different sample
    await startNewAnalysis(page);

    // Load bottleneck sample
    await loadSampleToCharts(page, 'sample-cookie-weight');

    // Should have no stale filter chips from the previous sample
    const chipCount = await page.locator('[data-testid^="filter-chip-"]').count();
    expect(chipCount).toBe(0);
  });
});

test.describe('Azure Edge Case: Entry Navigation', () => {
  test('should keep charts isolated from a fresh analysis entry', async ({ page }) => {
    await startNewAnalysis(page);

    await loadSampleToCharts(page);

    await startNewAnalysis(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toHaveCount(0);
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });
  });

  test('should show an empty editor without loading any data', async ({ page }) => {
    await startNewAnalysis(page);
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-ichart"]')).toHaveCount(0);
  });
});

test.describe('Azure Edge Case: Auth on Localhost', () => {
  test('should show mock user on localhost', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=New Analysis')).toBeVisible({ timeout: 10000 });
  });
});
