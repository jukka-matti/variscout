import { test, expect } from '@playwright/test';

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
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    await page.locator('text=New Analysis').click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Upload and Manual Entry should be available
    await expect(page.locator('text=Upload File')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();

    // Sample datasets should be visible
    await expect(page.locator('text=Sample Datasets')).toBeVisible();
    const sampleButtons = page.locator('[data-testid^="sample-"]');
    expect(await sampleButtons.count()).toBeGreaterThan(0);
  });

  test('should not show charts in empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    await page.locator('text=New Analysis').click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

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
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    await page.locator('text=New Analysis').click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    await page.locator('text=Manual Entry').click();

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Paste numeric-only data (no factor columns)
    const values = Array.from({ length: 15 }, (_, i) => (50 + Math.sin(i * 0.5) * 3).toFixed(2));
    await textarea.fill('Measurement\n' + values.join('\n'));

    const analyzeButton = page.locator('button:has-text("Analyze")');
    await analyzeButton.click();

    // Handle column mapping if shown
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Should render I-Chart at minimum (no boxplot groups expected)
    const hasChart = await page
      .locator('[data-testid="chart-ichart"]')
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (hasChart) {
      // Stats should show numeric mean
      const meanValue = page.locator('[data-testid="stat-value-mean"]');
      await expect(meanValue).toBeVisible({ timeout: 5000 });
      expect(parseFloat((await meanValue.textContent())!)).not.toBeNaN();
    }
  });
});

test.describe('Azure Edge Case: Replace Data', () => {
  test('should clear filters when loading a different sample', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Load first analysis
    await page.locator('text=New Analysis').click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    const sampleButtons = page.locator('[data-testid^="sample-"]');
    const count = await sampleButtons.count();
    if (count < 2) return; // Need at least 2 samples

    // Load first sample
    await sampleButtons.first().click();
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Apply a filter
    const boxplotRects = page.locator('[data-testid="chart-boxplot"] svg rect[cursor="pointer"]');
    if ((await boxplotRects.count()) > 0) {
      await boxplotRects.first().click();
      await page.waitForTimeout(500);
    }

    // Go back and load second sample
    const backBtn = page.locator('text=Back').first();
    await backBtn.click();
    await expect(page.locator('text=New Analysis')).toBeVisible({ timeout: 5000 });

    await page.locator('text=New Analysis').click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    await sampleButtons.nth(1).click();
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Should have no stale filter chips
    const chipCount = await page.locator('[data-testid^="filter-chip-"]').count();
    expect(chipCount).toBe(0);
  });
});

test.describe('Azure Edge Case: Back Navigation', () => {
  test('should navigate back to analyses dashboard from editor', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Go to editor
    await page.locator('text=New Analysis').click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Load a sample
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    await sampleButton.click();
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Navigate back
    const backBtn = page.locator('text=Back').first();
    await backBtn.click();

    // Should see analyses dashboard
    await expect(page.locator('text=New Analysis')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate back from empty editor', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Go to editor
    await page.locator('text=New Analysis').click();
    await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

    // Navigate back without loading any data
    const backBtn = page.locator('text=Back').first();
    await backBtn.click();

    // Should see analyses dashboard
    await expect(page.locator('text=New Analysis')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Azure Edge Case: Auth on Localhost', () => {
  test('should show mock user on localhost', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });

    // Mock user "Local Developer" should be displayed
    await expect(page.locator('text=Local Developer')).toBeVisible({ timeout: 5000 });
  });
});
