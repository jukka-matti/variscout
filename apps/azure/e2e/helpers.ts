import { expect, type Page } from '@playwright/test';

/**
 * Complete the ColumnMapping step after loading data.
 *
 * After a sample is loaded (or data pasted/uploaded), the app shows
 * the "Map Your Data" ColumnMapping screen where the user confirms
 * column selections. Sample datasets auto-detect the outcome column,
 * so the "Start Analysis" button is already enabled.
 */
export async function confirmColumnMapping(page: Page) {
  await expect(page.locator('text=Map Your Data')).toBeVisible({ timeout: 5000 });
  await page.locator('button:has-text("Start Analysis")').click();
}

/**
 * Navigate to editor, load the first sample, confirm mapping, and wait for charts.
 */
export async function loadSampleInEditor(page: Page) {
  await page.goto('/');
  await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'New Analysis' }).first().click();
  await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

  const sampleButton = page.locator('[data-testid^="sample-"]').first();
  await sampleButton.click();

  await confirmColumnMapping(page);
  await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
}

/**
 * Load the large-scale performance-mode sample and confirm mapping.
 */
export async function loadPerformanceSample(page: Page) {
  await page.goto('/');
  await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'New Analysis' }).first().click();
  await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

  await page.locator('[data-testid="sample-large-scale"]').click();

  await confirmColumnMapping(page);
  await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
}
