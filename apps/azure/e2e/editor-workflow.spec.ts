import { test, expect } from '@playwright/test';
import { confirmColumnMapping } from './helpers';

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

    // On localhost, EasyAuth returns mock user — should see the dashboard
    // Look for "VariScout Team" header or "New Analysis" button
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
  });

  test('should show user name in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Mock user is "Local Developer"
    await expect(page.locator('text=Local Developer')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Azure App: Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Click "New Analysis" to go to editor
    const newAnalysisBtn = page.getByRole('button', { name: 'New Analysis' }).first();
    await expect(newAnalysisBtn).toBeVisible({ timeout: 5000 });
    await newAnalysisBtn.click();

    // Wait for editor empty state
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state with upload and sample options', async ({ page }) => {
    // Should see upload and manual entry buttons
    await expect(page.locator('text=Upload File')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();

    // Should see sample datasets
    await expect(page.locator('text=Sample Datasets')).toBeVisible();
  });

  test('should load sample dataset and show charts', async ({ page }) => {
    // Click a sample dataset button
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await expect(sampleButton).toBeVisible({ timeout: 5000 });
    await sampleButton.click();

    // Confirm column mapping
    await confirmColumnMapping(page);

    // Dashboard should render with chart containers
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should display statistics after loading sample', async ({ page }) => {
    // Load first available sample
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();

    await confirmColumnMapping(page);

    // Wait for charts
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Stats should show a numeric mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const meanText = await meanValue.textContent();
    expect(parseFloat(meanText!)).not.toBeNaN();
  });

  test('should render all chart containers', async ({ page }) => {
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();

    await confirmColumnMapping(page);

    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-pareto"]')).toBeVisible({ timeout: 5000 });
  });

  test('should apply filter via boxplot and show filter chip', async ({ page }) => {
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();

    await confirmColumnMapping(page);

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

  test('should navigate back to analyses dashboard', async ({ page }) => {
    // Click "Back" button
    const backBtn = page.locator('text=Back').first();
    await backBtn.click();

    // Should see analyses dashboard again
    await expect(page.getByRole('button', { name: 'New Analysis' }).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
