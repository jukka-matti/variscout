import { test, expect } from '@playwright/test';
import { loadSampleToB0, loadSampleToCharts, startNewAnalysis } from './helpers';

/**
 * Mobile Responsive Layout E2E Tests
 *
 * Tests the phone (<640px) and tablet (768x1024) layouts
 * for the Azure Dashboard and Editor.
 */

test.describe('Phone layout (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('shows b0 controls on phone', async ({ page }) => {
    await startNewAnalysis(page);

    await loadSampleToB0(page);

    await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('b0-fix-data')).toBeVisible();
    await expect(page.getByTestId('see-the-data-cta')).toBeVisible();
  });

  test('settings remains reachable on phone', async ({ page }) => {
    await startNewAnalysis(page);
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible({ timeout: 5000 });
  });

  test('empty state buttons stack vertically', async ({ page }) => {
    await startNewAnalysis(page);
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Verify buttons are visible (they should stack in flex-col on phone)
    await expect(page.locator('text=Open from SharePoint')).toBeVisible();
    await expect(page.locator('text=Paste Data')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();
  });
});

test.describe('Tablet layout (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('shows chart controls on tablet', async ({ page }) => {
    await startNewAnalysis(page);
    await loadSampleToCharts(page);

    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Add Data/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('shows grid layout with charts', async ({ page }) => {
    await startNewAnalysis(page);
    await loadSampleToCharts(page);

    // Grid layout should show all chart cards
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-pareto"]')).toBeVisible();
  });
});
