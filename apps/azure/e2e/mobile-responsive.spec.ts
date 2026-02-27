import { test, expect } from '@playwright/test';
import { confirmColumnMapping } from './helpers';

/**
 * Mobile Responsive Layout E2E Tests
 *
 * Tests the phone (<640px) and tablet (768x1024) layouts
 * for the Azure Dashboard and Editor.
 */

test.describe('Phone layout (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('shows overflow menu instead of inline toolbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Load a sample
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();
    await confirmColumnMapping(page);

    // Wait for dashboard to load
    await page.waitForTimeout(1000);

    // Save button should be visible (always shown)
    await expect(page.locator('[data-testid="btn-save"]')).toBeVisible();

    // Overflow menu should be visible on phone
    await expect(page.locator('[data-testid="btn-overflow"]')).toBeVisible();

    // Desktop-only buttons should NOT be visible
    await expect(page.locator('[data-testid="btn-add-data"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-csv-export"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-what-if"]')).not.toBeVisible();
  });

  test('overflow menu opens and shows all actions', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();
    await confirmColumnMapping(page);
    await page.waitForTimeout(1000);

    // Open overflow menu
    await page.locator('[data-testid="btn-overflow"]').click();

    // Verify menu items are visible
    await expect(page.locator('text=Add Data')).toBeVisible();
    await expect(page.locator('text=Edit Data')).toBeVisible();
    await expect(page.locator('text=Export CSV')).toBeVisible();
    await expect(page.locator('text=What-If')).toBeVisible();
    await expect(page.locator('text=Presentation')).toBeVisible();
    await expect(page.locator('text=Data Table')).toBeVisible();
  });

  test('empty state buttons stack vertically', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Verify buttons are visible (they should stack in flex-col on phone)
    await expect(page.locator('text=Upload File')).toBeVisible();
    await expect(page.locator('text=Paste Data')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();
  });
});

test.describe('Tablet layout (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('shows full toolbar (not overflow menu)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();
    await confirmColumnMapping(page);
    await page.waitForTimeout(1000);

    // Desktop toolbar buttons should be visible
    await expect(page.locator('[data-testid="btn-save"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-csv-export"]')).toBeVisible();

    // Overflow menu should NOT be visible on tablet
    await expect(page.locator('[data-testid="btn-overflow"]')).not.toBeVisible();
  });

  test('shows grid layout with charts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();
    await confirmColumnMapping(page);

    // Grid layout should show all chart cards
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-pareto"]')).toBeVisible();
  });
});
