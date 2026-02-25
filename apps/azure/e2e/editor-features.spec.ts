import { test, expect } from '@playwright/test';
import { loadSampleInEditor } from './helpers';

/**
 * E2E Test: Azure Editor Features
 *
 * Tests editor toolbar features:
 * - CSV export (download trigger)
 * - Data panel toggle
 * - Save button
 * - What-If Simulator navigation
 * - Investigation mindmap toggle
 */

test.describe('Azure App: CSV Export', () => {
  test('should trigger CSV download when export button is clicked', async ({ page }) => {
    await loadSampleInEditor(page);

    // Start listening for download before clicking
    const downloadPromise = page.waitForEvent('download');

    const exportBtn = page.locator('[data-testid="btn-csv-export"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    const download = await downloadPromise;
    // Filename should end with .csv
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});

test.describe('Azure App: Data Panel', () => {
  test('should toggle data panel visibility', async ({ page }) => {
    await loadSampleInEditor(page);

    const dataPanelBtn = page.locator('[data-testid="btn-data-panel"]');
    await expect(dataPanelBtn).toBeVisible();

    // Open data panel
    await dataPanelBtn.click();

    // Data panel should show a table or data rows
    const dataPanel = page.locator('table, [role="grid"]');
    await expect(dataPanel.first()).toBeVisible({ timeout: 5000 });

    // Close data panel
    await dataPanelBtn.click();

    // Data panel should be hidden (wait a moment for transition)
    await page.waitForTimeout(300);
    // The button should no longer have active styling (bg-blue-600)
    await expect(dataPanelBtn).not.toHaveClass(/bg-blue-600/);
  });
});

test.describe('Azure App: Save', () => {
  test('should have save button enabled after loading data', async ({ page }) => {
    await loadSampleInEditor(page);

    const saveBtn = page.locator('[data-testid="btn-save"]');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeEnabled();
  });

  test('should have save button disabled in empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'New Analysis' }).first().click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    const saveBtn = page.locator('[data-testid="btn-save"]');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeDisabled();
  });

  test('should complete save without error', async ({ page }) => {
    await loadSampleInEditor(page);

    const saveBtn = page.locator('[data-testid="btn-save"]');
    await saveBtn.click();

    // After save, button should still be visible and no error modals
    await expect(saveBtn).toBeVisible();
    // No error dialog should appear
    const errorDialog = page.locator('text=Error');
    await expect(errorDialog).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe('Azure App: What-If Simulator', () => {
  test('should navigate to What-If page and back', async ({ page }) => {
    await loadSampleInEditor(page);

    const whatIfBtn = page.locator('[data-testid="btn-what-if"]');
    await expect(whatIfBtn).toBeVisible();
    await whatIfBtn.click();

    // What-If page should render — look for heading
    await expect(page.getByRole('heading', { name: 'What-If Simulator' })).toBeVisible({
      timeout: 5000,
    });

    // Click back button (ArrowLeft icon with title)
    const backBtn = page.locator('button[title="Back to Dashboard"]');
    await backBtn.click();

    // Charts should be visible again
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Azure App: Investigation Mindmap', () => {
  test('should toggle mindmap panel when investigation button is clicked', async ({ page }) => {
    await loadSampleInEditor(page);

    const investigationBtn = page.locator('[data-testid="btn-investigation"]');

    // Investigation button is only visible if there are factors
    // Most samples have factors, so it should be visible
    const isVisible = await investigationBtn.isVisible();
    if (!isVisible) {
      // Skip if sample doesn't have factors
      test.skip();
      return;
    }

    // Open mindmap panel
    await investigationBtn.click();

    // Button should now have active styling
    await expect(investigationBtn).toHaveClass(/bg-blue-600/);

    // Close mindmap panel
    await investigationBtn.click();

    // Button should no longer have active styling
    await expect(investigationBtn).not.toHaveClass(/bg-blue-600/);
  });
});
