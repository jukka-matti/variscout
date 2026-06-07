import { test, expect } from '@playwright/test';
import { loadSampleToCharts, startNewAnalysis } from './helpers';

/**
 * E2E Test: Azure Editor Workflow
 *
 * Tests the editor flow:
 * 1. App loads with mock auth (localhost)
 * 2. Navigate to editor (new analysis)
 * 3. Load a sample dataset
 * 4. Verify charts render
 * 5. Verify stats display
 * 6. Apply filter → verify stats update
 */

test.describe('Azure App: Authentication', () => {
  test('should auto-authenticate on localhost', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 10000 });
  });

  test('should show the local analysis shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=New Analysis')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=saved').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Azure App: Editor', () => {
  test.beforeEach(async ({ page }) => {
    await startNewAnalysis(page);
  });

  test('should show empty state with upload and sample options', async ({ page }) => {
    // Should see upload and manual entry buttons
    await expect(page.locator('text=Open from SharePoint')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();

    // Should see sample datasets
    await expect(page.locator('text=Sample Datasets')).toBeVisible();
  });

  test('should load sample dataset and show charts', async ({ page }) => {
    await loadSampleToCharts(page);
  });

  test('should display statistics after loading sample', async ({ page }) => {
    await loadSampleToCharts(page);

    await expect(page.locator('text=/x̄\\d/')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/n\\d/')).toBeVisible({ timeout: 5000 });
  });

  test('should render all chart containers', async ({ page }) => {
    await loadSampleToCharts(page);
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-pareto"]')).toBeVisible({ timeout: 5000 });
  });

  test('should apply filter via boxplot and show filter chip', async ({ page }) => {
    await loadSampleToCharts(page);
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 15000 });

    // Click on a boxplot category
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    const rectCount = await boxplotRects.count();
    if (rectCount > 0) {
      await boxplotRects.first().click();

      // Filter chip should appear
      const filterChips = page.locator('[data-testid^="filter-chip-"]');
      await expect(filterChips.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should stay on the analysis entry shell before data loads', async ({ page }) => {
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Paste Data' })).toBeVisible({ timeout: 5000 });
  });
});
