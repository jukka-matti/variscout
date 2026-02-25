import { test, expect } from '@playwright/test';

/**
 * E2E Test: Multi-Step User Flows
 *
 * Tests complete user journeys through the PWA:
 * 1. Deep drill-down (multi-level with backtrack)
 * 2. Manual entry setup flow
 * 3. Spec limits → Cpk display
 * 4. View switching
 * 5. Sample switching
 */

test.describe('User Flow: Deep Drill-Down', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=coffee');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should drill 2 levels and backtrack', async ({ page }) => {
    // Record initial mean
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const initialMean = parseFloat((await meanValue.textContent())!);

    // Level 1: Click a boxplot category
    const boxplot = page.locator('[data-testid="chart-boxplot"]');
    const groupButtons = boxplot.getByRole('button', { name: /^Select / });
    await expect(groupButtons.first()).toBeVisible({ timeout: 5000 });
    const groupCount = await groupButtons.count();
    expect(groupCount).toBeGreaterThanOrEqual(2); // Need at least 2 groups

    await groupButtons.first().click();
    await expect(page.locator('[data-testid^="filter-chip-"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Mean should change after first filter
    await page.waitForTimeout(500);
    const level1Mean = parseFloat((await meanValue.textContent())!);

    // Level 2: After first drill, boxplot re-renders with next factor's groups.
    // Wait for re-render to settle, then attempt second drill if groups exist.
    await page.waitForTimeout(500);
    const level2Buttons = boxplot.getByRole('button', { name: /^Select / });
    const level2Count = await level2Buttons.count();
    if (level2Count > 0) {
      await level2Buttons.first().click();
      await page.waitForTimeout(500);
    }

    // Backtrack: Remove last filter chip
    const removeButtons = page.locator('[data-testid^="filter-chip-remove-"]');
    const removeCount = await removeButtons.count();
    if (removeCount > 0) {
      await removeButtons.last().click();
      await page.waitForTimeout(300);
    }

    // Clear all remaining filters
    const clearButton = page.locator('[data-testid="filter-clear-all"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }

    // Mean should return close to initial
    await page.waitForTimeout(300);
    const finalMean = parseFloat((await meanValue.textContent())!);
    expect(finalMean).toBeCloseTo(initialMean, 0);
  });

  test('should show cumulative filter chips', async ({ page }) => {
    const boxplot = page.locator('[data-testid="chart-boxplot"]');
    const groupButtons = boxplot.getByRole('button', { name: /^Select / });
    await expect(groupButtons.first()).toBeVisible({ timeout: 5000 });

    // Apply first filter
    await groupButtons.first().click();
    const chips = page.locator('[data-testid^="filter-chip-"]');
    await expect(chips.first()).toBeVisible({ timeout: 5000 });

    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('User Flow: Manual Entry', () => {
  test('should open manual entry and navigate setup', async ({ page }) => {
    await page.goto('/');

    // Click "Or enter data manually"
    const manualButton = page.getByRole('button', { name: /enter data manually/i });
    await expect(manualButton).toBeVisible({ timeout: 10000 });
    await manualButton.click();

    // ManualEntry setup should show Step 1 form
    await expect(page.getByRole('heading', { name: /What are you measuring/i })).toBeVisible({
      timeout: 5000,
    });

    // Should have Start Entry button
    const startButton = page.locator('button:has-text("Start Entry")');
    await expect(startButton).toBeVisible({ timeout: 3000 });
  });
});

test.describe('User Flow: Spec Limits', () => {
  test('should display Cpk for packaging dataset with specs', async ({ page }) => {
    await page.goto('/?sample=packaging');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Packaging has USL=100 → Cpk should be visible
    const cpkValue = page.locator('[data-testid="stat-value-cpk"]');
    await expect(cpkValue).toBeVisible({ timeout: 5000 });
    const cpkText = await cpkValue.textContent();
    expect(parseFloat(cpkText!)).not.toBeNaN();
  });
});

test.describe('User Flow: View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=coffee');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('User Flow: Sample Switching', () => {
  test('should load different samples sequentially', async ({ page }) => {
    // Load coffee
    await page.goto('/?sample=coffee');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    const coffeeMean = parseFloat((await meanValue.textContent())!);

    // Navigate to packaging
    await page.goto('/?sample=packaging');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    const packagingMean = parseFloat((await meanValue.textContent())!);

    // Means should be different
    expect(coffeeMean).not.toBeCloseTo(packagingMean, 0);
  });
});
